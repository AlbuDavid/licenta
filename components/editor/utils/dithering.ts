/* components/editor/utils/dithering.ts
   Floyd–Steinberg dithering for the laser-engraving preview.

   A laser engraves photos as a field of discrete burn dots; this converts a
   raster image into exactly that: engraving-coloured dots on a transparent
   background, so the material surface shows through between dots.

   Polarity is material-dependent:
   - slate: the burn is LIGHTER than the surface → bright image areas engrave
   - wood:  the burn is DARKER  than the surface → dark image areas engrave

   Performance: the source is downscaled to maxEdge before diffusion, so even
   ~4000px photos stay well under the preview-toggle budget. Results are cached
   per source element by the caller. */

import type { TemplateMaterial } from "@/lib/template-config";

const DEFAULT_MAX_EDGE = 1200;

/** Parses "#RRGGBB" into [r, g, b]. */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/**
 * Renders `source` as a dithered engraving simulation.
 * Returns a canvas with engraving-coloured dots on transparent background.
 */
export function ditherToEngraving(
  source: HTMLImageElement | HTMLCanvasElement,
  engravingColor: string,
  material: TemplateMaterial,
  maxEdge: number = DEFAULT_MAX_EDGE,
): HTMLCanvasElement {
  const srcW =
    source instanceof HTMLCanvasElement ? source.width : source.naturalWidth;
  const srcH =
    source instanceof HTMLCanvasElement ? source.height : source.naturalHeight;

  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH, 1));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const px = imageData.data;

  // "Not engraved" luminance: dark for slate (bare slate is dark),
  // light for wood (bare wood is light). Transparent pixels blend toward it.
  const blankLum = material === "slate" ? 0 : 255;

  // Luminance buffer (error diffusion happens here, not in the RGBA array)
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = px[i * 4];
    const g = px[i * 4 + 1];
    const b = px[i * 4 + 2];
    const a = px[i * 4 + 3] / 255;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    lum[i] = l * a + blankLum * (1 - a);
  }

  // Floyd–Steinberg error diffusion → binary dot mask
  const [er, eg, eb] = hexToRgb(engravingColor);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = lum[i];
      const quant = old < 128 ? 0 : 255;
      const err = old - quant;
      lum[i] = quant;

      if (x + 1 < w)              lum[i + 1]     += (err * 7) / 16;
      if (y + 1 < h) {
        if (x > 0)                lum[i + w - 1] += (err * 3) / 16;
                                  lum[i + w]     += (err * 5) / 16;
        if (x + 1 < w)            lum[i + w + 1] += (err * 1) / 16;
      }

      // slate: bright quantum = engraved dot; wood: dark quantum = charred dot
      const isDot = material === "slate" ? quant === 255 : quant === 0;
      const o = i * 4;
      if (isDot) {
        px[o] = er;
        px[o + 1] = eg;
        px[o + 2] = eb;
        px[o + 3] = 255;
      } else {
        px[o + 3] = 0; // bare material shows through
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return out;
}
