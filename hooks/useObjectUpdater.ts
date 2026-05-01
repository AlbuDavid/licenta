"use client";

import { useEditorStore } from "@/store/editorStore";

/** Debounce timer for collapsing rapid property changes into one snapshot. */
let _snapshotTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Returns `updateActiveObject` — a function that sets a property on every
 * currently active Fabric object and immediately re-renders the canvas.
 *
 * Each call debounces a history snapshot (300 ms) so rapid changes
 * (e.g. dragging a slider, typing a font size) collapse into a single undo step.
 */
export function useObjectUpdater() {
  const canvas       = useEditorStore((s) => s.canvas);
  const takeSnapshot = useEditorStore((s) => s.takeSnapshot);

  function updateActiveObject(key: string, value: unknown) {
    if (!canvas) return;

    const targets = canvas.getActiveObjects();
    if (targets.length === 0) return;

    targets.forEach((obj) => {
      (obj as unknown as Record<string, unknown>)[key] = value;
      obj.set(key as keyof typeof obj, value as never);

      if ("dirty" in obj) {
        (obj as { dirty: boolean }).dirty = true;
      }
    });

    canvas.requestRenderAll();

    // Debounced snapshot — collapses rapid property changes into one undo step
    if (_snapshotTimer) clearTimeout(_snapshotTimer);
    _snapshotTimer = setTimeout(() => {
      takeSnapshot();
      _snapshotTimer = null;
    }, 300);
  }

  return { updateActiveObject };
}
