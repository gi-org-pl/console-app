import type { TemplateField } from "../ExportLab.types";

/** The message for a field value the template cannot use, or undefined when it is fine. */
export function getFieldError(
  field: TemplateField,
  value: string,
): string | undefined {
  if (field.kind === "choice")
    return field.options.some((option) => option.value === value)
      ? undefined
      : `Wybierz: ${field.label.toLowerCase()}.`;
  if (field.isRequired && !value.trim())
    return `Wpisz ${field.label.toLowerCase()}, aby przygotować grafikę.`;
  if (field.maxLength !== undefined && value.length > field.maxLength)
    return `Skróć do ${field.maxLength} znaków.`;
  return undefined;
}
