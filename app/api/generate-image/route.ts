import { generateImage } from "@/lib/generate-image";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const res = await generateImage(prompt);

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
