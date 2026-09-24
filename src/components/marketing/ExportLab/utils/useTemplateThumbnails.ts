import { useEffect, useRef, useState } from "react";
import {
  GRAPHIC_FORMATS,
  THUMBNAIL_DEBOUNCE_MS,
  THUMBNAIL_SIZE,
} from "../ExportLab.constants";
import type {
  FieldValues,
  GraphicPhoto,
  GraphicTemplate,
} from "../ExportLab.types";
import { loadGraphicFonts } from "./loadGraphicFonts";
import { rasterizeGraphic } from "./rasterizeGraphic";
import { validateContent } from "./validateContent";

const SQUARE_FORMAT = GRAPHIC_FORMATS[0];
// Twice the displayed size keeps thumbnails sharp on high-density screens.
const THUMBNAIL_SCALE = (THUMBNAIL_SIZE * 2) / SQUARE_FORMAT.width;

/**
 * Small 1:1 PNGs of the templates that are not selected, drawn from the
 * current text and photo. The selected one reuses its square preview instead.
 */
export function useTemplateThumbnails(
  templates: readonly GraphicTemplate[],
  values: FieldValues,
  photo: GraphicPhoto | null,
  selectedId: string,
): Readonly<Record<string, string>> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const shownUrls = useRef<string[]>([]);

  useEffect(
    () => () => {
      for (const url of shownUrls.current) URL.revokeObjectURL(url);
    },
    [],
  );

  useEffect(() => {
    let isCancelled = false;
    const created: string[] = [];
    // Waits for a pause in typing, so thumbnails never compete with the previews.
    const timer = setTimeout(async () => {
      const next: Record<string, string> = {};
      await loadGraphicFonts().catch(() => undefined);
      for (const template of templates) {
        if (template.id === selectedId) continue;
        try {
          validateContent(template, values);
          const blob = await rasterizeGraphic(
            template,
            { values, photo: template.supportsPhoto ? photo : null },
            SQUARE_FORMAT,
            THUMBNAIL_SCALE,
          );
          if (isCancelled) break;
          const url = URL.createObjectURL(blob);
          created.push(url);
          next[template.id] = url;
        } catch {
          // A template the text does not fit simply keeps no thumbnail.
        }
      }
      if (isCancelled) {
        for (const url of created) URL.revokeObjectURL(url);
        return;
      }
      for (const url of shownUrls.current) URL.revokeObjectURL(url);
      shownUrls.current = created;
      setUrls(next);
    }, THUMBNAIL_DEBOUNCE_MS);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [templates, values, photo, selectedId]);

  return urls;
}
