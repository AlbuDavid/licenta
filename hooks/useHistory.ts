"use client";

import { useEffect } from "react";
import type { FabricObject } from "fabric";
import { useEditorStore } from "@/store/editorStore";

/** Objects tagged with this key are transient UI chrome — never snapshot them. */
const TRANSIENT_TAG = "__snap_guide__";

function isTransient(o: FabricObject): boolean {
  return (o as { data?: { tag?: string } }).data?.tag === TRANSIENT_TAG;
}

/**
 * Wires Fabric canvas mutation events to the Zustand history stack and
 * registers Ctrl+Z / Ctrl+Y (and Ctrl+Shift+Z) keyboard shortcuts.
 *
 * Mount this hook once inside <EditorCanvas />.
 *
 * Why the guard matters:
 *  canvas.loadFromJSON() fires object:added for every restored object.
 *  Without the isRestoringHistory flag the undo itself would push a new
 *  snapshot, corrupting the history stack.  The store's pushHistory action
 *  already checks that flag — this hook just needs to forward events.
 */
export function useHistory() {
  const canvas      = useEditorStore((s) => s.canvas);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const undo        = useEditorStore((s) => s.undo);
  const redo        = useEditorStore((s) => s.redo);

  // ── Canvas event listeners ────────────────────────────────────────────────

  useEffect(() => {
    if (!canvas) return;

    /**
     * Captures the current canvas state, filtering out transient guide lines
     * (they are already excluded via excludeFromExport but we double-filter
     * to be safe).
     */
    function snapshot() {
      const raw = canvas!.toJSON() as {
        objects?: Array<{ data?: { tag?: string }; excludeFromExport?: boolean }>;
      };
      if (raw.objects) {
        raw.objects = raw.objects.filter(
          (o) => !o.excludeFromExport && o.data?.tag !== TRANSIENT_TAG,
        );
      }
      pushHistory(JSON.stringify(raw));
    }

    // Push the initial (empty) canvas state so the user can undo back to it
    snapshot();

    const onMutation = (opt: { target?: FabricObject }) => {
      // Skip mutations caused by transient guide lines
      if (opt.target && isTransient(opt.target)) return;
      snapshot();
    };

    canvas.on("object:added",    onMutation as () => void);
    canvas.on("object:removed",  onMutation as () => void);
    canvas.on("object:modified", onMutation as () => void);

    return () => {
      canvas.off("object:added",    onMutation as () => void);
      canvas.off("object:removed",  onMutation as () => void);
      canvas.off("object:modified", onMutation as () => void);
    };
  }, [canvas, pushHistory]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      // Ignore shortcuts while the user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        if (e.shiftKey) void redo();
        else            void undo();
      }

      if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        void redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);
}
