"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditorStore } from "@/store/editorStore";
import { loadSVGOntoCanvas } from "@/components/editor/utils/fabric-compat";

interface PresetDesign {
  id: string;
  name: string;
  category: string;
  svgContent: string;
  sortOrder: number;
}

interface PresetsGrouped {
  [category: string]: PresetDesign[];
}

export function usePresets() {
  const canvas = useEditorStore((s) => s.canvas);
  const takeSnapshot = useEditorStore((s) => s.takeSnapshot);
  const [presets, setPresets] = useState<PresetDesign[]>([]);
  const [grouped, setGrouped] = useState<PresetsGrouped>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPresets() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/presets");
        if (!res.ok) throw new Error("Failed to fetch presets");
        const data: PresetDesign[] = await res.json();
        if (cancelled) return;

        setPresets(data);

        const groups: PresetsGrouped = {};
        for (const preset of data) {
          if (!groups[preset.category]) groups[preset.category] = [];
          groups[preset.category].push(preset);
        }
        setGrouped(groups);
      } catch (err) {
        if (!cancelled) {
          console.error("[usePresets]", err);
          setError("Nu s-au putut incarca preset-urile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchPresets();
    return () => { cancelled = true; };
  }, []);

  const addPresetToCanvas = useCallback(
    async (preset: PresetDesign) => {
      if (!canvas) return;
      await loadSVGOntoCanvas(canvas, preset.svgContent, false, false);
      takeSnapshot();
    },
    [canvas, takeSnapshot],
  );

  return { presets, grouped, loading, error, addPresetToCanvas };
}
