import pptxgen from "pptxgenjs";
import { presentationSchema } from "./schema/ppt-schema";
import { z } from "zod";

type Presentation = z.infer<typeof presentationSchema>;

// Helper for consistent text styling
const baseText = {
  fontFace: "Arial",
  color: "2c2c2c",
};

export const createPptx = (data: Presentation, themeColor: string) => {
  const pres = new pptxgen();

  // Simple, wide canvas (16:9 is default). Keep a light neutral background.
  pres.layout = "LAYOUT_16x9";

  pres.defineSlideMaster({
    title: "MASTER_SLIDE",
    background: { color: "F9FAFB" },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.18, fill: { color: themeColor } } },
    ],
    slideNumber: { x: 9.1, y: 5.1, color: "9CA3AF", fontSize: 10 },
  });

  // Title Slide (centered, roomy)
  const titleSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
  titleSlide.addText(data.title, {
    ...baseText,
    x: 0.9,
    y: 1.6,
    w: 8.2,
    fontSize: 44,
    bold: true,
    align: "center",
    color: themeColor,
  });

  if (data.subtitle) {
    titleSlide.addText(data.subtitle, {
      ...baseText,
      x: 1,
      y: 2.8,
      w: 8,
      fontSize: 24,
      align: "center",
      color: "4B5563",
    });
  }

  // Clamp slides to a reasonable max to avoid huge decks
  const slides = data.slides.slice(0, 12);

  slides.forEach((slideData, idx) => {
    const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });

    // Title
    slide.addText(slideData.title, {
      ...baseText,
      x: 0.8,
      y: 0.7,
      w: 8.4,
      fontSize: 32,
      bold: true,
      color: themeColor,
    });

    const contentY = 1.5;

    if (slideData.layout === "two_column") {
      const mid = Math.ceil(slideData.content.length / 2);
      const leftCol = slideData.content.slice(0, mid);
      const rightCol = slideData.content.slice(mid);

      slide.addText(leftCol.join("\n"), {
        ...baseText,
        x: 0.8,
        y: contentY,
        w: 4.2,
        fontSize: 18,
        bullet: true,
        lineSpacing: 22,
      });

      slide.addText(rightCol.join("\n"), {
        ...baseText,
        x: 5.3,
        y: contentY,
        w: 4.2,
        fontSize: 18,
        bullet: true,
        lineSpacing: 22,
      });
    } else if (slideData.layout === "title_only") {
      slide.addText(slideData.content?.join("\n") ?? "", {
        ...baseText,
        x: 1,
        y: contentY + 0.5,
        w: 8,
        fontSize: 20,
        align: "center",
        lineSpacing: 26,
      });
    } else {
      slide.addText(slideData.content.join("\n"), {
        ...baseText,
        x: 1,
        y: contentY,
        w: 8,
        fontSize: 20,
        bullet: true,
        lineSpacing: 24,
      });
    }

    // Footer hint (similar to preview)
    slide.addText(`Slide ${idx + 1} / ${slides.length} · AI generated mock`, {
      ...baseText,
      x: 0.9,
      y: 5.2,
      w: 8.2,
      fontSize: 10,
      color: "9CA3AF",
      align: "right",
    });
  });

  pres.writeFile({
    fileName: `${data.title.replace(/[^a-z0-9]/gi, "_")}.pptx`,
  });
};
