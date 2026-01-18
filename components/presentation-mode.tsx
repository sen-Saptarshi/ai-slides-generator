"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { presentationSchema } from "@/lib/schema/ppt-schema";
import { motion, AnimatePresence } from "framer-motion";

type Presentation = z.infer<typeof presentationSchema>;

interface PresentationModeProps {
  data: Presentation;
  color: string;
  font: string;
  onClose: () => void;
  isDarkMode?: boolean;
}

type ViewMode = "standard" | "wide" | "full";
type TransitionMode = "none" | "fade" | "slide" | "scale";

export function PresentationMode({
  data,
  color,
  font,
  onClose,
  isDarkMode = false,
}: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("wide");
  const [transition, setTransition] = useState<TransitionMode>("slide");

  // Total slides = 1 (title) + content slides
  const totalSlides = 1 + data.slides.length;

  const widthClass = {
    standard: "max-w-4xl",
    wide: "max-w-7xl",
    full: "max-w-[95vw]",
  }[viewMode];

  const variants = {
    none: {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { x: "100%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "-100%", opacity: 0 },
    },
    scale: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 1.1, opacity: 0 },
    },
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Request fullscreen on mount
    document.documentElement.requestFullscreen().catch((e) => {
      console.log("Fullscreen request denied or failed", e);
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    };
  }, [totalSlides, onClose]);

  const slideContent = () => {
    if (currentSlide === 0) {
      // Title Slide
      return (
        <Card
          className={cn(
            "aspect-video w-full flex flex-col justify-center items-center text-center p-12 shadow-2xl border-t-8 transition-all duration-300",
            widthClass,
            isDarkMode ? "bg-black text-white" : "bg-white",
          )}
          style={{ borderTopColor: color }}
        >
          <h1 className="text-6xl font-bold mb-8" style={{ color }}>
            {data.title}
          </h1>
          {data.subtitle && (
            <div
              className={cn(
                "text-3xl font-light tracking-wide",
                isDarkMode ? "text-gray-300" : "text-gray-500",
              )}
            >
              {data.subtitle}
            </div>
          )}
          <div
            className="mt-16 h-2 w-32 rounded-full"
            style={{ backgroundColor: color }}
          />
        </Card>
      );
    } else {
      // Content Slides (index is currentSlide - 1)
      const slide = data.slides[currentSlide - 1];
      return (
        <Card
          className={cn(
            "aspect-video w-full flex flex-col overflow-hidden shadow-2xl border-t-8 transition-all duration-300",
            widthClass,
            isDarkMode ? "bg-black text-white" : "bg-white",
          )}
          style={{ borderTopColor: color }}
        >
          <CardHeader
            className={cn(
              "pb-6 pt-10 px-16",
              isDarkMode ? "bg-black" : "bg-white",
            )}
          >
            <CardTitle className="text-4xl font-bold" style={{ color }}>
              {slide.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 px-16 pb-12 flex items-center">
            {slide.layout === "two_column" ? (
              <div className="grid grid-cols-2 gap-16 w-full">
                <ul className="list-disc pl-5 space-y-6">
                  {slide.content
                    .slice(0, Math.ceil(slide.content.length / 2))
                    .map((point: string, i: number) => (
                      <li
                        key={i}
                        className={cn(
                          "text-2xl leading-relaxed",
                          isDarkMode ? "text-gray-300" : "text-gray-700",
                        )}
                      >
                        {point}
                      </li>
                    ))}
                </ul>
                <ul className="list-disc pl-5 space-y-6">
                  {slide.content
                    .slice(Math.ceil(slide.content.length / 2))
                    .map((point: string, i: number) => (
                      <li
                        key={i}
                        className={cn(
                          "text-2xl leading-relaxed",
                          isDarkMode ? "text-gray-300" : "text-gray-700",
                        )}
                      >
                        {point}
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <ul className="list-disc pl-5 space-y-6 w-full">
                {slide.content.map((point: string, i: number) => (
                  <li
                    key={i}
                    className={cn(
                      "text-3xl leading-relaxed",
                      isDarkMode ? "text-gray-300" : "text-gray-700",
                    )}
                  >
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          <div
            className={cn(
              "h-6 w-full flex items-center justify-between px-8 text-sm",
              isDarkMode
                ? "bg-gray-900/50 text-gray-500"
                : "bg-gray-50 text-gray-400",
            )}
          >
            <span>
              {currentSlide} / {data.slides.length}
            </span>
            <span>{data.title}</span>
          </div>
        </Card>
      );
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-8",
        font,
      )}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Shuffle className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTransition("none")}>
              None
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTransition("fade")}>
              Fade
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTransition("slide")}>
              Slide
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTransition("scale")}>
              Scale
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Monitor className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setViewMode("standard")}>
              <Minimize className="mr-2 h-4 w-4" /> Standard (4xl)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewMode("wide")}>
              <Maximize className="mr-2 h-4 w-4" /> Wide (7xl)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setViewMode("full")}>
              <Monitor className="mr-2 h-4 w-4" /> Full Width
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            variants={variants[transition]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="w-full h-full flex items-center justify-center"
          >
            {slideContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 flex items-center gap-4 text-white/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
          disabled={currentSlide === 0}
          className="hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
        <span className="text-sm font-medium">
          Slide {currentSlide + 1} of {totalSlides}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))
          }
          disabled={currentSlide === totalSlides - 1}
          className="hover:bg-white/20 disabled:opacity-30"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
