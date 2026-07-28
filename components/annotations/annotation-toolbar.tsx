"use client";

import {
  ArrowRight,
  Circle,
  Heart,
  Minus,
  Smile,
  Square,
  Star,
  Trash2,
  Triangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/color-picker";
import type { Annotation, AnnotationKind } from "@/lib/schema/ppt-schema";
import { EMOJI_PALETTE } from "@/lib/annotations";
import { cn } from "@/lib/utils";

const SHAPE_BTNS: {
  kind: AnnotationKind;
  label: string;
  icon: React.ReactNode;
}[] = [
  { kind: "rect", label: "Rectangle", icon: <Square className="h-3.5 w-3.5" /> },
  {
    kind: "roundRect",
    label: "Rounded rect",
    icon: <Square className="h-3.5 w-3.5 rounded-[3px]" />,
  },
  { kind: "oval", label: "Oval", icon: <Circle className="h-3.5 w-3.5" /> },
  {
    kind: "triangle",
    label: "Triangle",
    icon: <Triangle className="h-3.5 w-3.5" />,
  },
  { kind: "star", label: "Star", icon: <Star className="h-3.5 w-3.5" /> },
  { kind: "heart", label: "Heart", icon: <Heart className="h-3.5 w-3.5" /> },
  { kind: "line", label: "Line", icon: <Minus className="h-3.5 w-3.5" /> },
  {
    kind: "arrow",
    label: "Arrow",
    icon: <ArrowRight className="h-3.5 w-3.5" />,
  },
];

interface AnnotationToolbarProps {
  selected: Annotation | null;
  onAddShape: (kind: AnnotationKind) => void;
  onAddEmoji: (emoji: string) => void;
  onPatchSelected: (patch: Partial<Annotation>) => void;
  onDeleteSelected: () => void;
}

export function AnnotationToolbar({
  selected,
  onAddShape,
  onAddEmoji,
  onPatchSelected,
  onDeleteSelected,
}: AnnotationToolbarProps) {
  const isLine =
    selected?.kind === "line" || selected?.kind === "arrow";
  const isEmoji = selected?.kind === "emoji";
  const noFill = !selected?.fill || selected.fill === "none";

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-2 py-1.5">
      <span className="mr-1 hidden text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:inline">
        Annotate
      </span>

      {SHAPE_BTNS.map((s) => (
        <Button
          key={s.kind}
          type="button"
          variant="ghost"
          size="icon-sm"
          title={s.label}
          className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
          onClick={() => onAddShape(s.kind)}
        >
          {s.icon}
        </Button>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Emoji"
            className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <Smile className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-2">
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_PALETTE.map((em) => (
              <button
                key={em}
                type="button"
                className="rounded p-1 text-lg hover:bg-accent"
                onClick={() => onAddEmoji(em)}
              >
                {em}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <div className="mx-1 h-5 w-px bg-zinc-700" />

      {selected ? (
        <>
          {!isEmoji && (
            <>
              <ColorPicker
                compact
                label="Stroke"
                value={
                  selected.stroke && selected.stroke !== "none"
                    ? selected.stroke
                    : "#1d4ed8"
                }
                onChange={(c) => onPatchSelected({ stroke: c })}
              />

              {!isLine && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      onPatchSelected({
                        fill: noFill
                          ? selected.stroke !== "none"
                            ? selected.stroke
                            : "#3b82f6"
                          : "none",
                      })
                    }
                    className={cn(
                      "rounded px-2 py-1 text-[10px] font-medium",
                      noFill
                        ? "bg-zinc-800 text-zinc-300"
                        : "bg-sky-600/30 text-sky-200",
                    )}
                  >
                    {noFill ? "No fill" : "Filled"}
                  </button>
                  {!noFill && (
                    <ColorPicker
                      compact
                      label="Fill"
                      value={selected.fill}
                      onChange={(c) => onPatchSelected({ fill: c })}
                    />
                  )}
                </>
              )}

              <label className="flex items-center gap-1 text-[10px] text-zinc-400">
                W
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={selected.strokeWidth}
                  onChange={(e) =>
                    onPatchSelected({
                      strokeWidth: Number(e.target.value) || 1,
                    })
                  }
                  className="h-6 w-12 px-1 text-xs"
                />
              </label>
            </>
          )}

          {isEmoji && (
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-7">
                  Change emoji
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_PALETTE.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className="rounded p-1 text-lg hover:bg-accent"
                      onClick={() => onPatchSelected({ emoji: em })}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Delete (Del)"
            className="text-red-400 hover:bg-red-950 hover:text-red-300"
            onClick={onDeleteSelected}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <span className="text-[10px] text-zinc-600">
          Add a shape · click to select · drag / resize / rotate
        </span>
      )}
    </div>
  );
}
