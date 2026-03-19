"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import type { ActiveSelection, FabricObject, TPointerEventInfo } from "fabric";
import { useEditorStore } from "@/store/editorStore";
import type { AlignType } from "@/components/editor/utils/align";

/**
 * Corel Draw-style anchor alignment.
 *
 * The anchor is the LAST CLICKED object that belongs to the active selection.
 * It never moves — all other objects snap their edge/centre to match it.
 *
 * Implementation strategy
 * ────────────────────────
 * 1. Track the last canvas `mouse:down` target in a ref (same pattern as the
 *    working /customize editor that uses `lastClickedRef`).
 * 2. When an alignment button fires, call `canvas.discardActiveObject()` first.
 *    This is the KEY step: Fabric restores every child object's `left`/`top`
 *    to canvas-absolute coordinates so we can reason about them normally.
 * 3. Read each object's origin-aware absolute bounding box.
 * 4. Compute (dx, dy) in canvas-absolute space and apply `obj.left += dx`.
 *    This works for any originX/originY because `left`/`top` always define the
 *    origin point in the parent coordinate system — adding a document-space
 *    delta always moves the object by that exact amount in document space.
 * 5. Re-create the ActiveSelection so the user keeps multi-select.
 */
export function useAlignment() {
  const canvas    = useEditorStore((s) => s.canvas);
  const anchorRef = useRef<FabricObject | null>(null);

  // Mirror the lastClickedRef pattern from the working svg-canvas editor
  useEffect(() => {
    if (!canvas) return;

    function onMouseDown(opt: TPointerEventInfo) {
      if (opt.target) anchorRef.current = opt.target as FabricObject;
    }

    canvas.on("mouse:down", onMouseDown);
    return () => { canvas.off("mouse:down", onMouseDown); };
  }, [canvas]);

  function align(type: AlignType) {
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active || active.type !== "activeSelection") return;

    const sel     = active as ActiveSelection;
    const objects = sel.getObjects() as FabricObject[];
    if (objects.length < 2) return;

    // Prefer the last-clicked object; fall back to last in array
    let anchor: FabricObject = objects[objects.length - 1];
    if (anchorRef.current && objects.includes(anchorRef.current)) {
      anchor = anchorRef.current;
    }

    // ── Step 1: release the ActiveSelection ───────────────────────────────
    // After this call every object.left / object.top is canvas-document-absolute.
    canvas.discardActiveObject();
    objects.forEach((o) => o.setCoords());

    // ── Step 2: compute axis-aligned bounding box in document space ────────
    //
    // We must respect originX / originY because:
    //   • Shapes/images default to originX:"left",  originY:"top"
    //     → left = left edge,  top = top edge
    //   • Groups  default to originX:"center", originY:"center"
    //     → left = centre x,   top = centre y
    //
    // getDocEdge converts whatever the object stores into the left/top edge.
    function docEdges(obj: FabricObject): { l: number; t: number; w: number; h: number } {
      const raw = obj as unknown as Record<string, unknown>;
      const ox  = (raw["originX"] as string | undefined) ?? "left";
      const oy  = (raw["originY"] as string | undefined) ?? "top";
      const l0  = (obj.left  ?? 0) as number;
      const t0  = (obj.top   ?? 0) as number;
      const w   = ((obj.width  ?? 0) as number) * ((obj.scaleX ?? 1) as number);
      const h   = ((obj.height ?? 0) as number) * ((obj.scaleY ?? 1) as number);

      const l = ox === "center" ? l0 - w / 2 : ox === "right"  ? l0 - w : l0;
      const t = oy === "center" ? t0 - h / 2 : oy === "bottom" ? t0 - h : t0;
      return { l, t, w, h };
    }

    function bbox(obj: FabricObject) {
      const { l, t, w, h } = docEdges(obj);
      return { l, t, r: l + w, b: t + h, cx: l + w / 2, cy: t + h / 2, w, h };
    }

    const ab = bbox(anchor);

    // ── Step 3: move every non-anchor object ──────────────────────────────
    objects.forEach((obj) => {
      if (obj === anchor) return;

      const ob = bbox(obj);
      let dx = 0, dy = 0;

      switch (type) {
        case "left":    dx = ab.l  - ob.l;  break;
        case "right":   dx = ab.r  - ob.r;  break;
        case "centerH": dx = ab.cx - ob.cx; break;
        case "top":     dy = ab.t  - ob.t;  break;
        case "bottom":  dy = ab.b  - ob.b;  break;
        case "centerV": dy = ab.cy - ob.cy; break;
      }

      obj.set({
        left: ((obj.left ?? 0) as number) + dx,
        top:  ((obj.top  ?? 0) as number) + dy,
      });
      obj.setCoords();
    });

    // ── Step 4: restore multi-selection so the user can keep editing ───────
    const restored = new fabric.ActiveSelection(objects, { canvas });
    canvas.setActiveObject(restored);
    canvas.requestRenderAll();
  }

  return {
    alignLeft:    () => align("left"),
    alignCenterH: () => align("centerH"),
    alignRight:   () => align("right"),
    alignTop:     () => align("top"),
    alignCenterV: () => align("centerV"),
    alignBottom:  () => align("bottom"),
  };
}
