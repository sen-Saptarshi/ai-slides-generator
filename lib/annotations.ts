import type { Annotation, AnnotationKind } from "@/lib/schema/ppt-schema";
import { SLIDE_H, SLIDE_W } from "@/lib/utils";

export const EMOJI_PALETTE = [
  "✨",
  "🚀",
  "💡",
  "🔥",
  "✅",
  "⭐",
  "🎯",
  "📈",
  "💬",
  "❤️",
  "👍",
  "🎉",
  "📌",
  "⚡",
  "🌟",
  "💪",
] as const;

export const SHAPE_TOOLS: {
  kind: AnnotationKind;
  label: string;
}[] = [
  { kind: "rect", label: "Rectangle" },
  { kind: "roundRect", label: "Rounded" },
  { kind: "oval", label: "Oval" },
  { kind: "triangle", label: "Triangle" },
  { kind: "star", label: "Star" },
  { kind: "heart", label: "Heart" },
  { kind: "line", label: "Line" },
  { kind: "arrow", label: "Arrow" },
];

function uid() {
  return `ann_${Math.random().toString(36).slice(2, 10)}`;
}

export function createAnnotation(
  kind: AnnotationKind,
  opts?: Partial<Omit<Annotation, "kind" | "id">> & { emoji?: string },
): Annotation {
  const isLine = kind === "line" || kind === "arrow";
  const isEmoji = kind === "emoji";
  const w = opts?.w ?? (isEmoji ? 72 : isLine ? 160 : 120);
  const h = opts?.h ?? (isEmoji ? 72 : isLine ? 8 : 80);

  return clampAnnotation({
    id: uid(),
    kind,
    x: opts?.x ?? (SLIDE_W - w) / 2,
    y: opts?.y ?? (SLIDE_H - h) / 2,
    w,
    h,
    rotation: opts?.rotation ?? 0,
    fill: opts?.fill ?? (isLine || isEmoji ? "none" : "#3b82f6"),
    stroke: opts?.stroke ?? (isEmoji ? "none" : "#1d4ed8"),
    strokeWidth: opts?.strokeWidth ?? (isLine ? 4 : 3),
    emoji: isEmoji ? opts?.emoji || "✨" : undefined,
  });
}

export function clampAnnotation(a: Annotation): Annotation {
  const min =
    a.kind === "emoji" ? 24 : a.kind === "line" || a.kind === "arrow" ? 16 : 20;
  const w = Math.max(min, a.w);
  const h = Math.max(
    a.kind === "line" || a.kind === "arrow" ? 4 : min,
    a.h,
  );
  return {
    ...a,
    w,
    h,
    x: Math.min(Math.max(a.x, -w + 20), SLIDE_W - 20),
    y: Math.min(Math.max(a.y, -h + 20), SLIDE_H - 20),
    rotation: ((a.rotation % 360) + 360) % 360,
  };
}

export function updateAnnotation(
  list: Annotation[],
  id: string,
  patch: Partial<Annotation>,
): Annotation[] {
  return list.map((item) =>
    item.id === id ? clampAnnotation({ ...item, ...patch }) : item,
  );
}

export function removeAnnotation(list: Annotation[], id: string): Annotation[] {
  return list.filter((item) => item.id !== id);
}

export function ensureAnnotations(list?: Annotation[] | null): Annotation[] {
  return list ?? [];
}
