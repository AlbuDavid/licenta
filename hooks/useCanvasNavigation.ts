"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editorStore";

const ZOOM_MIN = 0.05;   // 5%
const ZOOM_MAX = 20;     // 2000%
// Exponential factor — matches the feel from the existing editor
const ZOOM_FACTOR = 0.999;

/**
 * Attaches professional zoom & pan navigation to the Fabric canvas stored
 * in the Zustand editorStore.
 *
 * Navigation behaviours:
 *  - Mouse wheel       → zoom in/out centred on the cursor
 *  - Middle-mouse drag → pan the viewport
 *  - Alt + left drag   → pan the viewport (pen-tablet / laptop friendly)
 *
 * The hook re-attaches listeners whenever the canvas instance changes
 * (e.g. after a hot-reload or remount).
 */
export function useCanvasNavigation() {
  const canvas = useEditorStore((s) => s.canvas);

  // Mutable pan state — kept in refs so event closures never go stale.
  const isPanning = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvas) return;

    // ── Wheel → zoom at cursor ────────────────────────────────────────────────
    const onWheel = (opt: fabric.TEvent<WheelEvent>) => {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();

      let z = canvas.getZoom() * ZOOM_FACTOR ** e.deltaY;
      z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
      canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), z);
    };

    // ── Mouse down → start pan (middle-mouse or Alt+left) ───────────────────
    const onMouseDown = (opt: fabric.TEvent<MouseEvent>) => {
      const e = opt.e;
      const isMiddle = e.button === 1;
      const isAltLeft = e.button === 0 && e.altKey;

      if (isMiddle || isAltLeft) {
        e.preventDefault();
        isPanning.current     = true;
        lastPos.current       = { x: e.clientX, y: e.clientY };
        canvas.selection      = false;
        canvas.defaultCursor  = "grabbing";
      }
    };

    // ── Mouse move → pan viewport ─────────────────────────────────────────────
    const onMouseMove = (opt: fabric.TEvent<MouseEvent>) => {
      if (!isPanning.current) return;
      const e = opt.e;
      canvas.relativePan(
        new fabric.Point(
          e.clientX - lastPos.current.x,
          e.clientY - lastPos.current.y,
        )
      );
      lastPos.current = { x: e.clientX, y: e.clientY };
    };

    // ── Mouse up → end pan ────────────────────────────────────────────────────
    const onMouseUp = (opt: fabric.TEvent<MouseEvent>) => {
      if (!isPanning.current) return;
      isPanning.current    = false;
      canvas.selection     = true;
      canvas.defaultCursor = "default";
    };

    // ── Prevent browser middle-click autoscroll on the canvas wrapper ─────────
    const canvasEl = canvas.getElement() as HTMLCanvasElement;
    const wrapperEl = canvasEl.parentElement;

    const preventMiddleScroll = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };
    const preventContextMenu = (e: MouseEvent) => {
      // Suppress the context menu that some browsers fire on middle-mouse release
      if (e.button === 1) e.preventDefault();
    };

    wrapperEl?.addEventListener("mousedown", preventMiddleScroll);
    wrapperEl?.addEventListener("contextmenu", preventContextMenu);

    // Register Fabric events
    canvas.on("mouse:wheel",  onWheel);
    canvas.on("mouse:down",   onMouseDown);
    canvas.on("mouse:move",   onMouseMove);
    canvas.on("mouse:up",     onMouseUp);

    return () => {
      canvas.off("mouse:wheel",  onWheel);
      canvas.off("mouse:down",   onMouseDown);
      canvas.off("mouse:move",   onMouseMove);
      canvas.off("mouse:up",     onMouseUp);
      wrapperEl?.removeEventListener("mousedown",   preventMiddleScroll);
      wrapperEl?.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [canvas]); // re-run if the canvas instance is replaced
}
