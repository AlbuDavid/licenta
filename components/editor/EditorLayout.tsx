"use client";

import { type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorTopBar } from "@/components/editor/EditorTopBar";
import { EditorSidebar } from "@/components/editor/EditorSidebar";

interface EditorLayoutProps {
  /** The canvas component rendered in the central area. */
  canvasSlot: ReactNode;
}

export function EditorLayout({ canvasSlot }: EditorLayoutProps) {
  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-col h-[calc(100vh-56px)] bg-slate-700 overflow-hidden text-slate-100">
        <EditorTopBar />
        <div className="flex flex-1 overflow-hidden">
          <EditorSidebar />
          <main className="flex flex-1 overflow-hidden">
            {canvasSlot}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
