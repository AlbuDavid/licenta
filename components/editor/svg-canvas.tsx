/* components/editor/svg-canvas.tsx */
"use client"

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

interface SvgCanvasProps {
  svgContent: string | null;
  onSave: (finalSvg: string) => void;
}

// ── Font options ──────────────────────────────────────────────────────────────
const FONTS = [
  'Arial', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Palatino', 'Garamond',
];
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

// ── Fixed shape sizes (px on canvas — locked, cannot be resized by user) ─────
// Scale: ~3.78 px/mm → 10 cm = 378 px. We halve for comfortable canvas display.
const SHAPES = {
  square:    { label: 'Pătrat 10×10 cm',    w: 189, h: 189, r: 0 },
  rectangle: { label: 'Dreptunghi 20×30 cm', w: 226, h: 151, r: 0 },
  circle:    { label: 'Cerc ⌀10 cm',         w: 0,   h: 0,   r: 94 },
} as const;

type ShapeKey = keyof typeof SHAPES;

// ── Component ─────────────────────────────────────────────────────────────────
export default function SvgCanvas({ svgContent, onSave }: SvgCanvasProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const [fc, setFc] = useState<fabric.Canvas | null>(null);

  // Text-toolbar state (shown only when an IText is selected)
  const [textProps, setTextProps] = useState({
    visible: false,
    fontFamily: 'Arial',
    fontSize: 24,
    fill: '#1a1a1a',
    bold: false,
    italic: false,
    underline: false,
  });

  // ── 1. Init canvas ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 760,
      height: 520,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    });

    // DELETE key support
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const actives = canvas.getActiveObjects();
        if (!actives.length) return;
        canvas.discardActiveObject();
        actives.forEach(o => canvas.remove(o));
        canvas.requestRenderAll();
      }
    };
    window.addEventListener('keydown', onKey);

    // Selection listeners → update text toolbar
    const syncTextBar = (obj?: fabric.Object) => {
      if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        const t = obj as fabric.IText;
        setTextProps({
          visible: true,
          fontFamily: (t.fontFamily as string) || 'Arial',
          fontSize: (t.fontSize as number) || 24,
          fill: (t.fill as string) || '#1a1a1a',
          bold: t.fontWeight === 'bold',
          italic: t.fontStyle === 'italic',
          underline: !!t.underline,
        });
      } else {
        setTextProps(p => ({ ...p, visible: false }));
      }
    };

    canvas.on('selection:created',  e => syncTextBar(e.selected?.[0]));
    canvas.on('selection:updated',  e => syncTextBar(e.selected?.[0]));
    canvas.on('selection:cleared',  () => syncTextBar());

    setFc(canvas);
    return () => {
      window.removeEventListener('keydown', onKey);
      canvas.dispose();
    };
  }, []);

  // ── 2. Load SVG ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fc || !svgContent) return;

    const load = async () => {
      try {
        // fabric v6: async API
        const result = await (fabric as any).loadSVGFromString(svgContent);
        const objects: fabric.Object[] = result.objects ?? result;
        const options = result.options ?? {};

        if (!objects?.length) { alert('SVG-ul pare gol sau incompatibil.'); return; }

        const group = (fabric.util as any).groupSVGElements
          ? (fabric.util as any).groupSVGElements(objects, options)
          : new (fabric as any).Group(objects.filter(Boolean));

        fc.clear();
        const cW = fc.getWidth(), cH = fc.getHeight();
        const scale = Math.min((cW * 0.75) / (group.width  || 1),
                               (cH * 0.75) / (group.height || 1));
        group.scale(scale);
        group.set({ left: cW / 2, top: cH / 2, originX: 'center', originY: 'center' });
        fc.add(group);
        fc.requestRenderAll();
      } catch {
        // fabric v5 fallback: callback API
        (fabric as any).loadSVGFromString(
          svgContent,
          (objects: fabric.Object[], options: any) => {
            if (!objects?.length) { alert('SVG-ul pare gol.'); return; }
            const group = (fabric.util as any).groupSVGElements(objects, options);
            fc.clear();
            group.scaleToWidth(440);
            group.set({ left: 380, top: 260, originX: 'center', originY: 'center' });
            fc.add(group);
            fc.requestRenderAll();
          }
        );
      }
    };
    load();
  }, [fc, svgContent]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const addText = () => {
    if (!fc) return;
    const t = new fabric.IText('Textul tău', {
      left: 80, top: 80,
      fontFamily: textProps.fontFamily,
      fontSize: textProps.fontSize,
      fill: textProps.fill,
    });
    fc.add(t);
    fc.setActiveObject(t);
    t.enterEditing();
    fc.requestRenderAll();
  };

  const addShape = (key: ShapeKey) => {
    if (!fc) return;
    const lock = { lockScalingX: true, lockScalingY: true, lockSkewingX: true, lockSkewingY: true };
    const colors: Record<ShapeKey, { fill: string; stroke: string }> = {
      square:    { fill: '#fef9c3', stroke: '#ca8a04' },
      rectangle: { fill: '#dcfce7', stroke: '#16a34a' },
      circle:    { fill: '#e0e7ff', stroke: '#4f46e5' },
    };
    const s = SHAPES[key];
    const c = colors[key];
    let obj: fabric.Object;
    if (key === 'circle') {
      obj = new fabric.Circle({ radius: s.r, fill: c.fill, stroke: c.stroke, strokeWidth: 2, left: 200, top: 150, ...lock });
    } else {
      obj = new fabric.Rect({ width: s.w, height: s.h, fill: c.fill, stroke: c.stroke, strokeWidth: 2, left: 200, top: 150, ...lock });
    }
    fc.add(obj);
    fc.setActiveObject(obj);
    fc.requestRenderAll();
  };

  const applyTextProp = (prop: string, value: unknown) => {
    if (!fc) return;
    const obj = fc.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
      (obj as any).set(prop, value);
      fc.requestRenderAll();
    }
  };

  const deleteSelected = () => {
    if (!fc) return;
    const actives = fc.getActiveObjects();
    fc.discardActiveObject();
    actives.forEach(o => fc.remove(o));
    fc.requestRenderAll();
  };

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
      className="flex gap-0 rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-white"
    >
      {/* ── LEFT TOOLBAR ── */}
      <aside className="w-52 bg-gray-950 text-white flex flex-col py-5 px-3 gap-1 shrink-0">
        <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase px-2 mb-2">
          Instrumente
        </p>

        {/* Text */}
        <ToolBtn icon="T" label="Adaugă Text" color="blue" onClick={addText} />

        <hr className="border-gray-800 my-3" />
        <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase px-2 mb-2">
          Forme fixe
        </p>

        {/* Shapes */}
        {(Object.keys(SHAPES) as ShapeKey[]).map(key => (
          <button
            key={key}
            onClick={() => addShape(key)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                       bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors text-left w-full"
          >
            <ShapeIcon type={key} />
            <span className="leading-tight">{SHAPES[key].label}</span>
          </button>
        ))}

        <div className="flex-1" />

        <hr className="border-gray-800 mb-3" />

        {/* Delete */}
        <button
          onClick={deleteSelected}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold
                     bg-red-600 hover:bg-red-500 text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Șterge
        </button>

        <p className="text-[10px] text-gray-600 text-center mt-2 leading-tight">
          sau apasă DELETE
        </p>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* ── TEXT PROPERTY BAR ── */}
        <div
          className="border-b border-gray-100 px-4 py-2 flex items-center gap-3 flex-wrap bg-gray-50"
          style={{ minHeight: 52 }}
        >
          {textProps.visible ? (
            <>
              <span className="text-xs font-semibold text-gray-500">Font</span>
              <select
                value={textProps.fontFamily}
                onChange={e => {
                  setTextProps(p => ({ ...p, fontFamily: e.target.value }));
                  applyTextProp('fontFamily', e.target.value);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>

              <span className="text-xs font-semibold text-gray-500">Mărime</span>
              <select
                value={textProps.fontSize}
                onChange={e => {
                  const v = Number(e.target.value);
                  setTextProps(p => ({ ...p, fontSize: v }));
                  applyTextProp('fontSize', v);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm w-16 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Bold / Italic / Underline */}
              <div className="flex gap-1">
                {[
                  { label: 'B', prop: 'fontWeight',  on: 'bold',   off: 'normal', active: textProps.bold },
                  { label: 'I', prop: 'fontStyle',   on: 'italic', off: 'normal', active: textProps.italic },
                  { label: 'U', prop: 'underline',   on: true,     off: false,    active: textProps.underline },
                ].map(({ label, prop, on, off, active }) => (
                  <button
                    key={label}
                    onClick={() => {
                      const next = !active;
                      setTextProps(p => ({
                        ...p,
                        bold:      prop === 'fontWeight' ? next : p.bold,
                        italic:    prop === 'fontStyle'  ? next : p.italic,
                        underline: prop === 'underline'  ? next : p.underline,
                      }));
                      applyTextProp(prop, next ? on : off);
                    }}
                    className={`w-8 h-8 rounded-md text-sm font-bold border transition-colors
                      ${active
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <span className="text-xs font-semibold text-gray-500">Culoare</span>
              <input
                type="color"
                value={textProps.fill}
                onChange={e => {
                  setTextProps(p => ({ ...p, fill: e.target.value }));
                  applyTextProp('fill', e.target.value);
                }}
                className="w-8 h-8 rounded-md cursor-pointer border border-gray-300"
              />
            </>
          ) : (
            <p className="text-xs text-gray-400 italic">
              Selectează un element text pentru a edita proprietățile
            </p>
          )}
        </div>

        {/* ── CANVAS ── */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
          <div className="shadow-2xl rounded-lg overflow-hidden border border-gray-300">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50">
          <p className="text-xs text-gray-400">
            💡 Fă dublu-click pe text pentru a-l edita · Formele au dimensiuni fixe
          </p>
          <button
            onClick={() => onSave(fc?.toSVG() ?? '')}
            className="flex items-center gap-2 px-5 py-2 bg-gray-950 text-white rounded-lg
                       hover:bg-gray-800 font-semibold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Salvează Design
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function ToolBtn({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
        bg-${color}-600 hover:bg-${color}-500 text-white transition-colors w-full`}
    >
      <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-xs font-bold">
        {icon}
      </span>
      {label}
    </button>
  );
}

function ShapeIcon({ type }: { type: ShapeKey }) {
  if (type === 'circle') return (
    <svg className="w-5 h-5 shrink-0 text-indigo-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="8" />
    </svg>
  );
  if (type === 'square') return (
    <svg className="w-5 h-5 shrink-0 text-yellow-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="16" height="16" />
    </svg>
  );
  return (
    <svg className="w-5 h-5 shrink-0 text-green-400" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="4" width="18" height="12" />
    </svg>
  );
}
