/* components/editor/utils/fabric-compat.ts
   Abstracts differences between Fabric.js v5 (callbacks) and v6 (promises). */

import * as fabric from 'fabric';
import { CV_W, CV_H } from '../editor.config';

// ── Generic method-name fallback ──────────────────────────────────────────────
export function tryMethod(obj: any, methods: string[], ...args: any[]): void {
  for (const m of methods) {
    if (typeof obj[m] === 'function') { obj[m](...args); return; }
  }
}

// ── Image from URL (v5 callback / v6 promise) ─────────────────────────────────
export function fabricImageFromURL(url: string): Promise<fabric.Image> {
  return new Promise(resolve => {
    try {
      const r = (fabric.Image as any).fromURL(url);
      if (r?.then) { r.then(resolve); return; }
    } catch { /* fall through to v5 */ }
    (fabric.Image as any).fromURL(url, resolve);
  });
}

// ── loadFromJSON (v5 callback / v6 promise) ───────────────────────────────────
export function fabricLoadJSON(canvas: fabric.Canvas, state: object): Promise<void> {
  return new Promise(resolve => {
    try {
      const r = canvas.loadFromJSON(state);
      if (r?.then) { r.then(() => resolve()); return; }
    } catch { /* fall through */ }
    (canvas as any).loadFromJSON(state, resolve);
  });
}

// ── Background image setter ────────────────────────────────────────────────────
export function fabricSetBgImage(canvas: fabric.Canvas, img: fabric.Image | null): void {
  if (typeof (canvas as any).setBackgroundImage === 'function') {
    (canvas as any).setBackgroundImage(img, canvas.requestRenderAll.bind(canvas));
  } else {
    (canvas as any).backgroundImage = img;
    canvas.requestRenderAll();
  }
}

// ── Layer order helpers ────────────────────────────────────────────────────────
export function sendToBack(canvas: fabric.Canvas, obj: fabric.Object): void {
  tryMethod(canvas, ['sendObjectToBack', 'sendToBack'], obj);
  canvas.requestRenderAll();
}
export function bringToFront(canvas: fabric.Canvas, obj: fabric.Object): void {
  tryMethod(canvas, ['bringObjectToFront', 'bringToFront'], obj);
  canvas.requestRenderAll();
}
export function sendBackwards(canvas: fabric.Canvas, obj: fabric.Object): void {
  tryMethod(canvas, ['sendObjectBackwards', 'sendBackwards'], obj);
  canvas.requestRenderAll();
}
export function bringForward(canvas: fabric.Canvas, obj: fabric.Object): void {
  tryMethod(canvas, ['bringObjectForward', 'bringForward'], obj);
  canvas.requestRenderAll();
}

// ── Clone an object (v5 callback / v6 promise) ────────────────────────────────
export function cloneObject(obj: fabric.Object): Promise<fabric.Object> {
  return new Promise(resolve => {
    try {
      const r = (obj as any).clone();
      if (r?.then) { r.then(resolve); return; }
    } catch { /* fall through */ }
    (obj as any).clone(resolve);
  });
}

// ── Main SVG loader ────────────────────────────────────────────────────────────
// ungroup=true  → place every element individually (CorelDraw-style editing)
// ungroup=false → place as a single group
export async function loadSVGOntoCanvas(
  canvas: fabric.Canvas,
  svgString: string,
  clearFirst: boolean,
  ungroup: boolean,
): Promise<void> {
  const z   = canvas.getZoom();
  const vpt = canvas.viewportTransform!;

  const place = (objects: fabric.Object[], options: any) => {
    if (!objects?.length) { alert('SVG-ul pare gol sau incompatibil.'); return; }
    const valid = objects.filter(Boolean);

    if (clearFirst) canvas.clear();

    if (ungroup) {
      // Compute bounding box of all elements
      let [mnX, mnY, mxX, mxY] = [Infinity, Infinity, -Infinity, -Infinity];
      valid.forEach(o => {
        const l = o.left ?? 0, t = o.top ?? 0;
        const r = l + (o.width  ?? 0) * (o.scaleX ?? 1);
        const b = t + (o.height ?? 0) * (o.scaleY ?? 1);
        mnX = Math.min(mnX, l); mnY = Math.min(mnY, t);
        mxX = Math.max(mxX, r); mxY = Math.max(mxY, b);
      });
      const cW = (mxX - mnX) || 1, cH = (mxY - mnY) || 1;
      const scale = Math.min((CV_W * 0.65 / z) / cW, (CV_H * 0.65 / z) / cH);
      const ox = (CV_W / z - cW * scale) / 2 - mnX * scale - vpt[4] / z;
      const oy = (CV_H / z - cH * scale) / 2 - mnY * scale - vpt[5] / z;

      valid.forEach(o => {
        o.set({
          left:   (o.left   ?? 0) * scale + ox,
          top:    (o.top    ?? 0) * scale + oy,
          scaleX: (o.scaleX ?? 1) * scale,
          scaleY: (o.scaleY ?? 1) * scale,
        });
        canvas.add(o);
      });
    } else {
      const grp = (fabric.util as any).groupSVGElements
        ? (fabric.util as any).groupSVGElements(valid, options)
        : new (fabric as any).Group(valid);
      const scale = Math.min(
        (CV_W * 0.65 / z) / (grp.width  || 1),
        (CV_H * 0.65 / z) / (grp.height || 1),
      );
      grp.scale(scale);
      grp.set({
        left:    (CV_W / 2 - vpt[4]) / z,
        top:     (CV_H / 2 - vpt[5]) / z,
        originX: 'center',
        originY: 'center',
      });
      canvas.add(grp);
    }

    canvas.requestRenderAll();
  };

  try {
    // fabric v6 async API
    const r = await (fabric as any).loadSVGFromString(svgString);
    place(r.objects ?? r, r.options ?? {});
  } catch {
    // fabric v5 callback fallback
    await new Promise<void>(res => {
      (fabric as any).loadSVGFromString(svgString, (o: fabric.Object[], opts: any) => {
        place(o, opts);
        res();
      });
    });
  }
}
