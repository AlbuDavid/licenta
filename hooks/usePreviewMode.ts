"use client";

import { useEffect, useRef } from "react";
import type { FabricObject, Image as FabricImage } from "fabric";
import { filters } from "fabric";
import { useEditorStore } from "@/store/editorStore";
import { TEMPLATE_TAG } from "@/hooks/useProductTemplate";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Custom fields saved into obj.data so they survive toJSON() / undo. */
interface PreviewData {
  tag?: string;
  originalFill?: string | null;
  originalStroke?: string | null;
  /** True when preview colours have been applied to this object. */
  inPreview?: boolean;
}

/** Engraving simulation colours for each material. */
const MATERIAL_COLORS = {
  /** Light slate-grey mark on a dark slate surface (laser burns lighter). */
  slate: "#E2E8F0",
  /** Dark charred mark on a warm wood surface. */
  wood:  "#3E2723",
} as const;

type Material = keyof typeof MATERIAL_COLORS;

// ── Helpers ───────────────────────────────────────────────────────────────────

function data(obj: FabricObject): PreviewData {
  return ((obj as unknown as Record<string, unknown>).data ?? {}) as PreviewData;
}

function isTemplate(obj: FabricObject): boolean {
  return data(obj).tag === TEMPLATE_TAG;
}

function isImage(obj: FabricObject): obj is FabricImage {
  return obj.type === "image";
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Reacts to `editorStore.mode` changes.
 *
 * When mode switches to "preview":
 *  - Skips the boundary template (it represents the raw material surface).
 *  - Saves each object's original fill + stroke into obj.data.
 *  - Replaces colours with the engraving simulation colour for `material`.
 *  - For raster images: applies a Fabric Grayscale filter to simulate the
 *    washed-out look of a laser-engraved photo.
 *
 * When mode switches back to "design":
 *  - Restores originalFill / originalStroke.
 *  - Removes the grayscale filter from images.
 */
export function usePreviewMode(material: Material = "slate") {
  const canvas = useEditorStore((s) => s.canvas);
  const mode   = useEditorStore((s) => s.mode);

  // Keep a stable ref so the effect can read the latest value without re-running
  const materialRef = useRef<Material>(material);
  materialRef.current = material;

  useEffect(() => {
    if (!canvas) return;

    const engravingColor = MATERIAL_COLORS[materialRef.current];
    const objects = canvas.getObjects().filter((o) => !isTemplate(o));

    if (mode === "preview") {
      objects.forEach((obj) => {
        const d = data(obj);
        if (d.inPreview) return; // already transformed — skip

        // Persist originals so they survive multiple on/off cycles
        d.originalFill   = (obj.fill   as string | null | undefined) ?? null;
        d.originalStroke = (obj.stroke as string | null | undefined) ?? null;
        d.inPreview      = true;
        (obj as unknown as Record<string, unknown>).data = d;

        if (isImage(obj)) {
          // Apply grayscale filter to simulate photo engraving
          obj.filters = [new filters.Grayscale()];
          obj.applyFilters();
        } else {
          // Only recolour if the object actually has a visible fill/stroke
          if (obj.fill   !== null && obj.fill   !== "")  obj.set("fill",   engravingColor);
          if (obj.stroke !== null && obj.stroke !== "")  obj.set("stroke", engravingColor);
        }
      });
    } else {
      // Restore design colours
      objects.forEach((obj) => {
        const d = data(obj);
        if (!d.inPreview) return; // was never transformed

        if (isImage(obj)) {
          obj.filters = [];
          obj.applyFilters();
        } else {
          obj.set("fill",   d.originalFill   ?? "");
          obj.set("stroke", d.originalStroke ?? "");
        }

        d.inPreview = false;
        (obj as unknown as Record<string, unknown>).data = d;
      });
    }

    canvas.requestRenderAll();
  // material is intentionally excluded — materialRef keeps it current without
  // triggering a double-apply on every material prop change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, mode]);
}
