import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { PHOTO_ACCEPTED_TYPES } from "../ExportLab/ExportLab.constants";
import { describeContent } from "../ExportLab/utils/describeContent";
import { usePhoto } from "../ExportLab/utils/usePhoto";
import type { ParsedRenderParams, RenderState } from "./GraphicRender.types";
import { parseRenderParams } from "./utils/parseRenderParams";
import { useRenderedGraphic } from "./utils/useRenderedGraphic";

/**
 * One graphic with its state taken from the URL, for scripts and agents.
 * The `data-render-*` attributes on the root are the contract; see the README.
 */
const GraphicRender = () => {
  const [searchParams] = useSearchParams();
  // The prerendered HTML has no query string; parsing after mount keeps hydration identical.
  const [parsed, setParsed] = useState<ParsedRenderParams | null>(null);
  useEffect(() => {
    setParsed(parseRenderParams(searchParams));
  }, [searchParams]);

  const photo = usePhoto();
  const request = parsed?.request ?? null;
  const graphic = useRenderedGraphic(request, photo);
  const state: RenderState = parsed?.error
    ? { status: "error", error: parsed.error }
    : parsed
      ? graphic
      : { status: "loading" };
  const failure = state.status === "error" ? state.error : null;

  return (
    <main
      data-render-status={state.status}
      data-render-template={request?.template.id}
      data-render-format={request?.format.id}
      data-render-width={request?.format.width}
      data-render-height={request?.format.height}
      data-render-overflow={
        state.status === "ready" ? String(state.hasOverflow) : undefined
      }
      data-render-error={failure?.code}
      data-render-error-fields={failure?.fieldIds.join(" ")}
    >
      {request && state.status === "ready" && (
        <img
          src={state.url}
          alt={describeContent(request.template, request.values)}
          width={request.format.width}
          height={request.format.height}
          className="block max-w-none"
        />
      )}
      {failure && (
        <p role="alert" className="p-4 text-app-error">
          {failure.message}
        </p>
      )}
      {request?.photoFocus && (
        <label className="block p-4">
          Zdjęcie w tle{" "}
          <input
            type="file"
            accept={PHOTO_ACCEPTED_TYPES.join(",")}
            onChange={(event) => {
              void photo.select(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>
      )}
    </main>
  );
};

export default GraphicRender;
