import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** True when hex color is light enough that dark text reads better. */
export function isLightColor(hex: string): boolean {
  const raw = hex.replace("#", "").trim()
  if (raw.length !== 3 && raw.length !== 6) return false
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return false
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

export const SLIDE_W = 960
export const SLIDE_H = 540
