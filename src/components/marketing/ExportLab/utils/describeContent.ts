import type { FieldValues, GraphicTemplate } from "../ExportLab.types";
import { stripHighlights } from "./tokenizeHighlights";

const ENDS_WITH_PUNCTUATION = /[.!?…]$/;

/** Text alternative for the exported graphic, built from the filled text fields. */
export function describeContent(
  template: GraphicTemplate,
  values: FieldValues,
) {
  const description = template.fields
    .filter((field) => field.kind === "text")
    .map((field) => stripHighlights(values[field.id] ?? "").trim())
    .filter(Boolean)
    .map((value) => (ENDS_WITH_PUNCTUATION.test(value) ? value : `${value}.`))
    .join(" ");
  const funding = template.fields
    .filter((field) => field.kind === "funding")
    .flatMap((field) => field.options)
    .find((option) => option.value === values.funding);
  return funding?.leftImage && funding.rightImage
    ? `${description} Finansowanie: ${funding.label}.`.trim()
    : description;
}
