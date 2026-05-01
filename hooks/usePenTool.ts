"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import type { TPointerEventInfo } from "fabric";
import { useEditorStore } from "@/store/editorStore";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PenNode {
  x: number;
  y: number;
  kind: "corner" | "smooth";
  cpIn:  { x: number; y: number } | null;
  cpOut: { x: number; y: number } | null;
}

type PenState = "idle" | "drawing" | "finishing";

/** Tag used on all live-preview objects so they are never snapshotted or exported. */
const PEN_PREVIEW_TAG = "__pen_preview__";

// ── Helper: build SVG path `d` string from nodes ─────────────────────────────

function buildPathD(nodes: PenNode[], closed: boolean): string {
  if (nodes.length < 2) return "";

  const parts: string[] = [];
  parts.push(`M ${nodes[0].x} ${nodes[0].y}`);

  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];

    if (prev.cpOut !== null || curr.cpIn !== null) {
      // Cubic bezier — fall back to the node position when a handle is absent
      const cp1 = prev.cpOut ?? { x: prev.x, y: prev.y };
      const cp2 = curr.cpIn  ?? { x: curr.x, y: curr.y };
      parts.push(`C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${curr.x} ${curr.y}`);
    } else {
      parts.push(`L ${curr.x} ${curr.y}`);
    }
  }

  if (closed) {
    // Closing segment: use the last node's cpOut and first node's cpIn (if any)
    const last  = nodes[nodes.length - 1];
    const first = nodes[0];
    if (last.cpOut !== null || first.cpIn !== null) {
      const cp1 = last.cpOut  ?? { x: last.x,  y: last.y  };
      const cp2 = first.cpIn  ?? { x: first.x, y: first.y };
      parts.push(`C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${first.x} ${first.y}`);
    }
    parts.push("Z");
  }

  return parts.join(" ");
}

// ── Helper: distance between two points (in canvas/document units) ───────────

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Helper: mirror a point through a pivot (for smooth handles) ──────────────

function mirror(
  pt: { x: number; y: number },
  pivot: { x: number; y: number },
): { x: number; y: number } {
  return { x: 2 * pivot.x - pt.x, y: 2 * pivot.y - pt.y };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Implements the Pen tool — a polycurve with Bézier control points.
 *
 * Wires itself up via useEffect when activeTool === "pen" and tears down
 * on cleanup or tool switch.  All mutable pen state lives in useRef (not
 * React state) to avoid re-renders during mouse events.
 *
 * Keyboard:
 *  - Enter → finish and commit path
 *  - Escape → finish (or discard if < 2 nodes)
 */
export function usePenTool(): void {
  const canvas        = useEditorStore((s) => s.canvas);
  const activeTool    = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const takeSnapshot  = useEditorStore((s) => s.takeSnapshot);
  const pauseHistory  = useEditorStore((s) => s.pauseHistory);
  const resumeHistory = useEditorStore((s) => s.resumeHistory);

  // ── Global "P" shortcut — activate pen tool from any tool ────────────────
  useEffect(() => {
    const onGlobalKey = (e: KeyboardEvent) => {
      // Ignore when typing in inputs or canvas text editing
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setActiveTool("pen");
      }
    };
    window.addEventListener("keydown", onGlobalKey);
    return () => window.removeEventListener("keydown", onGlobalKey);
  }, [setActiveTool]);

  // ── Internal state machine — refs to avoid re-renders ────────────────────
  const penState   = useRef<PenState>("idle");
  const nodes      = useRef<PenNode[]>([]);
  const dragStart  = useRef<{ x: number; y: number } | null>(null);
  const mouseDown  = useRef(false);
  const previewPath  = useRef<fabric.Path | null>(null);
  const previewMarkers = useRef<fabric.Circle[]>([]);
  const previewHandles = useRef<fabric.Line[]>([]);

  useEffect(() => {
    if (!canvas || activeTool !== "pen") return;

    const c = canvas;
    penState.current = "drawing";
    nodes.current    = [];
    dragStart.current = null;
    mouseDown.current = false;

    // Mode: no selection, crosshair cursor — same pattern as useDrawingMode/useProductTemplate
    const prevSelection     = c.selection;
    const prevDefaultCursor = c.defaultCursor;
    /* eslint-disable react-hooks/immutability */
    c.selection     = false;
    c.defaultCursor = "crosshair";
    /* eslint-enable react-hooks/immutability */
    c.requestRenderAll();

    // ── Preview helpers ───────────────────────────────────────────────────────

    /** Remove all existing preview objects from the canvas. */
    function clearPreview() {
      if (previewPath.current) {
        c.remove(previewPath.current);
        previewPath.current = null;
      }
      previewMarkers.current.forEach((m) => c.remove(m));
      previewMarkers.current = [];
      previewHandles.current.forEach((l) => c.remove(l));
      previewHandles.current = [];
    }

    /** Shared options for every preview object — never exported, never selectable. */
    function previewOpts() {
      return {
        selectable:        false,
        evented:           false,
        excludeFromExport: true,
        data:              { tag: PEN_PREVIEW_TAG },
      } as const;
    }

    /** Rebuild preview path + markers from current nodes state. */
    function rebuildPreview(mousePos?: { x: number; y: number }) {
      clearPreview();

      const ns = nodes.current;
      if (ns.length === 0) return;

      const zoom = c.getZoom();
      const markerR = 4 / zoom;

      // ── Path preview ─────────────────────────────────────────────────────
      // Build a temporary node list that includes the current mouse position
      // as the next point (gives the user live feedback)
      let tempNodes: PenNode[] = [...ns];
      if (mousePos && ns.length >= 1) {
        tempNodes = [
          ...ns,
          { x: mousePos.x, y: mousePos.y, kind: "corner", cpIn: null, cpOut: null },
        ];
      }

      if (tempNodes.length >= 2) {
        const d = buildPathD(tempNodes, false);
        if (d) {
          const p = new fabric.Path(d, {
            fill:          "transparent",
            stroke:        "#6366f1",
            strokeWidth:   1 / zoom,
            strokeUniform: true,
            strokeDashArray: [4 / zoom, 4 / zoom],
            ...previewOpts(),
          });
          previewPath.current = p;
          c.add(p);
        }
      }

      // ── Node markers ─────────────────────────────────────────────────────
      ns.forEach((node, i) => {
        const isFirst = i === 0;
        const marker = new fabric.Circle({
          left:         node.x - markerR,
          top:          node.y - markerR,
          radius:       markerR,
          fill:         isFirst ? "#6366f1" : "#ffffff",
          stroke:       "#6366f1",
          strokeWidth:  1 / zoom,
          strokeUniform: true,
          ...previewOpts(),
        });
        previewMarkers.current.push(marker);
        c.add(marker);

        // ── Control-point handle lines ─────────────────────────────────────
        const lineOpts = {
          stroke:       "#6366f1",
          strokeWidth:  1 / zoom,
          strokeUniform: true,
          opacity:      0.6,
          ...previewOpts(),
        };

        if (node.cpIn) {
          const line = new fabric.Line(
            [node.cpIn.x, node.cpIn.y, node.x, node.y],
            lineOpts,
          );
          previewHandles.current.push(line);
          c.add(line);
          // Draw cp marker
          const cpMark = new fabric.Circle({
            left:         node.cpIn.x - markerR * 0.7,
            top:          node.cpIn.y - markerR * 0.7,
            radius:       markerR * 0.7,
            fill:         "#a5b4fc",
            stroke:       "#6366f1",
            strokeWidth:  1 / zoom,
            strokeUniform: true,
            ...previewOpts(),
          });
          previewMarkers.current.push(cpMark);
          c.add(cpMark);
        }

        if (node.cpOut) {
          const line = new fabric.Line(
            [node.x, node.y, node.cpOut.x, node.cpOut.y],
            lineOpts,
          );
          previewHandles.current.push(line);
          c.add(line);
          // Draw cp marker
          const cpMark = new fabric.Circle({
            left:         node.cpOut.x - markerR * 0.7,
            top:          node.cpOut.y - markerR * 0.7,
            radius:       markerR * 0.7,
            fill:         "#a5b4fc",
            stroke:       "#6366f1",
            strokeWidth:  1 / zoom,
            strokeUniform: true,
            ...previewOpts(),
          });
          previewMarkers.current.push(cpMark);
          c.add(cpMark);
        }
      });

      c.requestRenderAll();
    }

    // ── Finish: commit the path ───────────────────────────────────────────────

    function finishPath(closed: boolean, discard: boolean) {
      if (penState.current === "finishing") return;
      penState.current = "finishing";

      // Pause before clearPreview so object:removed events from preview objects
      // don't each create a separate undo entry.
      pauseHistory();
      clearPreview();

      const ns = nodes.current;

      if (!discard && ns.length >= 2) {
        const d = buildPathD(ns, closed);
        if (d) {
          const zoom = c.getZoom();
          const path = new fabric.Path(d, {
            fill:          "transparent",
            stroke:        "#1e293b",
            strokeWidth:   1 / zoom,
            strokeUniform: true,
          });
          c.add(path);
          c.setActiveObject(path);
          c.requestRenderAll();
        }
      }

      resumeHistory();
      if (!discard && ns.length >= 2) {
        takeSnapshot();
      }

      // Reset state
      nodes.current     = [];
      dragStart.current = null;
      mouseDown.current = false;

      setActiveTool("select");
    }

    // ── Fabric event handlers ─────────────────────────────────────────────────

    const onMouseDown = (e: TPointerEventInfo) => {
      if (penState.current !== "drawing") return;

      mouseDown.current = true;
      const pt = e.scenePoint;

      // Check if clicking near the first node (close path)
      if (nodes.current.length >= 3 && nodes.current[0]) {
        const first = nodes.current[0];
        const screenDist = dist(pt, first) * c.getZoom();
        if (screenDist < 8) {
          finishPath(true, false);
          return;
        }
      }

      // Add a new node
      const newNode: PenNode = {
        x:     pt.x,
        y:     pt.y,
        kind:  "corner",
        cpIn:  null,
        cpOut: null,
      };
      nodes.current.push(newNode);
      dragStart.current = { x: pt.x, y: pt.y };

      rebuildPreview();
    };

    const onMouseMove = (e: TPointerEventInfo) => {
      if (penState.current !== "drawing") return;

      const pt = e.scenePoint;

      if (mouseDown.current && dragStart.current && nodes.current.length > 0) {
        // Check if dragged far enough to activate handle creation (3 screen px)
        const screenDist = dist(pt, dragStart.current) * c.getZoom();
        if (screenDist > 3) {
          // Set current (last) node as smooth, create handles
          const idx  = nodes.current.length - 1;
          const node = nodes.current[idx];

          node.kind  = "smooth";
          node.cpOut = { x: pt.x, y: pt.y };
          node.cpIn  = mirror(pt, node);

          rebuildPreview();
          return;
        }
      }

      // Live preview: show where the next segment will go
      if (!mouseDown.current && nodes.current.length >= 1) {
        rebuildPreview(pt);
      }
    };

    const onMouseUp = () => {
      mouseDown.current = false;
      // Node is already finalized by mouse:move — nothing else to do
    };

    const onDblClick = () => {
      if (penState.current !== "drawing") return;
      // Remove the duplicate node that mouse:down added for the dblclick
      if (nodes.current.length > 1) {
        nodes.current.pop();
      }
      finishPath(false, false);
    };

    // ── Keyboard: Enter = finish, Escape = finish/discard ────────────────────

    const onKeyDown = (e: KeyboardEvent) => {
      if (penState.current !== "drawing") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Enter") {
        e.preventDefault();
        finishPath(false, false);
      } else if (e.key === "Escape") {
        e.preventDefault();
        const discard = nodes.current.length < 2;
        finishPath(false, discard);
      }
    };

    // Register all listeners
    c.on("mouse:down",    onMouseDown as (e: TPointerEventInfo) => void);
    c.on("mouse:move",    onMouseMove as (e: TPointerEventInfo) => void);
    c.on("mouse:up",      onMouseUp   as unknown as () => void);
    c.on("mouse:dblclick", onDblClick as unknown as () => void);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      // Tear down listeners
      c.off("mouse:down",    onMouseDown as (e: TPointerEventInfo) => void);
      c.off("mouse:move",    onMouseMove as (e: TPointerEventInfo) => void);
      c.off("mouse:up",      onMouseUp   as unknown as () => void);
      c.off("mouse:dblclick", onDblClick as unknown as () => void);
      document.removeEventListener("keydown", onKeyDown);

      // Clean up any live preview objects left on canvas
      clearPreview();

      // Restore canvas mode
      c.selection     = prevSelection;
      c.defaultCursor = prevDefaultCursor;
      c.requestRenderAll();

      penState.current = "idle";
    };
  }, [canvas, activeTool, setActiveTool, takeSnapshot, pauseHistory, resumeHistory]);
}
