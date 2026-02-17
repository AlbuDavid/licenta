/* app/produse/customize/page.tsx */
"use client"

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Importăm editorul (fără SSR)
const SvgEditor = dynamic(() => import('@/components/editor/svg-canvas'), { 
  ssr: false,
  loading: () => <p>Se încarcă editorul...</p>
});

export default function CustomizePage() {
  const [uploadedSvg, setUploadedSvg] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (file.type !== 'image/svg+xml') {
      alert("Te rog încarcă doar fișiere SVG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedSvg(e.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleOrderSave = (finalSvg: string) => {
    console.log("SVG Salvat:", finalSvg);
    alert("Design salvat cu succes!");
    // Aici vom adăuga logica de "Adaugă în coș"
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Personalizează Produsul</h1>

      {!uploadedSvg ? (
        <div className="border-4 border-dashed border-gray-200 rounded-xl h-64 flex flex-col items-center justify-center bg-gray-50">
          <p className="text-lg text-gray-600 mb-4">Încarcă un SVG</p>
          <input type="file" accept=".svg" onChange={handleFileUpload} />
        </div>
      ) : (
        <div>
          <button 
            onClick={() => setUploadedSvg(null)}
            className="mb-4 text-sm text-red-500 hover:underline"
          >
            ← Încarcă alt fișier
          </button>
          
          {/* Aici doar afișăm componenta, butoanele sunt ÎN EA */}
          <SvgEditor svgContent={uploadedSvg} onSave={handleOrderSave} />
        </div>
      )}
    </div>
  );
}