"use client";

import { type ReactNode, useRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MousePointer2,
  Square,
  Circle,
  Minus,
  Type,
  Hand,
  ImagePlus,
  FileCode2,
} from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import type { ToolId } from "@/store/editorStore";
import { useEditorTools } from "@/hooks/useEditorTools";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarTool {
  id: ToolId;
  label: string;
  icon: ReactNode;
  shortcut: string;
}

const tools: SidebarTool[] = [
  { id: "select",    label: "Selectare",  icon: <MousePointer2 size={16} />, shortcut: "V" },
  { id: "pan",       label: "Panoramare", icon: <Hand          size={16} />, shortcut: "H" },
  { id: "rectangle", label: "Dreptunghi", icon: <Square        size={16} />, shortcut: "R" },
  { id: "ellipse",   label: "Elipsă",     icon: <Circle        size={16} />, shortcut: "E" },
  { id: "line",      label: "Linie",      icon: <Minus         size={16} />, shortcut: "L" },
  { id: "text",      label: "Text",       icon: <Type          size={16} />, shortcut: "T" },
];

export function EditorSidebar() {
  const activeTool    = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const { addImage, addSVG } = useEditorTools();

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

  return (
    <aside className="flex flex-col items-center gap-1 py-2 w-11 bg-slate-800 border-r border-slate-700 shrink-0">
      {tools.map((tool) => {
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
                onClick={() => setActiveTool(tool.id)}
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

      <Separator className="w-6 bg-slate-700 my-1" />

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

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleImageFile}
      />

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

      <input
        ref={svgInputRef}
        type="file"
        accept=".svg, image/svg+xml"
        className="hidden"
        onChange={handleSVGFile}
      />
    </aside>
  );
}
