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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlignDistributePanel } from "@/components/editor/AlignDistributePanel";
import { ColorSwatch } from "@/components/editor/ColorSwatch";
import { LayerActions } from "@/components/editor/LayerActions";

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
  if (fill === "transparent" || fill === "" || fill === null || fill === undefined)
    return "transparent";
  if (typeof fill === "string" && fill.startsWith("#")) return fill;
  if (typeof fill === "string") return fill;
  return "#1e293b";
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

export function PropertiesBar() {
  const selectedObjects = useEditorStore((s) => s.selectedObjects);
  const { updateActiveObject } = useObjectUpdater();
  const {
    groupSelected,
    ungroupSelected,
    bringObjectForward,
    sendObjectBackward,
  } = useGrouping();

  const {
    alignTarget, setAlignTarget,
    distributeOver, setDistributeOver,
    align, distribute,
  } = useAlignment();
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

  // ── Nothing selected ─────────────────────────────────────────────────────
  if (!first) {
    return (
      <span className="text-[11px] text-slate-600 italic select-none">
        Selectează un obiect pentru proprietăți
      </span>
    );
  }

  // ── activeSelection (multiple objects — align + distribute + group) ────────
  if (hasMulti || isActiveSelec) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-slate-400 select-none">
          {selectedObjects.length} obiecte selectate
        </span>
        <AlignDistributePanel
          objectCount={selectedObjects.length}
          alignTarget={alignTarget}       setAlignTarget={setAlignTarget}
          distributeOver={distributeOver} setDistributeOver={setDistributeOver}
          align={align}
          distribute={distribute}
        />
        <LayerActions
          onBringForward={bringObjectForward}
          onSendBackward={sendObjectBackward}
          onGroup={groupSelected}
          onUngroup={ungroupSelected}
          showGroup
          showUngroup
        />
      </div>
    );
  }

  // ── Single Group selected — show align panel + Ungroup ───────────────────
  if (isGroup) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-slate-400 select-none">Grup</span>
        <AlignDistributePanel
          objectCount={1}
          alignTarget={alignTarget}       setAlignTarget={setAlignTarget}
          distributeOver={distributeOver} setDistributeOver={setDistributeOver}
          align={align}
          distribute={distribute}
        />
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
      <div className="flex items-center gap-1.5">
        {/* Font family */}
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">Font</TooltipContent>
        </Tooltip>

        {/* Font size */}
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">Mărime font</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4 bg-slate-600" />

        {/* Text color */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <ColorSwatch
                value={textProps.fill}
                allowTransparent={false}
                onChange={(v) => {
                  setTextProps((p) => ({ ...p, fill: v }));
                  updateActiveObject("fill", v);
                }}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Culoare text</TooltipContent>
        </Tooltip>

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
      <div className="flex items-center gap-1.5">
        {/* Fill color */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <ColorSwatch
                value={shapeProps.fill}
                onChange={(v) => {
                  setShapeProps((p) => ({ ...p, fill: v }));
                  updateActiveObject("fill", v);
                }}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Umplutură</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4 bg-slate-600" />

        {/* Stroke color */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <ColorSwatch
                value={shapeProps.stroke}
                onChange={(v) => {
                  setShapeProps((p) => ({ ...p, stroke: v }));
                  updateActiveObject("stroke", v);
                }}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Contur</TooltipContent>
        </Tooltip>

        {/* Stroke width */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
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
              <span className="text-[10px] text-slate-500 select-none">px</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">Grosime contur</TooltipContent>
        </Tooltip>

        {/* Per-corner radii — rect or rounded-rect path */}
        {(objType === "rect" || isRoundedRectPath) && (
          <>
            <Separator orientation="vertical" className="h-4 bg-slate-600" />
            <div className="flex items-center gap-0.5">
              {(
                [
                  { key: "rTL" as const, title: "Rază colț Stânga-Sus (↖)"  },
                  { key: "rTR" as const, title: "Rază colț Dreapta-Sus (↗)"  },
                  { key: "rBR" as const, title: "Rază colț Dreapta-Jos (↘)"  },
                  { key: "rBL" as const, title: "Rază colț Stânga-Jos (↙)"  },
                ] as const
              ).map(({ key, title }) => (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Input
                      type="number"
                      min={0}
                      max={500}
                      step={1}
                      value={cornerRadii[key]}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        const next = { ...cornerRadii, [key]: v };
                        setCornerRadii(next);
                        applyCornerRadii(next.rTL, next.rTR, next.rBR, next.rBL);
                      }}
                      className={`${inputCls} w-14`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{title}</TooltipContent>
                </Tooltip>
              ))}
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
