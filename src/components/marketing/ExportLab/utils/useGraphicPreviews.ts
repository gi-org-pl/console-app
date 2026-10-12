import { type RefObject, useEffect, useRef, useState } from "react";
import { GRAPHIC_FORMATS, PREVIEW_DEBOUNCE_MS } from "../ExportLab.constants";
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
  /**
   * A queue shared by several graphics, so that their rasterizations run one
   * after another. Without it the graphic queues only behind itself.
   */
  sharedQueue?: RefObject<Promise<void>>,
): PreviewsState {
  // The previews are kept with what they were drawn from: once the template or
  // the content changes they are out of date at once, not an effect later.
  const [result, setResult] = useState({
    state: RENDERING_STATE,
    template,
    content,
  });
  const setState = (state: PreviewsState) =>
    setResult({ state, template, content });
  const ownQueue = useRef(Promise.resolve());
  const renderQueue = sharedQueue ?? ownQueue;

  useEffect(() => {
    let isCancelled = false;
    const urls: string[] = [];
    setState(RENDERING_STATE);

    async function prepare() {
      try {
        validateContent(template, content.values);
        await loadGraphicFonts();
        if (isCancelled) return;
        const previews: Preview[] = [];
        // Sequential rendering bounds peak memory on phones.
        for (const format of GRAPHIC_FORMATS) {
          if (isCancelled) return;
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

    // A changed draft waits briefly; an already running rasterization finishes
    // before the latest draft starts, so edits cannot spawn concurrent exports.
    const timer = window.setTimeout(() => {
      renderQueue.current = renderQueue.current.then(() => {
        if (!isCancelled) return prepare();
      });
    }, PREVIEW_DEBOUNCE_MS);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [template, content, renderQueue]);

  return result.template === template && result.content === content
    ? result.state
    : RENDERING_STATE;
}
