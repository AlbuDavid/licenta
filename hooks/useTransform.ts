"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editorStore";
import type { AnchorPoint, AnchorH, AnchorV } from "@/store/editorStore";

export type { AnchorPoint, AnchorH, AnchorV };

export interface TransformSnapshot {
  x: number;      // mm at the current anchor point
  y: number;      // mm at the current anchor point
  w: number;      // mm — getScaledWidth()
  h: number;      // mm — getScaledHeight()
  angle: number;  // degrees, normalised 0..360
}

// Map our AnchorPoint vocabulary to Fabric's originX / originY strings
function toFabricOrigin(anchor: AnchorPoint): {
  originX: "left" | "center" | "right";
  originY: "top" | "center" | "bottom";
} {
  const yMap: Record<AnchorV, "top" | "center" | "bottom"> = {
    top:    "top",
    middle: "center",
    bottom: "bottom",
  };
  return { originX: anchor.x, originY: yMap[anchor.y] };
}

function normaliseAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

let _snapshotTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSnapshot(takeSnapshot: () => void) {
  if (_snapshotTimer) clearTimeout(_snapshotTimer);
  _snapshotTimer = setTimeout(() => {
    takeSnapshot();
    _snapshotTimer = null;
  }, 300);
}

export function useTransform() {
  const canvas            = useEditorStore((s) => s.canvas);
  const selectedObjects   = useEditorStore((s) => s.selectedObjects);
  const anchor            = useEditorStore((s) => s.transformAnchor);
  const lockAspect        = useEditorStore((s) => s.transformLockAspect);
  const setAnchor         = useEditorStore((s) => s.setTransformAnchor);
  const setLockAspect     = useEditorStore((s) => s.setTransformLockAspect);
  const takeSnapshot      = useEditorStore((s) => s.takeSnapshot);

  const [snapshot, setSnapshot] = useState<TransformSnapshot | null>(null);

  // Keep anchor in a ref so event handlers always see the current value
  const anchorRef = useRef(anchor);
  useEffect(() => { anchorRef.current = anchor; }, [anchor]);

  const readSnapshot = useCallback((obj: fabric.FabricObject, a: AnchorPoint): TransformSnapshot => {
    const { originX, originY } = toFabricOrigin(a);
    const pt = obj.getPointByOrigin(originX, originY);
    return {
      x: round1(pt.x),
      y: round1(pt.y),
      w: round1(obj.getScaledWidth()),
      h: round1(obj.getScaledHeight()),
      angle: round1(normaliseAngle(obj.angle ?? 0)),
    };
  }, []);

  // Sync snapshot whenever selection or anchor changes
  useEffect(() => {
    const first = selectedObjects[0] ?? null;
    if (!first || selectedObjects.length > 1) {
      setSnapshot(null);
      return;
    }
    setSnapshot(readSnapshot(first, anchor));
  }, [selectedObjects, anchor, readSnapshot]);

  // Sync snapshot from canvas events (drag, scale, rotate)
  useEffect(() => {
    if (!canvas) return;

    const sync = () => {
      const first = selectedObjects[0] ?? null;
      if (!first || selectedObjects.length > 1) return;
      setSnapshot(readSnapshot(first, anchorRef.current));
    };

    canvas.on("object:moving",   sync);
    canvas.on("object:scaling",  sync);
    canvas.on("object:rotating", sync);
    canvas.on("object:skewing",  sync);

    return () => {
      canvas.off("object:moving",   sync);
      canvas.off("object:scaling",  sync);
      canvas.off("object:rotating", sync);
      canvas.off("object:skewing",  sync);
    };
  }, [canvas, selectedObjects, readSnapshot]);

  function getTarget(): fabric.FabricObject | null {
    if (!canvas || selectedObjects.length !== 1) return null;
    return selectedObjects[0] ?? null;
  }

  function setX(mm: number) {
    const obj = getTarget();
    if (!obj) return;
    const { originX, originY } = toFabricOrigin(anchor);
    // Move the object so the anchor point lands at mm
    const currentPt = obj.getPointByOrigin(originX, originY);
    const dx = mm - currentPt.x;
    obj.set("left", (obj.left ?? 0) + dx);
    obj.setCoords();
    canvas!.requestRenderAll();
    setSnapshot((s) => s ? { ...s, x: round1(mm) } : s);
    scheduleSnapshot(takeSnapshot);
  }

  function setY(mm: number) {
    const obj = getTarget();
    if (!obj) return;
    const { originX, originY } = toFabricOrigin(anchor);
    const currentPt = obj.getPointByOrigin(originX, originY);
    const dy = mm - currentPt.y;
    obj.set("top", (obj.top ?? 0) + dy);
    obj.setCoords();
    canvas!.requestRenderAll();
    setSnapshot((s) => s ? { ...s, y: round1(mm) } : s);
    scheduleSnapshot(takeSnapshot);
  }

  function setW(mm: number) {
    const obj = getTarget();
    if (!obj || mm <= 0) return;
    const naturalW = obj.width ?? 1;
    const newScaleX = mm / naturalW;
    if (lockAspect) {
      const ratio = mm / obj.getScaledWidth();
      obj.set({ scaleX: newScaleX, scaleY: (obj.scaleY ?? 1) * ratio });
    } else {
      obj.set("scaleX", newScaleX);
    }
    obj.setCoords();
    canvas!.requestRenderAll();
    setSnapshot((s) => s ? {
      ...s,
      w: round1(mm),
      h: lockAspect ? round1(obj.getScaledHeight()) : s.h,
    } : s);
    scheduleSnapshot(takeSnapshot);
  }

  function setH(mm: number) {
    const obj = getTarget();
    if (!obj || mm <= 0) return;
    const naturalH = obj.height ?? 1;
    const newScaleY = mm / naturalH;
    if (lockAspect) {
      const ratio = mm / obj.getScaledHeight();
      obj.set({ scaleY: newScaleY, scaleX: (obj.scaleX ?? 1) * ratio });
    } else {
      obj.set("scaleY", newScaleY);
    }
    obj.setCoords();
    canvas!.requestRenderAll();
    setSnapshot((s) => s ? {
      ...s,
      h: round1(mm),
      w: lockAspect ? round1(obj.getScaledWidth()) : s.w,
    } : s);
    scheduleSnapshot(takeSnapshot);
  }

  function setAngle(deg: number) {
    const obj = getTarget();
    if (!obj) return;
    const norm = normaliseAngle(deg);
    obj.rotate(norm);
    obj.setCoords();
    canvas!.requestRenderAll();
    setSnapshot((s) => s ? { ...s, angle: round1(norm) } : s);
    scheduleSnapshot(takeSnapshot);
  }

  function resetAngle() {
    setAngle(0);
  }

  function toggleLockAspect() {
    setLockAspect(!lockAspect);
  }

  return {
    snapshot,
    anchor,
    lockAspect,
    setAnchor,
    toggleLockAspect,
    setX,
    setY,
    setW,
    setH,
    setAngle,
    resetAngle,
  };
}
