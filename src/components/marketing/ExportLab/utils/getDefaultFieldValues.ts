import { GRAPHIC_TEMPLATES } from "../ExportLab.constants";
import type { FieldValues, GraphicTemplate } from "../ExportLab.types";

/** Defaults of every field; a shared id keeps the value of the first template listing it. */
export function getDefaultFieldValues(
  templates: readonly GraphicTemplate[] = GRAPHIC_TEMPLATES,
): FieldValues {
  const values: FieldValues = {};
  for (const template of templates)
    for (const field of template.fields)
      values[field.id] ??= field.defaultValue;
  return values;
}
