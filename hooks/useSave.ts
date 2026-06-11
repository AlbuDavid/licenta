"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import {
  applyPreviewToCanvas,
  restoreDesignState,
} from "@/hooks/usePreviewMode";

type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Serializes the Fabric canvas to JSON and POSTs it to /api/designs.
 *
 * Returns a `status` value that drives button label feedback:
 *   idle    → "Salvează"
 *   saving  → "Se salvează…"
 *   saved   → "Salvat!"   (resets to idle after 2 s)
 *   error   → "Eroare"    (resets to idle after 3 s)
 *
 * Objects with `excludeFromExport: true` (snap guide lines) are stripped
 * before serialization so they are never persisted to the database.
 * Saving during preview mode persists the DESIGN state (original colours,
 * original image elements) — preview styling is restored right after.
 */
export function useSave() {
  const canvas = useEditorStore((s) => s.canvas);
  const [status, setStatus] = useState<SaveStatus>("idle");

  async function save(name = "Design fără titlu") {
    if (!canvas || status === "saving") return;

    // Never persist preview-filtered colours / dithered image elements
    const wasPreview = useEditorStore.getState().mode === "preview";
    if (wasPreview) restoreDesignState(canvas);

    // Serialize, stripping transient objects
    const raw = canvas.toJSON() as {
      objects?: Array<{ excludeFromExport?: boolean }>;
    };
    if (raw.objects) {
      raw.objects = raw.objects.filter((o) => !o.excludeFromExport);
    }
    const canvasJson = JSON.stringify(raw);

    if (wasPreview) void applyPreviewToCanvas(canvas);

    setStatus("saving");
    try {
      const res = await fetch("/api/designs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, canvasJson }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Eroare la salvare");
      }

      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      console.error("[useSave]", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return { save, status };
}
