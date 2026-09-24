import { useEffect, useState } from "react";
import { GRAPHIC_FORMATS } from "../ExportLab.constants";
import type {
  GraphicContent,
  GraphicTemplate,
  Preview,
  PreviewsState,
} from "../ExportLab.types";
import { ContentError } from "./contentError";
import { loadGraphicFonts } from "./loadGraphicFonts";
import { rasterizeGraphic } from "./rasterizeGraphic";
import { validateContent } from "./validateContent";

const RENDERING_STATE: PreviewsState = {
  status: "rendering",
  previews: [],
  error: null,
};

export function useGraphicPreviews(
  template: GraphicTemplate,
  content: GraphicContent,
): PreviewsState {
  const [state, setState] = useState<PreviewsState>(RENDERING_STATE);

  useEffect(() => {
    let isCancelled = false;
    const urls: string[] = [];
    setState(RENDERING_STATE);

    async function prepare() {
      try {
        validateContent(template, content.values);
        await loadGraphicFonts();
        const previews: Preview[] = [];
        // Sequential rendering bounds peak memory on phones.
        for (const format of GRAPHIC_FORMATS) {
          const { blob, hasOverflow } = await rasterizeGraphic(
            template,
            content,
            format,
          );
          if (isCancelled) return;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          previews.push({
            formatId: format.id,
            hasOverflow,
            url,
            file: new File([blob], `gi-${template.id}-${format.id}.png`, {
              type: "image/png",
            }),
          });
        }
        if (isCancelled) return;
        setState({ status: "ready", previews, error: null });
      } catch (cause) {
        if (isCancelled) return;
        setState({
          status: "error",
          previews: [],
          error: {
            message:
              cause instanceof Error
                ? cause.message
                : "Nie udało się przygotować grafik.",
            fieldIds: cause instanceof ContentError ? cause.fieldIds : [],
          },
        });
      }
    }

    void prepare();
    return () => {
      isCancelled = true;
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [template, content]);

  return state;
}
