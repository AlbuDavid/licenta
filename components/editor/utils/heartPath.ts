/**
 * Builds an SVG path `d` string for a heart shape scaled to w × h mm.
 * Origin at (0, 0); path fits within 0..w × 0..h.
 * Two symmetric cubic bezier curves meeting at the bottom tip.
 */
export function buildHeartPathD(w: number, h: number): string {
  const cx = w / 2;
  // Top two humps defined as two cubics from center-top, meeting at bottom tip
  return [
    `M ${cx},${h * 0.27}`,
    // Left hump
    `C ${cx},${h * 0.1} ${w * 0.05},${h * 0.1} ${w * 0.05},${h * 0.35}`,
    `C ${w * 0.05},${h * 0.6} ${cx},${h * 0.82} ${cx},${h}`,
    // Right hump (mirror)
    `C ${cx},${h * 0.82} ${w * 0.95},${h * 0.6} ${w * 0.95},${h * 0.35}`,
    `C ${w * 0.95},${h * 0.1} ${cx},${h * 0.1} ${cx},${h * 0.27}`,
    "Z",
  ].join(" ");
}
