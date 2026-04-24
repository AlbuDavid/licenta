"use client";

import { useTransform } from "@/hooks/useTransform";
import { useEditorStore } from "@/store/editorStore";
import { AnchorPicker } from "@/components/editor/AnchorPicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, Unlink, RotateCcw } from "lucide-react";

const inputCls =
  "h-7 w-20 text-xs bg-slate-700 border-slate-600 text-slate-200 " +
  "placeholder:text-slate-500 focus-visible:ring-0 focus-visible:border-slate-400 text-center";

const labelCls = "text-[9px] text-slate-500 select-none leading-none";

interface LabelledInputProps {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  tooltip: string;
  onChange: (v: number) => void;
}

function LabelledInput({ label, value, step = 0.1, min, max, unit = "mm", tooltip, onChange }: LabelledInputProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center gap-0.5">
          <span className={labelCls}>{label}</span>
          <div className="flex items-center gap-0.5">
            <Input
              type="number"
              step={step}
              min={min}
              max={max}
              value={value}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onChange(v);
              }}
              className={inputCls}
            />
            <span className={labelCls}>{unit}</span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function TransformBar() {
  const selectedObjects = useEditorStore((s) => s.selectedObjects);
  const {
    snapshot,
    anchor,
    lockAspect,
    setAnchor,
    toggleLockAspect,
    setX, setY, setW, setH,
    setAngle, resetAngle,
  } = useTransform();

  // Only show when exactly one object is selected and we have a snapshot
  if (selectedObjects.length !== 1 || !snapshot) return null;

  return (
    <div className="flex items-center gap-2 px-3 h-11 bg-slate-800 border-b border-slate-600 shrink-0">

      {/* Anchor picker */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <AnchorPicker value={anchor} onChange={setAnchor} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Punct de referință</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-5 bg-slate-600" />

      {/* Position */}
      <LabelledInput label="X" value={snapshot.x} tooltip="Poziție X (mm)" onChange={setX} />
      <LabelledInput label="Y" value={snapshot.y} tooltip="Poziție Y (mm)" onChange={setY} />

      <Separator orientation="vertical" className="h-5 bg-slate-600" />

      {/* Dimensions + aspect-lock */}
      <LabelledInput label="L" value={snapshot.w} tooltip="Lățime (mm)" min={0.1} onChange={setW} />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={[
              "h-7 w-7 self-end mb-0.5 transition-colors",
              lockAspect
                ? "bg-indigo-600/80 text-white hover:bg-indigo-500"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-700",
            ].join(" ")}
            onClick={toggleLockAspect}
            aria-pressed={lockAspect}
            aria-label={lockAspect ? "Dezleagă proporțiile" : "Blochează proporțiile"}
          >
            {lockAspect ? <Link size={12} /> : <Unlink size={12} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {lockAspect ? "Dezleagă proporțiile" : "Blochează proporțiile"}
        </TooltipContent>
      </Tooltip>

      <LabelledInput label="H" value={snapshot.h} tooltip="Înălțime (mm)" min={0.1} onChange={setH} />

      <Separator orientation="vertical" className="h-5 bg-slate-600" />

      {/* Rotation */}
      <LabelledInput
        label="°"
        value={snapshot.angle}
        step={1}
        min={0}
        max={359}
        unit="°"
        tooltip="Rotație (grade)"
        onChange={setAngle}
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700 self-end mb-0.5"
            onClick={resetAngle}
            aria-label="Resetează rotația"
          >
            <RotateCcw size={12} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Resetează rotația (0°)</TooltipContent>
      </Tooltip>

    </div>
  );
}
