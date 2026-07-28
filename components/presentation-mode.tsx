"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Minimize,
  Maximize,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SlideCanvas, type Presentation } from "@/components/slide-canvas";
import { ScaledStage } from "@/components/scaled-stage";
import { motion, AnimatePresence, type Transition } from "framer-motion";

interface PresentationModeProps {
  data: Presentation;
  accentColor: string;
  font: string;
  onClose: () => void;
  darkSlides?: boolean;
}

type ViewMode = "standard" | "wide" | "full";
type TransitionMode = "none" | "fade" | "slide" | "scale";

const VIEW_WIDTH: Record<ViewMode, string> = {
  // Distinct widths so scale actually changes on a typical display
  standard: "w-[min(100%,42rem)]", // ~672px
  wide: "w-[min(100%,64rem)]", // ~1024px
  full: "w-[min(100%,calc(100vw-2rem))]", // nearly full viewport
};

const MOTION: Record<
  TransitionMode,
  {
    initial: Record<string, number>;
    animate: Record<string, number>;
    exit: (dir: number) => Record<string, number>;
    enter: (dir: number) => Record<string, number>;
    transition: Transition;
  }
> = {
  none: {
    initial: { opacity: 1, x: 0, scale: 1 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: () => ({ opacity: 1, x: 0, scale: 1 }),
    enter: () => ({ opacity: 1, x: 0, scale: 1 }),
    transition: { duration: 0 },
  },
  fade: {
    initial: { opacity: 0, x: 0, scale: 1 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: () => ({ opacity: 0, x: 0, scale: 1 }),
    enter: () => ({ opacity: 0, x: 0, scale: 1 }),
    transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
  },
  slide: {
    initial: { opacity: 0, x: 0, scale: 1 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -160 : 160, scale: 1 }),
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 160 : -160, scale: 1 }),
    transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
  },
  scale: {
    initial: { opacity: 0, x: 0, scale: 0.86 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: () => ({ opacity: 0, x: 0, scale: 1.08 }),
    enter: () => ({ opacity: 0, x: 0, scale: 0.86 }),
    transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] },
  },
};

export function PresentationMode({
  data,
  accentColor,
  font,
  onClose,
  darkSlides = false,
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("wide");
  const [transitionMode, setTransitionMode] =
    useState<TransitionMode>("fade");
  const dirRef = useRef(1);
  const [dir, setDir] = useState(1);
  const totalSlides = 1 + data.slides.length;
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const moveTo = useCallback(
    (next: number) => {
      setCurrentSlide((prev) => {
        const clamped = Math.min(Math.max(next, 0), totalSlides - 1);
        if (clamped === prev) return prev;
        const nextDir = clamped > prev ? 1 : -1;
        dirRef.current = nextDir;
        setDir(nextDir);
        return clamped;
      });
    },
    [totalSlides],
  );

  const step = useCallback(
    (delta: number) => {
      setCurrentSlide((prev) => {
        const clamped = Math.min(Math.max(prev + delta, 0), totalSlides - 1);
        if (clamped === prev) return prev;
        dirRef.current = delta >= 0 ? 1 : -1;
        setDir(delta >= 0 ? 1 : -1);
        return clamped;
      });
    },
    [totalSlides],
  );

  // Fullscreen: once on mount, exit once on unmount. Never re-toggle on slide change.
  useEffect(() => {
    const root = document.documentElement;
    let active = true;

    const enter = async () => {
      try {
        if (!document.fullscreenElement && root.requestFullscreen) {
          await root.requestFullscreen();
        }
      } catch {
        // User blocked or unsupported — still show overlay
      }
    };

    void enter();

    const onFullscreenChange = () => {
      // User pressed Esc / browser exit while we are still open → close presenter
      if (active && !document.fullscreenElement && !closingRef.current) {
        onCloseRef.current();
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      active = false;
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Keyboard — functional updates, stable deps (no slide-change remount)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        moveTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        moveTo(totalSlides - 1);
      } else if (e.key === "Escape") {
        // Let browser exit fullscreen; fullscreenchange closes us.
        // If not fullscreen, close directly.
        e.preventDefault();
        closingRef.current = true;
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, moveTo, totalSlides]);

  const handleClose = () => {
    closingRef.current = true;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  };

  const isTitle = currentSlide === 0;
  const contentIndex = currentSlide - 1;
  const fx = MOTION[transitionMode];

  return (
    <div
      className={cn("fixed inset-0 z-50 flex flex-col bg-black", font)}
      role="dialog"
      aria-modal="true"
      aria-label="Presentation"
    >
      <div className="absolute right-4 top-4 z-50 flex items-center gap-1 rounded-full bg-black/40 p-1 opacity-50 transition hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/15"
              aria-label="Transition style"
            >
              <Shuffle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(["none", "fade", "slide", "scale"] as const).map((t) => (
              <DropdownMenuItem
                key={t}
                onClick={() => setTransitionMode(t)}
                className={transitionMode === t ? "bg-accent" : ""}
              >
                {t[0].toUpperCase() + t.slice(1)}
                {transitionMode === t ? " ✓" : ""}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/15"
              aria-label="Slide size"
            >
              <Monitor className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setViewMode("standard")}
              className={viewMode === "standard" ? "bg-accent" : ""}
            >
              <Minimize className="mr-2 h-4 w-4" /> Standard
              {viewMode === "standard" ? " ✓" : ""}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setViewMode("wide")}
              className={viewMode === "wide" ? "bg-accent" : ""}
            >
              <Maximize className="mr-2 h-4 w-4" /> Wide
              {viewMode === "wide" ? " ✓" : ""}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setViewMode("full")}
              className={viewMode === "full" ? "bg-accent" : ""}
            >
              <Monitor className="mr-2 h-4 w-4" /> Full width
              {viewMode === "full" ? " ✓" : ""}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/15"
          onClick={handleClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Stage — size modes change container width so ScaledStage actually rescales */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
        <div
          className={cn(
            "relative transition-[width] duration-300 ease-out",
            VIEW_WIDTH[viewMode],
          )}
        >
          {/* Reserve 16:9 box so enter/exit don't collapse layout */}
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <div className="absolute inset-0">
              <AnimatePresence mode="wait" custom={dir} initial={false}>
                <motion.div
                  key={currentSlide}
                  custom={dir}
                  initial={fx.enter(dir)}
                  animate={fx.animate}
                  exit={fx.exit(dir)}
                  transition={fx.transition}
                  className="absolute inset-0"
                >
                  <ScaledStage fitHeight className="h-full">
                    {isTitle ? (
                      <SlideCanvas
                        kind="title"
                        title={data.title}
                        subtitle={data.subtitle}
                        color={accentColor}
                        darkSlides={darkSlides}
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
                      />
                    )}
                  </ScaledStage>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/10 px-3 py-1.5 text-white/80 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => step(-1)}
          disabled={currentSlide === 0}
          className="text-white hover:bg-white/20 disabled:opacity-30"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="min-w-20 text-center text-xs font-medium tabular-nums">
          {currentSlide + 1} / {totalSlides}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => step(1)}
          disabled={currentSlide === totalSlides - 1}
          className="text-white hover:bg-white/20 disabled:opacity-30"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
