"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Save,
  Download,
  Braces,
  Camera,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Eye,
  LayoutTemplate,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import { useProductTemplate, type TemplateShape } from "@/hooks/useProductTemplate";
import { useExport } from "@/hooks/useExport";
import { useSave } from "@/hooks/useSave";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PropertiesBar } from "@/components/editor/PropertiesBar";

export function EditorTopBar() {
  const zoom          = useEditorStore((s) => s.zoom);
  const zoomIn        = useEditorStore((s) => s.zoomIn);
  const zoomOut       = useEditorStore((s) => s.zoomOut);
  const mode          = useEditorStore((s) => s.mode);
  const setMode       = useEditorStore((s) => s.setMode);
  const isPreview     = mode === "preview";
  const undo          = useEditorStore((s) => s.undo);
  const redo          = useEditorStore((s) => s.redo);
  const historyIndex  = useEditorStore((s) => s.historyIndex);
  const historyLength = useEditorStore((s) => s.history.length);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;
  const designThumbnail = useEditorStore((s) => s.designThumbnail);

  const { loadProductTemplate, clearTemplate, TEMPLATES } = useProductTemplate();
  const { exportSVG, exportJSON, generateThumbnail } = useExport();
  const { save, status: saveStatus } = useSave();
  const [templateVal, setTemplateVal] = useState("");

  const saveLabel: Record<typeof saveStatus, string> = {
    idle:   "Salvează (Ctrl+S)",
    saving: "Se salvează…",
    saved:  "Salvat!",
    error:  "Eroare — reîncearcă",
  };

  return (
    <div className="flex bg-slate-800 border-b border-slate-700 shrink-0">
      <div className="flex items-center gap-1 px-3 h-11 w-full">

        {/* File actions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-40"
              disabled={saveStatus === "saving"}
              onClick={() => void save()}>
              <Save size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{saveLabel[saveStatus]}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
              onClick={() => exportSVG()}>
              <Download size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Exportă SVG</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
              onClick={() => exportJSON()}>
              <Braces size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Descarcă JSON (vector data)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
              onClick={() => generateThumbnail()}>
              <Camera size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Captează miniatură (pentru coș)</TooltipContent>
        </Tooltip>

        {designThumbnail && (
          <Tooltip>
            <TooltipTrigger asChild>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={designThumbnail}
                alt="Miniatură design"
                className="h-7 w-7 rounded object-cover border border-slate-600 cursor-default"
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">Miniatură curentă</TooltipContent>
          </Tooltip>
        )}

        <Separator orientation="vertical" className="h-4 bg-slate-600 mx-0.5" />

        {/* Undo / Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-40"
              disabled={!canUndo}
              onClick={() => void undo()}>
              <Undo2 size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-40"
              disabled={!canRedo}
              onClick={() => void redo()}>
              <Redo2 size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Redo (Ctrl+Y)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4 bg-slate-600 mx-0.5" />

        {/* Zoom controls */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
              onClick={zoomOut}>
              <ZoomOut size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Micșorare (Ctrl+-)</TooltipContent>
        </Tooltip>

        <span className="text-xs text-slate-400 w-10 text-center tabular-nums select-none">
          {zoom}%
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
              onClick={zoomIn}>
              <ZoomIn size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Mărire (Ctrl++)</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4 bg-slate-600 mx-0.5" />

        {/* Product template selector */}
        <LayoutTemplate size={13} className="text-slate-400 shrink-0" />
        <Select
          value={templateVal}
          onValueChange={(val) => {
            if (val === "none") clearTemplate();
            else loadProductTemplate(val as TemplateShape);
            setTemplateVal("");
          }}
        >
          <SelectTrigger
            className="h-7 w-36 text-xs bg-slate-700 border-slate-600
                       text-slate-300 hover:bg-slate-600 focus:ring-0
                       focus:ring-offset-0"
          >
            <SelectValue placeholder="Șablon…" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
            <SelectItem value="none"      className="text-xs focus:bg-slate-700">Fără șablon</SelectItem>
            <SelectItem value="circle"    className="text-xs focus:bg-slate-700">{TEMPLATES.circle.label}</SelectItem>
            <SelectItem value="square"    className="text-xs focus:bg-slate-700">{TEMPLATES.square.label}</SelectItem>
            <SelectItem value="rectangle" className="text-xs focus:bg-slate-700">{TEMPLATES.rectangle.label}</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-4 bg-slate-600 mx-0.5" />

        {/* Preview mode toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon"
              className={`h-7 w-7 transition-colors ${
                isPreview
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
              }`}
              aria-pressed={isPreview}
              onClick={() => setMode(isPreview ? "design" : "preview")}>
              <Eye size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isPreview ? "Ieși din previzualizare" : "Previzualizare laser (Tab)"}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4 bg-slate-600 mx-0.5" />

        {/* Contextual object properties */}
        <PropertiesBar />

      </div>
    </div>
  );
}
