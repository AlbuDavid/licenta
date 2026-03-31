/* components/editor/ui/TextBar.tsx */
"use client"
import React from 'react';
import { FONTS, FONT_SIZES, type TextProps } from '../editor.config';

interface TextBarProps {
  tp: TextProps;
  setTp: (v: TextProps) => void;
  applyText: (prop: string, val: string | number | boolean) => void;
}

export function TextBar({ tp, setTp, applyText }: TextBarProps) {
  if (!tp.vis) return (
    <div className="h-10 flex items-center px-4 border-b border-gray-800 bg-gray-900">
      <span className="text-[11px] text-gray-600 italic">Selectează un text pentru a edita proprietățile</span>
    </div>
  );

  return (
    <div className="h-10 flex items-center gap-2 px-3 border-b border-gray-800 bg-gray-900 flex-wrap overflow-hidden">
      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Font</span>
      <select
        value={tp.font}
        onChange={e => { setTp({ ...tp, font: e.target.value }); applyText('fontFamily', e.target.value); }}
        className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-1 py-0.5 h-6"
      >
        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
      </select>

      <select
        value={tp.size}
        onChange={e => { const v = Number(e.target.value); setTp({ ...tp, size: v }); applyText('fontSize', v); }}
        className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-1 py-0.5 h-6 w-12"
      >
        {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <div className="flex gap-0.5">
        {[
          { ch: 'B', prop: 'fontWeight', on: 'bold',   off: 'normal', active: tp.bold,  style: 'font-bold' },
          { ch: 'I', prop: 'fontStyle',  on: 'italic', off: 'normal', active: tp.italic, style: 'italic' },
          { ch: 'U', prop: 'underline',  on: true,     off: false,    active: tp.under,  style: 'underline' },
        ].map(({ ch, prop, on, off, active, style }) => (
          <button key={ch}
            onClick={() => {
              const nx = !active;
              setTp({ ...tp, bold: prop === 'fontWeight' ? nx : tp.bold, italic: prop === 'fontStyle' ? nx : tp.italic, under: prop === 'underline' ? nx : tp.under });
              applyText(prop, nx ? on : off);
            }}
            className={`w-6 h-6 rounded text-xs ${style} border transition-colors
              ${active ? 'bg-blue-600 text-white border-blue-500' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}
          >{ch}</button>
        ))}
      </div>

      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">Culoare</span>
      <input type="color" value={tp.color}
        onChange={e => { setTp({ ...tp, color: e.target.value }); applyText('fill', e.target.value); }}
        className="w-6 h-6 rounded cursor-pointer border border-gray-700 bg-transparent"
      />
    </div>
  );
}


/* components/editor/ui/AlignBar.tsx */
import { type AlignType } from '../utils/align';

interface AlignBarProps { onAlign: (t: AlignType) => void; }

const ALIGNS: { type: AlignType; title: string; icon: React.ReactNode }[] = [
  { type: 'left',    title: 'Aliniere stânga',     icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="1" y="3" width="6" height="2"/><rect x="1" y="7" width="10" height="2"/><rect x="1" y="11" width="7" height="2"/><rect x="0" y="1" width="1" height="14"/></svg> },
  { type: 'centerH', title: 'Centru orizontal',    icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="3" y="3" width="10" height="2"/><rect x="5" y="7" width="6" height="2"/><rect x="4" y="11" width="8" height="2"/><rect x="7" y="0" width="2" height="16"/></svg> },
  { type: 'right',   title: 'Aliniere dreapta',    icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="9" y="3" width="6" height="2"/><rect x="5" y="7" width="10" height="2"/><rect x="8" y="11" width="7" height="2"/><rect x="15" y="1" width="1" height="14"/></svg> },
  { type: 'top',     title: 'Aliniere sus',         icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="3" y="3" width="2" height="6"/><rect x="7" y="3" width="2" height="10"/><rect x="11" y="3" width="2" height="7"/><rect x="1" y="0" width="14" height="1"/></svg> },
  { type: 'centerV', title: 'Centru vertical',      icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="3" y="3" width="2" height="10"/><rect x="7" y="5" width="2" height="6"/><rect x="11" y="4" width="2" height="8"/><rect x="0" y="7" width="16" height="2"/></svg> },
  { type: 'bottom',  title: 'Aliniere jos',         icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="3" y="7" width="2" height="6"/><rect x="7" y="3" width="2" height="10"/><rect x="11" y="6" width="2" height="7"/><rect x="1" y="15" width="14" height="1"/></svg> },
  { type: 'distH',   title: 'Distribuie orizontal', icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="0" y="3" width="2" height="10"/><rect x="14" y="3" width="2" height="10"/><rect x="6" y="5" width="4" height="6"/><rect x="3" y="7" width="2" height="2"/><rect x="11" y="7" width="2" height="2"/></svg> },
  { type: 'distV',   title: 'Distribuie vertical',  icon: <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5"><rect x="3" y="0" width="10" height="2"/><rect x="3" y="14" width="10" height="2"/><rect x="5" y="6" width="6" height="4"/><rect x="7" y="3" width="2" height="2"/><rect x="7" y="11" width="2" height="2"/></svg> },
];

export function AlignBar({ onAlign }: AlignBarProps) {
  return (
    <div className="flex items-center gap-0.5 px-2 border-b border-gray-800 bg-gray-900 h-10">
      <span className="text-[10px] text-gray-600 uppercase tracking-wide font-semibold mr-1">Aliniere</span>
      {ALIGNS.map(({ type, title, icon }) => (
        <button key={type} title={title} onClick={() => onAlign(type)}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
        >{icon}</button>
      ))}
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────────
   StatusBar
───────────────────────────────────────────────────────────────────────────── */
interface StatusBarProps {
  zoomPct: number;
  cur: { x: number; y: number };
  selInfo: { x: number; y: number; w: number; h: number } | null;
  onFit:  () => void;
  onDown: () => void;
}

export function StatusBar({ zoomPct, cur, selInfo, onFit, onDown }: StatusBarProps) {
  return (
    <div className="h-9 flex items-center justify-between px-3 border-t border-gray-800 bg-gray-950 text-[11px] text-gray-500 shrink-0">
      <div className="flex items-center gap-4">
        <span className="font-mono">X: {cur.x.toFixed(1)} cm&nbsp;&nbsp;Y: {cur.y.toFixed(1)} cm</span>
        {selInfo && (
          <span className="font-mono text-gray-400">
            Sel: X {selInfo.x} · Y {selInfo.y} · W {selInfo.w} cm · H {selInfo.h} cm
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onFit} title="Potrivire (Ctrl+0)"
          className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
          Potrivire
        </button>
        <span className="font-mono text-gray-400">{zoomPct}%</span>
        <button onClick={onDown}
          className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition-colors">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v8M5 7l3 3 3-3M2 12h12"/>
          </svg>
          Descarcă SVG
        </button>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────────
   ShortcutsPanel
───────────────────────────────────────────────────────────────────────────── */
import { SHORTCUTS } from '../editor.config';

export function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-[460px] max-h-[80vh] overflow-y-auto p-5"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-base">Scurtături tastatură</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {SHORTCUTS.map(({ keys, desc }) => (
            <div key={keys} className="flex items-center justify-between py-1 border-b border-gray-800">
              <span className="text-gray-400 text-xs">{desc}</span>
              <span className="font-mono text-[11px] bg-gray-800 text-blue-300 px-2 py-0.5 rounded">{keys}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────────
   SnapPanel
───────────────────────────────────────────────────────────────────────────── */
interface SnapPanelProps {
  gridOn:    boolean; setGridOn:    (v: boolean) => void;
  gridSize:  number;  setGridSize:  (v: number)  => void;
  snapGrid:  boolean; setSnapGrid:  (v: boolean) => void;
  snapObj:   boolean; setSnapObj:   (v: boolean) => void;
  onClose:   () => void;
}

export function SnapPanel({ gridOn, setGridOn, gridSize, setGridSize, snapGrid, setSnapGrid, snapObj, setSnapObj, onClose }: SnapPanelProps) {
  return (
    <div className="absolute bottom-10 right-2 z-40 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 w-60">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm">Grid & Snap</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
      </div>

      <Row label="Grid vizibil" on={gridOn} toggle={() => setGridOn(!gridOn)} />
      <Row label="Snap pe grid" on={snapGrid} toggle={() => setSnapGrid(!snapGrid)} />
      <Row label="Snap pe obiecte" on={snapObj} toggle={() => setSnapObj(!snapObj)} />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">Mărime grid</span>
        <div className="flex items-center gap-1">
          <input type="number" value={gridSize} min={1} max={100} onChange={e => setGridSize(Number(e.target.value))}
            className="w-14 bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded px-1 py-0.5 text-right"/>
          <span className="text-xs text-gray-500">mm</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, on, toggle }: { label: string; on: boolean; toggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-300">{label}</span>
      <button onClick={toggle}
        className={`w-9 h-5 rounded-full transition-colors relative ${on ? 'bg-blue-600' : 'bg-gray-700'}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`}/>
      </button>
    </div>
  );
}


/* ─────────────────────────────────────────────────────────────────────────────
   MaterialPanel
───────────────────────────────────────────────────────────────────────────── */
import type { MaterialMode } from '../editor.config';

interface MaterialPanelProps {
  material: MaterialMode;
  preview:  boolean;
  onApply:  (m: MaterialMode) => void;
  onClose:  () => void;
}

export function MaterialPanel({ material, preview, onApply, onClose }: MaterialPanelProps) {
  return (
    <div className="absolute bottom-10 right-2 z-40 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 w-64">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold text-sm">Preview material</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
      </div>
      <p className="text-[11px] text-gray-500 mb-3 leading-tight">
        Simulează aspectul gravurii laser pe materialul ales. Elementele vor fi recolorate temporar.
      </p>
      <div className="flex flex-col gap-2">
        {([
          { id: 'none',  label: 'Fără preview', sub: 'Editare normală',
            style: 'bg-gray-800 border-gray-600' },
          { id: 'slate', label: '🪨 Ardezie neagră', sub: 'Gravat gri pe negru',
            style: 'bg-gray-800 border-gray-600' },
          { id: 'wood',  label: '🪵 Lemn',           sub: 'Gravat maro închis',
            style: 'bg-gray-800 border-gray-600' },
        ] as const).map(({ id, label, sub, style }) => (
          <button key={id} onClick={() => onApply(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${style}
              ${material === id && preview !== false ? 'ring-2 ring-blue-500' : 'hover:border-gray-500'}`}
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-200">{label}</span>
              <span className="text-[10px] text-gray-500">{sub}</span>
            </div>
            {material === id && preview !== false && (
              <span className="ml-auto text-blue-400 text-xs font-bold">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
