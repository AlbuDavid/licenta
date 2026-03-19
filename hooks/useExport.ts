"use client";

import { useEditorStore } from "@/store/editorStore";

/**
 * Exports the current canvas as an SVG file and triggers a browser download.
 *
 * Objects with `excludeFromExport: true` (snap guide lines) are automatically
 * omitted by Fabric's toSVG() — no extra filtering needed.
 */
export function useExport() {
  const canvas = useEditorStore((s) => s.canvas);

  function exportSVG(filename = "design.svg") {
    if (!canvas) return;

    const svg  = canvas.toSVG();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);

    const anchor      = document.createElement("a");
    anchor.href       = url;
    anchor.download   = filename;
    anchor.style.display = "hidden";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return { exportSVG };
}
