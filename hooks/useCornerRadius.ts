"use client";

import * as fabric from "fabric";
import type { FabricObject } from "fabric";
import { useEditorStore } from "@/store/editorStore";
import { roundedRectPath } from "@/components/editor/utils/roundedRectPath";

// ── Shared data shape stored inside the fabric object ────────────────────────

export interface CornerRadiiData {
  isRoundedRect: true;
  /** Visual width (px) baked in at the time of last edit — scaleX is always 1. */
  vw: number;
  vh: number;
  rTL: number;
  rTR: number;
  rBR: number;
  rBL: number;
}

/** Type-safe check: is this object a rounded-rect path created by useCornerRadius? */
export function isRoundedRectObject(
  obj: FabricObject,
): obj is FabricObject & { data: CornerRadiiData } {
  const d = (obj as { data?: unknown }).data;
  return (
    obj.type === "path" &&
    typeof d === "object" &&
    d !== null &&
    (d as Record<string, unknown>).isRoundedRect === true
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCornerRadius() {
  const canvas = useEditorStore((s) => s.canvas);

  /**
   * Replaces the active rect / rounded-rect-path with a new fabric.Path that
   * has the given four corner radii.
   *
   * Why we replace instead of mutate:
   *  • fabric.Path stores its geometry as immutable baked-in path data.
   *  • There is no API to change a path's shape after creation; a new Path
   *    object must be created.
   *
   * Visual dimensions are always baked into the path (scaleX/scaleY = 1) so
   * that "radius 20" always means "20 canvas-document pixels", matching user
   * expectations in a measurement-oriented editor.
   */
  function applyCornerRadii(
    rTL: number,
    rTR: number,
    rBR: number,
    rBL: number,
  ) {
    if (!canvas) return;
    const obj = canvas.getActiveObject() as FabricObject | null;
    if (!obj) return;

    // ── 1. Compute visual dimensions ─────────────────────────────────────
    let vw: number, vh: number;

    if (obj.type === "rect") {
      vw = ((obj.width  ?? 0) as number) * ((obj.scaleX ?? 1) as number);
      vh = ((obj.height ?? 0) as number) * ((obj.scaleY ?? 1) as number);
    } else if (isRoundedRectObject(obj)) {
      // Bake the current user-applied scale into the path dimensions
      vw = obj.data.vw * ((obj.scaleX ?? 1) as number);
      vh = obj.data.vh * ((obj.scaleY ?? 1) as number);
    } else {
      return; // only works on rects / rounded-rect paths
    }

    // ── 2. Build path and create the new Fabric object ───────────────────
    const d = roundedRectPath(vw, vh, rTL, rTR, rBR, rBL);

    const data: CornerRadiiData = { isRoundedRect: true, vw, vh, rTL, rTR, rBR, rBL };

    const newPath = new fabric.Path(d, {
      left:          (obj.left  ?? 0) as number,
      top:           (obj.top   ?? 0) as number,
      angle:         (obj.angle ?? 0) as number,
      scaleX:        1,   // dimensions already baked in
      scaleY:        1,
      fill:          obj.fill,
      stroke:        obj.stroke,
      strokeWidth:   ((obj as { strokeWidth?: number }).strokeWidth ?? 0),
      strokeUniform: true,
      data,
    });

    // ── 3. Swap on canvas ─────────────────────────────────────────────────
    canvas.remove(obj);
    canvas.add(newPath);
    canvas.setActiveObject(newPath);
    canvas.requestRenderAll();
  }

  return { applyCornerRadii };
}
