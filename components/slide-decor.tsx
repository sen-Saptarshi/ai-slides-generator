"use client";

import type { TemplateStyle } from "@/lib/slide-templates";

/** Non-interactive decorative chrome — pointer-events none always. */
export function SlideDecor({
  style,
  accent,
  dark,
  kind,
}: {
  style: TemplateStyle;
  accent: string;
  dark: boolean;
  kind: "title" | "content";
}) {
  if (style.decor === "none") return null;

  if (style.decor === "modern") {
    return (
      <>
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full blur-[2px]"
          style={{ backgroundColor: accent, opacity: dark ? 0.14 : 0.1 }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full"
          style={{ backgroundColor: accent, opacity: dark ? 0.1 : 0.07 }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-28 w-28"
          style={{
            background: `linear-gradient(135deg, transparent 49.5%, ${accent} 50%)`,
            opacity: dark ? 0.35 : 0.28,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-10 top-10 h-px w-16"
          style={{ backgroundColor: accent, opacity: 0.5 }}
          aria-hidden
        />
      </>
    );
  }

  if (style.decor === "classic") {
    const frame = accent;
    return (
      <>
        {/* Outer thin + inner offset double frame */}
        <div
          className="pointer-events-none absolute inset-[18px] border"
          style={{ borderColor: `${frame}${dark ? "66" : "55"}` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-[22px] border"
          style={{ borderColor: `${frame}${dark ? "99" : "88"}` }}
          aria-hidden
        />
        {/* Corner ornaments */}
        {[
          "left-[18px] top-[18px]",
          "right-[18px] top-[18px]",
          "left-[18px] bottom-[18px]",
          "right-[18px] bottom-[18px]",
        ].map((pos) => (
          <div
            key={pos}
            className={`pointer-events-none absolute h-3 w-3 ${pos}`}
            style={{
              borderColor: frame,
              borderWidth: 0,
              boxShadow: `inset 0 0 0 1.5px ${frame}`,
            }}
            aria-hidden
          />
        ))}
      </>
    );
  }

  if (style.decor === "simple") {
    return (
      <>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 20%, ${accent}, transparent 45%), radial-gradient(circle at 80% 80%, ${accent}, transparent 40%)`,
          }}
          aria-hidden
        />
      </>
    );
  }

  if (style.decor === "designer") {
    return (
      <>
        {kind === "title" ? (
          <>
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-[40%]"
              style={{
                background: dark
                  ? `linear-gradient(165deg, ${accent} 0%, ${accent}dd 40%, #09090b 100%)`
                  : `linear-gradient(165deg, ${accent} 0%, ${accent}ee 45%, #f4f4f5 100%)`,
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-16 right-[18%] h-24 w-24 rotate-[14deg]"
              style={{
                backgroundColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-10 right-[22%] h-3 w-28"
              style={{ backgroundColor: dark ? "#fff" : "#0a0a0a", opacity: 0.85 }}
              aria-hidden
            />
          </>
        ) : (
          <>
            <div
              className="pointer-events-none absolute -right-10 top-6 h-36 w-36 rotate-[8deg]"
              style={{ backgroundColor: accent, opacity: dark ? 0.16 : 0.12 }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-14 right-8 h-2.5 w-20"
              style={{ backgroundColor: accent }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-1 opacity-30"
              style={{ backgroundColor: accent }}
              aria-hidden
            />
          </>
        )}
      </>
    );
  }

  if (style.decor === "minimalist") {
    return (
      <>
        <div
          className="pointer-events-none absolute left-12 top-12 h-px w-10"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-12 top-12 h-10 w-px"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-12 right-12 h-px w-10"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-12 right-12 h-10 w-px"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
      </>
    );
  }

  return null;
}
