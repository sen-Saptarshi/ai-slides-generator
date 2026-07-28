import { z } from "zod";

export const annotationKindSchema = z.enum([
  "rect",
  "roundRect",
  "oval",
  "line",
  "arrow",
  "triangle",
  "star",
  "heart",
  "emoji",
]);

/** Shape/emoji overlay in design coords (960×540 slide). */
export const annotationSchema = z.object({
  id: z.string(),
  kind: annotationKindSchema,
  /** Top-left of bounding box (design px). */
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  /** Degrees, clockwise. */
  rotation: z.number().default(0),
  /** CSS color or "none". */
  fill: z.string().default("none"),
  stroke: z.string().default("#2563eb"),
  strokeWidth: z.number().default(3),
  /** Required when kind === "emoji". */
  emoji: z.string().optional(),
});

export const slideSchema = z.object({
  title: z.string(),
  content: z.array(z.string()).describe("Bullet points for the slide"),
  layout: z.enum(["text", "title_only", "two_column", "image_and_text"]),
  imagePrompt: z
    .string()
    .optional()
    .describe("Prompt for an image if the slide needs one"),
  imageUrl: z
    .string()
    .optional()
    .describe("URL or base64 of the generated image"),
  annotations: z.array(annotationSchema).optional().default([]),
});

export const presentationSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  /** Annotations on the title slide. */
  annotations: z.array(annotationSchema).optional().default([]),
  slides: z.array(slideSchema),
});

export type Annotation = z.infer<typeof annotationSchema>;
export type AnnotationKind = z.infer<typeof annotationKindSchema>;
