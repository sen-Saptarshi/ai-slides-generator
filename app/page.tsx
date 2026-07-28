"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ColorPicker } from "@/components/color-picker";
import { SlidePreview } from "@/components/slide-preview";
import { PresentationMode } from "@/components/presentation-mode";
import { FontPicker } from "@/components/font-picker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { presentationSchema } from "@/lib/schema/ppt-schema";
import { isLightColor, cn } from "@/lib/utils";
import { z } from "zod";
import {
  Loader2,
  Play,
  Moon,
  Sun,
  Trash2,
  ChevronDown,
  Download,
  Sparkles,
} from "lucide-react";

import { toPng, toJpeg } from "html-to-image";
import pptxgen from "pptxgenjs";
import jsPDF from "jspdf";

type PresentationData = z.infer<typeof presentationSchema>;

interface FormData {
  topic: string;
}

export default function Home() {
  const [data, setData] = useState<PresentationData | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [color, setColor] = useState("#0f172a");
  const [font, setFont] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pptx" | "pdf">("pptx");
  const [exportQuality, setExportQuality] = useState<"high" | "medium">("high");
  const [hydrated, setHydrated] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    const saved = localStorage.getItem("presentation-data");
    const savedFont = localStorage.getItem("presentation-font");
    const savedTheme = localStorage.getItem("presentation-theme");
    const savedColor = localStorage.getItem("presentation-color");

    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch {
        localStorage.removeItem("presentation-data");
      }
    }
    if (savedFont) setFont(savedFont);
    if (savedTheme === "dark") setIsDarkMode(true);
    if (savedColor) setColor(savedColor);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode, hydrated]);

  const effectiveColor =
    isDarkMode && (color === "#000000" || color === "#0f172a")
      ? "#f8fafc"
      : color;

  const accentFg = isLightColor(effectiveColor) ? "#0a0a0a" : "#ffffff";

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("presentation-theme", next ? "dark" : "light");
  };

  const handleColorChange = (c: string) => {
    setColor(c);
    localStorage.setItem("presentation-color", c);
  };

  const handleDataUpdate = (newData: PresentationData) => {
    setData(newData);
    localStorage.setItem("presentation-data", JSON.stringify(newData));
  };

  const handleFontChange = (newFont: string) => {
    setFont(newFont);
    localStorage.setItem("presentation-font", newFont);
  };

  const handleReset = () => {
    setData(undefined);
    setError(null);
    localStorage.removeItem("presentation-data");
    reset();
  };

  const onSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setData(undefined);
    setError(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: formData.topic }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate presentation");
      }

      const result = await response.json();
      if (result?.error) throw new Error(result.error);

      const parsed = presentationSchema.safeParse(result.object ?? result);
      if (!parsed.success) {
        throw new Error("Invalid presentation data from model");
      }
      const newData = parsed.data;

      setData(newData);
      localStorage.setItem("presentation-data", JSON.stringify(newData));
      setIsLoading(false);

      newData.slides.forEach((slide, index) => {
        if (
          slide.layout !== "image_and_text" ||
          !slide.imagePrompt ||
          slide.imageUrl
        ) {
          return;
        }
        void (async () => {
          try {
            const imgResponse = await fetch("/api/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: slide.imagePrompt }),
            });
            if (!imgResponse.ok) return;
            const { imageUrl } = await imgResponse.json();
            if (!imageUrl) return;
            setData((prev) => {
              if (!prev) return prev;
              const slides = [...prev.slides];
              if (slides[index]?.imageUrl) return prev;
              slides[index] = { ...slides[index], imageUrl };
              const updated = { ...prev, slides };
              localStorage.setItem(
                "presentation-data",
                JSON.stringify(updated),
              );
              return updated;
            });
          } catch (err) {
            console.error(`Image failed for slide ${index}`, err);
          }
        })();
      });
    } catch (err) {
      console.error("Failed to generate slides", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate slides. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!data) return;
    setIsExporting(true);

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

  return (
    <div
      className={cn(
        "min-h-screen transition-colors",
        isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900",
      )}
    >
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-12 lg:gap-0">
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
            <header className="space-y-1">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold shadow-sm"
                  style={{
                    backgroundColor: effectiveColor,
                    color: accentFg,
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight">
                    AI Slide Gen
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Minimal decks, fast
                  </p>
                </div>
              </div>
            </header>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-1 flex-col gap-5"
            >
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Textarea
                  id="topic"
                  placeholder="E.g. Pitch deck for a neighborhood coffee shop..."
                  className={cn(
                    "min-h-28 resize-none",
                    isDarkMode && "bg-zinc-900 border-zinc-800",
                  )}
                  {...register("topic", { required: true, minLength: 3 })}
                />
                {errors.topic && (
                  <span className="text-sm text-red-500">
                    Enter a topic (min 3 chars)
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label>Accent color</Label>
                <ColorPicker value={color} onChange={handleColorChange} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Font</Label>
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

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  title="Clear deck"
                  className="px-3"
                  disabled={isLoading || (!data && !error)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  className="flex-1 font-medium"
                  disabled={isLoading}
                  style={{
                    backgroundColor: effectiveColor,
                    color: accentFg,
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </form>

            {data && (
              <div
                className={cn(
                  "space-y-2 border-t pt-4",
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
                      <Button
                        variant="outline"
                        className="justify-between px-3"
                      >
                        <span className="text-sm">
                          {exportFormat === "pdf" ? "PDF" : "PPTX"}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => setExportFormat("pptx")}
                      >
                        PowerPoint (.pptx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setExportFormat("pdf")}>
                        PDF (.pdf)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-between px-3"
                      >
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
              </div>
            )}

            <p className="mt-auto pt-4 text-center text-[11px] text-muted-foreground">
              Gemini 2.5 Flash · ← → keys navigate preview
            </p>
          </div>
        </aside>

        {/* Preview stage */}
        <main
          className={cn(
            "flex min-h-[70vh] flex-col p-4 sm:p-6 lg:col-span-8 lg:h-screen lg:overflow-hidden",
            isDarkMode ? "bg-zinc-900/40" : "bg-zinc-100/80",
          )}
        >
          <SlidePreview
            data={data}
            isLoading={isLoading}
            color={effectiveColor}
            onUpdate={handleDataUpdate}
            font={font}
            isDarkMode={isDarkMode}
          />
        </main>
      </div>

      {isPresenting && data && (
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
