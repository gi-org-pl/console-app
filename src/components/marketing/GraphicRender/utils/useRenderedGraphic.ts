import { useEffect, useState } from "react";
import type { PhotoState } from "../../ExportLab/ExportLab.types";
import { loadGraphicFonts } from "../../ExportLab/utils/loadGraphicFonts";
import { rasterizeGraphic } from "../../ExportLab/utils/rasterizeGraphic";
import type { RenderRequest, RenderState } from "../GraphicRender.types";

const LOADING_STATE: RenderState = { status: "loading" };
const AWAITING_PHOTO_STATE: RenderState = { status: "awaiting-photo" };

/**
 * Rasterizes the requested graphic with the editor's own pipeline, so the PNG
 * is the one the editor would export for the same values.
 */
export function useRenderedGraphic(
  request: RenderRequest | null,
  { photo, isLoading, error }: PhotoState,
): RenderState {
  const [state, setState] = useState<RenderState>(LOADING_STATE);

  useEffect(() => {
    if (!request) return;
    const { template, format, values, photoFocus } = request;
    if (photoFocus && error) {
      setState({
        status: "error",
        error: { code: "invalid-photo", message: error, fieldIds: [] },
      });
      return;
    }
    if (photoFocus && (isLoading || !photo)) {
      setState(isLoading ? LOADING_STATE : AWAITING_PHOTO_STATE);
      return;
    }

    let isCancelled = false;
    let url: string | undefined;
    setState(LOADING_STATE);

    async function prepare() {
      try {
        await loadGraphicFonts();
        if (isCancelled) return;
        const { blob, hasOverflow } = await rasterizeGraphic(
          template,
          {
            values,
            photo: photoFocus && photo ? { ...photo, ...photoFocus } : null,
          },
          format,
        );
        if (isCancelled) return;
        url = URL.createObjectURL(blob);
        setState({ status: "ready", url, hasOverflow });
      } catch (cause) {
        if (isCancelled) return;
        setState({
          status: "error",
          error: {
            code: "render-failed",
            message:
              cause instanceof Error
                ? cause.message
                : "Nie udało się przygotować grafiki.",
            fieldIds: [],
          },
        });
      }
    }

    void prepare();
    return () => {
      isCancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [request, photo, isLoading, error]);

  return state;
}
