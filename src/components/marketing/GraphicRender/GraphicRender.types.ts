import type {
  FieldValues,
  GraphicFormat,
  GraphicPhoto,
  GraphicTemplate,
} from "../ExportLab/ExportLab.types";

/** Machine-readable reason, exposed as `data-render-error` for automation. */
export type RenderErrorCode =
  | "missing-parameter"
  | "duplicate-parameter"
  | "unknown-template"
  | "unknown-format"
  | "unknown-parameter"
  | "invalid-photo"
  | "invalid-content"
  | "render-failed";

export interface RenderFailure {
  code: RenderErrorCode;
  message: string;
  /** Template fields to fix; empty when no field is to blame. */
  fieldIds: readonly string[];
}

export interface RenderRequest {
  template: GraphicTemplate;
  format: GraphicFormat;
  values: FieldValues;
  /** Set when the URL announces a photo; the file itself arrives through the file input. */
  photoFocus: Pick<GraphicPhoto, "focalX" | "focalY"> | null;
}

export type ParsedRenderParams =
  | { request: RenderRequest; error?: undefined }
  | { request?: undefined; error: RenderFailure };

export type RenderState =
  | { status: "loading" }
  | { status: "awaiting-photo" }
  | { status: "ready"; url: string; hasOverflow: boolean }
  | { status: "error"; error: RenderFailure };
