import { generateSlide } from "@/lib/generate-slide";
import { google } from "@ai-sdk/google";
import { generateImage, generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const res = await generateSlide(prompt);
    return Response.json(res);
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to generate slides" },
      { status: 500 },
    );
  }
}