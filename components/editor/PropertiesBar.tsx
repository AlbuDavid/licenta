"use client";

import { useEffect, useState } from "react";
import type { IText, FabricObject } from "fabric";
import * as fabric from "fabric";
import { useEditorStore } from "@/store/editorStore";
import { useObjectUpdater } from "@/hooks/useObjectUpdater";
import { useGrouping } from "@/hooks/useGrouping";
import { useAlignment } from "@/hooks/useAlignment";
import { useCornerRadius, isRoundedRectObject } from "@/hooks/useCornerRadius";
import type { CornerRadiiData } from "@/hooks/useCornerRadius";
import { useTextOnPath } from "@/hooks/useTextOnPath";
import { TextOnPathPopover } from "@/components/editor/TextOnPathPopover";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AArrowUp,
  AArrowDown,
  Type,
  Ungroup,
} from "lucide-react";
import { AlignDistributePanel } from "@/components/editor/AlignDistributePanel";
import { ColorSwatch } from "@/components/editor/ColorSwatch";
import { LayerActions } from "@/components/editor/LayerActions";

// ── Constants ─────────────────────────────────────────────────────────────────

const FONTS = [
  // Sans-serif
  "Arial",
  "Helvetica",
  "Verdana",
  "Trebuchet MS",
  "Gill Sans",
  "Segoe UI",
  "Calibri",
  "Candara",
  "Optima",
  "Futura",
  // Serif
  "Georgia",
  "Times New Roman",
  "Garamond",
  "Palatino",
  "Book Antiqua",
  "Cambria",
  // Monospace
  "Courier New",
  "Consolas",
  "Monaco",
  // Display / Script
  "Impact",
  "Copperplate",
  "Papyrus",
  "Brush Script MT",
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
  fontWeight: string;
  fontStyle: string;
  underline: boolean;
  linethrough: boolean;
  textAlign: string;
  charSpacing: number;
}

interface ShapeProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
}

// ── PropertiesBar ─────────────────────────────────────────────────────────────

export function PropertiesBar() {
  const selectedObjects = useEditorStore((s) => s.selectedObjects);
  const canvas = useEditorStore((s) => s.canvas);
  const takeSnapshot = useEditorStore((s) => s.takeSnapshot);
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
  const { editMeta } = useTextOnPath();
  const first = selectedObjects[0] ?? null;

  // Detect which panel to show
  const objType      = first?.type ?? null;
  const isText       = objType !== null && TEXT_TYPES.has(objType);
  const isShape      = objType !== null && SHAPE_TYPES.has(objType);
  const isGroup            = objType === "group";
  const isRoundedRectPath  = first !== null && isRoundedRectObject(first);
  const hasMulti     = selectedObjects.length > 1;
  const isActiveSelec = objType === "activeselection";

  // ── Local property state ─────────────────────────────────────────────────
  const [textProps, setTextProps] = useState<TextProps>({
    fontFamily:  "Arial",
    fontSize:    24,
    fill:        "#1e293b",
    fontWeight:  "normal",
    fontStyle:   "normal",
    underline:   false,
    linethrough: false,
    textAlign:   "left",
    charSpacing: 0,
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
        fontFamily:  str(first, "fontFamily",  "Arial"),
        fontSize:    num(first, "fontSize",    24),
        fill:        toHex(t.fill),
        fontWeight:  str(first, "fontWeight",  "normal"),
        fontStyle:   str(first, "fontStyle",   "normal"),
        underline:   !!(first as unknown as Record<string, unknown>).underline,
        linethrough: !!(first as unknown as Record<string, unknown>).linethrough,
        textAlign:   str(first, "textAlign",   "left"),
        charSpacing: num(first, "charSpacing", 0),
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
    const textOnPathMeta = first ? editMeta(first) : null;
    const isTextOnPath = textOnPathMeta !== null;

    // Explode a __text_on_path__ group: remove group, re-add each child glyph
    // individually so they can be further edited, then take a single snapshot.
    function explodeTextOnPath() {
      if (!canvas || !first) return;
      const store = useEditorStore.getState();
      store.pauseHistory();
      const group = first as fabric.Group;
      const children = group.removeAll() as fabric.FabricObject[];
      canvas.remove(group);
      children.forEach((child) => {
        // Re-enable interaction when exploded
        child.set({ selectable: true, evented: true });
        canvas.add(child);
      });
      const selection = new fabric.ActiveSelection(children, { canvas });
      canvas.setActiveObject(selection);
      canvas.requestRenderAll();
      store.resumeHistory();
      takeSnapshot();
    }

    return (
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-slate-400 select-none">
          {isTextOnPath ? "Text pe cerc" : "Grup"}
        </span>

        {/* Text-on-path: edit + explode actions */}
        {isTextOnPath && first && (
          <>
            <Separator orientation="vertical" className="h-4 bg-slate-600" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <TextOnPathPopover target={first} isEditMode={true}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600 gap-1"
                    >
                      <Type size={12} />
                      Editează text
                    </Button>
                  </TextOnPathPopover>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Editează textul pe cerc</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600 gap-1"
                  onClick={explodeTextOnPath}
                >
                  <Ungroup size={12} />
                  Explodează
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Separă literele în obiecte individuale</TooltipContent>
            </Tooltip>
          </>
        )}

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
          onUngroup={isTextOnPath ? undefined : ungroupSelected}
          showUngroup={!isTextOnPath}
        />
      </div>
    );
  }

  // ── Text properties ──────────────────────────────────────────────────────
  if (isText) {
    const isBold      = textProps.fontWeight === "bold";
    const isItalic    = textProps.fontStyle  === "italic";
    const isUnderline = textProps.underline;
    const isStrike    = textProps.linethrough;

    const toggleBold = () => {
      const next = isBold ? "normal" : "bold";
      setTextProps((p) => ({ ...p, fontWeight: next }));
      updateActiveObject("fontWeight", next);
    };
    const toggleItalic = () => {
      const next = isItalic ? "normal" : "italic";
      setTextProps((p) => ({ ...p, fontStyle: next }));
      updateActiveObject("fontStyle", next);
    };
    const toggleUnderline = () => {
      setTextProps((p) => ({ ...p, underline: !p.underline }));
      updateActiveObject("underline", !isUnderline);
    };
    const toggleStrike = () => {
      setTextProps((p) => ({ ...p, linethrough: !p.linethrough }));
      updateActiveObject("linethrough", !isStrike);
    };
    const setAlign = (align: string) => {
      setTextProps((p) => ({ ...p, textAlign: align }));
      updateActiveObject("textAlign", align);
    };

    const toggleCls = (active: boolean) =>
      `h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-600 ${
        active ? "bg-indigo-600/80 text-white hover:bg-indigo-500" : ""
      }`;

    return (
      <div className="flex items-center gap-1">
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
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200 max-h-64">
                {FONTS.map((f) => (
                  <SelectItem
                    key={f}
                    value={f}
                    className="text-xs focus:bg-slate-700 focus:text-white"
                    style={{ fontFamily: f }}
                  >
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TooltipTrigger>
          <TooltipContent side="bottom">Font</TooltipContent>
        </Tooltip>

        {/* Font size with increment / decrement */}
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-6 text-slate-400 hover:text-white hover:bg-slate-600 rounded-r-none"
                onClick={() => {
                  const next = Math.max(1, textProps.fontSize - 1);
                  setTextProps((p) => ({ ...p, fontSize: next }));
                  updateActiveObject("fontSize", next);
                }}
              >
                <AArrowDown size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Micșorează</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Input
                type="number"
                min={1}
                max={800}
                value={textProps.fontSize}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTextProps((p) => ({ ...p, fontSize: v }));
                  updateActiveObject("fontSize", v);
                }}
                className={`${inputCls} w-14 rounded-none border-x-0 text-center`}
              />
            </TooltipTrigger>
            <TooltipContent side="bottom">Mărime font</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-6 text-slate-400 hover:text-white hover:bg-slate-600 rounded-l-none"
                onClick={() => {
                  const next = Math.min(800, textProps.fontSize + 1);
                  setTextProps((p) => ({ ...p, fontSize: next }));
                  updateActiveObject("fontSize", next);
                }}
              >
                <AArrowUp size={12} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Mărește</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-4 bg-slate-600" />

        {/* Bold / Italic / Underline / Strikethrough */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={toggleCls(isBold)} onClick={toggleBold}>
                <Bold size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Bold (Ctrl+B)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={toggleCls(isItalic)} onClick={toggleItalic}>
                <Italic size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Italic (Ctrl+I)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={toggleCls(isUnderline)} onClick={toggleUnderline}>
                <Underline size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Subliniat (Ctrl+U)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={toggleCls(isStrike)} onClick={toggleStrike}>
                <Strikethrough size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Tăiat</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-4 bg-slate-600" />

        {/* Text alignment */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={toggleCls(textProps.textAlign === "left")} onClick={() => setAlign("left")}>
                <AlignLeft size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Stânga</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={toggleCls(textProps.textAlign === "center")} onClick={() => setAlign("center")}>
                <AlignCenter size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Centru</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className={toggleCls(textProps.textAlign === "right")} onClick={() => setAlign("right")}>
                <AlignRight size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Dreapta</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-4 bg-slate-600" />

        {/* Letter spacing */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-0.5">
              <span className="text-[9px] text-slate-500 select-none tracking-widest">VA</span>
              <Input
                type="number"
                min={-200}
                max={1000}
                step={10}
                value={textProps.charSpacing}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setTextProps((p) => ({ ...p, charSpacing: v }));
                  updateActiveObject("charSpacing", v);
                }}
                className={`${inputCls} w-14`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">Spațiere caractere</TooltipContent>
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
    const isEllipseOrCircle = objType === "ellipse" || objType === "circle";

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

        {/* Text on path — ellipse / circle only */}
        {isEllipseOrCircle && first && (
          <>
            <Separator orientation="vertical" className="h-4 bg-slate-600" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <TextOnPathPopover target={first} isEditMode={false}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-600 gap-1"
                    >
                      <Type size={12} />
                      Text pe cerc
                    </Button>
                  </TextOnPathPopover>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Adaugă text pe cerc / elipsă</TooltipContent>
            </Tooltip>
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
