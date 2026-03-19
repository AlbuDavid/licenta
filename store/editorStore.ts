import { create } from "zustand";
import * as fabric from "fabric";
import type { Canvas, FabricObject } from "fabric";

const ZOOM_MIN  = 0.05;
const ZOOM_MAX  = 20;
const ZOOM_STEP = 1.25;
const MAX_HISTORY = 50;

// ── Types ─────────────────────────────────────────────────────────────────────

export type EditorMode = "design" | "preview";
export type ToolId = "select" | "rectangle" | "ellipse" | "line" | "text" | "pan";

export interface EditorState {
  canvas: Canvas | null;
  selectedObjects: FabricObject[];
  zoom: number;
  mode: EditorMode;
  activeTool: ToolId;

  // ── History ──────────────────────────────────────────────────────────────
  /** Serialized canvas snapshots (most recent at the end). */
  history: string[];
  /** Index of the currently displayed snapshot (-1 = empty). */
  historyIndex: number;
  /** Guards against recording snapshots while undo/redo is restoring state. */
  isRestoringHistory: boolean;
}

export interface EditorActions {
  setCanvas: (canvas: Canvas | null) => void;
  setSelectedObjects: (objects: FabricObject[]) => void;
  setZoom: (zoom: number) => void;
  setMode: (mode: EditorMode) => void;
  setActiveTool: (tool: ToolId) => void;
  zoomIn: () => void;
  zoomOut: () => void;

  // ── History ──────────────────────────────────────────────────────────────
  /**
   * Appends a snapshot to the history stack.
   * No-ops when `isRestoringHistory` is true (prevents recursive recording
   * while loadFromJSON fires object:added events during undo/redo).
   */
  pushHistory: (snapshot: string) => void;
  /** Restore the previous canvas state. */
  undo: () => Promise<void>;
  /** Restore the next canvas state (after an undo). */
  redo: () => Promise<void>;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────────────────────
  canvas: null,
  selectedObjects: [],
  zoom: 100,
  mode: "design",
  activeTool: "select",

  history: [],
  historyIndex: -1,
  isRestoringHistory: false,

  // ── Actions ───────────────────────────────────────────────────────────────
  setCanvas: (canvas) => set({ canvas }),
  setSelectedObjects: (selectedObjects) => set({ selectedObjects }),
  setZoom: (zoom) => set({ zoom }),
  setMode: (mode) => set({ mode }),
  setActiveTool: (tool) => set({ activeTool: tool }),

  zoomIn: () =>
    set((state) => {
      if (!state.canvas) return {};
      const c = state.canvas;
      const z = Math.min(ZOOM_MAX, c.getZoom() * ZOOM_STEP);
      const center = c.getCenterPoint();
      c.zoomToPoint(new fabric.Point(center.x, center.y), z);
      return { zoom: Math.round(z * 100) };
    }),

  zoomOut: () =>
    set((state) => {
      if (!state.canvas) return {};
      const c = state.canvas;
      const z = Math.max(ZOOM_MIN, c.getZoom() / ZOOM_STEP);
      const center = c.getCenterPoint();
      c.zoomToPoint(new fabric.Point(center.x, center.y), z);
      return { zoom: Math.round(z * 100) };
    }),

  // ── History actions ───────────────────────────────────────────────────────

  pushHistory: (snapshot) => {
    if (get().isRestoringHistory) return;

    set((state) => {
      // Drop any "future" snapshots when a new action is taken after an undo
      const base = state.history.slice(0, state.historyIndex + 1);
      base.push(snapshot);
      // Trim to MAX_HISTORY
      const trimmed = base.length > MAX_HISTORY
        ? base.slice(base.length - MAX_HISTORY)
        : base;
      return { history: trimmed, historyIndex: trimmed.length - 1 };
    });
  },

  undo: async () => {
    const { canvas, history, historyIndex, isRestoringHistory } = get();
    if (!canvas || historyIndex <= 0 || isRestoringHistory) return;

    const newIndex = historyIndex - 1;
    set({ isRestoringHistory: true });
    try {
      await canvas.loadFromJSON(JSON.parse(history[newIndex]));
      canvas.requestRenderAll();
      set({ historyIndex: newIndex });
    } finally {
      set({ isRestoringHistory: false });
    }
  },

  redo: async () => {
    const { canvas, history, historyIndex, isRestoringHistory } = get();
    if (!canvas || historyIndex >= history.length - 1 || isRestoringHistory) return;

    const newIndex = historyIndex + 1;
    set({ isRestoringHistory: true });
    try {
      await canvas.loadFromJSON(JSON.parse(history[newIndex]));
      canvas.requestRenderAll();
      set({ historyIndex: newIndex });
    } finally {
      set({ isRestoringHistory: false });
    }
  },
}));
