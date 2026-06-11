"use client";

import * as fabric from "fabric";
import type { TPointerEventInfo } from "fabric";
import { useEditorStore } from "@/store/editorStore";
import {
  buildTemplateBoundary,
  TEMPLATE_TAG,
  GHOST_TAG,
} from "@/components/editor/utils/templateGeometry";
import type {
  ProductTemplateConfig,
  TemplateShape,
} from "@/lib/template-config";

// Re-exported for the existing importers (snapping, selection sync, preview…)
export { TEMPLATE_TAG };
export type { TemplateShape, ProductTemplateConfig };

// Only one placement session can be active at a time across the whole app.
let cancelActivePlacement: (() => void) | null = null;

export function useProductTemplate() {
  const canvas = useEditorStore((s) => s.canvas);

  /**
   * Enters placement mode for a product template: a ghost follows the cursor,
   * left-click places the real boundary at that position, Escape cancels.
   * Any previous in-flight placement is cancelled first; placing replaces an
   * already-placed template (one template max — preview/export need a single
   * unambiguous physical product).
   */
  function loadProductTemplate(config: ProductTemplateConfig) {
    if (!canvas) return;

    // Cancel any previous placement that wasn't finished.
    cancelActivePlacement?.();

    const c = canvas;                   // stable non-null ref captured by closures
    const w = config.widthMm;
    const h = config.heightMm;

    // Ghost starts off-screen; snaps to cursor on first mouse:move.
    const ghost = buildTemplateBoundary(config, -9999, -9999, true);
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

      // Batch "remove old template + place new" into a single undo step
      const store = useEditorStore.getState();
      store.pauseHistory();

      removeTemplateObjects(c);         // one template max — replace existing

      const pt   = c.getScenePoint(opt.e);
      const real = buildTemplateBoundary(config, pt.x - w / 2, pt.y - h / 2, false);
      c.insertAt(0, real);              // behind all user objects
      c.discardActiveObject();          // cancel any accidental selection from the click
      c.requestRenderAll();

      store.resumeHistory();
      store.takeSnapshot();

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
    removeTemplateObjects(canvas);
    canvas.requestRenderAll();
  }

  return { loadProductTemplate, clearTemplate };
}

// ── Internal ──────────────────────────────────────────────────────────────────

/** Removes all placed boundaries and ghosts from the canvas. */
function removeTemplateObjects(canvas: fabric.Canvas) {
  canvas
    .getObjects()
    .filter((o) => {
      const d = (o as fabric.FabricObject & { data?: { tag?: string } }).data;
      return d?.tag === TEMPLATE_TAG || d?.tag === GHOST_TAG;
    })
    .forEach((o) => canvas.remove(o));
}
