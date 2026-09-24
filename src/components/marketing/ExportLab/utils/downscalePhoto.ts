import { PHOTO_MAX_EDGE } from "../ExportLab.constants";

const JPEG_QUALITY = 0.92;

/**
 * Shrinks the photo to what templates can show, so every later preview embeds
 * a small image regardless of the camera's resolution. Smaller photos are
 * returned untouched to avoid a needless re-encode.
 */
export async function downscalePhoto(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(
      1,
      PHOTO_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight),
    );
    if (scale === 1) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Ta przeglądarka nie obsługuje canvasu.");
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    // JPEG stays JPEG; PNG and WebP go to PNG to keep transparency.
    const type = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, JPEG_QUALITY),
    );
    // Frees the bitmap now; iOS counts canvas memory until garbage collection.
    canvas.width = 0;
    canvas.height = 0;
    if (!blob) throw new Error("Nie udało się zmniejszyć zdjęcia.");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
