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
const SHAPES = {
  square:    { label: 'Pătrat 10×10 cm',     w: 189, h: 189, r: 0  },
  rectangle: { label: 'Dreptunghi 20×30 cm', w: 226, h: 151, r: 0  },
  circle:    { label: 'Cerc ⌀10 cm',          w: 0,   h: 0,   r: 94 },
} as const;

type ShapeKey = keyof typeof SHAPES;

// ── Shared helper: load SVG string onto a fabric canvas ───────────────────────
async function loadSvgOntoCanvas(
  fc: fabric.Canvas,
  svgContent: string,
  clear: boolean,
) {
  const cW = fc.getWidth();
  const cH = fc.getHeight();

  const addGroup = (objects: fabric.Object[], options: any) => {
    if (!objects?.length) { alert('SVG-ul pare gol sau incompatibil.'); return; }
    const group = (fabric.util as any).groupSVGElements
      ? (fabric.util as any).groupSVGElements(objects.filter(Boolean), options)
      : new (fabric as any).Group(objects.filter(Boolean));

    if (clear) fc.clear();
    const scale = Math.min((cW * 0.75) / (group.width || 1),
                           (cH * 0.75) / (group.height || 1));
    group.scale(scale);
    group.set({ left: cW / 2, top: cH / 2, originX: 'center', originY: 'center' });
    fc.add(group);
    fc.requestRenderAll();
  };

  try {
    // fabric v6 async API
    const result = await (fabric as any).loadSVGFromString(svgContent);
    addGroup(result.objects ?? result, result.options ?? {});
  } catch {
    // fabric v5 callback fallback
    (fabric as any).loadSVGFromString(svgContent, (objects: fabric.Object[], options: any) => {
      addGroup(objects, options);
    });
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SvgCanvas({ svgContent, onSave }: SvgCanvasProps) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const addSvgInputRef = useRef<HTMLInputElement>(null);
  const [fc, setFc]    = useState<fabric.Canvas | null>(null);

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

    // Text toolbar sync
    const syncTextBar = (obj?: fabric.Object) => {
      if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        const t = obj as fabric.IText;
        setTextProps({
          visible:    true,
          fontFamily: (t.fontFamily as string) || 'Arial',
          fontSize:   (t.fontSize   as number) || 24,
          fill:       (t.fill       as string) || '#1a1a1a',
          bold:       t.fontWeight === 'bold',
          italic:     t.fontStyle  === 'italic',
          underline:  !!t.underline,
        });
      } else {
        setTextProps(p => ({ ...p, visible: false }));
      }
    };

    canvas.on('selection:created', e => syncTextBar(e.selected?.[0]));
    canvas.on('selection:updated', e => syncTextBar(e.selected?.[0]));
    canvas.on('selection:cleared', () => syncTextBar());

    setFc(canvas);
    return () => {
      window.removeEventListener('keydown', onKey);
      canvas.dispose();
    };
  }, []);

  // ── 2. Load initial SVG (clears canvas) ────────────────────────────────────
  useEffect(() => {
    if (!fc || !svgContent) return;
    loadSvgOntoCanvas(fc, svgContent, true);
  }, [fc, svgContent]);

  // ── 3. Add extra SVG (keeps all existing objects) ───────────────────────────
  const handleAddSvgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fc) return;
    e.target.value = ''; // reset so same file can be added again
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      loadSvgOntoCanvas(fc, text, false); // false = don't clear existing objects
    };
    reader.readAsText(file);
  };

  // ── 4. Add text ─────────────────────────────────────────────────────────────
  const addText = () => {
    if (!fc) return;
    const t = new fabric.IText('Textul tău', {
      left: 80, top: 80,
      fontFamily: textProps.fontFamily,
      fontSize:   textProps.fontSize,
      fill:       textProps.fill,
    });
    fc.add(t);
    fc.setActiveObject(t);
    t.enterEditing();
    fc.requestRenderAll();
  };

  // ── 5. Add shape — outline only, forced to back of stack ────────────────────
  const addShape = (key: ShapeKey) => {
    if (!fc) return;

    const STROKE_COLORS: Record<ShapeKey, string> = {
      square:    '#ca8a04',
      rectangle: '#16a34a',
      circle:    '#4f46e5',
    };

    const lock = {
      lockScalingX: true, lockScalingY: true,
      lockSkewingX: true, lockSkewingY: true,
    };

    const s = SHAPES[key];
    let obj: fabric.Object;

    if (key === 'circle') {
      obj = new fabric.Circle({
        radius: s.r,
        fill: 'transparent',      // ← outline only, no fill
        stroke: STROKE_COLORS[key],
        strokeWidth: 2,
        left: 200, top: 150,
        ...lock,
      });
    } else {
      obj = new fabric.Rect({
        width: s.w, height: s.h,
        fill: 'transparent',      // ← outline only, no fill
        stroke: STROKE_COLORS[key],
        strokeWidth: 2,
        left: 200, top: 150,
        ...lock,
      });
    }

    fc.add(obj);

    // ← send shape behind every other object on the canvas
    // Try fabric v6 method first, fall back to v5
    if (typeof (fc as any).sendObjectToBack === 'function') {
      (fc as any).sendObjectToBack(obj);
    } else if (typeof (fc as any).sendToBack === 'function') {
      (fc as any).sendToBack(obj);
    }

    fc.discardActiveObject();
    fc.requestRenderAll();
  };

  // ── 6. Apply text property ──────────────────────────────────────────────────
  const applyTextProp = (prop: string, value: unknown) => {
    if (!fc) return;
    const obj = fc.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
      (obj as any).set(prop, value);
      fc.requestRenderAll();
    }
  };

  // ── 7. Delete selected ──────────────────────────────────────────────────────
  const deleteSelected = () => {
    if (!fc) return;
    const actives = fc.getActiveObjects();
    fc.discardActiveObject();
    actives.forEach(o => fc.remove(o));
    fc.requestRenderAll();
  };

  // ── 8. Download canvas as .svg file ────────────────────────────────────────
  const downloadSvg = () => {
    if (!fc) return;
    const svgString = fc.toSVG();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'design.svg';   // ← file saved as "design.svg"
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // notify parent page (shows the "Design salvat!" toast)
    onSave(svgString);
  };

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
      className="flex gap-0 rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-white"
    >
      {/* ── LEFT TOOLBAR ── */}
      <aside className="w-56 bg-gray-950 text-white flex flex-col py-5 px-3 gap-1 shrink-0">

        <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase px-2 mb-2">
          Instrumente
        </p>

        {/* Add text */}
        <button
          onClick={addText}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
                     bg-blue-600 hover:bg-blue-500 text-white transition-colors w-full"
        >
          <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center text-xs font-bold">
            T
          </span>
          Adaugă Text
        </button>

        {/* Add another SVG into the design */}
        <button
          onClick={() => addSvgInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
                     bg-violet-600 hover:bg-violet-500 text-white transition-colors w-full"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Adaugă SVG
        </button>
        {/* hidden input — triggers file picker for adding a second SVG */}
        <input
          ref={addSvgInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={handleAddSvgFile}
        />

        <hr className="border-gray-800 my-3" />

        <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase px-2 mb-2">
          Forme fixe
        </p>

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

        <p className="text-[10px] text-gray-600 px-2 mt-1 leading-tight">
          Formele apar întotdeauna în spate
        </p>

        <div className="flex-1" />
        <hr className="border-gray-800 mb-3" />

        {/* Delete selected */}
        <button
          onClick={deleteSelected}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold
                     bg-red-600 hover:bg-red-500 text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Șterge Element
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
                className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="border border-gray-300 rounded-md px-2 py-1 text-sm w-16 bg-white
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Bold / Italic / Underline */}
              <div className="flex gap-1">
                {[
                  { label: 'B', prop: 'fontWeight', on: 'bold',   off: 'normal', active: textProps.bold      },
                  { label: 'I', prop: 'fontStyle',  on: 'italic', off: 'normal', active: textProps.italic    },
                  { label: 'U', prop: 'underline',  on: true,     off: false,    active: textProps.underline },
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
            💡 Dublu-click pe text pentru editare · Formele sunt fixe și apar în spate
          </p>
          <button
            onClick={downloadSvg}
            className="flex items-center gap-2 px-5 py-2 bg-gray-950 text-white rounded-lg
                       hover:bg-gray-800 font-semibold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descarcă SVG
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
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
