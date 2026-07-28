"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, Paintbrush } from "lucide-react";

const COLORS = [
  "#000000",
  "#ffffff",
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#84cc16",
  "#0f172a",
  "#d4a853",
  "#38bdf8",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  /** Full-width field (default) or toolbar swatch button. */
  compact?: boolean;
  /** Accessible label for compact trigger. */
  label?: string;
  className?: string;
}

function normalizeHex(value: string): string {
  if (value === "none" || !value) return "#000000";
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return "#000000";
}

export function ColorPicker({
  value,
  onChange,
  compact = false,
  label = "Color",
  className,
}: ColorPickerProps) {
  const display = value === "none" ? "#000000" : value || "#000000";
  const hex = normalizeHex(display);

  return (
    <Popover>
      <PopoverTrigger asChild>
        {compact ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            title={label}
            className={cn("h-7 gap-1.5 px-2", className)}
          >
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-full border border-zinc-500/50"
              style={{
                backgroundColor: value === "none" ? "transparent" : hex,
                backgroundImage:
                  value === "none"
                    ? "linear-gradient(45deg, #666 25%, transparent 25%), linear-gradient(-45deg, #666 25%, transparent 25%)"
                    : undefined,
                backgroundSize: value === "none" ? "6px 6px" : undefined,
              }}
            />
            <span className="text-[10px] text-zinc-400">{label}</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              className,
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full border border-zinc-500/40"
                style={{ backgroundColor: hex }}
              />
              <span className="flex-1 truncate font-mono text-xs uppercase">
                {value === "none" ? "none" : hex}
              </span>
              <Paintbrush className="ml-auto h-4 w-4 opacity-50" />
            </div>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Presets</Label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "h-7 w-7 rounded-full border border-zinc-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950",
                    hex.toLowerCase() === color.toLowerCase()
                      ? "scale-110 ring-2 ring-zinc-100 ring-offset-1 ring-offset-zinc-950"
                      : "hover:scale-105",
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => onChange(color)}
                >
                  <span className="sr-only">Pick {color}</span>
                  {hex.toLowerCase() === color.toLowerCase() && (
                    <Check
                      className={cn(
                        "mx-auto h-3 w-3 drop-shadow-md",
                        color === "#ffffff" || color === "#84cc16"
                          ? "text-zinc-900"
                          : "text-white",
                      )}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Custom</Label>
            <div className="flex gap-2">
              <Input
                value={hex}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || v.startsWith("#")) onChange(v || "#");
                }}
                className="h-8 flex-1 font-mono text-xs uppercase"
                placeholder="#000000"
                maxLength={7}
              />
              <div className="relative h-8 w-8 overflow-hidden rounded-md border border-zinc-600 shadow-sm">
                <input
                  type="color"
                  value={hex.length === 7 ? hex : "#000000"}
                  onChange={(e) => onChange(e.target.value)}
                  className="absolute -left-4 -top-4 h-16 w-16 cursor-pointer border-0"
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
