"use client";

import { useEffect, useRef, useState } from "react";
import type { Annotation } from "@/lib/schema/ppt-schema";
import { updateAnnotation } from "@/lib/annotations";
import { AnnotationShape } from "@/components/annotations/annotation-shape";
import { cn } from "@/lib/utils";

type DragMode =
  | { type: "move"; startX: number; startY: number; orig: Annotation }
  | {
      type: "resize";
      corner: "nw" | "ne" | "sw" | "se";
      startX: number;
      startY: number;
      orig: Annotation;
    }
  | {
      type: "rotate";
      startX: number;
      startY: number;
      orig: Annotation;
      cx: number;
      cy: number;
    };

interface AnnotationLayerProps {
  annotations: Annotation[];
  editable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (next: Annotation[]) => void;
}

export function AnnotationLayer({
  annotations,
  editable = false,
  selectedId = null,
  onSelect,
  onChange,
}: AnnotationLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragMode | null>(null);
  const annotationsRef = useRef(annotations);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    annotationsRef.current = annotations;
    onChangeRef.current = onChange;
  }, [annotations, onChange]);

  useEffect(() => {
    if (!drag || !editable) return;

    const apply = (id: string, patch: Partial<Annotation>) => {
      onChangeRef.current?.(
        updateAnnotation(annotationsRef.current, id, patch),
      );
    };

    const onMove = (e: PointerEvent) => {
      const orig = drag.orig;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      // Pointer delta is in screen px; parent is scaled — convert via layer rect
      const layer = layerRef.current;
      if (!layer) return;
      const rect = layer.getBoundingClientRect();
      const scaleX = rect.width / 960;
      const scaleY = rect.height / 540;
      const ddx = dx / (scaleX || 1);
      const ddy = dy / (scaleY || 1);

      if (drag.type === "move") {
        apply(orig.id, {
          x: orig.x + ddx,
          y: orig.y + ddy,
        });
      } else if (drag.type === "resize") {
        let { x, y, w, h } = orig;
        const c = drag.corner;
        if (c.includes("e")) w = orig.w + ddx;
        if (c.includes("s")) h = orig.h + ddy;
        if (c.includes("w")) {
          w = orig.w - ddx;
          x = orig.x + ddx;
        }
        if (c.includes("n")) {
          h = orig.h - ddy;
          y = orig.y + ddy;
        }
        apply(orig.id, { x, y, w, h });
      } else if (drag.type === "rotate") {
        const ang =
          (Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx) * 180) /
          Math.PI;
        apply(orig.id, { rotation: ang + 90 });
      }
    };

    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [drag, editable]);

  useEffect(() => {
    if (!editable || !selectedId || !onChange) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onChange(annotations.filter((a) => a.id !== selectedId));
        onSelect?.(null);
      }
      if (e.key === "Escape") {
        onSelect?.(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editable, selectedId, annotations, onChange, onSelect]);

  if (!annotations.length && !editable) return null;

  // Layer itself never captures hits — only shapes do.
  // Otherwise text edit + image pen are blocked under the full-slide overlay.
  return (
    <div
      ref={layerRef}
      className="pointer-events-none absolute inset-0 z-20"
    >
      {annotations.map((ann) => {
        const selected = editable && selectedId === ann.id;
        return (
          <div
            key={ann.id}
            className={cn(
              "absolute",
              editable ? "pointer-events-auto cursor-move" : "pointer-events-none",
              selected && "z-30",
            )}
            style={{
              left: ann.x,
              top: ann.y,
              width: ann.w,
              height: ann.h,
              transform: `rotate(${ann.rotation}deg)`,
              transformOrigin: "center center",
            }}
            onPointerDown={(e) => {
              if (!editable) return;
              e.stopPropagation();
              onSelect?.(ann.id);
              setDrag({
                type: "move",
                startX: e.clientX,
                startY: e.clientY,
                orig: { ...ann },
              });
            }}
          >
            <div
              className={cn(
                "h-full w-full",
                selected &&
                  "outline outline-2 outline-sky-400 outline-offset-2",
              )}
            >
              <AnnotationShape ann={ann} />
            </div>

            {selected && (
              <>
                {/* Rotate handle */}
                <button
                  type="button"
                  className="absolute left-1/2 top-1 z-40 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-sky-500 shadow"
                  title="Rotate"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const layer = layerRef.current;
                    if (!layer) return;
                    const rect = layer.getBoundingClientRect();
                    const scaleX = rect.width / 960;
                    const scaleY = rect.height / 540;
                    const cx = rect.left + (ann.x + ann.w / 2) * scaleX;
                    const cy = rect.top + (ann.y + ann.h / 2) * scaleY;
                    setDrag({
                      type: "rotate",
                      startX: e.clientX,
                      startY: e.clientY,
                      orig: { ...ann },
                      cx,
                      cy,
                    });
                  }}
                />

                {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                  <button
                    key={corner}
                    type="button"
                    title="Resize"
                    className={cn(
                      "absolute z-40 h-2.5 w-2.5 rounded-sm border border-white bg-sky-500 shadow",
                      corner === "nw" && "-left-1 -top-1 cursor-nwse-resize",
                      corner === "ne" && "-right-1 -top-1 cursor-nesw-resize",
                      corner === "sw" && "-bottom-1 -left-1 cursor-nesw-resize",
                      corner === "se" && "-bottom-1 -right-1 cursor-nwse-resize",
                    )}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setDrag({
                        type: "resize",
                        corner,
                        startX: e.clientX,
                        startY: e.clientY,
                        orig: { ...ann },
                      });
                    }}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

