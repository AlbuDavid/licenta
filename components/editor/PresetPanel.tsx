"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePresets } from "@/hooks/usePresets";

interface PresetPanelProps {
  onClose: () => void;
}

export function PresetPanel({ onClose }: PresetPanelProps) {
  const { grouped, loading, error, addPresetToCanvas } = usePresets();
  const categories = Object.keys(grouped);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleCategory(cat: string) {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  return (
    <div className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0 animate-in slide-in-from-left-2 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          Preset-uri
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
          onClick={onClose}
        >
          <X size={14} />
        </Button>
      </div>

      <Separator className="bg-slate-700" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-slate-400" />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 text-center py-4">{error}</p>
        )}

        {!loading && !error && categories.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-4">
            Niciun preset disponibil
          </p>
        )}

        {categories.map((category) => {
          const isCollapsed = collapsed[category] ?? false;
          const items = grouped[category];

          return (
            <div key={category} className="mb-2">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-1.5 w-full px-1 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors rounded"
              >
                {isCollapsed ? (
                  <ChevronRight size={12} className="shrink-0" />
                ) : (
                  <ChevronDown size={12} className="shrink-0" />
                )}
                {category}
                <span className="text-slate-500 ml-auto text-[10px]">
                  {items.length}
                </span>
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {items.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => void addPresetToCanvas(preset)}
                      className="group relative flex flex-col items-center rounded-md border border-slate-600 bg-slate-750 hover:border-indigo-500 hover:bg-slate-700 transition-colors p-1.5"
                      title={preset.name}
                    >
                      <div
                        className="w-full aspect-square flex items-center justify-center rounded bg-white p-1.5"
                        dangerouslySetInnerHTML={{ __html: preset.svgContent }}
                      />
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-200 mt-1 truncate w-full text-center leading-tight">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
