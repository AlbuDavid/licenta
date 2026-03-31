"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const CHECKERBOARD =
  "linear-gradient(45deg,#6b7280 25%,transparent 25%)," +
  "linear-gradient(-45deg,#6b7280 25%,transparent 25%)," +
  "linear-gradient(45deg,transparent 75%,#6b7280 75%)," +
  "linear-gradient(-45deg,transparent 75%,#6b7280 75%)";

interface ColorSwatchProps {
  value: string;
  onChange: (val: string) => void;
  allowTransparent?: boolean;
}

/**
 * A colored swatch button that opens a Popover with a color picker and a
 * "Transparent" option. The swatch displays a checkerboard pattern when the
 * value is "transparent".
 */
export function ColorSwatch({
  value,
  onChange,
  allowTransparent = true,
}: ColorSwatchProps) {
  const isTransparent = value === "transparent";
  const colorInputVal = isTransparent ? "#ffffff" : value;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-8 h-7 rounded border border-slate-600 overflow-hidden
                     hover:border-slate-400 transition-colors
                     focus:outline-none focus:ring-1 focus:ring-indigo-500 shrink-0"
          title={isTransparent ? "Transparent" : value}
        >
          {isTransparent ? (
            <div
              className="w-full h-full"
              style={{
                backgroundImage: CHECKERBOARD,
                backgroundSize: "6px 6px",
                backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0",
              }}
            />
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: value }} />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-3 bg-slate-800 border-slate-700 shadow-xl rounded-lg"
        side="bottom"
        align="start"
        sideOffset={6}
      >
        <div className="flex flex-col gap-2.5">
          <input
            type="color"
            value={colorInputVal}
            onChange={(e) => onChange(e.target.value)}
            className="w-36 h-10 rounded cursor-pointer border-0 bg-transparent p-0 block"
            style={{ colorScheme: "dark" }}
          />

          {allowTransparent && (
            <button
              onClick={() => onChange("transparent")}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs
                         border transition-colors w-full text-left
                         ${isTransparent
                           ? "border-indigo-500 text-indigo-300 bg-indigo-500/10"
                           : "border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200 hover:bg-slate-700"
                         }`}
            >
              <span
                className="w-4 h-4 rounded-sm border border-slate-500 shrink-0 inline-block"
                style={{
                  backgroundImage: CHECKERBOARD,
                  backgroundSize: "4px 4px",
                  backgroundPosition: "0 0, 0 2px, 2px -2px, -2px 0",
                }}
              />
              Transparent
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
