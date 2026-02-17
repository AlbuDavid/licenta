/* components/editor/svg-canvas.tsx */
"use client"

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
// import { fabric } from 'fabric'; 

interface SvgCanvasProps {
  svgContent: string | null;
  onSave: (finalSvg: string) => void;
}

export default function SvgCanvas({ svgContent, onSave }: SvgCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);

  // 1. Inițializare Canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 600,
      backgroundColor: '#f3f4f6',
    });
    setFabricCanvas(canvas);
    return () => { canvas.dispose(); }
  }, []);

// 2. Încărcare SVG (Versiunea cu Debugging)
  useEffect(() => {
    // Dacă nu avem canvas sau conținut, nu facem nimic
    if (!fabricCanvas || !svgContent) {
      console.log("Aștept canvas-ul sau conținutul SVG...");
      return;
    }

    console.log("1. Am primit SVG-ul. Încep procesarea...");

    fabric.loadSVGFromString(svgContent, (objects, options) => {
      // Verificăm dacă a găsit ceva în fișier
      if (!objects || objects.length === 0) {
        console.error("EROARE: Nu am găsit niciun obiect în SVG!");
        alert("Acest SVG pare gol sau nu este compatibil.");
        return;
      }

      console.log(`2. Am găsit ${objects.length} elemente în SVG.`);

      // Încercăm să le grupăm
      const obj = fabric.util.groupSVGElements(objects as any, options);
      
      if (!obj) {
        console.error("EROARE: Nu s-a putut crea grupul de elemente.");
        return;
      }

      // Curățăm canvas-ul vechi
      fabricCanvas.clear();

      // Setăm dimensiuni fixe ca să fim siguri că se vede
      obj.scaleToWidth(400); // Îl forțăm la 400px lățime
      
      // Îl centrăm manual
      obj.set({
        left: 300,   // Centrul canvas-ului de 600px
        top: 300,
        originX: 'center',
        originY: 'center'
      });

      // Adăugăm pe ecran
      fabricCanvas.add(obj);
      
      // FORȚĂM redesenarea (important pentru React)
      fabricCanvas.requestRenderAll();
      
      console.log("3. SVG adăugat și desenat pe canvas!");
    });
  }, [fabricCanvas, svgContent]);

  // Funcții (Logic)
  const addText = () => {
    if (!fabricCanvas) return;
    const text = new fabric.IText('Text Nou', {
      left: 50, top: 50, fontFamily: 'Arial', fill: '#333', fontSize: 24
    });
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
  };

  const removeActiveObject = () => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
      fabricCanvas.discardActiveObject();
      activeObjects.forEach((obj) => fabricCanvas.remove(obj));
    }
  };

  const handleExport = () => {
    if (!fabricCanvas) return;
    onSave(fabricCanvas.toSVG());
  };

  // UI (Aici sunt butoanele!)
  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white shadow-sm">
        <canvas ref={canvasRef} />
      </div>

      <div className="flex gap-2">
        <button 
          onClick={addText}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
        >
          + Text
        </button>

        <button 
          onClick={removeActiveObject}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-bold"
        >
          Șterge Element
        </button>
        
        <button 
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold"
        >
          Salvează Design
        </button>
      </div>
      
      <p className="text-sm text-gray-500">
        Poți folosi și tasta DELETE pentru a șterge.
      </p>
    </div>
  );
}