import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  value: number;
  onValueChange?: (value: number) => void;
}

function Slider({ className, value, onValueChange, ...props }: SliderProps) {
  return (
    <input
      type="range"
      data-slot="slider"
      value={value}
      onChange={(e) => onValueChange?.(Number(e.target.value))}
      className={cn(
        "h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-600",
        "accent-indigo-500",
        "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
        "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
        "[&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer",
        "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
        "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0",
        "[&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:cursor-pointer",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Slider };
