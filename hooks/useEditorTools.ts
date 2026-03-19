"use client";

import * as fabric from "fabric";
import { useEditorStore } from "@/store/editorStore";
import { loadSVGOntoCanvas } from "@/components/editor/utils/fabric-compat";

/**
 * Returns functions that insert Fabric objects at the current viewport centre.
 *
 * How they interact with the canvas:
 *  1. Read the live `canvas` from Zustand (set by useFabricCanvas on mount).
 *  2. Compute the viewport centre in scene (document) coordinates by inverting
 *     the viewport transform: sceneX = (screenCX - translateX) / zoom.
 *  3. Create the Fabric object centred on that point.
 *  4. Add it, select it, and immediately return to "select" mode so the user
 *     can reposition/resize straight away.
 *
 * Stroke width is kept at 1/zoom so lines always appear 1 px on screen
 * regardless of zoom level — the correct behaviour for a laser-path editor.
 */
export function useEditorTools() {
  const canvas      = useEditorStore((s) => s.canvas);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);

  /** Returns the current viewport centre in scene (document) coordinates. */
  function getViewportCenter(): { x: number; y: number } {
    if (!canvas) return { x: 200, y: 200 };
    const zoom = canvas.getZoom();
    const vpt  = canvas.viewportTransform!;           // [scaleX, 0, 0, scaleY, tx, ty]
    return {
      x: (canvas.getWidth()  / 2 - vpt[4]) / zoom,
      y: (canvas.getHeight() / 2 - vpt[5]) / zoom,
    };
  }

  /** Shared helper: add object to canvas, select it, return to select tool. */
  function commit(obj: fabric.FabricObject) {
    if (!canvas) return;
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    setActiveTool("select");
  }

  // ── Public insert functions ─────────────────────────────────────────────────

  function addRectangle() {
    if (!canvas) return;
    const { x, y } = getViewportCenter();
    const sw = 1 / canvas.getZoom();          // 1 px on-screen regardless of zoom
    const rect = new fabric.Rect({
      left:        x - 100,
      top:         y - 60,
      width:       200,
      height:      120,
      fill:        "transparent",
      stroke:      "#1e293b",               // slate-800 — laser path colour
      strokeWidth: sw,
      strokeUniform: true,                  // keeps stroke width when scaled
    });
    commit(rect);
  }

  function addEllipse() {
    if (!canvas) return;
    const { x, y } = getViewportCenter();
    const sw = 1 / canvas.getZoom();
    const ellipse = new fabric.Ellipse({
      left:        x - 80,
      top:         y - 80,
      rx:          80,
      ry:          80,
      fill:        "transparent",
      stroke:      "#1e293b",
      strokeWidth: sw,
      strokeUniform: true,
    });
    commit(ellipse);
  }

  function addLine() {
    if (!canvas) return;
    const { x, y } = getViewportCenter();
    const sw = 1 / canvas.getZoom();
    const line = new fabric.Line(
      [x - 100, y, x + 100, y],
      {
        stroke:      "#1e293b",
        strokeWidth: sw,
        strokeUniform: true,
      }
    );
    commit(line);
  }

  function addText() {
    if (!canvas) return;
    const { x, y } = getViewportCenter();
    const text = new fabric.IText("Text", {
      left:       x - 40,
      top:        y - 12,
      fontFamily: "Arial",
      fontSize:   24,
      fill:       "#1e293b",
    });
    commit(text);
    // Enter editing mode immediately so the user can type straight away
    text.enterEditing();
    canvas.requestRenderAll();
  }

  /**
   * Reads a user-selected image file, creates a fabric.FabricImage, scales it
   * so it fits within 80% of the current viewport, and centres it in the view.
   *
   * Flow:
   *  1. FileReader reads the file as a data-URL.
   *  2. fabric.FabricImage.fromURL() decodes it into a Fabric image object.
   *  3. If either dimension exceeds the 80% viewport threshold, scale both
   *     axes uniformly by the smaller ratio to preserve aspect ratio.
   *  4. Reposition to the viewport centre and commit (select + add).
   */
  async function addImage(file: File) {
    if (!canvas) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await fabric.FabricImage.fromURL(dataUrl);

    // Maximum allowed size = 80% of the current viewport in scene units
    const zoom    = canvas.getZoom();
    const maxW    = (canvas.getWidth()  * 0.8) / zoom;
    const maxH    = (canvas.getHeight() * 0.8) / zoom;
    const naturalW = img.width  ?? 100;
    const naturalH = img.height ?? 100;

    const ratioW = naturalW > maxW ? maxW / naturalW : 1;
    const ratioH = naturalH > maxH ? maxH / naturalH : 1;
    const scale  = Math.min(ratioW, ratioH);   // uniform — preserves aspect ratio

    const { x, y } = getViewportCenter();
    img.set({
      scaleX: scale,
      scaleY: scale,
      left:   x - (naturalW * scale) / 2,
      top:    y - (naturalH * scale) / 2,
    });

    commit(img);
  }

  /**
   * Reads a user-selected .svg file as text, then delegates to the
   * battle-tested `loadSVGOntoCanvas` utility (fabric-compat.ts) with:
   *   clearFirst = false  → don't wipe existing canvas objects
   *   ungroup    = false  → import as a single fabric.Group
   *
   * Using `ungroup: false` means the entire SVG — regardless of how many
   * individual paths it contains — lands on the canvas as one selectable,
   * scalable unit. The user can move it as a whole; they are not forced to
   * deal with hundreds of individual vector fragments.
   *
   * After loading, the last added object (the group) is selected and the
   * tool returns to "select" mode.
   */
  async function addSVG(file: File) {
    if (!canvas) return;

    const svgText = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });

    const countBefore = canvas.getObjects().length;

    // clearFirst=false, ungroup=false → grouped import, canvas preserved
    await loadSVGOntoCanvas(canvas, svgText, false, false);

    // Select the newly added group so the user can immediately reposition it
    const objects = canvas.getObjects();
    if (objects.length > countBefore) {
      const added = objects[objects.length - 1];
      canvas.setActiveObject(added);
      canvas.requestRenderAll();
    }

    setActiveTool("select");
  }

  return { addRectangle, addEllipse, addLine, addText, addImage, addSVG };
}
