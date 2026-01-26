import { z } from "zod";

export const presentationSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  slides: z.array(
    z.object({
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
    }),
  ),
});
