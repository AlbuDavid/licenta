"use client";

import { useEditorStore } from "@/store/editorStore";

/**
 * Returns `updateActiveObject` — a function that sets a property on every
 * currently active Fabric object and immediately re-renders the canvas.
 *
 * Design rationale:
 *  - Reading `canvas` from the store (not a prop) keeps the hook dependency-free
 *    and usable from any component without prop drilling.
 *  - `canvas.getActiveObjects()` is used instead of the store's `selectedObjects`
 *    because it reflects Fabric's live state; the store array is only for React UI.
 *  - `canvas.requestRenderAll()` schedules a single repaint after all properties
 *    are applied, avoiding multiple repaints on multi-selection updates.
 *
 * Usage:
 *   const { updateActiveObject } = useObjectUpdater();
 *   updateActiveObject("fill", "#ff0000");
 *   updateActiveObject("fontSize", 32);
 */
export function useObjectUpdater() {
  const canvas = useEditorStore((s) => s.canvas);

  function updateActiveObject(key: string, value: unknown) {
    if (!canvas) return;

    const targets = canvas.getActiveObjects();
    if (targets.length === 0) return;

    targets.forEach((obj) => {
      // fabric.Object.set() accepts a key-value pair
      (obj as unknown as Record<string, unknown>)[key] = value;
      obj.set(key as keyof typeof obj, value as never);

      // IText needs an extra dirty flag when text-style props change
      if ("dirty" in obj) {
        (obj as { dirty: boolean }).dirty = true;
      }
    });

    canvas.requestRenderAll();
  }

  return { updateActiveObject };
}
