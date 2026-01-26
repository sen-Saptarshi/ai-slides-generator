"use server";

export async function generateImage(
  prompt: string,
  width: number = 512,
  height: number = 512,
//   steps: number = 50,
) {
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("width", width.toString());
  formData.append("height", height.toString());
//   formData.append("steps", "4");

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        // Note: Content-Type is intentionally removed here.
        // When using FormData, the browser automatically sets the correct Content-Type with the boundary.
      },
      body: formData,
    },
  );

  console.log(res);

  if (!res.ok) {
    throw new Error("Failed to generate image", { cause: await res.json() });
  }

  return res.json();
}
