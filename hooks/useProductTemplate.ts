"use client";

import * as fabric from "fabric";
import type { TPointerEventInfo } from "fabric";
import { useEditorStore } from "@/store/editorStore";
import { buildHeartPathD } from "@/components/editor/utils/heartPath";

export type TemplateShape = "circle" | "square" | "heart" | "rectangle";

const TEMPLATES: Record<TemplateShape, { w: number; h: number; label: string }> = {
  circle:    { w: 100, h: 100, label: "Cerc (⌀ 100 mm)"           },
  square:    { w: 100, h: 100, label: "Pătrat (100 × 100 mm)"      },
  heart:     { w: 100, h: 100, label: "Inimă (100 × 100 mm)"       },
  rectangle: { w: 200, h: 300, label: "Dreptunghi (200 × 300 mm)"  },
};

export const TEMPLATE_TAG = "__product_template__";
const GHOST_TAG = "__template_ghost__";

// Only one placement session can be active at a time across the whole app.
let cancelActivePlacement: (() => void) | null = null;

/**
 * Builds a boundary shape object at (left, top).
 * Ghost objects are translucent, non-interactive, and excluded from export.
 * Real objects are movable but locked from resize/rotate.
 */
function buildTemplateShape(
  shape: TemplateShape,
  left: number,
  top: number,
  isGhost: boolean,
): fabric.FabricObject {
  const { w, h } = TEMPLATES[shape];

  const base = {
    fill:            "transparent" as const,
    stroke:          "#64748b",
    strokeWidth:     3,
    strokeDashArray: [12, 6] as number[],
    strokeUniform:   true,
    hasControls:     false,
    lockScalingX:    true,
    lockScalingY:    true,
    lockRotation:    true,
    lockSkewingX:    true,
    lockSkewingY:    true,
  };

  const props = isGhost
    ? {
        ...base,
        selectable:        false,
        evented:           false,
        opacity:           0.55,
        excludeFromExport: true,
        data:              { tag: GHOST_TAG, shape },
      }
    : {
        ...base,
        selectable:  true,
        evented:     true,
        hoverCursor: "move" as string,
        data:        { tag: TEMPLATE_TAG, shape },
      };

  if (shape === "circle") {
    return new fabric.Circle({ ...props, radius: w / 2, left, top });
  }
  if (shape === "heart") {
    return new fabric.Path(buildHeartPathD(w, h), { ...props, left, top });
  }
  return new fabric.Rect({
    ...props,
    width:  w,
    height: h,
    left,
    top,
    rx: shape === "rectangle" ? 8 : 0,
    ry: shape === "rectangle" ? 8 : 0,
  });
}

export function useProductTemplate() {
  const canvas = useEditorStore((s) => s.canvas);

  /**
   * Enters placement mode: a ghost follows the cursor, left-click places the
   * real boundary at that position, Escape cancels. Any previous in-flight
   * placement is cancelled first.
   */
  function loadProductTemplate(shape: TemplateShape) {
    if (!canvas) return;

    // Cancel any previous placement that wasn't finished.
    cancelActivePlacement?.();

    const c = canvas;                   // stable non-null ref captured by closures
    const { w, h } = TEMPLATES[shape];

    // Ghost starts off-screen; snaps to cursor on first mouse:move.
    const ghost = buildTemplateShape(shape, -9999, -9999, true);
    c.add(ghost);
    c.requestRenderAll();

    c.selection     = false;
    c.defaultCursor = "crosshair";

    // ── Event handlers ────────────────────────────────────────────────────────

    const onMove = (opt: TPointerEventInfo) => {
      const pt = c.getScenePoint(opt.e);
      ghost.set({ left: pt.x - w / 2, top: pt.y - h / 2 });
      ghost.setCoords();
      c.requestRenderAll();
    };

    const onDown = (opt: TPointerEventInfo) => {
      const e = opt.e as MouseEvent;
      // Only a plain left-click places the shape; ignore alt/ctrl/middle.
      if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;

      c.remove(ghost);

      const pt  = c.getScenePoint(opt.e);
      const real = buildTemplateShape(shape, pt.x - w / 2, pt.y - h / 2, false);
      c.insertAt(0, real);            // behind all user objects
      c.discardActiveObject();        // cancel any accidental selection from the click
      c.requestRenderAll();

      cleanup();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        c.remove(ghost);
        c.requestRenderAll();
        cleanup();
      }
    };

    function cleanup() {
      c.off("mouse:move", onMove);
      c.off("mouse:down", onDown);
      window.removeEventListener("keydown", onKey, true);
      c.selection     = true;
      c.defaultCursor = "default";
      cancelActivePlacement = null;
    }

    cancelActivePlacement = cleanup;

    c.on("mouse:move", onMove);
    c.on("mouse:down", onDown);
    window.addEventListener("keydown", onKey, { capture: true });
  }

  function clearTemplate() {
    cancelActivePlacement?.();

    if (!canvas) return;
    canvas
      .getObjects()
      .filter((o) => {
        const d = (o as fabric.FabricObject & { data?: { tag?: string } }).data;
        return d?.tag === TEMPLATE_TAG || d?.tag === GHOST_TAG;
      })
      .forEach((o) => canvas.remove(o));
    canvas.requestRenderAll();
  }

  return { loadProductTemplate, clearTemplate, TEMPLATES };
}
