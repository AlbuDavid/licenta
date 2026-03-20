"use client";

import { useEditorStore } from "@/store/editorStore";

/**
 * Exports the current canvas as an SVG file and triggers a browser download.
 *
 * Objects with `excludeFromExport: true` (snap guide lines) are automatically
 * omitted by Fabric's toSVG() — no extra filtering needed.
 */
export function useExport() {
  const canvas              = useEditorStore((s) => s.canvas);
  const setDesignThumbnail  = useEditorStore((s) => s.setDesignThumbnail);

  function exportSVG(filename = "design.svg") {
    if (!canvas) return;

    const svg  = canvas.toSVG();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    triggerDownload(blob, filename);
  }

  /**
   * Serialises the canvas to a JSON file and triggers a browser download.
   *
   * Custom properties stored in `obj.data` (originalFill, originalStroke,
   * inPreview, tag) are preserved because `data` is included in the
   * property list passed to toJSON().
   *
   * The downloaded file can be re-loaded with `canvas.loadFromJSON()`.
   */
  function exportJSON(filename = "design.json") {
    if (!canvas) return;

    // "data" carries every custom field we write (preview originals, tags, etc.)
    const json = canvas.toJSON(["data", "id", "name", "excludeFromExport"]);
    const blob = new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    triggerDownload(blob, filename);
  }

  /**
   * Renders the canvas to a 2× PNG data URL and stores it in editorStore.
   *
   * Snap-guide lines are already excluded via `excludeFromExport: true`.
   * The template boundary IS included — it gives the thumbnail its product shape.
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
