import { presentationSchema } from "@/lib/schema/ppt-schema";
import { z } from "zod";

export type PresentationData = z.infer<typeof presentationSchema>;

const KEYS = {
  data: "presentation-data",
  font: "presentation-font",
  theme: "presentation-theme",
  color: "presentation-color",
} as const;

export type PresentationPrefs = {
  color: string;
  font: string;
  isDarkMode: boolean;
};

export const DEFAULT_PREFS: PresentationPrefs = {
  color: "#0f172a",
  font: "",
  isDarkMode: false,
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
  return {
    color: localStorage.getItem(KEYS.color) || DEFAULT_PREFS.color,
    font: localStorage.getItem(KEYS.font) || DEFAULT_PREFS.font,
    isDarkMode: localStorage.getItem(KEYS.theme) === "dark",
  };
}

export function savePrefs(prefs: Partial<PresentationPrefs>) {
  if (prefs.color !== undefined) {
    localStorage.setItem(KEYS.color, prefs.color);
  }
  if (prefs.font !== undefined) {
    localStorage.setItem(KEYS.font, prefs.font);
  }
  if (prefs.isDarkMode !== undefined) {
    localStorage.setItem(
      KEYS.theme,
      prefs.isDarkMode ? "dark" : "light",
    );
  }
}

export function hasSavedPresentation(): boolean {
  return !!localStorage.getItem(KEYS.data);
}
