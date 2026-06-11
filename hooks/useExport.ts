"use client";

import { useEditorStore } from "@/store/editorStore";
import {
  getPlacedTemplate,
  getTemplateBBox,
  buildTemplateClipShape,
} from "@/components/editor/utils/templateGeometry";
import {
  applyPreviewToCanvas,
  restoreDesignState,
} from "@/hooks/usePreviewMode";
import type { Canvas, FabricObject } from "fabric";

/**
 * Exports the current canvas as an SVG file and triggers a browser download.
 *
 * Objects with `excludeFromExport: true` (snap guide lines) are automatically
 * omitted by Fabric's toSVG() — no extra filtering needed.
 */
export function useExport() {
  const canvas              = useEditorStore((s) => s.canvas);
  const setDesignThumbnail  = useEditorStore((s) => s.setDesignThumbnail);

  /**
   * Laser-ready SVG export.
   *
   * With a placed product template, the file matches the physical blank:
   *  - content is clipped to the template shape (crossing objects are cut,
   *    outside objects disappear),
   *  - coordinates are translated so the template bounding-box top-left
   *    is (0,0),
   *  - width/height are the product's real dimensions in mm with a matching
   *    viewBox (1 document unit = 1 mm),
   *  - the boundary itself and all preview-only styling are excluded.
   *
   * Always exports the DESIGN state: if preview mode is active it is
   * temporarily restored, then re-applied after export.
   * Without a template the previous full-canvas behaviour is preserved.
   */
  function exportSVG(filename = "design.svg") {
    if (!canvas) return;

    const wasPreview = useEditorStore.getState().mode === "preview";
    if (wasPreview) restoreDesignState(canvas);

    try {
      const template = getPlacedTemplate(canvas);
      const svg = template
        ? buildTemplateClippedSVG(canvas, template)
        : canvas.toSVG();

      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      triggerDownload(blob, filename);
    } catch (error) {
      console.error("[useExport] SVG export failed", error);
    } finally {
      if (wasPreview) void applyPreviewToCanvas(canvas);
    }
  }

  /**
   * Serialises the canvas to a JSON file and triggers a browser download.
   *
   * Custom properties stored in `obj.data` (originalFill, originalStroke,
   * inPreview, tag, product config) are preserved because `data` is included
   * in the property list passed to toObject().
   *
   * The downloaded file can be re-loaded with `canvas.loadFromJSON()`.
   */
  function exportJSON(filename = "design.json") {
    if (!canvas) return;

    // "data" carries every custom field we write (preview originals, tags, etc.)
    const json = canvas.toObject(["data", "id", "name", "excludeFromExport"]);
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    triggerDownload(blob, filename);
  }

  /**
   * Renders the canvas to a 2× PNG data URL and stores it in editorStore.
   *
   * Snap-guide lines are already excluded via `excludeFromExport: true`.
   * The template boundary IS included — it gives the thumbnail its product
   * shape (and in preview mode the realistic material render is captured).
   *
   * Returns the data URL so callers can use it immediately (e.g. cart addItem).
   */
  function generateThumbnail(): string | null {
    if (!canvas) return null;

    // Temporarily deselect so selection handles don't appear in the thumbnail
    const active = canvas.getActiveObject();
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const dataUrl = canvas.toDataURL({
      format:     "png",
      multiplier: 2,          // 2× → crisp on retina; canvas is 4000 doc units
      quality:    1,
    });

    // Restore selection
    if (active) canvas.setActiveObject(active);
    canvas.requestRenderAll();

    setDesignThumbnail(dataUrl);
    return dataUrl;
  }

  return { exportSVG, exportJSON, generateThumbnail };
}

// ── Internal ──────────────────────────────────────────────────────────────────

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Generates the template-clipped, mm-true SVG.
 *
 * Mechanics: a synthetic clip shape is installed as canvas.clipPath (Fabric
 * wraps all exported objects in <g clip-path="...">), the boundary object and
 * background are temporarily excluded, and the viewBox is normalised so the
 * template's top-left is (0,0) by wrapping the content in a translate group.
 */
function buildTemplateClippedSVG(canvas: Canvas, template: FabricObject): string {
  const bbox = getTemplateBBox(template);
  const x = round2(bbox.left);
  const y = round2(bbox.top);
  const w = round2(bbox.width);
  const h = round2(bbox.height);

  const prevClipPath   = canvas.clipPath;
  const prevExclude    = template.excludeFromExport;
  const prevBackground = canvas.backgroundColor;

  canvas.clipPath = buildTemplateClipShape(template);
  template.excludeFromExport = true;
  canvas.backgroundColor = ""; // no background rect in the laser file

  // Drop objects fully outside the blank — clip-path support is unreliable
  // in laser software, so they must not appear in the file at all.
  const droppedObjects = canvas.getObjects().filter((obj) => {
    if (obj === template || obj.excludeFromExport) return false;
    obj.setCoords();
    const corners = obj.aCoords;
    const xs = [corners.tl.x, corners.tr.x, corners.br.x, corners.bl.x];
    const ys = [corners.tl.y, corners.tr.y, corners.br.y, corners.bl.y];
    const outside =
      Math.max(...xs) < bbox.left ||
      Math.min(...xs) > bbox.left + bbox.width ||
      Math.max(...ys) < bbox.top ||
      Math.min(...ys) > bbox.top + bbox.height;
    return outside;
  });
  droppedObjects.forEach((obj) => { obj.excludeFromExport = true; });

  let svg: string;
  try {
    svg = canvas.toSVG({
      width:  `${w}mm`,
      height: `${h}mm`,
      viewBox: { x, y, width: w, height: h },
    });
  } finally {
    canvas.clipPath = prevClipPath;
    template.excludeFromExport = prevExclude;
    canvas.backgroundColor = prevBackground;
    droppedObjects.forEach((obj) => { obj.excludeFromExport = false; });
  }

  // Normalise: viewBox starts at (0,0); content shifted by the same amount.
  // The clip path definition lives inside the translated group's coordinate
  // space (userSpaceOnUse), so it shifts together with the content.
  svg = svg.replace(
    `viewBox="${x} ${y} ${w} ${h}"`,
    `viewBox="0 0 ${w} ${h}"`,
  );
  const translateOpen = `<g transform="translate(${round2(-x)} ${round2(-y)})">\n`;
  svg = svg.replace("</defs>\n", `</defs>\n${translateOpen}`);
  svg = svg.replace("</svg>", "</g>\n</svg>");

  return svg;
}

function triggerDownload(blob: Blob, filename: string) {
  const url    = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href       = url;
  anchor.download   = filename;
  anchor.style.display = "hidden";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
