"use client";

import * as fabric from "fabric";
import { useEditorStore } from "@/store/editorStore";
import {
  bringForward,
  sendBackwards,
} from "@/components/editor/utils/fabric-compat";

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
    if (!active || active.type !== "activeSelection") return;

    const selection = active as fabric.ActiveSelection;
    const objects   = selection.getObjects() as fabric.FabricObject[];

    // Step 1 — dissolve the temporary multi-select container
    canvas.discardActiveObject();

    // Step 2 — remove individual objects from canvas
    objects.forEach((o) => canvas.remove(o));

    // Step 3 — create a persistent Group and add it
    const group = new fabric.Group(objects);
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();
  }

  function ungroupSelected() {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active || active.type !== "group") return;

    const group   = active as fabric.Group;
    const objects = group.getObjects() as fabric.FabricObject[];

    // Remove the group; children lose their group-relative transforms
    canvas.remove(group);

    // Re-add each child — Fabric converts transforms back to canvas-absolute
    objects.forEach((o) => canvas.add(o));

    // Re-select all children as a multi-selection so the user can keep editing
    const newSelection = new fabric.ActiveSelection(objects, { canvas });
    canvas.setActiveObject(newSelection);
    canvas.requestRenderAll();
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
