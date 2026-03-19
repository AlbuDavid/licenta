"use client";

import { type ReactNode, useRef, useState } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MousePointer2,
  Square,
  Circle,
  Minus,
  Type,
  Hand,
  ZoomIn,
  ZoomOut,
  Eye,
  Save,
  Download,
  Undo2,
  Redo2,
  ImagePlus,
  FileCode2,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import type { ToolId } from "@/store/editorStore";
import { useEditorTools } from "@/hooks/useEditorTools";
import { PropertiesBar } from "@/components/editor/PropertiesBar";
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
import { LayoutTemplate } from "lucide-react";

// ── Tool definitions ──────────────────────────────────────────────────────────

interface ModeTool {
  kind: "mode";
  id: ToolId;
  label: string;
  icon: ReactNode;
  shortcut: string;
}

interface InsertTool {
  kind: "insert";
  id: ToolId;
  label: string;
  icon: ReactNode;
  shortcut: string;
}

type SidebarTool = ModeTool | InsertTool;

const tools: SidebarTool[] = [
  { kind: "mode",   id: "select",    label: "Selectare",  icon: <MousePointer2 size={16} />, shortcut: "V" },
  { kind: "mode",   id: "pan",       label: "Panoramare", icon: <Hand          size={16} />, shortcut: "H" },
  { kind: "insert", id: "rectangle", label: "Dreptunghi", icon: <Square        size={16} />, shortcut: "R" },
  { kind: "insert", id: "ellipse",   label: "Elipsă",     icon: <Circle        size={16} />, shortcut: "E" },
  { kind: "insert", id: "line",      label: "Linie",      icon: <Minus         size={16} />, shortcut: "L" },
  { kind: "insert", id: "text",      label: "Text",       icon: <Type          size={16} />, shortcut: "T" },
];

// ── EditorLayout ──────────────────────────────────────────────────────────────

interface EditorLayoutProps {
  /** The canvas component rendered in the central area. */
  canvasSlot: ReactNode;
}

export function EditorLayout({ canvasSlot }: EditorLayoutProps) {
  // All state comes directly from the store — no prop drilling needed
  const activeTool    = useEditorStore((s) => s.activeTool);
  const zoom          = useEditorStore((s) => s.zoom);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const zoomIn        = useEditorStore((s) => s.zoomIn);
  const zoomOut       = useEditorStore((s) => s.zoomOut);

  const undo          = useEditorStore((s) => s.undo);
  const redo          = useEditorStore((s) => s.redo);
  const historyIndex  = useEditorStore((s) => s.historyIndex);
  const historyLength = useEditorStore((s) => s.history.length);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  const { addImage, addSVG } = useEditorTools();
  const { loadProductTemplate, clearTemplate, TEMPLATES } = useProductTemplate();
  const { exportSVG } = useExport();
  const { save, status: saveStatus } = useSave();
  const [templateVal, setTemplateVal] = useState("");

  const saveLabel: Record<typeof saveStatus, string> = {
    idle:   "Salvează (Ctrl+S)",
    saving: "Se salvează…",
    saved:  "Salvat!",
    error:  "Eroare — reîncearcă",
  };

  // Hidden file input refs for media imports
  const imageInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef   = useRef<HTMLInputElement>(null);

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    addImage(file);
    e.target.value = "";
  }

  function handleSVGFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    addSVG(file);
    e.target.value = "";
  }

  /** Activate the tool — useDrawingMode handles the actual canvas interaction. */
  function handleToolClick(tool: SidebarTool) {
    setActiveTool(tool.id);
  }

  return (
    <TooltipProvider delayDuration={400}>
      {/*
       * Fills the viewport below the 56px SiteHeader.
       * Dark theme mirrors /produse/customize for a professional IDE feel.
       */}
      <div className="flex flex-col h-[calc(100vh-56px)] bg-slate-700 overflow-hidden text-slate-100">

        {/* ── Top Bar (two rows) ───────────────────────────────────────────── */}
        <div className="flex flex-col bg-slate-800 border-b border-slate-700 shrink-0">

          {/* ── Row 1 : static tools ──────────────────────────────────────── */}
          <div className="flex items-center gap-1 px-3 h-10">

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

            {/* Product template selector — each pick ADDS a new template */}
            <LayoutTemplate size={13} className="text-slate-400 shrink-0" />
            <Select
              value={templateVal}
              onValueChange={(val) => {
                if (val === "none") clearTemplate();
                else loadProductTemplate(val as TemplateShape);
                // Reset so the same shape can be picked again
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

            {/* Preview mode — icon only */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700">
                  <Eye size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Previzualizare (Tab)</TooltipContent>
            </Tooltip>

          </div>

          {/* ── Row 2 : contextual object properties ──────────────────────── */}
          <div className="flex items-center gap-1.5 px-3 h-10 border-t border-slate-700/50">
            <PropertiesBar />
          </div>

        </div>

        {/* ── Main Area ────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left Sidebar (Tools) ─────────────────────────────────────── */}
          <aside className="flex flex-col items-center gap-1 py-2 w-11 bg-slate-800 border-r border-slate-700 shrink-0">
            {tools.map((tool) => {
              // All tools stay highlighted while they are the active tool.
              const isActive = activeTool === tool.id;

              return (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 transition-colors ${
                        isActive
                          ? "bg-indigo-600 text-white hover:bg-indigo-500"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                      }`}
                      onClick={() => handleToolClick(tool)}
                      aria-pressed={isActive}
                      aria-label={tool.label}
                    >
                      {tool.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {tool.label}{" "}
                    <kbd className="ml-1 text-xs opacity-50">{tool.shortcut}</kbd>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* ── Divider + Media imports ──────────────────────────────── */}
            <Separator className="w-6 bg-slate-700 my-1" />

            {/* Image upload */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                  onClick={() => imageInputRef.current?.click()}
                  aria-label="Importă imagine"
                >
                  <ImagePlus size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Importă imagine (PNG / JPG)</TooltipContent>
            </Tooltip>

            {/* Hidden file input — raster images */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={handleImageFile}
            />

            {/* SVG upload */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                  onClick={() => svgInputRef.current?.click()}
                  aria-label="Importă SVG"
                >
                  <FileCode2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Importă vector (SVG)</TooltipContent>
            </Tooltip>

            {/* Hidden file input — SVG */}
            <input
              ref={svgInputRef}
              type="file"
              accept=".svg, image/svg+xml"
              className="hidden"
              onChange={handleSVGFile}
            />
          </aside>

          {/* ── Canvas Area ──────────────────────────────────────────────── */}
          <main className="flex flex-1 overflow-hidden">
            {canvasSlot}
          </main>

        </div>
      </div>
    </TooltipProvider>
  );
}
