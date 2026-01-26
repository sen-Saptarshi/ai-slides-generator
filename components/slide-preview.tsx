"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";
import { presentationSchema } from "@/lib/schema/ppt-schema";
import { Skeleton } from "@/components/ui/skeleton";
import { EditableText } from "@/components/editable-text";
import { cn } from "@/lib/utils";

type Presentation = z.infer<typeof presentationSchema>;

interface SlidePreviewProps {
  data?: Presentation;
  isLoading: boolean;
  color: string;
  onUpdate?: (newData: Presentation) => void;
  font?: string;
  isDarkMode?: boolean;
}

const ScaledSlide = ({ children }: { children: ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const targetScale = containerWidth / 960; // 960px is our reference fixed width
        setScale(targetScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full relative"
      style={{ height: 960 * (9 / 16) * scale }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left transition-transform duration-200"
        style={{
          transform: `scale(${scale})`,
          width: "960px",
          height: "540px",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export function SlidePreview({
  data,
  isLoading,
  color,
  onUpdate,
  font = "",
  isDarkMode = false,
}: SlidePreviewProps) {
  const handleUpdateTitle = (newTitle: string) => {
    if (data && onUpdate) {
      onUpdate({ ...data, title: newTitle });
    }
  };

  const handleUpdateSubtitle = (newSubtitle: string) => {
    if (data && onUpdate) {
      onUpdate({ ...data, subtitle: newSubtitle });
    }
  };

  const handleUpdateSlideTitle = (index: number, newTitle: string) => {
    if (data && onUpdate) {
      const newSlides = [...data.slides];
      newSlides[index] = { ...newSlides[index], title: newTitle };
      onUpdate({ ...data, slides: newSlides });
    }
  };

  const handleUpdateSlideContent = (
    slideIndex: number,
    contentIndex: number,
    newValue: string,
  ) => {
    if (data && onUpdate) {
      const newSlides = [...data.slides];
      const newContent = [...newSlides[slideIndex].content];
      newContent[contentIndex] = newValue;
      newSlides[slideIndex] = { ...newSlides[slideIndex], content: newContent };
      onUpdate({ ...data, slides: newSlides });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="aspect-video flex flex-col justify-between overflow-hidden"
          >
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-gray-400">
        Enter a prompt and click generate to see slides here.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className={cn("space-y-8 p-4 pb-20", font)}>
        {/* Title Slide */}
        <div className="w-full flex justify-center">
          <ScaledSlide>
            <div id="slide-title" className="w-full h-full pptx-slide-export">
              <Card
                className={cn(
                  "w-full h-full flex flex-col justify-center items-center text-center p-12 shadow-xl border-t-8",
                  isDarkMode ? "bg-black text-white" : "bg-white",
                )}
                style={{ borderTopColor: color }}
              >
                <h1 className="text-5xl font-bold mb-6" style={{ color }}>
                  <EditableText
                    initialValue={data.title}
                    onSave={handleUpdateTitle}
                    style={{ color }}
                    className="inline-block min-w-50"
                    color={color}
                  />
                </h1>
                {data.subtitle && (
                  <div
                    className={cn(
                      "text-2xl font-light tracking-wide",
                      isDarkMode ? "text-gray-300" : "text-gray-500",
                    )}
                  >
                    <EditableText
                      initialValue={data.subtitle}
                      onSave={handleUpdateSubtitle}
                    />
                  </div>
                )}
                <div
                  className="mt-12 h-1 w-24 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </Card>
            </div>
          </ScaledSlide>
        </div>

        {/* Content Slides */}
        <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto w-full">
          {data.slides.map((slide, index) => (
            <ScaledSlide key={index}>
              <div
                id={`slide-${index}`}
                className="pptx-slide-export w-full h-full"
              >
                <Card
                  className={cn(
                    "w-full h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow border-t-4",
                    isDarkMode ? "bg-black text-white" : "bg-white",
                  )}
                  style={{ borderTopColor: color }}
                >
                  <CardHeader
                    className={cn(
                      "pb-4 pt-8 px-12",
                      isDarkMode ? "bg-black" : "bg-white",
                    )}
                  >
                    <CardTitle className="text-3xl font-bold" style={{ color }}>
                      <EditableText
                        initialValue={slide.title}
                        onSave={(val) => handleUpdateSlideTitle(index, val)}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 px-12 pb-8 flex items-center">
                    {slide.layout === "two_column" ? (
                      <div className="grid grid-cols-2 gap-12 w-full">
                        <ul className="list-disc pl-5 space-y-4">
                          {slide.content
                            .slice(0, Math.ceil(slide.content.length / 2))
                            .map((point: string, i: number) => (
                              <li
                                key={i}
                                className={cn(
                                  "text-lg leading-relaxed",
                                  isDarkMode
                                    ? "text-gray-300"
                                    : "text-gray-700",
                                )}
                              >
                                <EditableText
                                  initialValue={point}
                                  onSave={(val) =>
                                    handleUpdateSlideContent(index, i, val)
                                  }
                                  as="textarea"
                                />
                              </li>
                            ))}
                        </ul>
                        <ul className="list-disc pl-5 space-y-4">
                          {slide.content
                            .slice(Math.ceil(slide.content.length / 2))
                            .map((point: string, i: number) => {
                              const trueIndex =
                                i + Math.ceil(slide.content.length / 2);
                              return (
                                <li
                                  key={trueIndex}
                                  className={cn(
                                    "text-lg leading-relaxed",
                                    isDarkMode
                                      ? "text-gray-300"
                                      : "text-gray-700",
                                  )}
                                >
                                  <EditableText
                                    initialValue={point}
                                    onSave={(val) =>
                                      handleUpdateSlideContent(
                                        index,
                                        trueIndex,
                                        val,
                                      )
                                    }
                                    as="textarea"
                                  />
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    ) : slide.layout === "image_and_text" ? (
                      <div className="grid grid-cols-2 gap-8 w-full h-80 items-center">
                        <div className="relative w-full h-full min-h-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {slide.imageUrl ? (
                            <img
                              src={slide.imageUrl}
                              alt={slide.imagePrompt || "Slide image"}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground p-4 text-center h-full w-full bg-gray-100 dark:bg-gray-800 animate-pulse">
                              <div className="h-8 w-8 border-4 border-current border-t-transparent rounded-full animate-spin mb-4 opacity-50" />
                              <p className="text-sm font-medium">
                                Generating Image...
                              </p>
                              <p className="text-xs mt-1 opacity-50 truncate max-w-50 mx-auto">
                                {slide.imagePrompt}
                              </p>
                            </div>
                          )}
                        </div>
                        <ul className="list-disc pl-5 space-y-4">
                          {slide.content.map((point: string, i: number) => (
                            <li
                              key={i}
                              className={cn(
                                "text-lg leading-relaxed",
                                isDarkMode ? "text-gray-300" : "text-gray-700",
                              )}
                            >
                              <EditableText
                                initialValue={point}
                                onSave={(val) =>
                                  handleUpdateSlideContent(index, i, val)
                                }
                                as="textarea"
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <ul className="list-disc pl-5 space-y-4 w-full">
                        {slide.content.map((point: string, i: number) => (
                          <li
                            key={i}
                            className={cn(
                              "text-xl leading-relaxed",
                              isDarkMode ? "text-gray-300" : "text-gray-700",
                            )}
                          >
                            <EditableText
                              initialValue={point}
                              onSave={(val) =>
                                handleUpdateSlideContent(index, i, val)
                              }
                              as="textarea"
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                  <div
                    className={cn(
                      "h-4 w-full flex items-center justify-between px-6 text-[10px]",
                      isDarkMode
                        ? "bg-gray-900/50 text-gray-500"
                        : "bg-gray-50 text-gray-300",
                    )}
                  >
                    <span>
                      {index + 1} / {data.slides.length}
                    </span>
                    <span>AI Generated Mockup</span>
                  </div>
                </Card>
              </div>
            </ScaledSlide>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
