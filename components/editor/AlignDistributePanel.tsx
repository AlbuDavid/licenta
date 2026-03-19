"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  SlidersHorizontal,
} from "lucide-react";
import type {
  AlignAction,
  AlignTarget,
  DistributeAction,
  DistributeOver,
} from "@/hooks/useAlignment";

// ── Inline SVG icons for distribute operations ────────────────────────────────

function DistHLeftIcon()   { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="2" height="8" fill="currentColor"/><rect x="5" y="5" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="1" y="3" width="2" height="8" fill="currentColor"/><rect x="11" y="4" width="2" height="6" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><line x1="1" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.2"/><line x1="5" y1="1" x2="5" y2="13" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/><line x1="11" y1="1" x2="11" y2="13" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/></svg>; }
function DistHCenterIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0.5" y="4" width="3" height="6" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="5.5" y="3" width="3" height="8" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="10.5" y="5" width="3" height="4" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><line x1="2" y1="1" x2="2" y2="13" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/><line x1="7" y1="1" x2="7" y2="13" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/><line x1="12" y1="1" x2="12" y2="13" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/></svg>; }
function DistHRightIcon()  { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="4" width="2" height="6" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="5" y="5" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="11" y="3" width="2" height="8" fill="currentColor" rx="0.5"/><line x1="3" y1="1" x2="3" y2="13" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/><line x1="9" y1="1" x2="9" y2="13" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/><line x1="13" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2"/></svg>; }
function DistHGapIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="0.5" y="3" width="3" height="8" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="10.5" y="3" width="3" height="8" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="5.5" y="5" width="3" height="4" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><line x1="4" y1="7" x2="5.5" y2="7" stroke="#6366f1" strokeWidth="1" strokeDasharray="1.5 0.5"/><line x1="8.5" y1="7" x2="10" y2="7" stroke="#6366f1" strokeWidth="1" strokeDasharray="1.5 0.5"/></svg>; }

function DistVTopIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="1" width="8" height="2" fill="currentColor"/><rect x="5" y="5" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="4" y="11" width="6" height="2" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><line x1="1" y1="1" x2="13" y2="1" stroke="currentColor" strokeWidth="1.2"/><line x1="1" y1="5" x2="13" y2="5" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/><line x1="1" y1="11" x2="13" y2="11" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/></svg>; }
function DistVCenterIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="0.5" width="6" height="3" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="3" y="5.5" width="8" height="3" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="5" y="10.5" width="4" height="3" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><line x1="1" y1="2" x2="13" y2="2" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/><line x1="1" y1="7" x2="13" y2="7" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/><line x1="1" y1="12" x2="13" y2="12" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/></svg>; }
function DistVBottomIcon() { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="1" width="6" height="2" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="5" y="5" width="4" height="4" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="3" y="11" width="8" height="2" fill="currentColor" rx="0.5"/><line x1="1" y1="3" x2="13" y2="3" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/><line x1="1" y1="9" x2="13" y2="9" stroke="#6366f1" strokeWidth="1" strokeDasharray="2 1"/><line x1="1" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1.2"/></svg>; }
function DistVGapIcon()    { return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="0.5" width="8" height="3" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="3" y="10.5" width="8" height="3" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><rect x="5" y="5.5" width="4" height="3" stroke="currentColor" strokeWidth="1.2" rx="0.5"/><line x1="7" y1="4" x2="7" y2="5.5" stroke="#6366f1" strokeWidth="1" strokeDasharray="1.5 0.5"/><line x1="7" y1="8.5" x2="7" y2="10" stroke="#6366f1" strokeWidth="1" strokeDasharray="1.5 0.5"/></svg>; }

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  objectCount: number;
  alignTarget:      AlignTarget;
  setAlignTarget:   (t: AlignTarget) => void;
  distributeOver:   DistributeOver;
  setDistributeOver:(o: DistributeOver) => void;
  align:            (type: AlignAction,     target: AlignTarget)    => void;
  distribute:       (type: DistributeAction, over:  DistributeOver) => void;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TargetToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded overflow-hidden border border-slate-600">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 text-[10px] px-2 py-1 transition-colors select-none
            ${value === opt.value
              ? "bg-indigo-600 text-white"
              : "bg-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-600"
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface ActionBtnProps {
  label:    string;
  icon:     React.ReactNode;
  onClick:  () => void;
}

function ActionBtn({ label, icon, onClick }: ActionBtnProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-600"
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

// ── AlignDistributePanel ──────────────────────────────────────────────────────

export function AlignDistributePanel({
  objectCount,
  alignTarget,
  setAlignTarget,
  distributeOver,
  setDistributeOver,
  align,
  distribute,
}: Props) {
  const canDistribute = objectCount >= 2;

  const alignTargetOptions: { value: AlignTarget; label: string }[] = [
    { value: "selection", label: "Selecție" },
    { value: "page",      label: "Pagină"   },
  ];

  const distOverOptions: { value: DistributeOver; label: string }[] = [
    { value: "selection", label: "Selecție" },
    { value: "page",      label: "Pagină"   },
  ];

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
            >
              <SlidersHorizontal size={14} />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Aliniere & Distribuire</TooltipContent>
      </Tooltip>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="w-56 p-3 bg-slate-800 border-slate-700 text-slate-200 shadow-xl"
      >
        {/* ── Align section ────────────────────────────────────────────────── */}
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 select-none">
          Aliniere
        </p>

        <div className="mb-2">
          <TargetToggle
            value={alignTarget}
            onChange={setAlignTarget}
            options={alignTargetOptions}
          />
        </div>

        {/* Horizontal align row */}
        <div className="flex items-center gap-0.5 mb-1">
          <ActionBtn label="Aliniere stânga"         icon={<AlignStartVertical     size={14} />} onClick={() => align("left",    alignTarget)} />
          <ActionBtn label="Centru orizontal"         icon={<AlignCenterVertical    size={14} />} onClick={() => align("centerH", alignTarget)} />
          <ActionBtn label="Aliniere dreapta"         icon={<AlignEndVertical       size={14} />} onClick={() => align("right",   alignTarget)} />
          <Separator orientation="vertical" className="h-5 bg-slate-600 mx-1" />
          <ActionBtn label="Aliniere sus"             icon={<AlignStartHorizontal   size={14} />} onClick={() => align("top",     alignTarget)} />
          <ActionBtn label="Centru vertical"          icon={<AlignCenterHorizontal  size={14} />} onClick={() => align("centerV", alignTarget)} />
          <ActionBtn label="Aliniere jos"             icon={<AlignEndHorizontal     size={14} />} onClick={() => align("bottom",  alignTarget)} />
        </div>

        <Separator className="bg-slate-700 my-3" />

        {/* ── Distribute section ───────────────────────────────────────────── */}
        <p className={`text-[10px] uppercase tracking-wider mb-2 select-none ${canDistribute ? "text-slate-500" : "text-slate-700"}`}>
          Distribuire
        </p>

        <div className={`space-y-2 ${!canDistribute ? "opacity-40 pointer-events-none" : ""}`}>
          <TargetToggle
            value={distributeOver}
            onChange={setDistributeOver}
            options={distOverOptions}
          />

          {/* Horizontal distribute */}
          <div>
            <p className="text-[10px] text-slate-600 mb-1 select-none">Orizontal</p>
            <div className="flex items-center gap-0.5">
              <ActionBtn label="Margini stânga egale"  icon={<DistHLeftIcon />}   onClick={() => distribute("leftEdges",  distributeOver)} />
              <ActionBtn label="Centre orizontale egale" icon={<DistHCenterIcon />} onClick={() => distribute("centersH",   distributeOver)} />
              <ActionBtn label="Margini dreapta egale" icon={<DistHRightIcon />}  onClick={() => distribute("rightEdges", distributeOver)} />
              <ActionBtn label="Spațiere egală orizontal" icon={<DistHGapIcon />}  onClick={() => distribute("gapH",       distributeOver)} />
            </div>
          </div>

          {/* Vertical distribute */}
          <div>
            <p className="text-[10px] text-slate-600 mb-1 select-none">Vertical</p>
            <div className="flex items-center gap-0.5">
              <ActionBtn label="Margini sus egale"     icon={<DistVTopIcon />}    onClick={() => distribute("topEdges",    distributeOver)} />
              <ActionBtn label="Centre verticale egale" icon={<DistVCenterIcon />} onClick={() => distribute("centersV",    distributeOver)} />
              <ActionBtn label="Margini jos egale"     icon={<DistVBottomIcon />} onClick={() => distribute("bottomEdges", distributeOver)} />
              <ActionBtn label="Spațiere egală vertical" icon={<DistVGapIcon />}   onClick={() => distribute("gapV",        distributeOver)} />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
