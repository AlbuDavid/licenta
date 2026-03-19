"use client";

import { useEffect, useState } from "react";
import type { IText, FabricObject } from "fabric";
import { useEditorStore } from "@/store/editorStore";
import { useObjectUpdater } from "@/hooks/useObjectUpdater";
import { useGrouping } from "@/hooks/useGrouping";
import { useAlignment } from "@/hooks/useAlignment";
import { useCornerRadius, isRoundedRectObject } from "@/hooks/useCornerRadius";
import type { CornerRadiiData } from "@/hooks/useCornerRadius";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  BringToFront,
  SendToBack,
  Group,
  Ungroup,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Constants ─────────────────────────────────────────────────────────────────

const FONTS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
];

const TEXT_TYPES  = new Set(["i-text", "text", "textbox"]);
const SHAPE_TYPES = new Set(["rect", "ellipse", "circle", "line", "polygon", "path"]);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safely read a string property from a Fabric object, with a fallback. */
function str(obj: FabricObject, key: string, fallback = ""): string {
  const v = (obj as unknown as Record<string, unknown>)[key];
  return typeof v === "string" ? v : fallback;
}

/** Safely read a number property from a Fabric object, with a fallback. */
function num(obj: FabricObject, key: string, fallback = 0): number {
  const v = (obj as unknown as Record<string, unknown>)[key];
  return typeof v === "number" ? v : fallback;
}

/** Convert any fabric fill value to a CSS hex string for <input type="color">. */
function toHex(fill: unknown): string {
  if (typeof fill === "string" && fill.startsWith("#")) return fill;
  if (typeof fill === "string" && fill !== "transparent" && fill !== "") return fill;
  return "#1e293b"; // slate-800 default
}

// ── Local state shape ─────────────────────────────────────────────────────────

interface TextProps {
  fontFamily: string;
  fontSize: number;
  fill: string;
}

interface ShapeProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
}

// ── PropertiesBar ─────────────────────────────────────────────────────────────

/**
 * Renders contextual property controls in the top bar based on what is
 * currently selected on the canvas.
 *
 * How it works:
 *  1. Subscribes to `selectedObjects` from the Zustand store.
 *  2. On each selection change, reads the current property values directly
 *     from the Fabric object and copies them into local React state.
 *     (Local state → the form reflects the selected object's real values.)
 *  3. onChange handlers update local state immediately (optimistic UI) and
 *     will call canvas update functions once Step 2 wires in the logic.
 */
// ── Shared layer + group action buttons (rendered in every branch) ────────────

interface AlignmentHandlers {
  alignLeft:    () => void;
  alignCenterH: () => void;
  alignRight:   () => void;
  alignTop:     () => void;
  alignCenterV: () => void;
  alignBottom:  () => void;
}

function LayerActions({
  onBringForward,
  onSendBackward,
  onGroup,
  onUngroup,
  showGroup    = false,
  showUngroup  = false,
  alignment,
}: {
  onBringForward: () => void;
  onSendBackward: () => void;
  onGroup?:    () => void;
  onUngroup?:  () => void;
  showGroup?:  boolean;
  showUngroup?: boolean;
  alignment?:  AlignmentHandlers;
}) {
  const btnCls = "h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700";

  return (
    <div className="flex items-center gap-0.5 ml-2">
      <Separator orientation="vertical" className="h-6 bg-slate-600 mr-1.5" />

      {/* ── Alignment (multi-select only) ──────────────────────────────── */}
      {alignment && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={btnCls} onClick={alignment.alignLeft}>
                <AlignStartVertical size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Aliniere stânga</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={btnCls} onClick={alignment.alignCenterH}>
                <AlignCenterVertical size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Centru orizontal</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={btnCls} onClick={alignment.alignRight}>
                <AlignEndVertical size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Aliniere dreapta</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 bg-slate-600 mx-0.5" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={btnCls} onClick={alignment.alignTop}>
                <AlignStartHorizontal size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Aliniere sus</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={btnCls} onClick={alignment.alignCenterV}>
                <AlignCenterHorizontal size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Centru vertical</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={btnCls} onClick={alignment.alignBottom}>
                <AlignEndHorizontal size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Aliniere jos</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 bg-slate-600 mx-0.5" />
        </>
      )}

      {/* ── Group / Ungroup ────────────────────────────────────────────── */}
      {showGroup && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={btnCls} onClick={onGroup}>
              <Group size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Grupează (Ctrl+G)</TooltipContent>
        </Tooltip>
      )}

      {showUngroup && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={btnCls} onClick={onUngroup}>
              <Ungroup size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Dezgrupează (Ctrl+Shift+G)</TooltipContent>
        </Tooltip>
      )}

      {/* ── Layer order ────────────────────────────────────────────────── */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className={btnCls} onClick={onBringForward}>
            <BringToFront size={14} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Aduce înainte</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className={btnCls} onClick={onSendBackward}>
            <SendToBack size={14} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Trimite înapoi</TooltipContent>
      </Tooltip>
    </div>
  );
}

// ── PropertiesBar ─────────────────────────────────────────────────────────────

export function PropertiesBar() {
  const selectedObjects = useEditorStore((s) => s.selectedObjects);
  const { updateActiveObject } = useObjectUpdater();
  const {
    groupSelected,
    ungroupSelected,
    bringObjectForward,
    sendObjectBackward,
  } = useGrouping();

  const alignment = useAlignment();
  const { applyCornerRadii } = useCornerRadius();
  const first = selectedObjects[0] ?? null;

  // Detect which panel to show
  const objType      = first?.type ?? null;
  const isText       = objType !== null && TEXT_TYPES.has(objType);
  const isShape      = objType !== null && SHAPE_TYPES.has(objType);
  const isGroup            = objType === "group";
  const isRoundedRectPath  = first !== null && isRoundedRectObject(first);
  const hasMulti     = selectedObjects.length > 1;
  const isActiveSelec = objType === "activeSelection";

  // ── Local property state ─────────────────────────────────────────────────
  const [textProps, setTextProps] = useState<TextProps>({
    fontFamily: "Arial",
    fontSize:   24,
    fill:       "#1e293b",
  });

  const [shapeProps, setShapeProps] = useState<ShapeProps>({
    fill:        "transparent",
    stroke:      "#1e293b",
    strokeWidth: 1,
  });

  const [cornerRadii, setCornerRadii] = useState<CornerRadiiData>({
    isRoundedRect: true,
    vw: 0, vh: 0,
    rTL: 0, rTR: 0, rBR: 0, rBL: 0,
  });

  // Sync local state whenever the selection changes
  useEffect(() => {
    if (!first) return;

    if (TEXT_TYPES.has(first.type ?? "")) {
      const t = first as unknown as IText;
      setTextProps({
        fontFamily: str(first, "fontFamily", "Arial"),
        fontSize:   num(first, "fontSize",   24),
        fill:       toHex(t.fill),
      });
    }

    if (SHAPE_TYPES.has(first.type ?? "")) {
      setShapeProps({
        fill:        toHex(first.fill),
        stroke:      toHex(first.stroke),
        strokeWidth: num(first, "strokeWidth", 1),
      });

      // Sync per-corner radii
      if (isRoundedRectObject(first)) {
        setCornerRadii(first.data);
      } else {
        // Plain rect: seed all 4 corners from uniform rx
        const r = num(first, "rx", 0);
        setCornerRadii((p) => ({ ...p, rTL: r, rTR: r, rBR: r, rBL: r }));
      }
    }
  }, [first, selectedObjects]);

  // ── Shared input classes ─────────────────────────────────────────────────
  const inputCls =
    "h-7 text-xs bg-slate-700 border-slate-600 text-slate-200 " +
    "placeholder:text-slate-500 focus-visible:ring-0 focus-visible:border-slate-400";

  const labelCls = "text-[10px] text-slate-500 uppercase tracking-wider select-none";

  // ── Nothing selected ─────────────────────────────────────────────────────
  if (!first) {
    return (
      <span className="text-[11px] text-slate-600 italic select-none">
        Selectează un obiect pentru proprietăți
      </span>
    );
  }

  // ── activeSelection (multiple objects — alignment + Group) ───────────────
  if (hasMulti || isActiveSelec) {
    return (
      <div className="flex items-center">
        <span className="text-[11px] text-slate-400 select-none">
          {selectedObjects.length} obiecte selectate
        </span>
        <LayerActions
          onBringForward={bringObjectForward}
          onSendBackward={sendObjectBackward}
          onGroup={groupSelected}
          onUngroup={ungroupSelected}
          showGroup
          showUngroup
          alignment={alignment}
        />
      </div>
    );
  }

  // ── Single Group selected — show Ungroup ─────────────────────────────────
  if (isGroup) {
    return (
      <div className="flex items-center">
        <span className="text-[11px] text-slate-400 select-none">Grup</span>
        <LayerActions
          onBringForward={bringObjectForward}
          onSendBackward={sendObjectBackward}
          onUngroup={ungroupSelected}
          showUngroup
        />
      </div>
    );
  }

  // ── Text properties ──────────────────────────────────────────────────────
  if (isText) {
    return (
      <div className="flex items-center gap-2">
        {/* Font family */}
        <div className="flex flex-col gap-0.5">
          <span className={labelCls}>Font</span>
          <Select
            value={textProps.fontFamily}
            onValueChange={(v) => {
              setTextProps((p) => ({ ...p, fontFamily: v }));
              updateActiveObject("fontFamily", v);
            }}
          >
            <SelectTrigger className={`${inputCls} w-36`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
              {FONTS.map((f) => (
                <SelectItem key={f} value={f} className="text-xs focus:bg-slate-700"
                  style={{ fontFamily: f }}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Font size */}
        <div className="flex flex-col gap-0.5">
          <span className={labelCls}>Mărime</span>
          <Input
            type="number"
            min={6}
            max={400}
            value={textProps.fontSize}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTextProps((p) => ({ ...p, fontSize: v }));
              updateActiveObject("fontSize", v);
            }}
            className={`${inputCls} w-16`}
          />
        </div>

        <Separator orientation="vertical" className="h-8 bg-slate-600" />

        {/* Text color */}
        <div className="flex flex-col gap-0.5">
          <span className={labelCls}>Culoare</span>
          <input
            type="color"
            value={textProps.fill}
            onChange={(e) => {
              setTextProps((p) => ({ ...p, fill: e.target.value }));
              updateActiveObject("fill", e.target.value);
            }}
            className="w-7 h-7 rounded cursor-pointer border border-slate-600
                       bg-transparent p-0.5"
            title="Culoare text"
          />
        </div>

        <LayerActions
          onBringForward={bringObjectForward}
          onSendBackward={sendObjectBackward}
        />
      </div>
    );
  }

  // ── Shape properties ─────────────────────────────────────────────────────
  if (isShape) {
    return (
      <div className="flex items-center gap-2">
        {/* Fill color */}
        <div className="flex flex-col gap-0.5">
          <span className={labelCls}>Umplutură</span>
          <input
            type="color"
            value={shapeProps.fill === "transparent" ? "#ffffff" : shapeProps.fill}
            onChange={(e) => {
              setShapeProps((p) => ({ ...p, fill: e.target.value }));
              updateActiveObject("fill", e.target.value);
            }}
            className="w-7 h-7 rounded cursor-pointer border border-slate-600
                       bg-transparent p-0.5"
            title="Culoare umplutură"
          />
        </div>

        <Separator orientation="vertical" className="h-8 bg-slate-600" />

        {/* Stroke color */}
        <div className="flex flex-col gap-0.5">
          <span className={labelCls}>Contur</span>
          <input
            type="color"
            value={shapeProps.stroke}
            onChange={(e) => {
              setShapeProps((p) => ({ ...p, stroke: e.target.value }));
              updateActiveObject("stroke", e.target.value);
            }}
            className="w-7 h-7 rounded cursor-pointer border border-slate-600
                       bg-transparent p-0.5"
            title="Culoare contur"
          />
        </div>

        {/* Stroke width */}
        <div className="flex flex-col gap-0.5">
          <span className={labelCls}>Grosime</span>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={shapeProps.strokeWidth}
            onChange={(e) => {
              const v = Number(e.target.value);
              setShapeProps((p) => ({ ...p, strokeWidth: v }));
              updateActiveObject("strokeWidth", v);
            }}
            className={`${inputCls} w-16`}
          />
        </div>

        {/* Per-corner radii — rect or rounded-rect path */}
        {(objType === "rect" || isRoundedRectPath) && (
          <>
            <Separator orientation="vertical" className="h-8 bg-slate-600" />
            <div className="flex flex-col gap-0.5">
              <span className={labelCls}>Raze colțuri</span>
              {/*
               * Single row — clockwise from top-left:
               *   [S-S] [D-S] [D-J] [S-J]
               * Tooltip reveals the full corner name on hover.
               */}
              <div className="flex gap-0.5">
                {(
                  [
                    { key: "rTL" as const, title: "Stânga-Sus (↖)"  },
                    { key: "rTR" as const, title: "Dreapta-Sus (↗)"  },
                    { key: "rBR" as const, title: "Dreapta-Jos (↘)"  },
                    { key: "rBL" as const, title: "Stânga-Jos (↙)"  },
                  ] as const
                ).map(({ key, title }) => (
                  <Input
                    key={key}
                    type="number"
                    min={0}
                    max={500}
                    step={1}
                    title={title}
                    value={cornerRadii[key]}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      const next = { ...cornerRadii, [key]: v };
                      setCornerRadii(next);
                      applyCornerRadii(next.rTL, next.rTR, next.rBR, next.rBL);
                    }}
                    className={`${inputCls} w-14`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <LayerActions
          onBringForward={bringObjectForward}
          onSendBackward={sendObjectBackward}
        />
      </div>
    );
  }

  // ── Fallback (image, etc.) ────────────────────────────────────────────────
  return (
    <div className="flex items-center">
      <span className="text-[11px] text-slate-500 capitalize select-none">
        {objType}
      </span>
      <LayerActions
        onBringForward={bringObjectForward}
        onSendBackward={sendObjectBackward}
      />
    </div>
  );
}
