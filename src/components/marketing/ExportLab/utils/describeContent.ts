import type { FieldValues, GraphicTemplate } from "../ExportLab.types";
import { stripHighlights } from "./tokenizeHighlights";

const ENDS_WITH_PUNCTUATION = /[.!?…]$/;

/** Text alternative for the exported graphic, built from the filled text fields. */
export function describeContent(
  template: GraphicTemplate,
  values: FieldValues,
) {
  return template.fields
    .filter((field) => field.kind === "text")
    .map((field) => stripHighlights(values[field.id] ?? "").trim())
    .filter(Boolean)
    .map((value) => (ENDS_WITH_PUNCTUATION.test(value) ? value : `${value}.`))
    .join(" ");
}
