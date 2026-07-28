import { generateImage } from "@/lib/generate-image";
import { SLIDE_IMAGE_HEIGHT, SLIDE_IMAGE_WIDTH } from "@/lib/image-size";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return Response.json({ error: "Prompt required" }, { status: 400 });
    }

    const width =
      typeof body.width === "number" ? body.width : SLIDE_IMAGE_WIDTH;
    const height =
      typeof body.height === "number" ? body.height : SLIDE_IMAGE_HEIGHT;

    const res = await generateImage(prompt, width, height);

    if (res.success && res.result?.image) {
      return Response.json({
        imageUrl: `data:image/png;base64,${res.result.image}`,
      });
    }

    return Response.json(
      { error: "Failed to generate image" },
      { status: 500 },
    );
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Failed to generate image" },
      { status: 500 },
    );
  }
}
