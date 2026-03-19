"use client";

import dynamic from "next/dynamic";
import { EditorLayout } from "@/components/editor/EditorLayout";

/**
 * Dynamically import the canvas component with SSR disabled.
 * Fabric.js requires the browser DOM — the same pattern used in /produse/customize.
 */
const EditorCanvas = dynamic(
  () => import("@/components/editor/EditorCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-700">
        <svg
          className="animate-spin w-8 h-8 text-indigo-500 mb-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <p className="text-slate-400 text-sm">Se încarcă editorul…</p>
      </div>
    ),
  }
);

export default function EditorPage() {
  return (
    <EditorLayout canvasSlot={<EditorCanvas />} />
  );
}
