/* app/produse/customize/page.tsx */
"use client"

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const SvgEditor = dynamic(() => import('@/components/editor/svg-canvas'), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center text-gray-500">
      <svg className="animate-spin w-6 h-6 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Se încarcă editorul…
    </div>
  ),
});

export default function CustomizePage() {
  const [uploadedSvg, setUploadedSvg] = useState<string | null>(null);
  const [fileName, setFileName]       = useState<string>('');
  const [isDragging, setIsDragging]   = useState(false);
  const [savedMsg, setSavedMsg]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── File processing ─────────────────────────────────────────────────────────
  const processFile = (file: File) => {
    if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
      alert('Te rog încarcă doar fișiere SVG (.svg).');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => setUploadedSvg(e.target?.result as string);
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSave = (finalSvg: string) => {
    console.log('SVG Salvat:', finalSvg.slice(0, 120), '…');
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
    // TODO: trimite `finalSvg` la server / adaugă în coș
  };

  // ── UPLOAD SCREEN ───────────────────────────────────────────────────────────
  if (!uploadedSvg) {
    return (
      <div
        style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: '100vh' }}
        className="bg-gray-50 flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-block bg-gray-950 text-white text-xs font-bold tracking-widest uppercase px-4 py-1 rounded-full mb-4">
              Editor Personalizare
            </span>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
              Personalizează<br />Produsul Tău
            </h1>
            <p className="mt-3 text-gray-500 text-sm">
              Încarcă un fișier SVG și adaugă text, forme sau alte elemente grafice.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all
              ${isDragging
                ? 'border-gray-950 bg-gray-950 text-white scale-[1.01]'
                : 'border-gray-300 bg-white hover:border-gray-500 hover:shadow-lg'}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".svg,image/svg+xml"
              className="hidden"
              onChange={handleFileInput}
            />

            <div className={`mb-4 flex justify-center transition-colors ${isDragging ? 'text-white' : 'text-gray-300'}`}>
              <svg className="w-14 h-14" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M28 8H12a4 4 0 00-4 4v24a4 4 0 004 4h24a4 4 0 004-4V20m-8-12l8 8m-8-8v8h8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 28l4-4 4 4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M24 24v8" />
              </svg>
            </div>

            <p className={`text-lg font-semibold ${isDragging ? 'text-white' : 'text-gray-700'}`}>
              {isDragging ? 'Dă drumul fișierului!' : 'Trage fișierul SVG aici'}
            </p>
            <p className={`text-sm mt-1 ${isDragging ? 'text-gray-300' : 'text-gray-400'}`}>
              sau <span className="underline font-medium">apasă pentru a selecta</span>
            </p>
            <p className="mt-4 text-xs text-gray-400">Doar fișiere .SVG</p>
          </div>

          {/* Tips */}
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: '✏️', title: 'Editează text', desc: 'Adaugă și stilizează text' },
              { icon: '⬛', title: 'Forme fixe', desc: 'Pătrat, dreptunghi, cerc' },
              { icon: '💾', title: 'Salvează', desc: 'Exportă designul final' },
            ].map(tip => (
              <div key={tip.title} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <span className="text-2xl">{tip.icon}</span>
                <p className="text-sm font-semibold text-gray-800 mt-2">{tip.title}</p>
                <p className="text-xs text-gray-400 mt-1">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── EDITOR SCREEN ───────────────────────────────────────────────────────────
  return (
    <div
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
      className="min-h-screen bg-gray-100"
    >
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setUploadedSvg(null); setFileName(''); }}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Înapoi
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-semibold text-gray-800 truncate max-w-xs">{fileName}</span>
        </div>

        {savedMsg && (
          <span className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-full px-4 py-1 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Design salvat!
          </span>
        )}
      </header>

      {/* Editor */}
      <main className="p-6 max-w-screen-xl mx-auto">
        <SvgEditor svgContent={uploadedSvg} onSave={handleSave} />
      </main>
    </div>
  );
}
