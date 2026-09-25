import { GRAPHIC_TEMPLATES } from "../ExportLab.constants";
import type { GraphicTemplate } from "../ExportLab.types";

export function getTemplate(id: string): GraphicTemplate {
  return (
    GRAPHIC_TEMPLATES.find((template) => template.id === id) ??
    GRAPHIC_TEMPLATES[0]
  );
}
