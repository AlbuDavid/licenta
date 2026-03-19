"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import type { FabricObject } from "fabric";
import type { TMat2D } from "fabric";
import { useEditorStore } from "@/store/editorStore";
import { TEMPLATE_TAG } from "@/hooks/useProductTemplate";

const GUIDE_TAG = "__snap_guide__";

// ── Styles ────────────────────────────────────────────────────────────────────

// Window selection (left → right): solid blue rectangle
const WINDOW_COLOR   = "rgba(99,102,241,0.15)";  // indigo-500/15
const WINDOW_BORDER  = "rgba(99,102,241,0.8)";
const WINDOW_DASH: number[] = [];                 // solid

// Crossing selection (right → left): dashed green rectangle
const CROSS_COLOR    = "rgba(34,197,94,0.10)";   // green-500/10
const CROSS_BORDER   = "rgba(34,197,94,0.8)";
const CROSS_DASH     = [6, 4];                    // dashed

// ── Helpers ───────────────────────────────────────────────────────────────────

function isExcluded(obj: FabricObject): boolean {
  const tag = (obj as { data?: { tag?: string } }).data?.tag;
  return tag === GUIDE_TAG || tag === TEMPLATE_TAG || !obj.selectable;
}

function toSceneRect(
  c: fabric.Canvas,
  x1: number, y1: number,
  x2: number, y2: number,
) {
  const zoom = c.getZoom();
  const vpt  = c.viewportTransform as TMat2D;
  return {
    l: (Math.min(x1, x2) - vpt[4]) / zoom,
    r: (Math.max(x1, x2) - vpt[4]) / zoom,
    t: (Math.min(y1, y2) - vpt[5]) / zoom,
    b: (Math.max(y1, y2) - vpt[5]) / zoom,
  };
}

function aabb(obj: FabricObject) {
  obj.setCoords();
  const co = obj.aCoords;
  const xs = [co.tl.x, co.tr.x, co.br.x, co.bl.x];
  const ys = [co.tl.y, co.tr.y, co.br.y, co.bl.y];
  return {
    l: Math.min(...xs), r: Math.max(...xs),
    t: Math.min(...ys), b: Math.max(...ys),
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Implements AutoCAD-style rubber-band selection:
 *
 *  Left → Right  (Window)   — solid indigo rectangle.
 *                              Selects only objects FULLY inside the rectangle.
 *                              (Fabric's native behaviour — no overrides needed.)
 *
 *  Right → Left  (Crossing) — dashed green rectangle.
 *                              Selects every object that TOUCHES the rectangle,
 *                              even if only partially overlapping.
 *
 * The selection rectangle colour/dash updates in real time during the drag so
 * the user gets immediate visual feedback about which mode is active.
 */
export function useSelectionBehavior() {
  const canvas     = useEditorStore((s) => s.canvas);
  const activeTool = useEditorStore((s) => s.activeTool);

  const startX    = useRef(0);
  const startY    = useRef(0);
  const endX      = useRef(0);
  const endY      = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!canvas || activeTool !== "select") return;
    const c = canvas;

    // ── Apply window / crossing visual style ─────────────────────────────────

    function applyWindowStyle() {
      c.selectionColor       = WINDOW_COLOR;
      c.selectionBorderColor = WINDOW_BORDER;
      c.selectionDashArray   = WINDOW_DASH;
    }

    function applyCrossStyle() {
      c.selectionColor       = CROSS_COLOR;
      c.selectionBorderColor = CROSS_BORDER;
      c.selectionDashArray   = CROSS_DASH;
    }

    applyWindowStyle(); // default

    // ── mouse:down — record start ─────────────────────────────────────────────

    const onDown = (opt: fabric.TEvent<MouseEvent>) => {
      // Only track plain left-click on empty canvas (rubber-band)
      if (opt.e.button !== 0 || opt.e.altKey) return;
      const target = (opt as { target?: FabricObject }).target;
      if (target) return; // clicking an object — not a rubber-band drag

      startX.current    = opt.e.offsetX;
      startY.current    = opt.e.offsetY;
      isDragging.current = true;
      applyWindowStyle();
    };

    // ── mouse:move — switch style based on drag direction ────────────────────

    const onMove = (opt: fabric.TEvent<MouseEvent>) => {
      if (!isDragging.current) return;
      const dx = opt.e.offsetX - startX.current;
      // Switch style in real time; only switch after a small threshold (5px)
      if (Math.abs(dx) < 5) return;
      if (dx < 0) applyCrossStyle();
      else        applyWindowStyle();
    };

    // ── mouse:up — record end ─────────────────────────────────────────────────

    const onUp = (opt: fabric.TEvent<MouseEvent>) => {
      endX.current      = opt.e.offsetX;
      endY.current      = opt.e.offsetY;
      isDragging.current = false;
    };

    // ── selection:created/updated — apply crossing logic ─────────────────────

    const onSelectionCreated = () => {
      const dx = endX.current - startX.current;
      const dy = endY.current - startY.current;

      // Skip: single click (no real drag) or left-to-right (Fabric handles it)
      if (Math.abs(dx) < 5 || dx >= 0) {
        applyWindowStyle();
        return;
      }

      // ── Crossing (RTL): select all objects that intersect the rect ──────────
      const rect = toSceneRect(c, startX.current, startY.current, endX.current, endY.current);
      // Also accept slight upward/downward drags when dominant direction is RTL
      if (Math.abs(dy) > Math.abs(dx) * 3) {
        // Nearly vertical drag — fall back to window behaviour
        applyWindowStyle();
        return;
      }

      const crossing = c.getObjects().filter((obj) => {
        if (isExcluded(obj)) return false;
        const bb = aabb(obj);
        // Intersects if NOT completely outside on any axis
        return bb.r > rect.l && bb.l < rect.r && bb.b > rect.t && bb.t < rect.b;
      });

      if (crossing.length === 0) {
        c.discardActiveObject();
      } else if (crossing.length === 1) {
        c.setActiveObject(crossing[0]);
      } else {
        const sel = new fabric.ActiveSelection(crossing, { canvas: c });
        c.setActiveObject(sel);
      }

      c.requestRenderAll();
      applyWindowStyle(); // reset style after selection is made
    };

    c.on("mouse:down",         onDown         as unknown as () => void);
    c.on("mouse:move",         onMove         as unknown as () => void);
    c.on("mouse:up",           onUp           as unknown as () => void);
    c.on("selection:created",  onSelectionCreated);
    c.on("selection:updated",  onSelectionCreated);

    return () => {
      c.off("mouse:down",        onDown         as unknown as () => void);
      c.off("mouse:move",        onMove         as unknown as () => void);
      c.off("mouse:up",          onUp           as unknown as () => void);
      c.off("selection:created", onSelectionCreated);
      c.off("selection:updated", onSelectionCreated);
      applyWindowStyle();
    };
  }, [canvas, activeTool]);
}
