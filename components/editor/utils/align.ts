/* components/editor/utils/align.ts
   Alignment helpers. Multi-select → anchor = ultimul obiect selectat. */

import * as fabric from 'fabric';

export type AlignType =
  | 'left' | 'right' | 'centerH'
  | 'top'  | 'bottom' | 'centerV'
  | 'distH' | 'distV';

export function doAlign(
  canvas: fabric.Canvas,
  type: AlignType,
  anchor?: fabric.Object | null,
): void {
  const active = canvas.getActiveObject();
  if (!active) return;

  if (active.type === 'activeSelection') {
    alignMultiple(canvas, active as fabric.ActiveSelection, type, anchor ?? null);
  } else {
    alignSingle(canvas, active, type);
  }

  active.setCoords();
  canvas.requestRenderAll();
}

// ── Single object → align to canvas center ───────────────────────────────────
function alignSingle(canvas: fabric.Canvas, obj: fabric.Object, type: AlignType): void {
  const cw  = canvas.getWidth();
  const ch  = canvas.getHeight();
  const z   = canvas.getZoom();
  const vpt = canvas.viewportTransform!;
  const docL = -vpt[4] / z, docT = -vpt[5] / z;
  const docR = docL + cw / z, docB = docT + ch / z;
  const w   = (obj.width  ?? 0) * (obj.scaleX ?? 1);
  const h   = (obj.height ?? 0) * (obj.scaleY ?? 1);

  if (type === 'left')    obj.set({ left: docL });
  if (type === 'right')   obj.set({ left: docR - w });
  if (type === 'centerH') obj.set({ left: docL + (docR - docL - w) / 2 });
  if (type === 'top')     obj.set({ top: docT });
  if (type === 'bottom')  obj.set({ top: docB - h });
  if (type === 'centerV') obj.set({ top: docT + (docB - docT - h) / 2 });
  obj.setCoords();
}

interface AbsBox {
  o: fabric.Object;
  w: number; h: number;
  l: number; r: number;
  t: number; b: number;
  cx: number; cy: number;
}

// ── Multiple objects → align relative to anchor ──────────────────────────────
function alignMultiple(
  canvas: fabric.Canvas,
  sel: fabric.ActiveSelection,
  type: AlignType,
  anchor: fabric.Object | null,
): void {
  const objs = sel.getObjects();
  const mat  = sel.calcTransformMatrix();

  const abs: AbsBox[] = objs.map(o => {
    const pt = fabric.util.transformPoint(
      new fabric.Point(o.left ?? 0, o.top ?? 0), mat,
    );
    const w = (o.width  ?? 0) * (o.scaleX ?? 1);
    const h = (o.height ?? 0) * (o.scaleY ?? 1);
    return { o, w, h,
      l: pt.x - w / 2, r: pt.x + w / 2,
      t: pt.y - h / 2, b: pt.y + h / 2,
      cx: pt.x, cy: pt.y };
  });

  const anchorBox = anchor ? (abs.find(a => a.o === anchor) ?? null) : null;
  const mnL = Math.min(...abs.map(a => a.l));
  const mxR = Math.max(...abs.map(a => a.r));
  const mnT = Math.min(...abs.map(a => a.t));
  const mxB = Math.max(...abs.map(a => a.b));

  abs.forEach(({ o, l, r, t, b, cx, cy }) => {
    let dx = 0, dy = 0;

    if (anchorBox && type !== 'distH' && type !== 'distV') {
      if (type === 'left')    dx = anchorBox.l  - l;
      if (type === 'right')   dx = anchorBox.r  - r;
      if (type === 'centerH') dx = anchorBox.cx - cx;
      if (type === 'top')     dy = anchorBox.t  - t;
      if (type === 'bottom')  dy = anchorBox.b  - b;
      if (type === 'centerV') dy = anchorBox.cy - cy;
    } else {
      if (type === 'left')    dx = mnL - l;
      if (type === 'right')   dx = mxR - r;
      if (type === 'centerH') dx = (mnL + mxR) / 2 - cx;
      if (type === 'top')     dy = mnT - t;
      if (type === 'bottom')  dy = mxB - b;
      if (type === 'centerV') dy = (mnT + mxB) / 2 - cy;
    }
    o.set({ left: (o.left ?? 0) + dx, top: (o.top ?? 0) + dy });
  });

  if (type === 'distH' && abs.length >= 3) {
    const sorted = [...abs].sort((a, b) => a.l - b.l);
    const totalW = sorted.reduce((s, a) => s + a.w, 0);
    const gap    = (mxR - mnL - totalW) / (sorted.length - 1);
    let cursor   = mnL;
    sorted.forEach(({ o, w }) => {
      o.set({ left: (o.left ?? 0) + (cursor + w / 2 - ((o.left ?? 0) + w / 2)) });
      cursor += w + gap;
    });
  }
  if (type === 'distV' && abs.length >= 3) {
    const sorted = [...abs].sort((a, b) => a.t - b.t);
    const totalH = sorted.reduce((s, a) => s + a.h, 0);
    const gap    = (mxB - mnT - totalH) / (sorted.length - 1);
    let cursor   = mnT;
    sorted.forEach(({ o, h }) => {
      o.set({ top: (o.top ?? 0) + (cursor + h / 2 - ((o.top ?? 0) + h / 2)) });
      cursor += h + gap;
    });
  }

  objs.forEach(o => o.setCoords());
  sel.setCoords();
}
