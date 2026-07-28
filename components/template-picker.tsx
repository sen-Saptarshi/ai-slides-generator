"use client";

import {
  SLIDE_TEMPLATES,
  type SlideTemplateId,
} from "@/lib/slide-templates";
import { cn } from "@/lib/utils";

interface TemplatePickerProps {
  value: SlideTemplateId;
  onChange: (id: SlideTemplateId) => void;
  /** denser row for toolbar-ish layouts */
  compact?: boolean;
  className?: string;
}

/** Mini visual swatches so users feel the design before applying. */
function TemplateThumb({
  id,
  accent = "#d4a853",
}: {
  id: SlideTemplateId;
  accent?: string;
}) {
  const base = "absolute inset-0 overflow-hidden bg-white";
  switch (id) {
    case "classic":
      return (
        <div className={base}>
          <div
            className="absolute inset-1.5 border"
            style={{ borderColor: accent }}
          />
          <div className="absolute inset-x-3 top-[38%] h-1 rounded bg-zinc-800/80" />
          <div className="absolute inset-x-5 top-[48%] h-0.5 bg-zinc-400/50" />
        </div>
      );
    case "simple":
      return (
        <div className={cn(base, "bg-zinc-50")}>
          <div
            className="absolute left-1/2 top-[42%] h-0.5 w-6 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <div className="absolute inset-x-4 top-[52%] h-0.5 bg-zinc-300" />
          <div className="absolute inset-x-5 top-[60%] h-0.5 bg-zinc-200" />
        </div>
      );
    case "designer":
      return (
        <div className={base}>
          <div
            className="absolute inset-y-0 left-0 w-1"
            style={{ backgroundColor: accent }}
          />
          <div
            className="absolute inset-y-0 right-0 w-[34%]"
            style={{ backgroundColor: accent, opacity: 0.85 }}
          />
          <div className="absolute bottom-2 left-2 h-1 w-8 bg-zinc-900" />
        </div>
      );
    case "minimalist":
      return (
        <div className={cn(base, "bg-zinc-50")}>
          <div
            className="absolute left-2 top-2 h-px w-4"
            style={{ backgroundColor: accent }}
          />
          <div className="absolute inset-x-3 top-[45%] h-px bg-zinc-400" />
          <div className="absolute inset-x-4 top-[55%] h-px bg-zinc-300" />
        </div>
      );
    case "modern":
    default:
      return (
        <div className={base}>
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ backgroundColor: accent }}
          />
          <div
            className="absolute inset-y-0 left-0 w-1"
            style={{ backgroundColor: accent }}
          />
          <div className="absolute left-3 top-[40%] h-1 w-10 rounded bg-zinc-800" />
          <div className="absolute left-3 top-[52%] h-0.5 w-8 bg-zinc-400" />
          <div
            className="absolute bottom-0 right-0 h-4 w-4 opacity-40"
            style={{
              background: `linear-gradient(135deg, transparent 50%, ${accent} 50%)`,
            }}
          />
        </div>
      );
  }
}

export function TemplatePicker({
  value,
  onChange,
  compact = false,
  className,
}: TemplatePickerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {!compact && (
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Slide template
        </p>
      )}
      <div
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-5" : "grid-cols-1 sm:grid-cols-5",
        )}
      >
        {SLIDE_TEMPLATES.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={cn(
                "group flex flex-col overflow-hidden rounded-lg border text-left transition",
                active
                  ? "border-[#d4a853]/70 bg-[#d4a853]/10 ring-1 ring-[#d4a853]/40"
                  : "border-zinc-700/80 bg-zinc-900/40 hover:border-zinc-500 hover:bg-zinc-900",
              )}
            >
              <div
                className={cn(
                  "relative w-full border-b border-zinc-800/80",
                  compact ? "aspect-16/10" : "aspect-video",
                )}
              >
                <TemplateThumb id={t.id} />
              </div>
              <div className={cn("px-2", compact ? "py-1.5" : "py-2")}>
                <p
                  className={cn(
                    "font-medium leading-none",
                    compact ? "text-[10px]" : "text-xs",
                    active ? "text-[#e8c97a]" : "text-zinc-200",
                  )}
                >
                  {t.label}
                </p>
                {!compact && (
                  <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-zinc-500">
                    {t.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
