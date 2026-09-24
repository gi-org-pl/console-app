import type { FieldValues, GraphicTemplate } from "../ExportLab.types";
import { ContentError } from "./contentError";
import { getFieldError } from "./getFieldError";

export function validateContent(
  template: GraphicTemplate,
  values: FieldValues,
) {
  for (const field of template.fields) {
    const message = getFieldError(field, values[field.id] ?? "");
    if (message) throw new ContentError(message, [field.id]);
  }
}
