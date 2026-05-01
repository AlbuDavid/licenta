"use client";

import * as fabric from "fabric";
import { useEditorStore } from "@/store/editorStore";
import {
  bringForward,
  sendBackwards,
} from "@/components/editor/utils/fabric-compat";

/** Pause history, run fn, resume, take one snapshot. */
function batched(fn: () => void) {
  const store = useEditorStore.getState();
  store.pauseHistory();
  fn();
  store.resumeHistory();
  store.takeSnapshot();
}

/**
 * Grouping & layering operations for the active canvas selection.
 *
 * ── How Fabric's activeSelection → Group works ───────────────────────────────
 *
 * When a user lasso-selects or shift-clicks multiple objects, Fabric creates a
 * temporary `fabric.ActiveSelection`. This is NOT a persistent Group — it is a
 * virtual container that disappears the moment the selection is cleared.
 *
 * To make it permanent:
 *  1. Capture the child objects from the active selection.
 *  2. `canvas.discardActiveObject()` — dissolves the temporary container.
 *  3. Remove each original object from the canvas (they were added individually).
 *  4. `new fabric.Group(objects)` — creates a real, persistent Group.
 *  5. Add the Group and select it.
 *
 * Ungroup is the reverse:
 *  1. Get the Group's children via `group.getObjects()`.
 *  2. Remove the Group from the canvas.
 *  3. Re-add each child object (Fabric resets their transforms to absolute).
 *  4. Wrap them in a new `fabric.ActiveSelection` so they remain multi-selected.
 */
export function useGrouping() {
  const canvas = useEditorStore((s) => s.canvas);

  function groupSelected() {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== "activeselection") return;

    batched(() => {
      const selection = active as fabric.ActiveSelection;
      const objects   = selection.getObjects() as fabric.FabricObject[];

      canvas!.discardActiveObject();
      objects.forEach((o) => canvas!.remove(o));

      const group = new fabric.Group(objects);
      canvas!.add(group);
      canvas!.setActiveObject(group);
      canvas!.requestRenderAll();
    });
  }

  function ungroupSelected() {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== "group") return;

    batched(() => {
      const group = active as fabric.Group;
      const objects = group.removeAll() as fabric.FabricObject[];

      canvas!.remove(group);
      objects.forEach((o) => canvas!.add(o));

      const newSelection = new fabric.ActiveSelection(objects, { canvas: canvas! });
      canvas!.setActiveObject(newSelection);
      canvas!.requestRenderAll();
    });
  }

  function bringObjectForward() {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    bringForward(canvas, obj);
  }

  function sendObjectBackward() {
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    sendBackwards(canvas, obj);
  }

  return { groupSelected, ungroupSelected, bringObjectForward, sendObjectBackward };
}
