"use client";

import { type CSSProperties } from "react";
import { z } from "zod";
import {
  presentationSchema,
  type Annotation,
} from "@/lib/schema/ppt-schema";
import { EditableText } from "@/components/editable-text";
import { SlideImageSlot } from "@/components/slide-image-slot";
import { AnnotationLayer } from "@/components/annotations/annotation-layer";
import { SlideDecor } from "@/components/slide-decor";
import { ensureAnnotations } from "@/lib/annotations";
import {
  DEFAULT_TEMPLATE,
  getTemplateStyle,
  type BulletMarker,
  type SlideTemplateId,
  type TemplateStyle,
} from "@/lib/slide-templates";
import { cn, SLIDE_H, SLIDE_W } from "@/lib/utils";

export type Presentation = z.infer<typeof presentationSchema>;
export type Slide = Presentation["slides"][number];

export interface SlideEditHandlers {
  onTitle?: (value: string) => void;
  onSubtitle?: (value: string) => void;
  onSlideTitle?: (value: string) => void;
  onSlideContent?: (contentIndex: number, value: string) => void;
  onSlideImage?: (next: { imageUrl: string; imagePrompt: string }) => void;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
}

interface BaseProps {
  color: string;
  darkSlides?: boolean;
  template?: SlideTemplateId;
  /** User font class from FontPicker; empty = use template defaultFont. */
  fontClass?: string;
  editable?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
  annotations?: Annotation[];
  selectedAnnotationId?: string | null;
  onSelectAnnotation?: (id: string | null) => void;
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
  marker,
  accent,
  bodyClass,
  onContent,
}: {
  items: string[];
  startIndex?: number;
  editable?: boolean;
  marker: BulletMarker;
  accent: string;
  bodyClass: string;
  onContent?: (contentIndex: number, value: string) => void;
}) {
  return (
    <ul className="w-full list-none space-y-4">
      {items.map((point, i) => {
        const idx = startIndex + i;
        const n = idx + 1;
        return (
          <li key={idx} className={cn("flex gap-3", bodyClass)}>
            {marker === "dot" && (
              <span
                className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
            )}
            {marker === "bar" && (
              <span
                className="mt-1.5 h-5 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
            )}
            {marker === "dash" && (
              <span
                className="mt-[0.7em] h-px w-3 shrink-0"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
            )}
            {marker === "number" && (
              <span
                className="mt-0.5 w-6 shrink-0 text-sm font-bold tabular-nums"
                style={{ color: accent }}
                aria-hidden
              >
                {String(n).padStart(2, "0")}
              </span>
            )}
            {marker === "none" && (
              <span className="w-0 shrink-0" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <TextOrEdit
                value={point}
                editable={editable}
                onSave={onContent ? (v) => onContent(idx, v) : undefined}
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

function TitleRule({
  kind,
  accent,
}: {
  kind: TemplateStyle["titleRule"];
  accent: string;
}) {
  if (kind === "none") return null;
  if (kind === "pill") {
    return (
      <div
        className="mb-8 h-1 w-16 rounded-full opacity-90"
        style={{ backgroundColor: accent }}
      />
    );
  }
  if (kind === "double") {
    return (
      <div className="mb-8 flex w-28 flex-col gap-1">
        <div className="h-px w-full" style={{ backgroundColor: accent }} />
        <div
          className="h-px w-full opacity-50"
          style={{ backgroundColor: accent }}
        />
      </div>
    );
  }
  return (
    <div
      className="mb-8 h-px w-16"
      style={{ backgroundColor: accent }}
    />
  );
}

function ContentTitleRule({
  kind,
  accent,
}: {
  kind: TemplateStyle["contentTitleRule"];
  accent: string;
}) {
  if (kind === "none") return null;
  if (kind === "accent-underline") {
    return (
      <div
        className="mt-3 h-1 w-14 rounded-full"
        style={{ backgroundColor: accent }}
      />
    );
  }
  return (
    <div
      className="mt-3 h-px w-full max-w-[120px] opacity-60"
      style={{ backgroundColor: accent }}
    />
  );
}

export function SlideCanvas(props: SlideCanvasProps) {
  const {
    color,
    darkSlides = false,
    template = DEFAULT_TEMPLATE,
    fontClass = "",
    editable = false,
    className,
    style,
    id,
    annotations,
    selectedAnnotationId = null,
    onSelectAnnotation,
  } = props;

  const ts = getTemplateStyle(template, darkSlides);
  const anns = ensureAnnotations(annotations);
  const annotationLayer = (
    <AnnotationLayer
      annotations={anns}
      editable={editable}
      selectedId={selectedAnnotationId}
      onSelect={onSelectAnnotation}
      onChange={props.handlers?.onAnnotationsChange}
    />
  );

  // User font always wins. Template defaultFont only when no user font chosen.
  const resolvedFont = fontClass?.trim() ? fontClass : ts.defaultFont;

  const shell = cn(
    "relative flex h-full w-full flex-col overflow-hidden",
    ts.shell,
    resolvedFont,
    className,
  );

  const sideBar = ts.showSideBar ? (
    <div
      className="absolute inset-y-0 left-0 z-10"
      style={{ width: ts.sideBarWidth, backgroundColor: color }}
      aria-hidden
    />
  ) : null;

  const topBar = ts.showTopBar ? (
    <div
      className="absolute inset-x-0 top-0 z-10 h-1.5"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  ) : null;

  if (props.kind === "title") {
    const alignClass =
      ts.titleAlign === "center"
        ? "items-center justify-center text-center"
        : ts.titleAlign === "bottom-left"
          ? "items-start justify-end text-left"
          : "items-start justify-center text-left";

    return (
      <div
        id={id}
        className={shell}
        style={{ width: SLIDE_W, height: SLIDE_H, ...style }}
      >
        <SlideDecor
          style={ts}
          accent={color}
          dark={darkSlides}
          kind="title"
        />
        {topBar}
        {sideBar}
        <div
          className={cn(
            "relative z-[1] flex h-full flex-col",
            ts.titlePad,
            alignClass,
            ts.showSideBar && "pl-8",
          )}
          onPointerDown={() => {
            if (editable) onSelectAnnotation?.(null);
          }}
        >
          {ts.titleAlign === "center" && (
            <TitleRule kind={ts.titleRule} accent={color} />
          )}
          <h1 className={cn("mb-5 max-w-[90%]", ts.titleHeading)}>
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
            <p className={cn("max-w-[80%]", ts.subtitle)}>
              <TextOrEdit
                value={props.subtitle}
                editable={editable}
                onSave={props.handlers?.onSubtitle}
              />
            </p>
          ) : null}
          {ts.titleAlign === "bottom-left" && (
            <div
              className="mt-8 h-1.5 w-20"
              style={{ backgroundColor: color }}
            />
          )}
        </div>
        {annotationLayer}
      </div>
    );
  }

  const { slide, index, total, deckTitle, handlers } = props;
  const mid = Math.ceil(slide.content.length / 2);
  const bodyCls = ts.body;
  const bodyLg = ts.bodyLg;

  return (
    <div
      id={id}
      className={shell}
      style={{ width: SLIDE_W, height: SLIDE_H, ...style }}
    >
      <SlideDecor
        style={ts}
        accent={color}
        dark={darkSlides}
        kind="content"
      />
      {topBar}
      {sideBar}
      <div
        className={cn(
          "relative z-[1] flex min-h-0 flex-1 flex-col",
          ts.contentPad,
          ts.showSideBar && "pl-6",
        )}
        onPointerDown={() => {
          if (editable) onSelectAnnotation?.(null);
        }}
      >
        {slide.layout !== "title_only" ? (
          <div className="mb-5 shrink-0">
            <h2 className={ts.contentHeading}>
              <TextOrEdit
                value={slide.title}
                editable={editable}
                onSave={handlers?.onSlideTitle}
                style={{ color }}
                color={color}
              />
            </h2>
            <ContentTitleRule kind={ts.contentTitleRule} accent={color} />
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 items-center">
          {slide.layout === "title_only" ? (
            <div className="flex w-full flex-col items-center justify-center gap-6 text-center">
              <h2 className={cn("max-w-[90%]", ts.titleOnlyHeading)}>
                <TextOrEdit
                  value={slide.title}
                  editable={editable}
                  onSave={handlers?.onSlideTitle}
                  style={{ color }}
                  color={color}
                />
              </h2>
              <TitleRule kind={ts.titleRule} accent={color} />
              {slide.content[0] ? (
                <p className={cn("max-w-[70%]", ts.subtitle)}>
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
                marker={ts.bulletMarker}
                accent={color}
                bodyClass={bodyCls}
                onContent={handlers?.onSlideContent}
              />
              <BulletList
                items={slide.content.slice(mid)}
                startIndex={mid}
                editable={editable}
                marker={ts.bulletMarker}
                accent={color}
                bodyClass={bodyCls}
                onContent={handlers?.onSlideContent}
              />
            </div>
          ) : slide.layout === "image_and_text" ? (
            <div className="grid h-full max-h-[340px] w-full grid-cols-2 items-center gap-8">
              <div className={cn("h-full min-h-0 overflow-hidden", ts.imageRadius)}>
                <SlideImageSlot
                  imageUrl={slide.imageUrl}
                  imagePrompt={slide.imagePrompt}
                  darkSlides={darkSlides}
                  editable={editable}
                  onUpdate={handlers?.onSlideImage}
                />
              </div>
              <BulletList
                items={slide.content}
                editable={editable}
                marker={ts.bulletMarker}
                accent={color}
                bodyClass={bodyCls}
                onContent={handlers?.onSlideContent}
              />
            </div>
          ) : (
            <BulletList
              items={slide.content}
              editable={editable}
              marker={ts.bulletMarker}
              accent={color}
              bodyClass={bodyLg}
              onContent={handlers?.onSlideContent}
            />
          )}
        </div>
      </div>

      <div
        className={cn(
          "relative z-[1] flex shrink-0 items-center justify-between border-t",
          ts.footer,
          ts.footerBorder,
        )}
      >
        <span>
          {index + 1} / {total}
        </span>
        <span className="max-w-[60%] truncate">{deckTitle}</span>
      </div>
      {annotationLayer}
    </div>
  );
}
