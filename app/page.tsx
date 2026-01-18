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
import { presentationSchema } from "@/lib/schema/ppt-schema";
import { z } from "zod";
import { Loader2, Play } from "lucide-react";

import { toPng } from "html-to-image";
import pptxgen from "pptxgenjs";

type PresentationData = z.infer<typeof presentationSchema>;

interface FormData {
  topic: string;
}

export default function Home() {
  const [data, setData] = useState<PresentationData | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // Add export loading state
  const [isPresenting, setIsPresenting] = useState(false);
  const [color, setColor] = useState("#000000"); // Default color
  const [font, setFont] = useState<string>(""); // Global font state

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    const saved = localStorage.getItem("presentation-data");
    const savedFont = localStorage.getItem("presentation-font");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved data");
      }
    }
    if (savedFont) {
      setFont(savedFont);
    }
  }, []);

  const handleDataUpdate = (newData: PresentationData) => {
    setData(newData);
    localStorage.setItem("presentation-data", JSON.stringify(newData));
  };

  const handleFontChange = (newFont: string) => {
    setFont(newFont);
    localStorage.setItem("presentation-font", newFont);
  };

  const onSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setData(undefined);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: formData.topic }),
      });
      const result = await response.json();
      const newData = result.object || result;
      setData(newData);
      localStorage.setItem("presentation-data", JSON.stringify(newData));
    } catch (error) {
      console.error("Failed to generate slides", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!data) return;
    setIsExporting(true);

    try {
      const pres = new pptxgen();
      pres.layout = "LAYOUT_16x9";

      // Capture Title Slide
      const titleSlideElement = document.getElementById("slide-title");
      if (titleSlideElement) {
        const dataUrl = await toPng(titleSlideElement, { quality: 0.95 });
        const slide = pres.addSlide();
        slide.background = { data: dataUrl }; // Set as background image
      }

      // Capture Content Slides
      for (let i = 0; i < data.slides.length; i++) {
        const slideElement = document.getElementById(`slide-${i}`);
        if (slideElement) {
          const dataUrl = await toPng(slideElement, { quality: 0.95 });
          const slide = pres.addSlide();
          // We add it as an image that fills the slide to avoid distortion if aspect ratio differs slightly
          // or just background
          slide.addImage({ data: dataUrl, x: 0, y: 0, w: "100%", h: "100%" });
        }
      }

      await pres.writeFile({
        fileName: `${data.title.replace(/[^a-z0-9]/gi, "_")}.pptx`,
      });
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 h-screen">
        {/* Left Sidebar - Controls */}
        <div className="lg:col-span-4 space-y-6 p-6 border-r h-full flex flex-col">
          <div>
            <h1 className="text-2xl font-bold mb-2">AI Slide Gen</h1>
            <p className="text-gray-500 mb-8">
              Generate minimalist presentations in seconds.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 flex-1">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Textarea
                id="topic"
                placeholder="E.g. A pitch deck for a coffee shop..."
                className="h-32 resize-none"
                {...register("topic", { required: true })}
              />
              {errors.topic && (
                <span className="text-red-500 text-sm">Topic is required</span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Accent Color</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <div className="space-y-2">
              <Label>Presentation Font</Label>
              <div className="w-full">
                <FontPicker
                  currentFont={font}
                  onFontChange={handleFontChange}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              style={{ backgroundColor: color }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Presentation"
              )}
            </Button>
          </form>

          {data && (
            <div className="pt-4 border-t space-y-2">
              <Button
                onClick={() => setIsPresenting(true)}
                variant="default"
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800"
              >
                <Play className="h-4 w-4" />
                Present
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                variant="outline"
                className="w-full text-gray-700 border-gray-300"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  "Export to PowerPoint"
                )}
              </Button>
            </div>
          )}

          <div className="text-xs text-center text-gray-400 mt-auto">
            Powered by Gemini Flash 2.5
          </div>
        </div>

        {/* Right Area - Preview */}
        <div className="lg:col-span-8 p-6 bg-gray-50/50">
          <SlidePreview
            data={data}
            isLoading={isLoading}
            color={color}
            onUpdate={handleDataUpdate}
            font={font}
          />
        </div>
      </div>

      {/* Presentation Mode Overlay */}
      {isPresenting && data && (
        <PresentationMode
          data={data}
          color={color}
          font={font}
          onClose={() => setIsPresenting(false)}
        />
      )}
    </div>
  );
}
