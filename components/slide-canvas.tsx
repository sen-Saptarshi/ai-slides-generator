"use client";

import { type CSSProperties } from "react";
import { z } from "zod";
import { presentationSchema } from "@/lib/schema/ppt-schema";
import { EditableText } from "@/components/editable-text";
import { cn, SLIDE_H, SLIDE_W } from "@/lib/utils";
import { ImageIcon, Loader2 } from "lucide-react";

export type Presentation = z.infer<typeof presentationSchema>;
export type Slide = Presentation["slides"][number];

export interface SlideEditHandlers {
  onTitle?: (value: string) => void;
  onSubtitle?: (value: string) => void;
  onSlideTitle?: (value: string) => void;
  onSlideContent?: (contentIndex: number, value: string) => void;
}

interface BaseProps {
  color: string;
  isDarkMode?: boolean;
  editable?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

interface TitleSlideProps extends BaseProps {
  kind: "title";
  title: string;
  subtitle?: string;
  handlers?: SlideEditHandlers;
}

interface ContentSlideProps extends BaseProps {
  kind: "content";
  slide: Slide;
  index: number;
  total: number;
  deckTitle?: string;
  handlers?: SlideEditHandlers;
}

export type SlideCanvasProps = TitleSlideProps | ContentSlideProps;

function TextOrEdit({
  value,
  editable,
  onSave,
  as = "input",
  className,
  style,
  color,
}: {
  value: string;
  editable?: boolean;
  onSave?: (v: string) => void;
  as?: "input" | "textarea";
  className?: string;
  style?: CSSProperties;
  color?: string;
}) {
  if (editable && onSave) {
    return (
      <EditableText
        initialValue={value}
        onSave={onSave}
        as={as}
        className={className}
        style={style}
        color={color}
      />
    );
  }
  return (
    <span className={className} style={{ ...style, color }}>
      {value}
    </span>
  );
}

function BulletList({
  items,
  startIndex = 0,
  editable,
  isDarkMode,
  size = "md",
  onContent,
}: {
  items: string[];
  startIndex?: number;
  editable?: boolean;
  isDarkMode?: boolean;
  size?: "md" | "lg";
  onContent?: (contentIndex: number, value: string) => void;
}) {
  return (
    <ul className="list-none space-y-4 w-full">
      {items.map((point, i) => {
        const idx = startIndex + i;
        return (
          <li
            key={idx}
            className={cn(
              "flex gap-3 leading-relaxed",
              size === "lg" ? "text-[22px]" : "text-lg",
              isDarkMode ? "text-zinc-300" : "text-zinc-700",
            )}
          >
            <span
              className={cn(
                "mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full",
                isDarkMode ? "bg-zinc-500" : "bg-zinc-400",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <TextOrEdit
                value={point}
                editable={editable}
                onSave={
                  onContent ? (v) => onContent(idx, v) : undefined
                }
                as="textarea"
                className="w-full"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function SlideCanvas(props: SlideCanvasProps) {
  const {
    color,
    isDarkMode = false,
    editable = false,
    className,
    style,
    id,
  } = props;

  const shell = cn(
    "relative flex h-full w-full flex-col overflow-hidden rounded-xl border shadow-2xl",
    isDarkMode
      ? "border-zinc-800 bg-zinc-950 text-white"
      : "border-zinc-200/80 bg-white text-zinc-900",
    className,
  );

  const accentBar = (
    <div
      className="absolute inset-x-0 top-0 h-1.5"
      style={{ backgroundColor: color }}
    />
  );

  if (props.kind === "title") {
    return (
      <div
        id={id}
        className={shell}
        style={{ width: SLIDE_W, height: SLIDE_H, ...style }}
      >
        {accentBar}
        <div className="flex h-full flex-col items-center justify-center px-16 text-center">
          <div
            className="mb-8 h-1 w-16 rounded-full opacity-80"
            style={{ backgroundColor: color }}
          />
          <h1 className="mb-5 max-w-[90%] text-5xl font-bold tracking-tight">
            <TextOrEdit
              value={props.title}
              editable={editable}
              onSave={props.handlers?.onTitle}
              style={{ color }}
              color={color}
              className="inline-block max-w-full"
            />
          </h1>
          {props.subtitle ? (
            <p
              className={cn(
                "max-w-[80%] text-2xl font-light tracking-wide",
                isDarkMode ? "text-zinc-400" : "text-zinc-500",
              )}
            >
              <TextOrEdit
                value={props.subtitle}
                editable={editable}
                onSave={props.handlers?.onSubtitle}
              />
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const { slide, index, total, deckTitle, handlers } = props;
  const mid = Math.ceil(slide.content.length / 2);

  return (
    <div
      id={id}
      className={shell}
      style={{ width: SLIDE_W, height: SLIDE_H, ...style }}
    >
      {accentBar}
      <div className="flex min-h-0 flex-1 flex-col px-12 pb-4 pt-10">
        {slide.layout !== "title_only" ? (
          <h2 className="mb-6 shrink-0 text-3xl font-bold tracking-tight">
            <TextOrEdit
              value={slide.title}
              editable={editable}
              onSave={handlers?.onSlideTitle}
              style={{ color }}
              color={color}
            />
          </h2>
        ) : null}

        <div className="flex min-h-0 flex-1 items-center">
          {slide.layout === "title_only" ? (
            <div className="flex w-full flex-col items-center justify-center gap-6 text-center">
              <h2 className="max-w-[90%] text-5xl font-bold tracking-tight">
                <TextOrEdit
                  value={slide.title}
                  editable={editable}
                  onSave={handlers?.onSlideTitle}
                  style={{ color }}
                  color={color}
                />
              </h2>
              {slide.content[0] ? (
                <p
                  className={cn(
                    "max-w-[70%] text-xl font-light",
                    isDarkMode ? "text-zinc-400" : "text-zinc-500",
                  )}
                >
                  <TextOrEdit
                    value={slide.content[0]}
                    editable={editable}
                    onSave={
                      handlers?.onSlideContent
                        ? (v) => handlers.onSlideContent!(0, v)
                        : undefined
                    }
                    as="textarea"
                  />
                </p>
              ) : null}
            </div>
          ) : slide.layout === "two_column" ? (
            <div className="grid w-full grid-cols-2 gap-10">
              <BulletList
                items={slide.content.slice(0, mid)}
                startIndex={0}
                editable={editable}
                isDarkMode={isDarkMode}
                onContent={handlers?.onSlideContent}
              />
              <BulletList
                items={slide.content.slice(mid)}
                startIndex={mid}
                editable={editable}
                isDarkMode={isDarkMode}
                onContent={handlers?.onSlideContent}
              />
            </div>
          ) : slide.layout === "image_and_text" ? (
            <div className="grid h-full max-h-[340px] w-full grid-cols-2 gap-8 items-center">
              <div
                className={cn(
                  "relative h-full min-h-[280px] overflow-hidden rounded-lg",
                  isDarkMode ? "bg-zinc-900" : "bg-zinc-100",
                )}
              >
                {slide.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.imageUrl}
                    alt={slide.imagePrompt || "Slide image"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      "flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center",
                      isDarkMode ? "text-zinc-500" : "text-zinc-400",
                    )}
                  >
                    {slide.imagePrompt ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin opacity-60" />
                        <p className="text-sm font-medium">Generating image…</p>
                        <p className="line-clamp-2 max-w-[90%] text-xs opacity-60">
                          {slide.imagePrompt}
                        </p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 opacity-40" />
                        <p className="text-sm">No image</p>
                      </>
                    )}
                  </div>
                )}
              </div>
              <BulletList
                items={slide.content}
                editable={editable}
                isDarkMode={isDarkMode}
                onContent={handlers?.onSlideContent}
              />
            </div>
          ) : (
            <BulletList
              items={slide.content}
              editable={editable}
              isDarkMode={isDarkMode}
              size="lg"
              onContent={handlers?.onSlideContent}
            />
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex h-9 shrink-0 items-center justify-between border-t px-6 text-[11px] tracking-wide",
          isDarkMode
            ? "border-zinc-800 bg-zinc-900/60 text-zinc-500"
            : "border-zinc-100 bg-zinc-50 text-zinc-400",
        )}
      >
        <span>
          {index + 1} / {total}
        </span>
        <span className="truncate max-w-[60%]">{deckTitle}</span>
      </div>
    </div>
  );
}
