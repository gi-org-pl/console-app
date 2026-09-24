import type { GraphicFormat, GraphicTemplate } from "./ExportLab.types";
import { STANDARD_TEMPLATE } from "./templates/StandardTemplate/StandardTemplate.constants";

export const GRAPHIC_FORMATS: readonly GraphicFormat[] = [
  {
    id: "square",
    name: "Post kwadratowy",
    ratio: "1:1",
    width: 1080,
    height: 1080,
  },
  {
    id: "portrait",
    name: "Post pionowy",
    ratio: "4:5",
    width: 1080,
    height: 1350,
  },
  {
    id: "story",
    name: "Story / Reels",
    ratio: "9:16",
    width: 1080,
    height: 1920,
  },
  {
    id: "landscape",
    name: "Post poziomy",
    ratio: "1,91:1",
    width: 1200,
    height: 628,
  },
];

/** Adding a template: create its folder under `templates/` and list it here. */
export const GRAPHIC_TEMPLATES: readonly GraphicTemplate[] = [
  STANDARD_TEMPLATE,
];

export const PHOTO_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Longest photo edge kept after upload: twice the widest format, so crops stay sharp. */
export const PHOTO_MAX_EDGE = 2160;

/** Displayed size in px of the template thumbnails. */
export const THUMBNAIL_SIZE = 72;
export const THUMBNAIL_DEBOUNCE_MS = 600;
