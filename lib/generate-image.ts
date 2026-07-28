"use server";

import { SLIDE_IMAGE_HEIGHT, SLIDE_IMAGE_WIDTH } from "@/lib/image-size";

/** Snap to multiples of 8 (Flux / Workers AI often require this). */
function snapDim(n: number, fallback: number) {
  const v = Number.isFinite(n) ? Math.round(n) : fallback;
  const clamped = Math.min(1024, Math.max(256, v));
  return Math.round(clamped / 8) * 8;
}

export async function generateImage(
  prompt: string,
  width: number = SLIDE_IMAGE_WIDTH,
  height: number = SLIDE_IMAGE_HEIGHT,
) {
  const w = snapDim(width, SLIDE_IMAGE_WIDTH);
  const h = snapDim(height, SLIDE_IMAGE_HEIGHT);

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("width", String(w));
  formData.append("height", String(h));

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: formData,
    },
  );

  if (!res.ok) {
    throw new Error("Failed to generate image", { cause: await res.json() });
  }

  return res.json();
}
