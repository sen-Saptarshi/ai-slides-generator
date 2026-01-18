"use client";

import { Button } from "@/components/ui/button";
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
      <PopoverContent className="w-64">
        <div className="grid grid-cols-4 gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              className={cn(
                "h-8 w-8 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
                value === color && "ring-2 ring-offset-2 ring-black",
              )}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            >
              <span className="sr-only">Pick {color}</span>
              {value === color && (
                <Check className="mx-auto h-4 w-4 text-white drop-shadow-md" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
