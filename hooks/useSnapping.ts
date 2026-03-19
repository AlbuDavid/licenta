"use client";

import { useEffect } from "react";
import * as fabric from "fabric";
import type { FabricObject } from "fabric";
import { useEditorStore } from "@/store/editorStore";
import { TEMPLATE_TAG } from "@/hooks/useProductTemplate";

// ── Constants ─────────────────────────────────────────────────────────────────

/** How close (in screen pixels) before snapping kicks in. */
const SNAP_PX = 8;

/** Guide line colour — matches the indigo selection accent. */
const GUIDE_COLOR = "#6366f1";

/** Tag stored in `.data` to identify guide lines (never exported / deleted). */
const GUIDE_TAG = "__snap_guide__";

/** Document dimensions (mm) — guide lines span the full document. */
const DOC = 4000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isSnapGuide(o: FabricObject): boolean {
  return (o as { data?: { tag?: string } }).data?.tag === GUIDE_TAG;
}

function isTemplate(o: FabricObject): boolean {
  return (o as { data?: { tag?: string } }).data?.tag === TEMPLATE_TAG;
}

/**
 * Axis-aligned bounding box in document (canvas) coordinates.
 * Using `aCoords` (the four transformed corners) so rotation is handled
 * correctly even for angled objects.
 */
function aabb(obj: FabricObject): {
  l: number; r: number; cx: number;
  t: number; b: number; cy: number;
} {
  obj.setCoords();
  const c = obj.aCoords;
  const xs = [c.tl.x, c.tr.x, c.br.x, c.bl.x];
  const ys = [c.tl.y, c.tr.y, c.br.y, c.bl.y];
  const l = Math.min(...xs);
  const r = Math.max(...xs);
  const t = Math.min(...ys);
  const b = Math.max(...ys);
  return { l, r, cx: (l + r) / 2, t, b, cy: (t + b) / 2 };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Adds edge + centre snapping to the Fabric canvas.
 *
 * While an object (or multi-selection) is being dragged:
 *  - Compares its left / centre-x / right positions against every other
 *    object's equivalent positions (9 x-axis pairs, 9 y-axis pairs).
 *  - If any pair is within SNAP_PX screen pixels, the object is nudged to
 *    align exactly and an indigo guide line is drawn across the canvas.
 *  - Guides are removed as soon as the mouse is released.
 *
 * Template objects are included as snap targets so users can easily align
 * content to the laser-engraving boundary.
 */
export function useSnapping() {
  const canvas = useEditorStore((s) => s.canvas);

  useEffect(() => {
    if (!canvas) return;
    // Narrow to non-null for use inside nested functions
    const c = canvas;

    // ── Guide management ──────────────────────────────────────────────────────

    function clearGuides() {
      const guides = c.getObjects().filter(isSnapGuide);
      guides.forEach((g) => c.remove(g));
    }

    function makeGuide(x1: number, y1: number, x2: number, y2: number) {
      return new fabric.Line([x1, y1, x2, y2], {
        stroke:          GUIDE_COLOR,
        // strokeWidth in doc units so it renders as 1 screen-pixel at any zoom
        strokeWidth:     1 / c.getZoom(),
        strokeUniform:   false,
        selectable:      false,
        evented:         false,
        hoverCursor:     "default",
        // Excluded from SVG/JSON export — guides are purely transient UI
        excludeFromExport: true,
        data: { tag: GUIDE_TAG },
      });
    }

    function addVGuide(x: number) {
      c.add(makeGuide(x, -DOC, x, DOC * 2));
    }

    function addHGuide(y: number) {
      c.add(makeGuide(-DOC, y, DOC * 2, y));
    }

    // ── Snap logic ────────────────────────────────────────────────────────────

    function onObjectMoving(opt: { target: FabricObject }) {
      const moving = opt.target;

      const zoom      = c.getZoom();
      const threshold = SNAP_PX / zoom;

      const mb = aabb(moving);
      // The 3 x-snap positions and 3 y-snap positions of the moving object
      const mXs: number[] = [mb.l,  mb.cx, mb.r];
      const mYs: number[] = [mb.t,  mb.cy, mb.b];

      // All objects on canvas that are NOT the mover and NOT a guide line
      // (templates ARE included — snap-to-boundary is intentional)
      const others = c.getObjects().filter(
        (o) => o !== moving && !isSnapGuide(o),
      );

      let bestDX = threshold;
      let bestDY = threshold;
      let snapDX: number | null = null;
      let snapDY: number | null = null;
      let guideX: number | null = null;
      let guideY: number | null = null;

      for (const other of others) {
        const ob  = aabb(other);
        const oXs = [ob.l, ob.cx, ob.r];
        const oYs = [ob.t, ob.cy, ob.b];

        // Compare every moving-object snap point against every target snap point
        for (const mX of mXs) {
          for (const oX of oXs) {
            const d = Math.abs(mX - oX);
            if (d < bestDX) {
              bestDX = d;
              snapDX = oX - mX;   // delta to apply to moving.left
              guideX = oX;
            }
          }
        }

        for (const mY of mYs) {
          for (const oY of oYs) {
            const d = Math.abs(mY - oY);
            if (d < bestDY) {
              bestDY = d;
              snapDY = oY - mY;   // delta to apply to moving.top
              guideY = oY;
            }
          }
        }
      }

      // Apply snap + draw guides
      clearGuides();

      if (snapDX !== null) {
        moving.set({ left: (moving.left as number) + snapDX });
        addVGuide(guideX!);
      }
      if (snapDY !== null) {
        moving.set({ top: (moving.top as number) + snapDY });
        addHGuide(guideY!);
      }

      moving.setCoords();
    }

    function onMouseUp() {
      clearGuides();
      c.requestRenderAll();
    }

    // ── Event registration ────────────────────────────────────────────────────

    // Fabric v6 event types are generic; cast is safe — the event always
    // carries { target } when fired for object:moving.
    c.on("object:moving", onObjectMoving as unknown as () => void);
    c.on("mouse:up",      onMouseUp);

    return () => {
      c.off("object:moving", onObjectMoving as unknown as () => void);
      c.off("mouse:up",      onMouseUp);
      clearGuides();
    };
  }, [canvas]);
}
