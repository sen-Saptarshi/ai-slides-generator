import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { presentationSchema } from "./schema/ppt-schema";

export async function generateSlide(topic: string) {
  try {
    const { output } = await generateText({
      model: google("gemini-2.5-flash"),
      output: Output.object({
        schema: presentationSchema,
      }),
      prompt: `Generate a complete presentation with 6 to 10 slides on the topic: ${topic}.
          The response must match the given schema.
          1. "title": The main title of the presentation.
          2. "subtitle": A catchy subtitle.
          3. "slides": An array of slide objects.
             Each slide must have:
             - "title": The title of the specific slide.
             - "content": An array of bullet points (limit to 3-5 concise points per slide).
             - "layout": Choose best fit from "text" (standard), "title_only" (for emphasis), "two_column" (for comparisons or dense data).
             - "imagePrompt": A descriptive prompt for an image if relevant (optional).

          Ensure the content is engaging, professional, and follows a logical structure.
          Keep text concise for a minimalist aesthetic.`,
    });

    return output;
  } catch (error) {
    console.error("Error generating slide:", error);
    throw error;
  }
}
