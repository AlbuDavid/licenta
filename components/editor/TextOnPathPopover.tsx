"use client";

import { useState } from "react";
import type { FabricObject } from "fabric";
import { Loader2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTextOnPath,
  type TextOnPathParams,
} from "@/hooks/useTextOnPath";

// ── Font list (subset — same source as PropertiesBar) ─────────────────────────
export const FONTS = [
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
  "Georgia",
  "Times New Roman",
  "Garamond",
  "Palatino",
  "Book Antiqua",
  "Cambria",
  "Courier New",
  "Consolas",
  "Monaco",
  "Impact",
  "Copperplate",
  "Papyrus",
  "Brush Script MT",
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface TextOnPathPopoverProps {
  target: FabricObject;
  isEditMode: boolean;
  onClose?: () => void;
  children: React.ReactNode; // the trigger element
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TextOnPathPopover({
  target,
  isEditMode,
  onClose,
  children,
}: TextOnPathPopoverProps) {
  const { wrapText, updateWrapped, editMeta } = useTextOnPath();

  // Seed from existing meta when in edit mode
  const existingMeta = isEditMode ? editMeta(target) : null;

  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string>(existingMeta?.text ?? "");
  const [fontFamily, setFontFamily] = useState<string>(
    existingMeta?.fontFamily ?? "Arial",
  );
  const [fontSize, setFontSize] = useState<number>(
    existingMeta?.fontSize ?? 24,
  );
  const [fill, setFill] = useState<string>(existingMeta?.fill ?? "#1e293b");
  const [startAngle, setStartAngle] = useState<number>(
    existingMeta?.startAngleDeg ?? 0,
  );
  const [position, setPosition] = useState<"outside" | "inside">(
    existingMeta?.position ?? "outside",
  );
  const [isApplying, setIsApplying] = useState<boolean>(false);

  async function handleApply(): Promise<void> {
    if (!text.trim()) return;
    setIsApplying(true);

    const params: TextOnPathParams = {
      text,
      fontFamily,
      fontSize,
      fill,
      startAngleDeg: startAngle,
      position,
    };

    try {
      if (isEditMode) {
        await updateWrapped(target, params);
      } else {
        await wrapText(target, params);
      }
      setOpen(false);
      onClose?.();
    } catch (error) {
      console.error("[TextOnPathPopover] handleApply failed:", error);
    } finally {
      setIsApplying(false);
    }
  }

  const inputCls =
    "h-7 text-xs bg-slate-700 border-slate-600 text-slate-200 " +
    "placeholder:text-slate-500 focus-visible:ring-0 focus-visible:border-slate-400";

  const toggleBtn = (active: boolean) =>
    `h-7 px-3 text-xs ${
      active
        ? "bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-600"
        : "bg-slate-700 text-slate-300 hover:bg-slate-600 border-slate-600"
    }`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        className="w-72 bg-slate-800 border-slate-700 text-slate-200 p-4 space-y-3"
      >
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Text pe cerc
        </p>

        <Separator className="bg-slate-700" />

        {/* Text content */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase tracking-wide">
            Text
          </label>
          <Textarea
            rows={2}
            placeholder="Textul pe cerc..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="resize-none text-xs bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:border-slate-400"
          />
        </div>

        {/* Font family */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase tracking-wide">
            Font
          </label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger className={`${inputCls} w-full`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-slate-200 max-h-48">
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
        </div>

        {/* Font size + color in one row */}
        <div className="flex items-center gap-2">
          <div className="space-y-1 flex-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wide">
              Mărime
            </label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={1}
                max={800}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(Math.max(1, Number(e.target.value)))}
                className={`${inputCls} w-16`}
              />
              <span className="text-[10px] text-slate-500 select-none">mm</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 uppercase tracking-wide">
              Culoare
            </label>
            <Input
              type="color"
              value={fill}
              onChange={(e) => setFill(e.target.value)}
              className="h-7 w-10 cursor-pointer rounded border-slate-600 bg-slate-700 p-0.5"
            />
          </div>
        </div>

        {/* Start angle */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-slate-400 uppercase tracking-wide">
              Unghi start
            </label>
            <span className="text-[10px] text-slate-300 tabular-nums">
              {startAngle}°
            </span>
          </div>
          <Slider
            min={0}
            max={360}
            step={1}
            value={startAngle}
            onValueChange={setStartAngle}
            className="mt-1"
          />
        </div>

        {/* Position toggles */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase tracking-wide">
            Poziție text
          </label>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className={toggleBtn(position === "outside")}
              onClick={() => setPosition("outside")}
            >
              În afară
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={toggleBtn(position === "inside")}
              onClick={() => setPosition("inside")}
            >
              Înăuntru
            </Button>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Apply button */}
        <Button
          className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
          disabled={isApplying || !text.trim()}
          onClick={() => void handleApply()}
        >
          {isApplying ? (
            <Loader2 size={12} className="animate-spin mr-1.5" />
          ) : (
            <Type size={12} className="mr-1.5" />
          )}
          {isApplying ? "Se procesează..." : "Aplică"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
