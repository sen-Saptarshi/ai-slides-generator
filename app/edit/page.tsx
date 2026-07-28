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
import {
  startBackgroundImages,
} from "@/lib/generate-presentation";
import {
  clearPresentation,
  loadPrefs,
  loadPresentation,
  savePrefs,
  savePresentation,
  type PresentationData,
} from "@/lib/presentation-store";
import { cn, isLightColor } from "@/lib/utils";
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

export default function EditPage() {
  const router = useRouter();
  const [data, setData] = useState<PresentationData | undefined>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [color, setColor] = useState("#0f172a");
  const [font, setFont] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pptx" | "pdf">("pptx");
  const [exportQuality, setExportQuality] = useState<"high" | "medium">("high");

  useEffect(() => {
    const prefs = loadPrefs();
    setColor(prefs.color);
    setFont(prefs.font);
    setIsDarkMode(prefs.isDarkMode);
    document.documentElement.classList.toggle("dark", prefs.isDarkMode);

    const deck = loadPresentation();
    if (!deck) {
      router.replace("/");
      return;
    }
    setData(deck);
    setReady(true);
    startBackgroundImages(deck, setData);
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode, ready]);

  const effectiveColor =
    isDarkMode && (color === "#000000" || color === "#0f172a")
      ? "#f8fafc"
      : color;
  const accentFg = isLightColor(effectiveColor) ? "#0a0a0a" : "#ffffff";

  const handleDataUpdate = useCallback((newData: PresentationData) => {
    setData(newData);
    savePresentation(newData);
  }, []);

  const handleColorChange = (c: string) => {
    setColor(c);
    savePrefs({ color: c });
  };

  const handleFontChange = (newFont: string) => {
    setFont(newFont);
    savePrefs({ font: newFont });
  };

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    savePrefs({ isDarkMode: next });
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
          backgroundColor: isDarkMode ? "#09090b" : "#ffffff",
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Opening editor…
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen transition-colors",
        isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900",
      )}
    >
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-12">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex flex-col border-b lg:col-span-4 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r",
            isDarkMode
              ? "border-zinc-800 bg-zinc-950"
              : "border-zinc-200 bg-white",
          )}
        >
          <div className="flex flex-1 flex-col gap-6 p-5 sm:p-6 lg:p-7">
            <header className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href="/"
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium transition",
                    isDarkMode
                      ? "text-zinc-400 hover:text-zinc-200"
                      : "text-zinc-500 hover:text-zinc-800",
                  )}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Home
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleTheme}
                  title={isDarkMode ? "Light mode" : "Dark mode"}
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm"
                  style={{
                    backgroundColor: effectiveColor,
                    color: accentFg,
                  }}
                >
                  <Presentation className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-semibold tracking-tight">
                    {data.title}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {data.slides.length} slides · edit & export
                  </p>
                </div>
              </div>
            </header>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Accent color</Label>
                <ColorPicker value={color} onChange={handleColorChange} />
              </div>

              <div className="space-y-2">
                <Label>Presentation font</Label>
                <FontPicker
                  currentFont={font}
                  onFontChange={handleFontChange}
                />
              </div>

              {error && (
                <div
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    isDarkMode
                      ? "border-red-900/60 bg-red-950/50 text-red-300"
                      : "border-red-100 bg-red-50 text-red-600",
                  )}
                >
                  {error}
                </div>
              )}
            </div>

            <div
              className={cn(
                "mt-auto space-y-2 border-t pt-4",
                isDarkMode ? "border-zinc-800" : "border-zinc-200",
              )}
            >
              <Button
                onClick={() => setIsPresenting(true)}
                className={cn(
                  "w-full",
                  isDarkMode
                    ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                    : "bg-zinc-900 text-white hover:bg-zinc-800",
                )}
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
                className="w-full"
                style={{
                  backgroundColor: effectiveColor,
                  color: accentFg,
                }}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting…
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
                  className="w-full text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              ← → navigate · click text to edit
            </p>
          </div>
        </aside>

        {/* Preview */}
        <main
          className={cn(
            "flex min-h-[70vh] flex-col p-4 sm:p-6 lg:col-span-8 lg:h-screen lg:overflow-hidden",
            isDarkMode ? "bg-zinc-900/40" : "bg-zinc-100/80",
          )}
        >
          <SlidePreview
            data={data}
            isLoading={false}
            color={effectiveColor}
            onUpdate={handleDataUpdate}
            font={font}
            isDarkMode={isDarkMode}
          />
        </main>
      </div>

      {isPresenting && (
        <PresentationMode
          data={data}
          color={effectiveColor}
          font={font}
          isDarkMode={isDarkMode}
          onClose={() => setIsPresenting(false)}
        />
      )}
    </div>
  );
}
