export const formats = [
  {
    id: "square",
    name: "Post kwadratowy",
    platforms: "Instagram · Facebook",
    width: 1080,
    height: 1080,
  },
  {
    id: "portrait",
    name: "Post pionowy",
    platforms: "Instagram · Facebook",
    width: 1080,
    height: 1350,
  },
  {
    id: "story",
    name: "Story / Reels",
    platforms: "Instagram · Facebook",
    width: 1080,
    height: 1920,
  },
  {
    id: "landscape",
    name: "Post poziomy",
    platforms: "LinkedIn · X",
    width: 1200,
    height: 628,
  },
] as const;

export type GraphicFormat = (typeof formats)[number];
export interface GraphicContent {
  title: string;
  detail: string;
  photo: HTMLImageElement | null;
  focalX: number;
  focalY: number;
}

// Preview and download use the exact same pixels, without DOM screenshots or SVG foreignObject.
export async function loadGraphicFonts() {
  const loaded = await Promise.all([
    document.fonts.load('600 64px "Poppins"', "Zażółć gęślą jaźń"),
    document.fonts.load('400 28px "Roboto"', "Zażółć gęślą jaźń"),
  ]);
  if (loaded.some((fonts) => fonts.length === 0))
    throw new Error(
      "Nie udało się wczytać fontów. Odśwież stronę i spróbuj ponownie.",
    );
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  width: number,
) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (context.measureText(word).width > width)
        throw new Error("Zbyt długie słowo. Dodaj spację lub podział wiersza.");
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width > width) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    lines.push(line);
  }
  return lines;
}

export function renderGraphic(
  content: GraphicContent,
  format: GraphicFormat,
): HTMLCanvasElement {
  if (!content.title.trim())
    throw new Error("Wpisz nagłówek, aby przygotować grafikę.");
  if (content.title.length > 90 || content.detail.length > 140)
    throw new Error(
      "Skróć treść przed eksportem: nagłówek do 90, szczegóły do 140 znaków.",
    );
  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Ta przeglądarka nie obsługuje generowania grafik.");
  const { width, height } = format;
  const landscape = width > height;
  const margin = 64;
  const textWidth = landscape ? 640 : width - margin * 2;
  const titleSize = landscape ? 48 : 64;
  const titleY = landscape ? 154 : 196;
  context.fillStyle = "#173e48";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#d9f3e8";
  context.font = '400 23px "Roboto"';
  context.textBaseline = "top";
  context.fillText("GENERACJA INNOWACJA", margin, margin);
  context.font = `600 ${titleSize}px "Poppins"`;
  const titleLines = wrapText(context, content.title, textWidth);
  if (titleLines.length > (landscape ? 3 : 4))
    throw new Error(
      `${format.name}: nagłówek zajmuje za dużo miejsca. Skróć treść.`,
    );
  for (const [index, line] of titleLines.entries())
    context.fillText(line, margin, titleY + index * titleSize * 1.3);
  const detailY = titleY + titleLines.length * titleSize * 1.3 + 28;
  context.fillStyle = "#ffffff";
  context.font = '400 28px "Roboto"';
  const detailLines = wrapText(context, content.detail, textWidth);
  if (detailLines.length > 3)
    throw new Error(
      `${format.name}: szczegóły zajmują za dużo miejsca. Skróć treść.`,
    );
  for (const [index, line] of detailLines.entries())
    context.fillText(line, margin, detailY + index * 38);
  if (landscape && detailY + detailLines.length * 38 > height - 105)
    throw new Error(
      `${format.name}: treść nie mieści się w układzie. Skróć ją przed eksportem.`,
    );
  const imageX = landscape ? 780 : margin;
  const imageY = landscape
    ? 64
    : Math.max(height * 0.57, detailY + detailLines.length * 38 + 36);
  const imageWidth = width - imageX - margin;
  const imageHeight = height - imageY - 116;
  if (imageHeight < 90)
    throw new Error(
      `${format.name}: treść nie mieści się w układzie. Skróć ją przed eksportem.`,
    );
  context.save();
  context.beginPath();
  context.rect(imageX, imageY, imageWidth, imageHeight);
  context.clip();
  if (content.photo) {
    const photo = content.photo;
    const scale = Math.max(
      imageWidth / photo.naturalWidth,
      imageHeight / photo.naturalHeight,
    );
    const cropWidth = imageWidth / scale;
    const cropHeight = imageHeight / scale;
    context.drawImage(
      photo,
      ((photo.naturalWidth - cropWidth) * content.focalX) / 100,
      ((photo.naturalHeight - cropHeight) * content.focalY) / 100,
      cropWidth,
      cropHeight,
      imageX,
      imageY,
      imageWidth,
      imageHeight,
    );
  } else {
    context.fillStyle = "#286272";
    context.fillRect(imageX, imageY, imageWidth, imageHeight);
    context.strokeStyle = "#aee5ce";
    context.lineWidth = 32;
    for (let i = 0; i < 4; i++) {
      context.beginPath();
      context.arc(
        imageX + imageWidth * 0.66,
        imageY + imageHeight * 0.65,
        70 + i * 76,
        0,
        Math.PI * 2,
      );
      context.stroke();
    }
  }
  context.restore();
  context.font = '400 22px "Roboto"';
  context.fillStyle = "#d9f3e8";
  context.fillText("gi.org.pl", margin, height - 64);
  context.textAlign = "right";
  context.fillText("UKŁAD TESTOWY · POC", width - margin, height - 64);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Nie udało się zapisać PNG. Spróbuj ponownie."));
    }, "image/png"),
  );
}
