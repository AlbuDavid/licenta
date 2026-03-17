/* components/editor/utils/dxf.ts
   Parses a subset of DXF (LINE, CIRCLE, ARC, LWPOLYLINE, TEXT/MTEXT)
   and returns Fabric.js objects. No external dependency needed. */

import * as fabric from 'fabric';

export function parseDXFtoFabric(dxf: string): fabric.Object[] {
  const lines = dxf.split(/\r?\n/).map(l => l.trim());
  const objs:  fabric.Object[] = [];
  let i = 0;

  // Skip to ENTITIES section
  while (i < lines.length && lines[i] !== 'ENTITIES') i++;

  while (i < lines.length) {
    if (lines[i] !== '0') { i++; continue; }
    const type = (lines[i + 1] ?? '').toUpperCase();
    if (type === 'ENDSEC' || type === 'EOF') break;

    // Collect all group-code pairs until next entity marker
    let j = i + 2;
    const props: Record<number, string> = {};
    const vertX: number[] = [];
    const vertY: number[] = [];

    while (j < lines.length && lines[j] !== '0') {
      const code = parseInt(lines[j]);
      if (!isNaN(code)) {
        const val = lines[j + 1] ?? '';
        if (code === 10 && type === 'LWPOLYLINE') vertX.push(parseFloat(val));
        else if (code === 20 && type === 'LWPOLYLINE') vertY.push(-parseFloat(val));
        else props[code] = val;
      }
      j += 2;
    }

    const px = parseFloat(props[10] ?? '0');
    const py = -parseFloat(props[20] ?? '0');
    const BASE = { stroke: '#1a1a1a', strokeWidth: 1 };

    switch (type) {
      case 'LINE': {
        objs.push(new fabric.Line(
          [px, py, parseFloat(props[11] ?? '0'), -parseFloat(props[21] ?? '0')],
          { ...BASE, fill: '' },
        ));
        break;
      }
      case 'CIRCLE': {
        const r = parseFloat(props[40] ?? '10');
        objs.push(new fabric.Circle({ ...BASE, left: px - r, top: py - r, radius: r, fill: 'transparent' }));
        break;
      }
      case 'ARC': {
        const r  = parseFloat(props[40] ?? '10');
        const sa = parseFloat(props[50] ?? '0')   * Math.PI / 180;
        let   ea = parseFloat(props[51] ?? '360') * Math.PI / 180;
        if (ea < sa) ea += Math.PI * 2;
        const steps = Math.max(16, Math.ceil((ea - sa) * 10));
        const pts: { x: number; y: number }[] = [];
        for (let s = 0; s <= steps; s++) {
          const a = sa + (ea - sa) * (s / steps);
          pts.push({ x: px + r * Math.cos(a), y: py - r * Math.sin(a) });
        }
        if (pts.length > 1)
          objs.push(new fabric.Polyline(pts, { ...BASE, fill: 'transparent' }));
        break;
      }
      case 'LWPOLYLINE': {
        if (vertX.length > 1) {
          const pts = vertX.map((x, idx) => ({ x, y: vertY[idx] ?? 0 }));
          const closed = (parseInt(props[70] ?? '0') & 1) === 1;
          objs.push(
            closed
              ? new fabric.Polygon(pts, { ...BASE, fill: 'transparent' })
              : new fabric.Polyline(pts, { ...BASE, fill: 'transparent' }),
          );
        }
        break;
      }
      case 'TEXT':
      case 'MTEXT': {
        objs.push(new fabric.IText(props[1] ?? 'text', {
          left: px, top: py,
          fontSize: parseFloat(props[40] ?? '10'),
          fill: '#1a1a1a',
        }));
        break;
      }
    }

    i = j;
  }

  return objs;
}
