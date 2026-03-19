/**
 * Generates an SVG path string for a rounded rectangle occupying (0,0)→(w,h)
 * with four independently configurable corner radii.
 *
 * Each radius is clamped to half the shorter side so adjacent arcs never
 * overlap.  Cubic-Bézier curves (KAPPA ≈ 0.5523) match Fabric's own Rect
 * rounding so visual quality is identical.
 */

// Standard constant for approximating a quarter-circle with a cubic Bézier.
const K = 1 - 0.5522847498; // ≈ 0.4477  (control-point inset ratio)

export function roundedRectPath(
  w: number,
  h: number,
  rTL: number,
  rTR: number,
  rBR: number,
  rBL: number,
): string {
  const max = Math.min(w, h) / 2;
  const tl  = Math.max(0, Math.min(rTL, max));
  const tr  = Math.max(0, Math.min(rTR, max));
  const br  = Math.max(0, Math.min(rBR, max));
  const bl  = Math.max(0, Math.min(rBL, max));

  // Clockwise from the top-left corner arc endpoint
  return [
    `M ${tl} 0`,
    `L ${w - tr} 0`,
    `C ${w - K * tr} 0  ${w} ${K * tr}  ${w} ${tr}`,       // TR arc
    `L ${w} ${h - br}`,
    `C ${w} ${h - K * br}  ${w - K * br} ${h}  ${w - br} ${h}`, // BR arc
    `L ${bl} ${h}`,
    `C ${K * bl} ${h}  0 ${h - K * bl}  0 ${h - bl}`,      // BL arc
    `L 0 ${tl}`,
    `C 0 ${K * tl}  ${K * tl} 0  ${tl} 0`,                 // TL arc
    `Z`,
  ].join(" ");
}
