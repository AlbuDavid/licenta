/**
 * Builds an SVG path `d` string for a heart shape scaled to w × h mm.
 * Origin at (0, 0); path fits within 0..w × 0..h.
 * Proportions match the physical slate heart coaster (11×11cm):
 *   - shallow center cleft at ~20% height
 *   - wide lobes spreading to ~4% from edges, peaking at ~2% from top
 *   - smooth bottom tip at ~97% height
 */
export function buildHeartPathD(w: number, h: number): string {
  const cx = w / 2;
  return [
    `M ${cx},${h * 0.20}`,
    // Left lobe: from center cleft, arc up and outward to the wide shoulder
    `C ${cx},${h * 0.03} ${w * 0.04},${h * 0.02} ${w * 0.04},${h * 0.29}`,
    // Left side curving smoothly down to the bottom tip
    `C ${w * 0.04},${h * 0.60} ${w * 0.26},${h * 0.87} ${cx},${h * 0.97}`,
    // Right side from bottom tip up to right shoulder (mirror)
    `C ${w * 0.74},${h * 0.87} ${w * 0.96},${h * 0.60} ${w * 0.96},${h * 0.29}`,
    // Right lobe back to center cleft (mirror)
    `C ${w * 0.96},${h * 0.02} ${cx},${h * 0.03} ${cx},${h * 0.20}`,
    "Z",
  ].join(" ");
}
