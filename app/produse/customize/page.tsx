/* app/produse/customize/page.tsx */
"use client"

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const SvgEditor = dynamic(() => import('@/components/editor/svg-canvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-950">
      <svg className="animate-spin w-8 h-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      <p className="text-gray-400 text-sm">Se încarcă editorul…</p>
    </div>
  ),
});

export default function CustomizePage() {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [fileName,   setFileName]   = useState<string>('');
  const [saved,      setSaved]      = useState(false);

  const handleQuickLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      alert('Această zonă acceptă doar SVG. Folosește Import din editor pentru alte formate.');
      e.target.value = ''; return;
    }
    setFileName(file.name);
    const r = new FileReader();
    r.onload = ev => setSvgContent(ev.target?.result as string);
    r.readAsText(file);
    e.target.value = '';
  };

  const handleSave = (svg: string) => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    console.log('SVG exportat, lungime:', svg.length);
  };

  return (
    /* Ocupă tot ecranul, fără scroll extern */
    <div
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
      className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden"
    >
      {/* ── Header slim ── */}
      <header className="shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tracking-wide text-white">Personalizare produs</span>
          {fileName && (
            <>
              <span className="text-gray-600">|</span>
              <span className="text-xs text-gray-400 truncate max-w-xs">{fileName}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold bg-green-900/40 border border-green-700 px-3 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
              </svg>
              SVG descărcat!
            </span>
          )}

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 cursor-pointer text-xs font-medium text-gray-300 hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Deschide SVG de bază
            <input type="file" accept=".svg,image/svg+xml" className="hidden" onChange={handleQuickLoad}/>
          </label>

          <button
            onClick={() => { setSvgContent(null); setFileName(''); }}
            className="px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors"
          >
            Canvas gol
          </button>
        </div>
      </header>

      {/* ── Editor — flex-1 înseamnă că ocupă tot spațiul rămas ── */}
      <div className="flex-1 min-h-0 p-2">
        <SvgEditor svgContent={svgContent} onSave={handleSave} />
      </div>
    </div>
  );
}
