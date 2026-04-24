"use client";

import type { AnchorPoint, AnchorH, AnchorV } from "@/store/editorStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  value: AnchorPoint;
  onChange: (a: AnchorPoint) => void;
}

const COLS: AnchorH[] = ["left", "center", "right"];
const ROWS: AnchorV[] = ["top", "middle", "bottom"];

const LABELS: Record<AnchorV, Record<AnchorH, string>> = {
  top:    { left: "Sus-Stânga",  center: "Sus-Centru",  right: "Sus-Dreapta"  },
  middle: { left: "Mijloc-Stânga", center: "Centru",   right: "Mijloc-Dreapta" },
  bottom: { left: "Jos-Stânga",  center: "Jos-Centru",  right: "Jos-Dreapta"  },
};

export function AnchorPicker({ value, onChange }: Props) {
  return (
    <div
      className="grid grid-cols-3 gap-[2px] p-0.5 rounded bg-slate-700 border border-slate-600"
      role="group"
      aria-label="Punct referință"
    >
      {ROWS.map((vy) =>
        COLS.map((hx) => {
          const isActive = value.x === hx && value.y === vy;
          return (
            <Tooltip key={`${vy}-${hx}`}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={LABELS[vy][hx]}
                  aria-pressed={isActive}
                  onClick={() => onChange({ x: hx, y: vy })}
                  className={[
                    "w-3 h-3 rounded-[2px] transition-colors",
                    isActive
                      ? "bg-indigo-500"
                      : "bg-slate-500 hover:bg-slate-400",
                  ].join(" ")}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                {LABELS[vy][hx]}
              </TooltipContent>
            </Tooltip>
          );
        })
      )}
    </div>
  );
}
