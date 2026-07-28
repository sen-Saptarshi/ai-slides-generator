"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SLIDE_H, SLIDE_W, cn } from "@/lib/utils";

interface ScaledStageProps {
  children: ReactNode;
  className?: string;
  /**
   * Cap on scale factor. Omit / Infinity = fill parent fully.
   * Preview often uses 1 so slides stay at design size.
   */
  maxScale?: number;
  /** Fit both width and height of parent (min scale). Parent must have height. */
  fitHeight?: boolean;
}

/** Scales fixed 960×540 slide into parent (ResizeObserver). */
export function ScaledStage({
  children,
  className,
  maxScale = Number.POSITIVE_INFINITY,
  fitHeight = false,
}: ScaledStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      let next = w / SLIDE_W;
      if (fitHeight) {
        const h = el.clientHeight;
        if (h > 0) next = Math.min(next, h / SLIDE_H);
      }
      if (Number.isFinite(maxScale)) next = Math.min(next, maxScale);
      setScale(next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxScale, fitHeight]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", fitHeight && "h-full", className)}
      style={fitHeight ? undefined : { height: SLIDE_H * scale }}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
