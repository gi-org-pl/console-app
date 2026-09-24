import type { PreviewsState } from "../ExportLab.types";

export const STATUS_BADGE_LABEL: Record<PreviewsState["status"], string> = {
  rendering: "Przygotowywanie…",
  error: "Popraw treść",
  ready: "PNG · gotowe",
};
