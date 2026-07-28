"use client";

import type { Annotation } from "@/lib/schema/ppt-schema";

function starPoints(cx: number, cy: number, spikes: number, outer: number, inner: number) {
  const pts: string[] = [];
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes; i++) {
    pts.push(
      `${cx + Math.cos(rot) * outer},${cy + Math.sin(rot) * outer}`,
    );
    rot += step;
    pts.push(
      `${cx + Math.cos(rot) * inner},${cy + Math.sin(rot) * inner}`,
    );
    rot += step;
  }
  return pts.join(" ");
}

/** Pure visual for one annotation (no chrome / handles). */
export function AnnotationShape({ ann }: { ann: Annotation }) {
  const { kind, w, h, fill, stroke, strokeWidth, emoji } = ann;
  const sw = strokeWidth ?? 3;
  const f = fill === "none" ? "none" : fill;
  const s = stroke === "none" ? "none" : stroke;

  if (kind === "emoji") {
    const size = Math.min(w, h);
    return (
      <div
        className="flex h-full w-full items-center justify-center select-none"
        style={{ fontSize: size * 0.78, lineHeight: 1 }}
        aria-hidden
      >
        {emoji || "✨"}
      </div>
    );
  }

  const common = {
    fill: f,
    stroke: s,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="block overflow-visible"
      aria-hidden
    >
      {kind === "rect" && (
        <rect x={sw / 2} y={sw / 2} width={w - sw} height={h - sw} {...common} />
      )}
      {kind === "roundRect" && (
        <rect
          x={sw / 2}
          y={sw / 2}
          width={w - sw}
          height={h - sw}
          rx={Math.min(w, h) * 0.18}
          {...common}
        />
      )}
      {kind === "oval" && (
        <ellipse cx={w / 2} cy={h / 2} rx={(w - sw) / 2} ry={(h - sw) / 2} {...common} />
      )}
      {kind === "triangle" && (
        <polygon
          points={`${w / 2},${sw} ${w - sw},${h - sw} ${sw},${h - sw}`}
          {...common}
        />
      )}
      {kind === "star" && (
        <polygon
          points={starPoints(w / 2, h / 2, 5, Math.min(w, h) / 2 - sw, Math.min(w, h) / 4)}
          {...common}
        />
      )}
      {kind === "heart" && (
        <path
          d={heartPath(w, h, sw)}
          {...common}
        />
      )}
      {kind === "line" && (
        <line
          x1={sw}
          y1={h / 2}
          x2={w - sw}
          y2={h / 2}
          stroke={s === "none" ? "#1d4ed8" : s}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      )}
      {kind === "arrow" && (
        <g>
          <line
            x1={sw}
            y1={h / 2}
            x2={Math.max(sw, w - Math.min(h, 28))}
            y2={h / 2}
            stroke={s === "none" ? "#1d4ed8" : s}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <polygon
            points={arrowHead(w, h, sw)}
            fill={s === "none" ? "#1d4ed8" : s}
            stroke="none"
          />
        </g>
      )}
    </svg>
  );
}

function heartPath(w: number, h: number, pad: number) {
  const x0 = pad;
  const y0 = pad * 0.5;
  const ww = w - pad * 2;
  const hh = h - pad;
  // Relative heart in box
  return `M ${x0 + ww / 2} ${y0 + hh * 0.35}
    C ${x0 + ww / 2} ${y0 + hh * 0.1}, ${x0} ${y0 + hh * 0.1}, ${x0} ${y0 + hh * 0.35}
    C ${x0} ${y0 + hh * 0.6}, ${x0 + ww / 2} ${y0 + hh * 0.85}, ${x0 + ww / 2} ${y0 + hh}
    C ${x0 + ww / 2} ${y0 + hh * 0.85}, ${x0 + ww} ${y0 + hh * 0.6}, ${x0 + ww} ${y0 + hh * 0.35}
    C ${x0 + ww} ${y0 + hh * 0.1}, ${x0 + ww / 2} ${y0 + hh * 0.1}, ${x0 + ww / 2} ${y0 + hh * 0.35} Z`;
}

function arrowHead(w: number, h: number, sw: number) {
  const tipX = w - sw;
  const midY = h / 2;
  const back = Math.min(h * 0.9, 28);
  return `${tipX},${midY} ${tipX - back},${midY - h / 2 + sw} ${tipX - back},${midY + h / 2 - sw}`;
}
