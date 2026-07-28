import { presentationSchema } from "@/lib/schema/ppt-schema";
import { z } from "zod";

export type PresentationData = z.infer<typeof presentationSchema>;

/** Light/dark for slide canvas only — never the app chrome. */
export type SlideTheme = "light" | "dark";

const KEYS = {
  data: "presentation-data",
  font: "presentation-font",
  /** Slide surface theme (not app UI). */
  slideTheme: "presentation-slide-theme",
  /** Legacy key — migrated on read. */
  legacyTheme: "presentation-theme",
  accentColor: "presentation-color",
} as const;

export type PresentationPrefs = {
  /** Accent applied on slides (bars, titles). */
  accentColor: string;
  font: string;
  /** Slide backgrounds/text — not app chrome. */
  slideTheme: SlideTheme;
};

export const DEFAULT_PREFS: PresentationPrefs = {
  accentColor: "#d4a853",
  font: "",
  slideTheme: "light",
};

export function loadPresentation(): PresentationData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEYS.data);
  if (!raw) return null;
  try {
    const parsed = presentationSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function savePresentation(data: PresentationData) {
  localStorage.setItem(KEYS.data, JSON.stringify(data));
}

export function clearPresentation() {
  localStorage.removeItem(KEYS.data);
}

export function loadPrefs(): PresentationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;

  const storedTheme = localStorage.getItem(KEYS.slideTheme);
  const legacy = localStorage.getItem(KEYS.legacyTheme);
  let slideTheme: SlideTheme = DEFAULT_PREFS.slideTheme;
  if (storedTheme === "light" || storedTheme === "dark") {
    slideTheme = storedTheme;
  } else if (legacy === "dark") {
    slideTheme = "dark";
  } else if (legacy === "light") {
    slideTheme = "light";
  }

  return {
    accentColor:
      localStorage.getItem(KEYS.accentColor) || DEFAULT_PREFS.accentColor,
    font: localStorage.getItem(KEYS.font) || DEFAULT_PREFS.font,
    slideTheme,
  };
}

export function savePrefs(prefs: Partial<PresentationPrefs>) {
  if (prefs.accentColor !== undefined) {
    localStorage.setItem(KEYS.accentColor, prefs.accentColor);
  }
  if (prefs.font !== undefined) {
    localStorage.setItem(KEYS.font, prefs.font);
  }
  if (prefs.slideTheme !== undefined) {
    localStorage.setItem(KEYS.slideTheme, prefs.slideTheme);
  }
}

export function hasSavedPresentation(): boolean {
  return !!localStorage.getItem(KEYS.data);
}

/**
 * Accent as painted on slides. If dark slides + near-black accent,
 * bump to light so titles stay readable.
 */
export function resolveSlideAccent(
  accentColor: string,
  slideTheme: SlideTheme,
): string {
  if (slideTheme !== "dark") return accentColor;
  const c = accentColor.toLowerCase();
  if (c === "#000000" || c === "#0f172a" || c === "#09090b" || c === "#000") {
    return "#f8fafc";
  }
  return accentColor;
}
