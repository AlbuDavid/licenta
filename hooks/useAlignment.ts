"use client";

import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import type { ActiveSelection, FabricObject, TPointerEventInfo } from "fabric";
import { useEditorStore } from "@/store/editorStore";

/** Document width / height in document units (matches useFabricCanvas.ts). */
const DOC = 4000;

export type AlignTarget     = "selection" | "page";
export type DistributeOver  = "selection" | "page";

export type AlignAction =
  | "left" | "centerH" | "right"
  | "top"  | "centerV" | "bottom";

export type DistributeAction =
  | "leftEdges"   | "centersH"   | "rightEdges"  | "gapH"
  | "topEdges"    | "centersV"   | "bottomEdges" | "gapV";

// ── Internal bbox ─────────────────────────────────────────────────────────────

interface BBox {
  obj: FabricObject;
  l: number; r: number; cx: number;
  t: number; b: number; cy: number;
  w: number; h: number;
}

/** Bounding box in document (absolute) coordinates, origin-aware. */
function bbox(obj: FabricObject): BBox {
  const raw = obj as unknown as Record<string, unknown>;
  const ox  = (raw["originX"] as string | undefined) ?? "left";
  const oy  = (raw["originY"] as string | undefined) ?? "top";
  const l0  = (obj.left  ?? 0) as number;
  const t0  = (obj.top   ?? 0) as number;
  const w   = ((obj.width  ?? 0) as number) * ((obj.scaleX ?? 1) as number);
  const h   = ((obj.height ?? 0) as number) * ((obj.scaleY ?? 1) as number);
  const l   = ox === "center" ? l0 - w / 2 : ox === "right"  ? l0 - w : l0;
  const t   = oy === "center" ? t0 - h / 2 : oy === "bottom" ? t0 - h : t0;
  return { obj, l, r: l + w, cx: l + w / 2, t, b: t + h, cy: t + h / 2, w, h };
}

/** Move an object by (dx, dy) in document space. Works for any originX/Y. */
function move(obj: FabricObject, dx: number, dy: number) {
  obj.set({
    left: ((obj.left ?? 0) as number) + dx,
    top:  ((obj.top  ?? 0) as number) + dy,
  });
  obj.setCoords();
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAlignment() {
  const canvas    = useEditorStore((s) => s.canvas);
  const anchorRef = useRef<FabricObject | null>(null);

  const [alignTarget,   setAlignTarget]   = useState<AlignTarget>("selection");
  const [distributeOver, setDistributeOver] = useState<DistributeOver>("selection");

  // Track the last-clicked object as the alignment anchor
  useEffect(() => {
    if (!canvas) return;
    const onDown = (opt: TPointerEventInfo) => {
      if (opt.target) anchorRef.current = opt.target as FabricObject;
    };
    canvas.on("mouse:down", onDown);
    return () => { canvas.off("mouse:down", onDown); };
  }, [canvas]);

  // ── Core helpers ──────────────────────────────────────────────────────────

  /** Unwrap active selection, run fn, then re-wrap and render. */
  function withObjects(fn: (objects: FabricObject[]) => void) {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    const isSel   = active.type === "activeSelection";
    const objects = isSel
      ? (active as ActiveSelection).getObjects() as FabricObject[]
      : [active as FabricObject];

    canvas.discardActiveObject();
    objects.forEach((o) => o.setCoords());

    fn(objects);

    if (isSel && objects.length > 1) {
      canvas.setActiveObject(new fabric.ActiveSelection(objects, { canvas }));
    } else {
      canvas.setActiveObject(objects[0]);
    }
    canvas.requestRenderAll();
  }

  // ── Align ────────────────────────────────────────────────────────────────

  function align(type: AlignAction, target: AlignTarget) {
    withObjects((objects) => {
      const boxes = objects.map(bbox);

      if (target === "page") {
        // Align every object independently to the page boundary
        boxes.forEach((bb) => {
          let dx = 0, dy = 0;
          if (type === "left")    dx = 0           - bb.l;
          if (type === "right")   dx = DOC         - bb.r;
          if (type === "centerH") dx = DOC / 2     - bb.cx;
          if (type === "top")     dy = 0           - bb.t;
          if (type === "bottom")  dy = DOC         - bb.b;
          if (type === "centerV") dy = DOC / 2     - bb.cy;
          move(bb.obj, dx, dy);
        });
        return;
      }

      // target === "selection"
      const anchor = anchorRef.current && objects.includes(anchorRef.current)
        ? anchorRef.current : null;

      const ab = anchor
        ? boxes.find((b) => b.obj === anchor)!
        : (() => {
            // No anchor → align to bounding box of selection
            const l  = Math.min(...boxes.map((b) => b.l));
            const r  = Math.max(...boxes.map((b) => b.r));
            const t  = Math.min(...boxes.map((b) => b.t));
            const b2 = Math.max(...boxes.map((b) => b.b));
            return { l, r, cx: (l + r) / 2, t, b: b2, cy: (t + b2) / 2 } as BBox;
          })();

      boxes.forEach((bb) => {
        if (anchor && bb.obj === anchor) return; // anchor never moves
        let dx = 0, dy = 0;
        if (type === "left")    dx = ab.l  - bb.l;
        if (type === "right")   dx = ab.r  - bb.r;
        if (type === "centerH") dx = ab.cx - bb.cx;
        if (type === "top")     dy = ab.t  - bb.t;
        if (type === "bottom")  dy = ab.b  - bb.b;
        if (type === "centerV") dy = ab.cy - bb.cy;
        move(bb.obj, dx, dy);
      });
    });
  }

  // ── Distribute ───────────────────────────────────────────────────────────

  function distribute(type: DistributeAction, over: DistributeOver) {
    withObjects((objects) => {
      if (objects.length < 2) return;
      const boxes = objects.map(bbox);

      const selH = { min: Math.min(...boxes.map((b) => b.l)), max: Math.max(...boxes.map((b) => b.r)) };
      const selV = { min: Math.min(...boxes.map((b) => b.t)), max: Math.max(...boxes.map((b) => b.b)) };
      const extH = over === "page" ? { min: 0, max: DOC } : selH;
      const extV = over === "page" ? { min: 0, max: DOC } : selV;

      const n = objects.length;

      // ── Left edges ───────────────────────────────────────────────────────
      if (type === "leftEdges") {
        const sorted = [...boxes].sort((a, b) => a.l - b.l);
        const min    = over === "page" ? 0 : sorted[0].l;
        const max    = over === "page" ? DOC - sorted[n - 1].w : sorted[n - 1].l;
        const step   = n > 1 ? (max - min) / (n - 1) : 0;
        sorted.forEach((bb, i) => move(bb.obj, min + i * step - bb.l, 0));
      }

      // ── Centers H ────────────────────────────────────────────────────────
      if (type === "centersH") {
        const sorted = [...boxes].sort((a, b) => a.cx - b.cx);
        const min    = over === "page" ? sorted[0].w / 2 : sorted[0].cx;
        const max    = over === "page" ? DOC - sorted[n - 1].w / 2 : sorted[n - 1].cx;
        const step   = n > 1 ? (max - min) / (n - 1) : 0;
        sorted.forEach((bb, i) => move(bb.obj, min + i * step - bb.cx, 0));
      }

      // ── Right edges ──────────────────────────────────────────────────────
      if (type === "rightEdges") {
        const sorted = [...boxes].sort((a, b) => a.r - b.r);
        const min    = over === "page" ? sorted[0].w : sorted[0].r;
        const max    = over === "page" ? DOC : sorted[n - 1].r;
        const step   = n > 1 ? (max - min) / (n - 1) : 0;
        sorted.forEach((bb, i) => move(bb.obj, min + i * step - bb.r, 0));
      }

      // ── Equal horizontal gap ─────────────────────────────────────────────
      if (type === "gapH") {
        const sorted  = [...boxes].sort((a, b) => a.l - b.l);
        const totalW  = sorted.reduce((s, b) => s + b.w, 0);
        const gap     = (extH.max - extH.min - totalW) / (n - 1);
        let cursor    = extH.min;
        sorted.forEach((bb) => { move(bb.obj, cursor - bb.l, 0); cursor += bb.w + gap; });
      }

      // ── Top edges ────────────────────────────────────────────────────────
      if (type === "topEdges") {
        const sorted = [...boxes].sort((a, b) => a.t - b.t);
        const min    = over === "page" ? 0 : sorted[0].t;
        const max    = over === "page" ? DOC - sorted[n - 1].h : sorted[n - 1].t;
        const step   = n > 1 ? (max - min) / (n - 1) : 0;
        sorted.forEach((bb, i) => move(bb.obj, 0, min + i * step - bb.t));
      }

      // ── Centers V ────────────────────────────────────────────────────────
      if (type === "centersV") {
        const sorted = [...boxes].sort((a, b) => a.cy - b.cy);
        const min    = over === "page" ? sorted[0].h / 2 : sorted[0].cy;
        const max    = over === "page" ? DOC - sorted[n - 1].h / 2 : sorted[n - 1].cy;
        const step   = n > 1 ? (max - min) / (n - 1) : 0;
        sorted.forEach((bb, i) => move(bb.obj, 0, min + i * step - bb.cy));
      }

      // ── Bottom edges ─────────────────────────────────────────────────────
      if (type === "bottomEdges") {
        const sorted = [...boxes].sort((a, b) => a.b - b.b);
        const min    = over === "page" ? sorted[0].h : sorted[0].b;
        const max    = over === "page" ? DOC : sorted[n - 1].b;
        const step   = n > 1 ? (max - min) / (n - 1) : 0;
        sorted.forEach((bb, i) => move(bb.obj, 0, min + i * step - bb.b));
      }

      // ── Equal vertical gap ───────────────────────────────────────────────
      if (type === "gapV") {
        const sorted  = [...boxes].sort((a, b) => a.t - b.t);
        const totalH  = sorted.reduce((s, b) => s + b.h, 0);
        const gap     = (extV.max - extV.min - totalH) / (n - 1);
        let cursor    = extV.min;
        sorted.forEach((bb) => { move(bb.obj, 0, cursor - bb.t); cursor += bb.h + gap; });
      }
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    alignTarget,
    setAlignTarget,
    distributeOver,
    setDistributeOver,
    align,
    distribute,
    // Individual shorthands (used in LayerActions → kept for compat)
    alignLeft:    () => align("left",    alignTarget),
    alignCenterH: () => align("centerH", alignTarget),
    alignRight:   () => align("right",   alignTarget),
    alignTop:     () => align("top",     alignTarget),
    alignCenterV: () => align("centerV", alignTarget),
    alignBottom:  () => align("bottom",  alignTarget),
  };
}
