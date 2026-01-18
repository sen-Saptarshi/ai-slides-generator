import { z } from 'zod';

export const presentationSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  slides: z.array(z.object({
    title: z.string(),
    content: z.array(z.string()).describe("Bullet points for the slide"),
    layout: z.enum(["text", "title_only", "two_column"]),
    imagePrompt: z.string().optional().describe("Prompt for an image if the slide needs one")
  }))
});