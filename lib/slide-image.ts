import { SLIDE_IMAGE_HEIGHT, SLIDE_IMAGE_WIDTH } from "@/lib/image-size";

export { SLIDE_IMAGE_WIDTH, SLIDE_IMAGE_HEIGHT };

export async function requestSlideImage(
  prompt: string,
  opts?: { width?: number; height?: number },
): Promise<string> {
  const width = opts?.width ?? SLIDE_IMAGE_WIDTH;
  const height = opts?.height ?? SLIDE_IMAGE_HEIGHT;

  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, width, height }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.error === "string" ? body.error : "Image generation failed",
    );
  }

  const { imageUrl } = await res.json();
  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("No image returned");
  }
  return imageUrl;
}
