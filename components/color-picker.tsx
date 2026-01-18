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
  "#000000", // Black
  "#2563eb", // Blue
  "#16a34a", // Green
  "#dc2626", // Red
  "#d97706", // Amber
  "#7c3aed", // Violet
  "#db2777", // Pink
  "#84cc16", // Lime
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border border-gray-200"
              style={{ backgroundColor: value }}
            />
            <span className="flex-1 truncate">{value}</span>
            <Paintbrush className="ml-auto h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Presets</Label>
            <div className="grid grid-cols-4 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "h-8 w-8 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all",
                    value === color
                      ? "ring-2 ring-offset-1 ring-black scale-110"
                      : "hover:scale-105",
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => onChange(color)}
                >
                  <span className="sr-only">Pick {color}</span>
                  {value === color && (
                    <Check className="mx-auto h-3 w-3 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Custom</Label>
            <div className="flex gap-2">
              <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-8 flex-1 font-mono text-xs uppercase"
                placeholder="#000000"
                maxLength={7}
              />
              <div className="relative h-8 w-8 overflow-hidden rounded-md border shadow-sm">
                <input
                  type="color"
                  value={value.length === 7 ? value : "#000000"}
                  onChange={(e) => onChange(e.target.value)}
                  className="absolute -top-4 -left-4 h-16 w-16 cursor-pointer border-0"
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
