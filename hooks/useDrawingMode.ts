"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import type { TMat2D } from "fabric";
import { useEditorStore } from "@/store/editorStore";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DRAW_TOOLS = ["rectangle", "ellipse", "line", "text"] as const;
type DrawToolId  = typeof DRAW_TOOLS[number];

function isDrawTool(id: string): id is DrawToolId {
  return (DRAW_TOOLS as readonly string[]).includes(id);
}

/**
 * Converts a position in canvas-element space (offsetX / offsetY)
 * to scene (document) coordinates, accounting for zoom and pan.
 *
 * Formula mirrors the one used in useEditorTools.getViewportCenter:
 *   sceneX = (offsetX - translateX) / zoom
 */
function toScene(c: fabric.Canvas, offsetX: number, offsetY: number): fabric.Point {
  const zoom = c.getZoom();
  const vpt  = c.viewportTransform as TMat2D;
  return new fabric.Point(
    (offsetX - vpt[4]) / zoom,
    (offsetY - vpt[5]) / zoom,
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Intercepts mouse events when a draw tool is active and lets the user
 * define the shape by click-dragging instead of inserting at canvas centre.
 *
 * Behaviour per tool:
 *  - rectangle / ellipse: drag defines the bounding box
 *  - line:                drag defines start → end
 *  - text:                single click places an IText; enters edit mode
 *
 * After mouse-up (or text click) the tool resets to "select" so the new
 * object is immediately selectable — the same UX as Corel Draw / Illustrator.
 *
 * Coordination with useCanvasNavigation:
 *  - Drawing only activates on plain left-click (button=0, no altKey).
 *  - Pan activates on middle-mouse or alt+left — so the two never conflict.
 */
export function useDrawingMode() {
  const canvas        = useEditorStore((s) => s.canvas);
  const activeTool    = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);

  // Mutable draw state — refs so event closures don't go stale
  const startPt = useRef<fabric.Point | null>(null);
  const tempObj = useRef<fabric.FabricObject | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (!canvas) return;

    if (!isDrawTool(activeTool)) {
      // Restore normal selection behaviour when a non-draw tool is active
      canvas.selection     = true;
      canvas.defaultCursor = "default";
      canvas.hoverCursor   = "move";
      return;
    }

    // ── Enter drawing mode ────────────────────────────────────────────────────
    canvas.selection     = false;
    canvas.defaultCursor = "crosshair";
    canvas.hoverCursor   = "crosshair";

    const c = canvas; // narrowed to non-null for closures

    // ── mouse:down — record start, create temp shape ──────────────────────────
    const onDown = (opt: fabric.TEvent<MouseEvent>) => {
      // Only act on plain left-click; leave alt+left and middle-mouse for panning
      if (opt.e.button !== 0 || opt.e.altKey) return;

      // Clicking on an existing object → cancel draw mode, let Fabric select it
      if ((opt as { target?: fabric.FabricObject }).target) {
        c.selection = true;
        setActiveTool("select");
        return;
      }

      const pt = toScene(c, opt.e.offsetX, opt.e.offsetY);

      // ── Text: place on click, no drag needed ─────────────────────────────
      if (activeTool === "text") {
        const text = new fabric.IText("Text", {
          left:       pt.x,
          top:        pt.y,
          fontFamily: "Arial",
          fontSize:   40,
          fill:       "#1e293b",
        });
        c.add(text);
        c.setActiveObject(text);
        c.requestRenderAll();
        text.enterEditing();
        setActiveTool("select");
        return;
      }

      // ── Shapes: begin drag ───────────────────────────────────────────────
      startPt.current = pt;
      drawing.current = true;

      const sw = 1 / c.getZoom(); // 1 screen-pixel stroke at any zoom level

      let obj: fabric.FabricObject;

      if (activeTool === "rectangle") {
        obj = new fabric.Rect({
          left: pt.x, top: pt.y,
          width: 0, height: 0,
          fill:          "transparent",
          stroke:        "#1e293b",
          strokeWidth:   sw,
          strokeUniform: true,
          selectable:    false,
          evented:       false,
        });
      } else if (activeTool === "ellipse") {
        obj = new fabric.Ellipse({
          left: pt.x, top: pt.y,
          rx: 0, ry: 0,
          fill:          "transparent",
          stroke:        "#1e293b",
          strokeWidth:   sw,
          strokeUniform: true,
          selectable:    false,
          evented:       false,
        });
      } else {
        // line
        obj = new fabric.Line([pt.x, pt.y, pt.x, pt.y], {
          stroke:        "#1e293b",
          strokeWidth:   sw,
          strokeUniform: true,
          selectable:    false,
          evented:       false,
        });
      }

      c.add(obj);
      tempObj.current = obj;
      c.requestRenderAll();
    };

    // ── mouse:move — resize the in-progress shape ─────────────────────────────
    const onMove = (opt: fabric.TEvent<MouseEvent>) => {
      if (!drawing.current || !startPt.current || !tempObj.current) return;

      const e     = opt.e;
      const pt    = toScene(c, e.offsetX, e.offsetY);
      const start = startPt.current;
      const obj   = tempObj.current;

      const dx    = pt.x - start.x;
      const dy    = pt.y - start.y;
      const signX = dx >= 0 ? 1 : -1;
      const signY = dy >= 0 ? 1 : -1;

      if (obj.type === "rect" || obj.type === "ellipse") {
        // Ctrl → constrain to square / perfect circle
        let w = Math.abs(dx);
        let h = Math.abs(dy);
        if (e.ctrlKey) {
          const size = Math.max(w, h);
          w = size;
          h = size;
        }

        // Keep the click corner pinned: expand in the direction of the drag
        const l = signX >= 0 ? start.x : start.x - w;
        const t = signY >= 0 ? start.y : start.y - h;

        if (obj.type === "rect") {
          obj.set({ left: l, top: t, width: w, height: h });
        } else {
          obj.set({ left: l, top: t, rx: w / 2, ry: h / 2 });
        }
      } else if (obj.type === "line") {
        let x2 = pt.x;
        let y2 = pt.y;

        // Ctrl → constrain line angle to nearest 45°
        if (e.ctrlKey) {
          const dist  = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
          x2 = start.x + Math.cos(angle) * dist;
          y2 = start.y + Math.sin(angle) * dist;
        }

        (obj as fabric.Line).set({ x2, y2 });
      }

      obj.setCoords();
      c.requestRenderAll();
    };

    // ── mouse:up — finalize or discard ────────────────────────────────────────
    const onUp = () => {
      if (!drawing.current || !tempObj.current) return;
      drawing.current = false;

      const obj      = tempObj.current;
      tempObj.current = null;
      startPt.current = null;

      // Discard shapes that are effectively just a click (< 4 doc-units)
      const tooSmall = (() => {
        if (obj.type === "rect") {
          return ((obj.width  ?? 0) as number) < 4 &&
                 ((obj.height ?? 0) as number) < 4;
        }
        if (obj.type === "ellipse") {
          const e = obj as fabric.Ellipse;
          return (e.rx ?? 0) < 2 && (e.ry ?? 0) < 2;
        }
        if (obj.type === "line") {
          const l  = obj as fabric.Line;
          const dx = ((l.x2 ?? 0) as number) - ((l.x1 ?? 0) as number);
          const dy = ((l.y2 ?? 0) as number) - ((l.y1 ?? 0) as number);
          return Math.abs(dx) < 4 && Math.abs(dy) < 4;
        }
        return false;
      })();

      // Restore selection immediately — don't wait for the async useEffect cleanup
      c.selection     = true;
      c.defaultCursor = "default";

      if (tooSmall) {
        c.remove(obj);
        c.requestRenderAll();
        setActiveTool("select");
        return;
      }

      // Make the finished shape selectable and activate it
      obj.set({ selectable: true, evented: true });
      obj.setCoords();
      c.setActiveObject(obj);
      c.requestRenderAll();
      setActiveTool("select");
    };

    // Escape → cancel draw mode and return to select
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (tempObj.current) {
          c.remove(tempObj.current);
          tempObj.current = null;
        }
        drawing.current = false;
        startPt.current = null;
        c.selection     = true;
        c.defaultCursor = "default";
        setActiveTool("select");
      }
    };

    c.on("mouse:down", onDown as unknown as () => void);
    c.on("mouse:move", onMove as unknown as () => void);
    c.on("mouse:up",   onUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      c.off("mouse:down", onDown as unknown as () => void);
      c.off("mouse:move", onMove as unknown as () => void);
      c.off("mouse:up",   onUp);
      window.removeEventListener("keydown", onKeyDown);

      // Clean up any orphaned temp object if the tool is switched mid-drag
      if (tempObj.current) {
        c.remove(tempObj.current);
        tempObj.current = null;
      }
      drawing.current  = false;
      startPt.current  = null;

      // Reset cursor/selection to defaults
      c.selection      = true;
      c.defaultCursor  = "default";
    };
  }, [canvas, activeTool, setActiveTool]);
}
