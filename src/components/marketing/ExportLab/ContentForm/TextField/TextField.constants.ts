import type { HighlightToken } from "../../utils/tokenizeHighlights";

/** Shared with the photo field, so every field in the form has the same label. */
export const FIELD_LABEL_CLASS_NAME = "text-base font-medium";

export const FIELD_CONTROL_CLASS_NAME =
  "w-full rounded-lg border border-app-border bg-app-surface-2 px-4 py-2 text-base text-app-text transition-colors hover:border-app-border-strong";

/** Editor colors: highlights in the readable accent, markers dimmed but still visible. */
export const TOKEN_CLASS_NAME: Record<HighlightToken["kind"], string> = {
  plain: "",
  highlight: "text-app-accent-text",
  marker: "text-app-subtle",
};
