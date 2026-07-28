"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SlideCanvas,
  type Presentation,
  type SlideEditHandlers,
} from "@/components/slide-canvas";
import { ScaledStage } from "@/components/scaled-stage";
import { cn, SLIDE_H, SLIDE_W } from "@/lib/utils";

interface SlidePreviewProps {
  data?: Presentation;
  isLoading: boolean;
  color: string;
  onUpdate?: (newData: Presentation) => void;
  font?: string;
  isDarkMode?: boolean;
}

export function SlidePreview({
  data,
  isLoading,
  color,
  onUpdate,
  font = "",
  isDarkMode = false,
}: SlidePreviewProps) {
  // 0 = title, 1..n = content slides
  const [active, setActive] = useState(0);
  const total = data ? 1 + data.slides.length : 0;
  const deckKey = data ? `${data.title}::${data.slides.length}` : "";
  const [seenKey, setSeenKey] = useState(deckKey);

  // Reset filmstrip when a new deck loads (adjust state during render).
  if (deckKey !== seenKey) {
    setSeenKey(deckKey);
    setActive(0);
  }

  const safeActive =
    total > 0 ? Math.min(Math.max(active, 0), total - 1) : 0;

  const go = useCallback(
    (delta: number) => {
      setActive((i) =>
        Math.min(Math.max(i + delta, 0), Math.max(total - 1, 0)),
      );
    },
    [total],
  );

  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable)
        return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        setActive(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setActive(total - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, go, total]);

  const titleHandlers: SlideEditHandlers = useMemo(
    () => ({
      onTitle: (title) => data && onUpdate?.({ ...data, title }),
      onSubtitle: (subtitle) => data && onUpdate?.({ ...data, subtitle }),
    }),
    [data, onUpdate],
  );

  const contentHandlers = useCallback(
    (slideIndex: number): SlideEditHandlers => ({
      onSlideTitle: (title) => {
        if (!data || !onUpdate) return;
        const slides = [...data.slides];
        slides[slideIndex] = { ...slides[slideIndex], title };
        onUpdate({ ...data, slides });
      },
      onSlideContent: (contentIndex, value) => {
        if (!data || !onUpdate) return;
        const slides = [...data.slides];
        const content = [...slides[slideIndex].content];
        content[contentIndex] = value;
        slides[slideIndex] = { ...slides[slideIndex], content };
        onUpdate({ ...data, slides });
      },
      onSlideImage: ({ imageUrl, imagePrompt }) => {
        if (!data || !onUpdate) return;
        const slides = [...data.slides];
        slides[slideIndex] = {
          ...slides[slideIndex],
          imageUrl,
          imagePrompt,
        };
        onUpdate({ ...data, slides });
      },
    }),
    [data, onUpdate],
  );

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[420px] flex-col gap-4">
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-300/60 bg-zinc-100/40 dark:border-zinc-700 dark:bg-zinc-900/40">
          <div className="w-full max-w-3xl space-y-4 px-6">
            <Skeleton className="mx-auto aspect-video w-full rounded-xl" />
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-24 rounded-md" />
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground animate-pulse">
              Crafting slides…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300/70 bg-gradient-to-b from-zinc-50 to-zinc-100/80 px-6 text-center dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mb-2 text-xl font-semibold tracking-tight">
          Your deck preview
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
          Describe a topic on the left. Generate, then edit text in-place,
          step through slides, and present fullscreen.
        </p>
      </div>
    );
  }

  const isTitle = safeActive === 0;
  const contentIndex = safeActive - 1;

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-4", font)}>
      {/* Stage header */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{data.title}</p>
            <p className="text-xs text-muted-foreground">
              {isTitle
                ? "Title slide"
                : `Slide ${contentIndex + 1} · ${data.slides[contentIndex]?.layout?.replaceAll("_", " ")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => go(-1)}
            disabled={safeActive === 0}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-16 text-center text-xs tabular-nums text-muted-foreground">
            {safeActive + 1} / {total}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => go(1)}
            disabled={safeActive >= total - 1}
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main stage */}
      <div
        className={cn(
          "relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border p-4 sm:p-6",
          isDarkMode
            ? "border-zinc-800 bg-[radial-gradient(ellipse_at_center,_#27272a_0%,_#09090b_70%)]"
            : "border-zinc-200/80 bg-[radial-gradient(ellipse_at_center,_#f4f4f5_0%,_#e4e4e7_75%)]",
        )}
      >
        <div className="w-full max-w-5xl">
          <ScaledStage maxScale={1}>
            {isTitle ? (
              <SlideCanvas
                kind="title"
                title={data.title}
                subtitle={data.subtitle}
                color={color}
                isDarkMode={isDarkMode}
                editable
                handlers={titleHandlers}
              />
            ) : (
              <SlideCanvas
                kind="content"
                slide={data.slides[contentIndex]}
                index={contentIndex}
                total={data.slides.length}
                deckTitle={data.title}
                color={color}
                isDarkMode={isDarkMode}
                editable
                handlers={contentHandlers(contentIndex)}
              />
            )}
          </ScaledStage>
        </div>
      </div>

      {/* Filmstrip */}
      <div className="shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin]">
          <Thumb
            active={safeActive === 0}
            onClick={() => setActive(0)}
            label="Title"
            isDarkMode={isDarkMode}
          >
            <div
              className="origin-top-left"
              style={{
                width: SLIDE_W,
                height: SLIDE_H,
                transform: "scale(0.14)",
              }}
            >
              <SlideCanvas
                kind="title"
                title={data.title}
                subtitle={data.subtitle}
                color={color}
                isDarkMode={isDarkMode}
              />
            </div>
          </Thumb>

          {data.slides.map((slide, i) => (
            <Thumb
              key={i}
              active={safeActive === i + 1}
              onClick={() => setActive(i + 1)}
              label={`${i + 1}`}
              isDarkMode={isDarkMode}
            >
              <div
                className="origin-top-left"
                style={{
                  width: SLIDE_W,
                  height: SLIDE_H,
                  transform: "scale(0.14)",
                }}
              >
                <SlideCanvas
                  kind="content"
                  slide={slide}
                  index={i}
                  total={data.slides.length}
                  deckTitle={data.title}
                  color={color}
                  isDarkMode={isDarkMode}
                />
              </div>
            </Thumb>
          ))}
        </div>
      </div>

      {/* Offscreen full-size slides for export capture */}
      <div
        className="pointer-events-none fixed left-[-10000px] top-0"
        aria-hidden
      >
        <SlideCanvas
          id="slide-title"
          kind="title"
          title={data.title}
          subtitle={data.subtitle}
          color={color}
          isDarkMode={isDarkMode}
        />
        {data.slides.map((slide, i) => (
          <SlideCanvas
            key={i}
            id={`slide-${i}`}
            kind="content"
            slide={slide}
            index={i}
            total={data.slides.length}
            deckTitle={data.title}
            color={color}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </div>
  );
}

function Thumb({
  children,
  active,
  onClick,
  label,
  isDarkMode,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
  isDarkMode: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-lg border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        active
          ? "border-zinc-900 shadow-md ring-1 ring-zinc-900/10 dark:border-white dark:ring-white/20"
          : isDarkMode
            ? "border-zinc-700 hover:border-zinc-500"
            : "border-zinc-200 hover:border-zinc-400",
      )}
      style={{ width: SLIDE_W * 0.14, height: SLIDE_H * 0.14 }}
      aria-label={`Go to ${label}`}
      aria-current={active ? "true" : undefined}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden bg-white dark:bg-zinc-950">
        {children}
      </div>
      <span
        className={cn(
          "absolute bottom-1 right-1 rounded px-1 text-[9px] font-medium tabular-nums",
          active
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "bg-black/50 text-white",
        )}
      >
        {label}
      </span>
    </button>
  );
}
