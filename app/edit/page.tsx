"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ColorPicker } from "@/components/color-picker";
import { SlidePreview } from "@/components/slide-preview";
import { PresentationMode } from "@/components/presentation-mode";
import { FontPicker } from "@/components/font-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { startBackgroundImages } from "@/lib/generate-presentation";
import {
  clearPresentation,
  loadPrefs,
  loadPresentation,
  resolveSlideAccent,
  savePrefs,
  savePresentation,
  type PresentationData,
  type SlideTheme,
} from "@/lib/presentation-store";
import {
  DEFAULT_TEMPLATE,
  type SlideTemplateId,
} from "@/lib/slide-templates";
import { TemplatePicker } from "@/components/template-picker";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Home,
  Loader2,
  Moon,
  Play,
  Presentation,
  Sun,
  Trash2,
} from "lucide-react";
import { toPng, toJpeg } from "html-to-image";
import pptxgen from "pptxgenjs";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";

export default function EditPage() {
  const router = useRouter();
  const [data, setData] = useState<PresentationData | undefined>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [accentColor, setAccentColor] = useState("#d4a853");
  const [font, setFont] = useState("");
  const [slideTheme, setSlideTheme] = useState<SlideTheme>("light");
  const [template, setTemplate] =
    useState<SlideTemplateId>(DEFAULT_TEMPLATE);
  const [exportFormat, setExportFormat] = useState<"pptx" | "pdf">("pptx");
  const [exportQuality, setExportQuality] = useState<"high" | "medium">("high");

  useEffect(() => {
    // App chrome always dark — never tied to slide theme
    document.documentElement.classList.add("dark");

    const prefs = loadPrefs();
    setAccentColor(prefs.accentColor);
    setFont(prefs.font);
    setSlideTheme(prefs.slideTheme);
    setTemplate(prefs.template);

    const deck = loadPresentation();
    if (!deck) {
      router.replace("/");
      return;
    }
    setData(deck);
    setReady(true);
    startBackgroundImages(deck, setData);
  }, [router]);

  const slideAccent = resolveSlideAccent(accentColor, slideTheme);
  const darkSlides = slideTheme === "dark";

  const handleDataUpdate = useCallback((newData: PresentationData) => {
    setData(newData);
    savePresentation(newData);
  }, []);

  const handleAccentChange = (c: string) => {
    setAccentColor(c);
    savePrefs({ accentColor: c });
  };

  const handleFontChange = (newFont: string) => {
    setFont(newFont);
    savePrefs({ font: newFont });
  };

  const handleSlideTheme = (theme: SlideTheme) => {
    setSlideTheme(theme);
    savePrefs({ slideTheme: theme });
  };

  const handleTemplate = (id: SlideTemplateId) => {
    setTemplate(id);
    savePrefs({ template: id });
  };

  const handleClear = () => {
    clearPresentation();
    router.push("/");
  };

  const handleExport = async () => {
    if (!data) return;
    setIsExporting(true);
    setError(null);

    try {
      const isHighQuality = exportQuality === "high";
      const pixelRatio = isHighQuality ? 2 : 1;
      const imageQuality = isHighQuality ? 1.0 : 0.8;

      const captureSlide = async (element: HTMLElement) => {
        const options = {
          quality: imageQuality,
          pixelRatio,
          cacheBust: true,
          // Match slide surface, not app chrome
          backgroundColor: darkSlides ? "#09090b" : "#ffffff",
          width: element.offsetWidth || 960,
          height: element.offsetHeight || 540,
        };

        const dataUrl =
          isHighQuality && exportFormat === "pptx"
            ? await toPng(element, options)
            : await toJpeg(element, options);

        return {
          dataUrl,
          width: options.width,
          height: options.height,
        };
      };

      const slideImages: { dataUrl: string; width: number; height: number }[] =
        [];

      const titleEl = document.getElementById("slide-title");
      if (titleEl) slideImages.push(await captureSlide(titleEl));

      for (let i = 0; i < data.slides.length; i++) {
        const el = document.getElementById(`slide-${i}`);
        if (el) slideImages.push(await captureSlide(el));
      }

      if (slideImages.length === 0) {
        throw new Error("No slides found to export");
      }

      const fileName = `${data.title.replace(/[^a-z0-9]+/gi, "_") || "presentation"}`;

      if (exportFormat === "pdf") {
        const first = slideImages[0];
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [first.width * pixelRatio, first.height * pixelRatio],
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        slideImages.forEach((slide, index) => {
          if (index > 0) {
            pdf.addPage([slide.width * pixelRatio, slide.height * pixelRatio]);
          }
          pdf.addImage(
            slide.dataUrl,
            slide.dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG",
            0,
            0,
            pdfWidth,
            pdfHeight,
          );
        });
        pdf.save(`${fileName}.pdf`);
      } else {
        const pres = new pptxgen();
        pres.layout = "LAYOUT_16x9";
        slideImages.forEach((slide) => {
          const s = pres.addSlide();
          s.addImage({
            data: slide.dataUrl,
            x: 0,
            y: 0,
            w: "100%",
            h: "100%",
          });
        });
        await pres.writeFile({ fileName: `${fileName}.pptx` });
      }
    } catch (e) {
      console.error("Export failed", e);
      setError("Export failed. Try again.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!ready || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Opening editor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-12">
        {/* App chrome — always dark */}
        <aside className="flex flex-col border-b border-zinc-800 bg-zinc-950 lg:col-span-4 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex flex-1 flex-col gap-6 p-5 sm:p-6 lg:p-7">
            <header className="space-y-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-zinc-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Home
              </Link>

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 shadow-sm">
                  <Presentation className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold tracking-tight">
                    {data.title}
                  </h1>
                  <p className="text-xs text-zinc-500">
                    {data.slides.length} slides · edit & export
                  </p>
                </div>
              </div>
            </header>

            <section className="space-y-5">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Slide appearance
                </p>
                <p className="mb-3 text-[11px] leading-relaxed text-zinc-600">
                  These settings style the deck only — not this editor.
                </p>

                <div className="space-y-4">
                  <TemplatePicker
                    value={template}
                    onChange={handleTemplate}
                    compact
                  />

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Slide theme</Label>
                    <div className="flex rounded-lg border border-zinc-700 p-0.5">
                      <button
                        type="button"
                        onClick={() => handleSlideTheme("light")}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs transition",
                          slideTheme === "light"
                            ? "bg-zinc-100 text-zinc-900"
                            : "text-zinc-400 hover:text-zinc-200",
                        )}
                      >
                        <Sun className="h-3.5 w-3.5" />
                        Light slides
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSlideTheme("dark")}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs transition",
                          slideTheme === "dark"
                            ? "bg-zinc-100 text-zinc-900"
                            : "text-zinc-400 hover:text-zinc-200",
                        )}
                      >
                        <Moon className="h-3.5 w-3.5" />
                        Dark slides
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Slide accent</Label>
                    <ColorPicker
                      value={accentColor}
                      onChange={handleAccentChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Slide font</Label>
                    <FontPicker
                      currentFont={font}
                      onFontChange={handleFontChange}
                    />
                  </div>

                  {/* Mini preview of slide surface */}
                  <div
                    className={cn(
                      "overflow-hidden rounded-lg border",
                      darkSlides
                        ? "border-zinc-700 bg-zinc-950"
                        : "border-zinc-200 bg-white",
                    )}
                  >
                    <div
                      className="h-1 w-full"
                      style={{ backgroundColor: slideAccent }}
                    />
                    <div className="px-3 py-2.5">
                      <p
                        className={cn(
                          "text-xs font-semibold",
                          darkSlides ? "text-white" : "text-zinc-900",
                        )}
                        style={{ color: slideAccent }}
                      >
                        Accent preview
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-[11px]",
                          darkSlides ? "text-zinc-400" : "text-zinc-500",
                        )}
                      >
                        {slideTheme === "dark" ? "Dark" : "Light"} slide surface
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              ) : null}
            </section>

            <div className="mt-auto space-y-2 border-t border-zinc-800 pt-4">
              <Button
                onClick={() => setIsPresenting(true)}
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-white"
              >
                <Play className="mr-2 h-4 w-4" />
                Present
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between px-3">
                      <span className="text-sm">
                        {exportFormat === "pdf" ? "PDF" : "PPTX"}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setExportFormat("pptx")}>
                      PowerPoint (.pptx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setExportFormat("pdf")}>
                      PDF (.pdf)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between px-3">
                      <span className="text-sm">
                        {exportQuality === "high" ? "High" : "Medium"}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setExportQuality("high")}
                    >
                      High quality
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setExportQuality("medium")}
                    >
                      Medium (smaller)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  New
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="w-full text-red-400 hover:text-red-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            <p className="text-center text-[11px] text-zinc-600">
              Arrow keys navigate · click slide text to edit
            </p>
          </div>
        </aside>

        {/* Preview stage chrome — always dark workspace */}
        <main className="flex min-h-[70vh] flex-col bg-zinc-900/50 p-4 sm:p-6 lg:col-span-8 lg:h-screen lg:overflow-hidden">
          <SlidePreview
            data={data}
            isLoading={false}
            accentColor={slideAccent}
            onUpdate={handleDataUpdate}
            font={font}
            darkSlides={darkSlides}
            template={template}
          />
        </main>
      </div>

      {isPresenting ? (
        <PresentationMode
          data={data}
          accentColor={slideAccent}
          font={font}
          darkSlides={darkSlides}
          template={template}
          onClose={() => setIsPresenting(false)}
        />
      ) : null}
    </div>
  );
}
