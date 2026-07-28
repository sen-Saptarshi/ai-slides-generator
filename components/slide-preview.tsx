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
import { AnnotationToolbar } from "@/components/annotations/annotation-toolbar";
import {
  createAnnotation,
  ensureAnnotations,
  removeAnnotation,
  updateAnnotation,
} from "@/lib/annotations";
import type { Annotation, AnnotationKind } from "@/lib/schema/ppt-schema";
import { cn, SLIDE_H, SLIDE_W } from "@/lib/utils";

interface SlidePreviewProps {
  data?: Presentation;
  isLoading: boolean;
  accentColor: string;
  onUpdate?: (newData: Presentation) => void;
  font?: string;
  darkSlides?: boolean;
}

export function SlidePreview({
  data,
  isLoading,
  accentColor,
  onUpdate,
  font = "",
  darkSlides = false,
}: SlidePreviewProps) {
  // 0 = title, 1..n = content slides
  const [active, setActive] = useState(0);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);
  const total = data ? 1 + data.slides.length : 0;
  const deckKey = data ? `${data.title}::${data.slides.length}` : "";
  const [seenKey, setSeenKey] = useState(deckKey);

  // Reset filmstrip when a new deck loads (adjust state during render).
  if (deckKey !== seenKey) {
    setSeenKey(deckKey);
    setActive(0);
    setSelectedAnnotationId(null);
  }

  const safeActive =
    total > 0 ? Math.min(Math.max(active, 0), total - 1) : 0;
  const isTitleSlide = safeActive === 0;
  const contentIndex = safeActive - 1;

  const go = useCallback(
    (delta: number) => {
      setSelectedAnnotationId(null);
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
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;
      // Don't change slides while transforming an annotation
      if (selectedAnnotationId) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        setSelectedAnnotationId(null);
        setActive(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setSelectedAnnotationId(null);
        setActive(total - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, go, total, selectedAnnotationId]);

  const getAnnotationsForActive = useCallback((): Annotation[] => {
    if (!data) return [];
    if (isTitleSlide) return ensureAnnotations(data.annotations);
    return ensureAnnotations(data.slides[contentIndex]?.annotations);
  }, [data, isTitleSlide, contentIndex]);

  const setAnnotationsForActive = useCallback(
    (annotations: Annotation[]) => {
      if (!data || !onUpdate) return;
      if (isTitleSlide) {
        onUpdate({ ...data, annotations });
        return;
      }
      const slides = [...data.slides];
      slides[contentIndex] = { ...slides[contentIndex], annotations };
      onUpdate({ ...data, slides });
    },
    [data, onUpdate, isTitleSlide, contentIndex],
  );

  const titleHandlers: SlideEditHandlers = useMemo(
    () => ({
      onTitle: (title) => data && onUpdate?.({ ...data, title }),
      onSubtitle: (subtitle) => data && onUpdate?.({ ...data, subtitle }),
      onAnnotationsChange: (annotations) => {
        if (!data || !onUpdate) return;
        onUpdate({ ...data, annotations });
      },
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
      onAnnotationsChange: (annotations) => {
        if (!data || !onUpdate) return;
        const slides = [...data.slides];
        slides[slideIndex] = { ...slides[slideIndex], annotations };
        onUpdate({ ...data, slides });
      },
    }),
    [data, onUpdate],
  );

  const addShape = (kind: AnnotationKind) => {
    const next = createAnnotation(kind);
    const list = [...getAnnotationsForActive(), next];
    setAnnotationsForActive(list);
    setSelectedAnnotationId(next.id);
  };

  const addEmoji = (emoji: string) => {
    const next = createAnnotation("emoji", { emoji });
    const list = [...getAnnotationsForActive(), next];
    setAnnotationsForActive(list);
    setSelectedAnnotationId(next.id);
  };

  const selectedAnnotation =
    getAnnotationsForActive().find((a) => a.id === selectedAnnotationId) ??
    null;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[420px] flex-col gap-4">
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40">
          <div className="w-full max-w-3xl space-y-4 px-6">
            <Skeleton className="mx-auto aspect-video w-full rounded-xl bg-zinc-800" />
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-24 rounded-md bg-zinc-800" />
              ))}
            </div>
            <p className="animate-pulse text-center text-sm text-zinc-500">
              Crafting slides...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 px-6 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 shadow-lg">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mb-2 text-xl font-semibold tracking-tight text-zinc-100">
          Your deck preview
        </h2>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
          Generate a deck from the home page, then edit text in-place, step
          through slides, and present fullscreen.
        </p>
      </div>
    );
  }

  const activeAnnotations = getAnnotationsForActive();

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-4", font)}>
      {/* Stage header */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{data.title}</p>
            <p className="text-xs text-muted-foreground">
              {isTitleSlide
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

      <AnnotationToolbar
        selected={selectedAnnotation}
        onAddShape={addShape}
        onAddEmoji={addEmoji}
        onPatchSelected={(patch) => {
          if (!selectedAnnotationId) return;
          setAnnotationsForActive(
            updateAnnotation(activeAnnotations, selectedAnnotationId, patch),
          );
        }}
        onDeleteSelected={() => {
          if (!selectedAnnotationId) return;
          setAnnotationsForActive(
            removeAnnotation(activeAnnotations, selectedAnnotationId),
          );
          setSelectedAnnotationId(null);
        }}
      />

      {/* Main stage — app chrome always dark; slides paint their own theme */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-[radial-gradient(ellipse_at_center,_#27272a_0%,_#09090b_70%)] p-4 sm:p-6">
        <div className="w-full max-w-5xl">
          <ScaledStage maxScale={1}>
            {isTitleSlide ? (
              <SlideCanvas
                kind="title"
                title={data.title}
                subtitle={data.subtitle}
                color={accentColor}
                darkSlides={darkSlides}
                editable
                handlers={titleHandlers}
                annotations={ensureAnnotations(data.annotations)}
                selectedAnnotationId={selectedAnnotationId}
                onSelectAnnotation={setSelectedAnnotationId}
              />
            ) : (
              <SlideCanvas
                kind="content"
                slide={data.slides[contentIndex]}
                index={contentIndex}
                total={data.slides.length}
                deckTitle={data.title}
                color={accentColor}
                darkSlides={darkSlides}
                editable
                handlers={contentHandlers(contentIndex)}
                annotations={ensureAnnotations(
                  data.slides[contentIndex]?.annotations,
                )}
                selectedAnnotationId={selectedAnnotationId}
                onSelectAnnotation={setSelectedAnnotationId}
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
            onClick={() => {
              setSelectedAnnotationId(null);
              setActive(0);
            }}
            label="Title"
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
                color={accentColor}
                darkSlides={darkSlides}
                annotations={ensureAnnotations(data.annotations)}
              />
            </div>
          </Thumb>

          {data.slides.map((slide, i) => (
            <Thumb
              key={i}
              active={safeActive === i + 1}
              onClick={() => {
                setSelectedAnnotationId(null);
                setActive(i + 1);
              }}
              label={`${i + 1}`}
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
                  color={accentColor}
                  darkSlides={darkSlides}
                  annotations={ensureAnnotations(slide.annotations)}
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
          color={accentColor}
          darkSlides={darkSlides}
          annotations={ensureAnnotations(data.annotations)}
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
            color={accentColor}
            darkSlides={darkSlides}
            annotations={ensureAnnotations(slide.annotations)}
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
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-lg border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
        active
          ? "border-zinc-100 shadow-md ring-1 ring-white/20"
          : "border-zinc-700 hover:border-zinc-500",
      )}
      style={{ width: SLIDE_W * 0.14, height: SLIDE_H * 0.14 }}
      aria-label={`Go to ${label}`}
      aria-current={active ? "true" : undefined}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {children}
      </div>
      <span
        className={cn(
          "absolute bottom-1 right-1 rounded px-1 text-[9px] font-medium tabular-nums",
          active ? "bg-zinc-100 text-zinc-900" : "bg-black/50 text-white",
        )}
      >
        {label}
      </span>
    </button>
  );
}
