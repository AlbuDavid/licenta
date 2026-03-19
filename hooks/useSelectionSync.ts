"use client";

import { useEffect } from "react";
import type { FabricObject } from "fabric";
import { useEditorStore } from "@/store/editorStore";
import { TEMPLATE_TAG } from "@/hooks/useProductTemplate";

/** Returns true if the object is the locked product-template boundary. */
function isTemplate(o: FabricObject): boolean {
  return (o as { data?: { tag?: string } }).data?.tag === TEMPLATE_TAG;
}

/**
 * Keeps the Zustand `selectedObjects` array in sync with Fabric's active
 * selection, and handles Delete/Backspace to remove selected objects.
 *
 * Two responsibilities live here together because both depend on the same
 * canvas reference and both deal with "what is currently selected":
 *
 *  1. Selection sync — listens to Fabric's selection events and writes the
 *     active objects into the store so any component (e.g. a future Top Bar
 *     properties panel) can read them without touching the canvas directly.
 *
 *  2. Keyboard deletion — a window-level keydown listener deletes the active
 *     objects when Delete or Backspace is pressed, provided the focus is not
 *     inside a text input/textarea (so the user can still edit IText normally).
 */
export function useSelectionSync() {
  const canvas            = useEditorStore((s) => s.canvas);
  const setSelectedObjects = useEditorStore((s) => s.setSelectedObjects);

  useEffect(() => {
    if (!canvas) return;

    // ── Selection → store sync ────────────────────────────────────────────────

    // Exclude the template from the properties bar — it is not a user object.
    const syncSelection = () => {
      const objs = (canvas.getActiveObjects() as FabricObject[]).filter(
        (o) => !isTemplate(o),
      );
      setSelectedObjects(objs);
    };

    const onSelectionCreated = syncSelection;
    const onSelectionUpdated = syncSelection;

    const onSelectionCleared = () => {
      setSelectedObjects([]);
    };

    canvas.on("selection:created", onSelectionCreated);
    canvas.on("selection:updated", onSelectionUpdated);
    canvas.on("selection:cleared", onSelectionCleared);

    // ── Keyboard deletion ─────────────────────────────────────────────────────

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept Delete while the user is typing in an input or an
      // IText editing session (Fabric sets isEditing on the active object).
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const activeObj = canvas.getActiveObject() as (FabricObject & { isEditing?: boolean }) | null;
      if (activeObj?.isEditing) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        // Never delete the product-template boundary
        const toRemove = (canvas.getActiveObjects() as FabricObject[]).filter(
          (o) => !isTemplate(o),
        );
        if (toRemove.length === 0) return;

        canvas.discardActiveObject();
        toRemove.forEach((obj) => canvas.remove(obj));
        canvas.requestRenderAll();
        // Store is cleared via the selection:cleared event above
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      canvas.off("selection:created", onSelectionCreated);
      canvas.off("selection:updated", onSelectionUpdated);
      canvas.off("selection:cleared", onSelectionCleared);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [canvas, setSelectedObjects]);
}
