import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a numeric price for display: `139.99` → `"139,99 RON"` */
export function formatPrice(price: number): string {
  return `${price.toFixed(2).replace(".", ",")} RON`;
}
