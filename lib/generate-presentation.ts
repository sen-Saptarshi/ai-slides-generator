import { presentationSchema } from "@/lib/schema/ppt-schema";
import { requestSlideImage } from "@/lib/slide-image";
import {
  savePresentation,
  type PresentationData,
} from "@/lib/presentation-store";

/** Generate deck structure from topic prompt. */
export async function generatePresentation(
  topic: string,
): Promise<PresentationData> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: topic }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate presentation");
  }

  const result = await response.json();
  if (result?.error) throw new Error(result.error);

  const parsed = presentationSchema.safeParse(result.object ?? result);
  if (!parsed.success) {
    throw new Error("Invalid presentation data from model");
  }
  return parsed.data;
}

export function applyImageToSlide(
  prev: PresentationData,
  index: number,
  imageUrl: string,
): PresentationData {
  const slides = [...prev.slides];
  if (!slides[index] || slides[index].imageUrl) return prev;
  slides[index] = { ...slides[index], imageUrl };
  const next = { ...prev, slides };
  savePresentation(next);
  return next;
}

/** Fill missing slide images; merges via setData for race safety. */
export function startBackgroundImages(
  data: PresentationData,
  setData: (
    updater: (
      prev: PresentationData | undefined,
    ) => PresentationData | undefined,
  ) => void,
) {
  data.slides.forEach((slide, index) => {
    if (
      slide.layout !== "image_and_text" ||
      !slide.imagePrompt ||
      slide.imageUrl
    ) {
      return;
    }
    void (async () => {
      try {
        const imageUrl = await requestSlideImage(slide.imagePrompt!);
        setData((prev) => {
          if (!prev) return prev;
          return applyImageToSlide(prev, index, imageUrl);
        });
      } catch (err) {
        console.error(`Image failed for slide ${index}`, err);
      }
    })();
  });
}
