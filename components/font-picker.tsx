"use client";

import { Check, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const FONTS = [
  { name: "Default", value: "inherit", class: "" },
  { name: "Inter", value: "Inter", class: "font-sans" }, // Assuming root font is Geist/Interish
  {
    name: "Roboto",
    value: "Roboto",
    class: "font-[family-name:var(--font-roboto)]",
  },
  {
    name: "Playfair Display",
    value: "Playfair Display",
    class: "font-[family-name:var(--font-playfair)]",
  },
  {
    name: "Montserrat",
    value: "Montserrat",
    class: "font-[family-name:var(--font-montserrat)]",
  },
  { name: "Lato", value: "Lato", class: "font-[family-name:var(--font-lato)]" },
  {
    name: "Open Sans",
    value: "Open Sans",
    class: "font-[family-name:var(--font-open-sans)]",
  },
];

interface FontPickerProps {
  currentFont: string;
  onFontChange: (fontClass: string) => void;
}

export function FontPicker({ currentFont, onFontChange }: FontPickerProps) {
  const selectedFont = FONTS.find((f) => f.class === currentFont) || FONTS[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal px-3"
          onClick={(e) => e.stopPropagation()} // Prevent triggering parent click
        >
          <Type className="mr-2 h-4 w-4" />
          <span>{selectedFont.name}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1 bg-white">
        <div className="grid gap-1">
          {FONTS.map((font) => (
            <Button
              key={font.name}
              variant="ghost"
              className={cn(
                "justify-start text-left font-normal",
                font.class,
                currentFont === font.class &&
                  "bg-accent text-accent-foreground",
              )}
              onClick={(e) => {
                e.stopPropagation();
                onFontChange(font.class);
              }}
            >
              <span className="flex-1 truncate">{font.name}</span>
              {currentFont === font.class && (
                <Check className="ml-auto h-4 w-4" />
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
