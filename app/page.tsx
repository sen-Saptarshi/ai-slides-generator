"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  Loader2,
  Moon,
  Rocket,
  Sparkles,
  Sun,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/color-picker";
import { generatePresentation } from "@/lib/generate-presentation";
import {
  DEFAULT_PREFS,
  hasSavedPresentation,
  loadPrefs,
  resolveSlideAccent,
  savePrefs,
  savePresentation,
  type SlideTheme,
} from "@/lib/presentation-store";
import {
  DEFAULT_TEMPLATE,
  type SlideTemplateId,
} from "@/lib/slide-templates";
import { TemplatePicker } from "@/components/template-picker";
import { cn } from "@/lib/utils";

/** localStorage does not emit; storage event covers other tabs only. */
function subscribeStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getDraftSnapshot() {
  return hasSavedPresentation();
}

function getDraftServerSnapshot() {
  return false;
}

const PRESETS = [
  {
    id: "pitch",
    label: "Startup pitch",
    icon: Rocket,
    prompt:
      "A 8-slide investor pitch deck for a B2B SaaS product that automates expense reports. Include problem, solution, market, product, traction, business model, team, and ask.",
  },
  {
    id: "lecture",
    label: "Lecture",
    icon: GraduationCap,
    prompt:
      "A clear educational lecture deck on climate change basics for university students. Cover science, impacts, mitigation, and what individuals can do. 8-10 slides.",
  },
  {
    id: "product",
    label: "Product launch",
    icon: Sparkles,
    prompt:
      "A product launch presentation for a new smart water bottle with hydration tracking. Cover vision, features, how it works, pricing, and go-to-market. 7-9 slides.",
  },
  {
    id: "business",
    label: "Business review",
    icon: Briefcase,
    prompt:
      "A quarterly business review deck for a mid-size e-commerce brand. Include KPIs, wins, challenges, customer insights, and next-quarter priorities. 8 slides.",
  },
] as const;

export default function HomePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  // User edits this session (null = use stored / SSR default).
  const [accentOverride, setAccentOverride] = useState<string | null>(null);
  const [themeOverride, setThemeOverride] = useState<SlideTheme | null>(null);
  const [templateOverride, setTemplateOverride] =
    useState<SlideTemplateId | null>(null);

  // Hydration-safe: getServerSnapshot matches SSR; client snapshot after hydrate.
  const hasDraft = useSyncExternalStore(
    subscribeStorage,
    getDraftSnapshot,
    getDraftServerSnapshot,
  );

  const prefsJson = useSyncExternalStore(
    subscribeStorage,
    () => JSON.stringify(loadPrefs()),
    () => JSON.stringify(DEFAULT_PREFS),
  );
  const storedPrefs = JSON.parse(prefsJson) as {
    accentColor: string;
    slideTheme: SlideTheme;
    template?: SlideTemplateId;
  };

  const accentColor = accentOverride ?? storedPrefs.accentColor;
  const slideTheme = themeOverride ?? storedPrefs.slideTheme;
  const template =
    templateOverride ?? storedPrefs.template ?? DEFAULT_TEMPLATE;

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const slideAccent = resolveSlideAccent(accentColor, slideTheme);
  const darkSlides = slideTheme === "dark";

  const setTheme = (theme: SlideTheme) => {
    setThemeOverride(theme);
    savePrefs({ slideTheme: theme });
  };

  const onAccent = (c: string) => {
    setAccentOverride(c);
    savePrefs({ accentColor: c });
  };

  const onTemplate = (id: SlideTemplateId) => {
    setTemplateOverride(id);
    savePrefs({ template: id });
  };

  const pickPreset = (id: string, prompt: string) => {
    setActivePreset(id);
    setTopic(prompt);
  };

  const generate = async () => {
    const trimmed = topic.trim();
    if (trimmed.length < 3) {
      setError("Describe your presentation (at least a few words).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      savePrefs({ accentColor, slideTheme, template });
      const data = await generatePresentation(trimmed);
      savePresentation(data);
      router.push("/edit");
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Generation failed. Try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0c0b0a] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,168,83,0.18), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(80,100,140,0.12), transparent 50%), radial-gradient(ellipse 50% 30% at 0% 80%, rgba(180,90,60,0.08), transparent 45%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d4a853] text-zinc-950">
            <Presentation className="h-4 w-4" />
          </div>
          <span className="font-[family-name:var(--font-playfair)] text-lg tracking-tight">
            Slideforge
          </span>
        </div>
        {hasDraft ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={() => router.push("/edit")}
          >
            Continue editing
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        ) : null}
      </header>

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col px-6 pb-24 pt-10 sm:pt-16">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#d4a853]">
          AI presentation studio
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl md:text-[3.25rem]">
          Decks that look designed
          <br className="hidden sm:block" />
          <span className="text-zinc-400"> not dumped from a chat.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          Describe the talk. Get a minimalist slide deck you can edit, restyle,
          present, and export.
        </p>

        <div className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-5">
          <Textarea
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setActivePreset(null);
            }}
            placeholder="E.g. Pitch deck for a neighborhood specialty coffee shop expanding to a second location..."
            className="min-h-[140px] resize-none border-0 bg-transparent px-1 py-1 text-base text-zinc-100 shadow-none placeholder:text-zinc-500 focus-visible:ring-0"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void generate();
              }
            }}
          />

          <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {PRESETS.map((p) => {
              const Icon = p.icon;
              const on = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={loading}
                  onClick={() => pickPreset(p.id, p.prompt)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    on
                      ? "border-[#d4a853]/50 bg-[#d4a853]/15 text-[#e8c97a]"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Deck options — apply to slides only */}
          <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Deck style
              <span className="ml-2 font-normal normal-case tracking-normal text-zinc-600">
                (slides only — app stays dark)
              </span>
            </p>

            <TemplatePicker value={template} onChange={onTemplate} />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-1 flex-wrap items-end gap-4">
                <div className="min-w-[140px] flex-1 space-y-1.5 sm:max-w-[200px]">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    Slide accent
                  </label>
                  <ColorPicker value={accentColor} onChange={onAccent} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    Slide theme
                  </label>
                  <div className="flex rounded-lg border border-white/10 p-0.5">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition",
                        slideTheme === "light"
                          ? "bg-white text-zinc-900"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <Sun className="h-3.5 w-3.5" /> Light
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition",
                        slideTheme === "dark"
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-400 hover:text-zinc-200",
                      )}
                    >
                      <Moon className="h-3.5 w-3.5" /> Dark
                    </button>
                  </div>
                </div>

                {/* Live mini slide surface */}
                <div
                  className={cn(
                    "hidden w-28 overflow-hidden rounded-md border sm:block",
                    darkSlides
                      ? "border-zinc-600 bg-zinc-950"
                      : "border-zinc-300 bg-white",
                  )}
                  title="Slide surface preview"
                >
                  <div
                    className="h-1 w-full"
                    style={{ backgroundColor: slideAccent }}
                  />
                  <div className="px-2 py-1.5">
                    <p
                      className="truncate text-[10px] font-semibold"
                      style={{ color: slideAccent }}
                    >
                      Preview
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                disabled={loading}
                onClick={() => void generate()}
                className="h-11 shrink-0 bg-[#d4a853] px-6 font-medium text-zinc-950 hover:bg-[#e0b85e]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crafting deck...
                  </>
                ) : (
                  <>
                    Generate
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {error ? (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <p className="mt-3 text-[11px] text-zinc-600">
            Cmd/Ctrl + Enter to generate
          </p>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-3">
          {[
            {
              t: "Structure first",
              d: "Titles, layouts, and bullets before polish.",
            },
            {
              t: "Edit in place",
              d: "Click any text. Regen images from prompts.",
            },
            {
              t: "Present and export",
              d: "Fullscreen show, PDF or PPTX out.",
            },
          ].map((f) => (
            <li key={f.t} className="border-t border-white/10 pt-4">
              <h3 className="font-[family-name:var(--font-playfair)] text-lg text-zinc-200">
                {f.t}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                {f.d}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
