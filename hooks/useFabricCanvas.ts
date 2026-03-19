"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editorStore";

/**
 * Initialises a Fabric.js Canvas on a <canvas> element ref and keeps it
 * sized to a container div via ResizeObserver.
 *
 * - Inspired by /produse/customize: canvas fills its container dynamically
 *   and starts zoomed to fit the full 4000mm document.
 * - Handles Next.js Strict Mode double-render: cleanup disposes Fabric before
 *   the second mount to avoid "canvas already initialised" errors.
 * - Saves the canvas instance to the Zustand editorStore.
 *
 * @param canvasRef   Ref to the <canvas> DOM element
 * @param containerRef  Ref to the wrapper div whose size drives the canvas
 */
export function useFabricCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const setCanvas = useEditorStore((s) => s.setCanvas);
  const setZoom   = useEditorStore((s) => s.setZoom);

  useEffect(() => {
    const canvasEl    = canvasRef.current;
    const containerEl = containerRef.current;
    if (!canvasEl || !containerEl) return;

    const W = containerEl.clientWidth  || 960;
    const H = containerEl.clientHeight || 620;

    const canvas = new fabric.Canvas(canvasEl, {
      width:  W,
      height: H,
      backgroundColor: "#f8fafc",           // slate-50 — light document surface
      selectionColor:        "rgba(99,102,241,0.12)",   // indigo tint
      selectionBorderColor:  "#6366f1",
      selectionLineWidth:    1,
      controlsAboveOverlay:  true,
      preserveObjectStacking: true,
    });

    // Fit the 4000mm document into the viewport on load (same as existing editor)
    const initZoom = W / 4000;
    canvas.setZoom(initZoom);
    setZoom(Math.round(initZoom * 100));

    fabricRef.current = canvas;
    setCanvas(canvas);

    // Keep zoom% in sync as viewport changes
    const syncZoom = () => setZoom(Math.round(canvas.getZoom() * 100));
    canvas.on("after:render", syncZoom);

    // ── ResizeObserver: resize canvas when container changes ─────────────────
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width < 10 || height < 10) return;
      canvas.setWidth(width);
      canvas.setHeight(height);
      canvas.requestRenderAll();
    });
    observer.observe(containerEl);

    return () => {
      observer.disconnect();
      canvas.off("after:render", syncZoom);
      canvas.dispose();
      fabricRef.current = null;
      setCanvas(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  return fabricRef;
}
