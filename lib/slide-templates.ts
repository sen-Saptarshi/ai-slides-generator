export type SlideTemplateId =
  | "modern"
  | "classic"
  | "simple"
  | "designer"
  | "minimalist";

export type SlideTemplateMeta = {
  id: SlideTemplateId;
  label: string;
  description: string;
};

export const SLIDE_TEMPLATES: SlideTemplateMeta[] = [
  {
    id: "modern",
    label: "Modern",
    description: "Corporate edge, numbered points, confident geometry.",
  },
  {
    id: "classic",
    label: "Classic",
    description: "Editorial frame, refined hierarchy, lecture-ready.",
  },
  {
    id: "simple",
    label: "Simple",
    description: "Airy whitespace, soft cards, quiet clarity.",
  },
  {
    id: "designer",
    label: "Designer",
    description: "Magazine drama, bold type, accent architecture.",
  },
  {
    id: "minimalist",
    label: "Minimalist",
    description: "Precision hairlines, calm type, luxury restraint.",
  },
];

export const DEFAULT_TEMPLATE: SlideTemplateId = "modern";

export function isSlideTemplateId(
  v: string | null | undefined,
): v is SlideTemplateId {
  return (
    v === "modern" ||
    v === "classic" ||
    v === "simple" ||
    v === "designer" ||
    v === "minimalist"
  );
}

export type BulletMarker = "dot" | "bar" | "number" | "dash" | "none";

/**
 * Visual tokens. Never hardcode font-family on headings/body —
 * use defaultFont so user font picker can override fully.
 */
export type TemplateStyle = {
  id: SlideTemplateId;
  shell: string;
  decor: "none" | "modern" | "classic" | "simple" | "designer" | "minimalist";
  titleAlign: "center" | "left" | "bottom-left";
  titlePad: string;
  contentPad: string;
  /** Size/weight/tracking only — no font-family */
  titleHeading: string;
  contentHeading: string;
  titleOnlyHeading: string;
  subtitle: string;
  body: string;
  bodyLg: string;
  bulletMarker: BulletMarker;
  footer: string;
  footerBorder: string;
  showTopBar: boolean;
  showSideBar: boolean;
  sideBarWidth: string;
  titleRule: "none" | "line" | "double" | "pill";
  contentTitleRule: "none" | "line" | "accent-underline";
  imageRadius: string;
  /**
   * Applied on the slide only when the user has not chosen a font.
   * Never placed on individual text nodes (so override always works).
   */
  defaultFont: string;
  /** Dark surface uses slightly different shell bg if set */
  surfaceOverride?: { light: string; dark: string };
};

export function getTemplateStyle(
  template: SlideTemplateId,
  dark: boolean,
): TemplateStyle {
  const surface = dark
    ? "bg-zinc-950 text-white border-zinc-800"
    : "bg-white text-zinc-900 border-zinc-200/90";
  const muted = dark ? "text-zinc-400" : "text-zinc-500";
  const body = dark ? "text-zinc-300" : "text-zinc-700";

  switch (template) {
    case "classic":
      return {
        id: "classic",
        shell: cn(
          dark ? "bg-[#0c0b0a] text-[#f5f0e8] border-[#3a342c]" : "bg-[#fbf8f3] text-[#1c1917] border-[#d6cfc4]",
          "rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.22)] border",
        ),
        decor: "classic",
        titleAlign: "center",
        titlePad: "px-[88px] py-16",
        contentPad: "px-[72px] pt-12 pb-5",
        titleHeading:
          "text-[50px] font-semibold tracking-[-0.02em] leading-[1.12]",
        contentHeading:
          "text-[32px] font-semibold tracking-[-0.015em] leading-snug",
        titleOnlyHeading:
          "text-[46px] font-semibold tracking-[-0.02em] leading-tight",
        subtitle: cn(
          "text-[21px] font-normal italic tracking-[0.02em]",
          dark ? "text-[#b8a990]" : "text-[#6b6358]",
        ),
        body: cn("text-[17px] leading-[1.65]", body),
        bodyLg: cn("text-[20px] leading-[1.6]", body),
        bulletMarker: "dash",
        footer: cn(
          "h-10 px-12 text-[10px] tracking-[0.16em] uppercase",
          dark ? "bg-[#0c0b0a] text-[#8a8070]" : "bg-[#f5f0e6] text-[#8a8070]",
        ),
        footerBorder: dark ? "border-[#3a342c]" : "border-[#e0d8cc]",
        showTopBar: false,
        showSideBar: false,
        sideBarWidth: "0",
        titleRule: "double",
        contentTitleRule: "line",
        imageRadius: "rounded-sm",
        defaultFont: "font-[family-name:var(--font-playfair)]",
      };

    case "simple":
      return {
        id: "simple",
        shell: cn(
          dark
            ? "bg-zinc-950 text-zinc-50 ring-1 ring-white/10"
            : "bg-white text-zinc-900 ring-1 ring-zinc-200/90",
          "rounded-[20px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] border-0",
        ),
        decor: "simple",
        titleAlign: "center",
        titlePad: "px-20 py-[72px]",
        contentPad: "px-[68px] pt-14 pb-8",
        titleHeading:
          "text-[46px] font-semibold tracking-[-0.035em] leading-[1.08]",
        contentHeading:
          "text-[28px] font-semibold tracking-[-0.025em] leading-snug",
        titleOnlyHeading:
          "text-[42px] font-semibold tracking-[-0.03em] leading-tight",
        subtitle: cn("text-[19px] font-normal tracking-[-0.01em]", muted),
        body: cn("text-[17px] leading-[1.7] font-normal", body),
        bodyLg: cn("text-[20px] leading-[1.65] font-normal", body),
        bulletMarker: "dot",
        footer: cn("h-8 px-10 text-[10px] tracking-wide", muted),
        footerBorder: "border-transparent",
        showTopBar: false,
        showSideBar: false,
        sideBarWidth: "0",
        titleRule: "pill",
        contentTitleRule: "accent-underline",
        imageRadius: "rounded-2xl",
        defaultFont: "",
      };

    case "designer":
      return {
        id: "designer",
        shell: cn(
          dark
            ? "bg-zinc-950 text-white"
            : "bg-white text-zinc-950 ring-1 ring-zinc-900/8",
          "rounded-none shadow-[0_24px_60px_rgba(0,0,0,0.28)] border-0",
        ),
        decor: "designer",
        titleAlign: "bottom-left",
        titlePad: "px-12 pb-14 pt-16",
        contentPad: "pl-12 pr-11 pt-9 pb-5",
        titleHeading:
          "text-[54px] font-bold uppercase tracking-[-0.045em] leading-[0.92]",
        contentHeading:
          "text-[26px] font-bold uppercase tracking-[-0.02em] leading-none",
        titleOnlyHeading:
          "text-[46px] font-bold uppercase tracking-[-0.04em] leading-[0.95]",
        subtitle: cn(
          "text-[13px] font-semibold tracking-[0.22em] uppercase",
          muted,
        ),
        body: cn("text-[16px] leading-[1.55] font-medium", body),
        bodyLg: cn("text-[19px] leading-[1.5] font-medium", body),
        bulletMarker: "bar",
        footer: cn(
          "h-9 px-7 text-[9px] font-bold tracking-[0.2em] uppercase",
          muted,
          dark ? "bg-black/50" : "bg-zinc-100",
        ),
        footerBorder: dark ? "border-white/10" : "border-zinc-200",
        showTopBar: false,
        showSideBar: true,
        sideBarWidth: "12px",
        titleRule: "none",
        contentTitleRule: "none",
        imageRadius: "rounded-none",
        defaultFont: "font-[family-name:var(--font-montserrat)]",
      };

    case "minimalist":
      return {
        id: "minimalist",
        shell: cn(
          dark
            ? "bg-[#0a0a0a] text-zinc-100 border-zinc-800"
            : "bg-[#fafafa] text-zinc-900 border-zinc-300",
          "rounded-none border shadow-none",
        ),
        decor: "minimalist",
        titleAlign: "center",
        titlePad: "px-24 py-[88px]",
        contentPad: "px-[80px] pt-16 pb-8",
        titleHeading:
          "text-[38px] font-light tracking-[0.1em] uppercase leading-[1.2]",
        contentHeading:
          "text-[22px] font-light tracking-[0.14em] uppercase leading-snug",
        titleOnlyHeading:
          "text-[34px] font-light tracking-[0.12em] uppercase leading-tight",
        subtitle: cn(
          "text-[11px] font-normal tracking-[0.32em] uppercase",
          muted,
        ),
        body: cn(
          "text-[15px] font-light leading-[1.9] tracking-[0.02em]",
          body,
        ),
        bodyLg: cn(
          "text-[17px] font-light leading-[1.85] tracking-[0.02em]",
          body,
        ),
        bulletMarker: "none",
        footer: cn(
          "h-8 px-14 text-[9px] tracking-[0.28em] uppercase font-light",
          muted,
        ),
        footerBorder: dark ? "border-zinc-800" : "border-zinc-200",
        showTopBar: false,
        showSideBar: false,
        sideBarWidth: "0",
        titleRule: "line",
        contentTitleRule: "line",
        imageRadius: "rounded-none",
        defaultFont: "font-[family-name:var(--font-lato)]",
      };

    case "modern":
    default:
      return {
        id: "modern",
        shell: cn(
          surface,
          "rounded-xl shadow-[0_18px_48px_rgba(0,0,0,0.2)] border",
        ),
        decor: "modern",
        titleAlign: "center",
        titlePad: "px-16 py-14",
        contentPad: "px-12 pt-10 pb-4",
        titleHeading:
          "text-[50px] font-bold tracking-[-0.03em] leading-[1.06]",
        contentHeading:
          "text-[30px] font-bold tracking-[-0.02em] leading-snug",
        titleOnlyHeading:
          "text-[46px] font-bold tracking-[-0.03em] leading-tight",
        subtitle: cn("text-[22px] font-light tracking-wide", muted),
        body: cn("text-[17px] leading-[1.6]", body),
        bodyLg: cn("text-[21px] leading-[1.55]", body),
        bulletMarker: "number",
        footer: cn(
          "h-9 px-6 text-[11px] tracking-wide tabular-nums",
          muted,
          dark ? "bg-zinc-900/70" : "bg-zinc-50",
        ),
        footerBorder: dark ? "border-zinc-800" : "border-zinc-100",
        showTopBar: true,
        showSideBar: true,
        sideBarWidth: "7px",
        titleRule: "pill",
        contentTitleRule: "accent-underline",
        imageRadius: "rounded-lg",
        defaultFont: "",
      };
  }
}

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
