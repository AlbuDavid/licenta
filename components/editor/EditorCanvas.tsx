"use client";

/**
 * EditorCanvas — browser-only canvas component.
 *
 * Dynamically imported with { ssr: false } in the editor page, following
 * the same pattern as /produse/customize, because Fabric.js requires the DOM.
 *
 * Responsibilities:
 *  - Owns the container div and the <canvas> element
 *  - Initialises Fabric via useFabricCanvas (with ResizeObserver)
 *  - Attaches zoom/pan navigation via useCanvasNavigation
 */

import { useRef } from "react";
import { useFabricCanvas } from "@/hooks/useFabricCanvas";
import { useCanvasNavigation } from "@/hooks/useCanvasNavigation";
import { useSelectionSync } from "@/hooks/useSelectionSync";
import { useSnapping } from "@/hooks/useSnapping";
import { useHistory } from "@/hooks/useHistory";
import { useDrawingMode } from "@/hooks/useDrawingMode";
import { useSelectionBehavior } from "@/hooks/useSelectionBehavior";

export default function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);

  useFabricCanvas(canvasRef, containerRef);
  useCanvasNavigation();
  useSelectionSync();
  useSnapping();
  useHistory();
  useDrawingMode();
  useSelectionBehavior();

  return (
    // Container fills the canvas area slot — ResizeObserver tracks its size
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        // Fabric overwrites width/height; display:block prevents the 4px gap
        style={{ display: "block" }}
      />
    </div>
  );
}
