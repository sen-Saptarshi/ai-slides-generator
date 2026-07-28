"use client";

import { useState } from "react";
import { ImageIcon, Loader2, Pencil, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requestSlideImage } from "@/lib/slide-image";

interface SlideImageSlotProps {
  imageUrl?: string;
  imagePrompt?: string;
  darkSlides?: boolean;
  /** Preview edit mode only */
  editable?: boolean;
  onUpdate?: (next: { imageUrl: string; imagePrompt: string }) => void;
}

export function SlideImageSlot({
  imageUrl,
  imagePrompt = "",
  darkSlides = false,
  editable = false,
  onUpdate,
}: SlideImageSlotProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(imagePrompt);
  const [seenPrompt, setSeenPrompt] = useState(imagePrompt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync draft with prop when closed and prompt changes externally
  if (!open && imagePrompt !== seenPrompt) {
    setSeenPrompt(imagePrompt);
    setPrompt(imagePrompt);
  }

  const regenerate = async () => {
    const nextPrompt = prompt.trim();
    if (!nextPrompt || !onUpdate) return;
    setBusy(true);
    setError(null);
    try {
      const url = await requestSlideImage(nextPrompt);
      onUpdate({ imageUrl: url, imagePrompt: nextPrompt });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regenerate failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative h-full min-h-[280px] overflow-hidden rounded-lg",
        darkSlides ? "bg-zinc-900" : "bg-zinc-100",
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={imagePrompt || "Slide image"}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center",
            darkSlides ? "text-zinc-500" : "text-zinc-400",
          )}
        >
          {imagePrompt && !open ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin opacity-60" />
              <p className="text-sm font-medium">Generating image…</p>
              <p className="line-clamp-2 max-w-[90%] text-xs opacity-60">
                {imagePrompt}
              </p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 opacity-40" />
              <p className="text-sm">No image</p>
            </>
          )}
        </div>
      )}

      {editable && onUpdate && !open && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPrompt(imagePrompt || "");
            setError(null);
            setOpen(true);
          }}
          className={cn(
            "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full",
            "bg-black/55 text-white shadow-md backdrop-blur-sm",
            "opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100",
            "hover:bg-black/75",
          )}
          title="Edit image prompt"
          aria-label="Edit image prompt"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      {editable && open && (
        <div
          className="absolute inset-0 z-20 flex flex-col gap-2 bg-zinc-950/90 p-3 text-left backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
              Image prompt
            </span>
            <button
              type="button"
              onClick={() => {
                if (busy) return;
                setOpen(false);
                setPrompt(imagePrompt);
                setError(null);
              }}
              className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
              aria-label="Close"
              disabled={busy}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={busy}
            rows={4}
            className={cn(
              "min-h-0 flex-1 resize-none rounded-md border px-2.5 py-2 text-xs leading-relaxed",
              "bg-zinc-900 text-zinc-100 placeholder:text-zinc-500",
              "border-zinc-700 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500",
            )}
            placeholder="Describe the image…"
          />

          {error && (
            <p className="text-[11px] text-red-400 line-clamp-2">{error}</p>
          )}

          <Button
            type="button"
            size="sm"
            disabled={busy || !prompt.trim()}
            onClick={() => void regenerate()}
            className="h-8 w-full gap-1.5 text-xs"
          >
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
