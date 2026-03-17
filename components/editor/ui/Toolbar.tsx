/* components/editor/ui/Toolbar.tsx */
"use client"

import React from 'react';
import type { Tool } from '../editor.config';

interface ToolbarProps {
  tool:     Tool;
  setTool:  (t: Tool) => void;
  importUngroup:    boolean;
  setImportUngroup: (v: boolean) => void;
  onImportFile: () => void;
  onAddText:    () => void;
  onDeleteSel:  () => void;
  onGroup:      () => void;
  onUngroup:    () => void;
  onShowSnap:   () => void;
  onShowMat:    () => void;
  onShowShortcuts: () => void;
}

const TOOLS: { id: Tool; icon: React.ReactNode; label: string; key: string }[] = [
  {
    id: 'select', key: 'V',
    label: 'Selectare',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-7 1-4 7L5 3z"/>
      </svg>
    ),
  },
  {
    id: 'rect', key: 'R',
    label: 'Dreptunghi',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
        <rect x="3" y="6" width="18" height="12" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'ellipse', key: 'E',
    label: 'Elipsă',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
        <ellipse cx="12" cy="12" rx="9" ry="6"/>
      </svg>
    ),
  },
  {
    id: 'line', key: 'I',
    label: 'Linie',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
        <line x1="4" y1="20" x2="20" y2="4"/>
      </svg>
    ),
  },
  {
    id: 'text', key: 'T',
    label: 'Text',
    icon: <span className="text-sm font-bold leading-none">T</span>,
  },
  {
    id: 'pan', key: 'H',
    label: 'Panoramare',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M7 11V7a2 2 0 014 0v4m0 0V7a2 2 0 014 0v4m0 0v2a6 6 0 01-12 0v-2"/>
      </svg>
    ),
  },
];

export function Toolbar({
  tool, setTool, importUngroup, setImportUngroup,
  onImportFile, onAddText, onDeleteSel, onGroup, onUngroup,
  onShowSnap, onShowMat, onShowShortcuts,
}: ToolbarProps) {
  return (
    <aside className="w-[52px] bg-gray-950 flex flex-col items-center py-3 gap-1 shrink-0 border-r border-gray-800">
      {/* ── Drawing tools ── */}
      {TOOLS.map(({ id, icon, label, key }) => (
        <button
          key={id}
          title={`${label} (${key})`}
          onClick={() => setTool(id)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors
            ${tool === id
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
        >
          {icon}
        </button>
      ))}

      <div className="w-6 border-t border-gray-800 my-1" />

      {/* ── Import file ── */}
      <button
        title="Importă fișier (SVG / PNG / JPEG / DXF)"
        onClick={onImportFile}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-violet-700 hover:text-white transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
      </button>

      {/* ── Group / Ungroup ── */}
      <button title="Grupează (Ctrl+G)"  onClick={onGroup}   className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
          <rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/>
          <rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/>
        </svg>
      </button>
      <button title="Degrupează (Ctrl+U)" onClick={onUngroup} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M4 14v5h5M20 10V5h-5M4 10V5h5M20 14v5h-5"/>
        </svg>
      </button>

      <div className="flex-1" />

      {/* ── Settings ── */}
      <button title="Snap & Grid"            onClick={onShowSnap}      className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
          <circle cx="12" cy="12" r="3"/><path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M5.6 5.6l1.4 1.4M16.9 16.9l1.4 1.4M5.6 18.4l1.4-1.4M16.9 7.1l1.4-1.4"/>
        </svg>
      </button>
      <button title="Preview material"        onClick={onShowMat}       className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      </button>
      <button title="Scurtături tastatură"   onClick={onShowShortcuts}  className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
          <rect x="2" y="7" width="20" height="12" rx="2"/>
          <path strokeLinecap="round" d="M6 11h.01M9 11h.01M12 11h.01M15 11h.01M18 11h.01M6 15h12"/>
        </svg>
      </button>

      {/* ── Delete ── */}
      <button title="Șterge selectat (Del)" onClick={onDeleteSel}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-colors mt-1"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>

      {/* ── Ungroup on import toggle ── */}
      <button
        title={importUngroup ? 'Import: elemente separate (click pt. grup)' : 'Import: grup (click pt. separate)'}
        onClick={() => setImportUngroup(!importUngroup)}
        className={`w-9 h-7 rounded text-[9px] font-bold transition-colors mt-1
          ${importUngroup ? 'bg-blue-800 text-blue-200' : 'bg-gray-800 text-gray-400'}`}
      >
        {importUngroup ? 'UNG' : 'GRP'}
      </button>
    </aside>
  );
}
