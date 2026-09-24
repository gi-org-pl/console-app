import { HIGHLIGHT_MARKER } from "./tokenizeHighlights";

export interface TextSelection {
  value: string;
  start: number;
  end: number;
}

/**
 * Highlights the selected text, or removes the highlight when the selection
 * is already wrapped. With nothing selected it opens an empty highlight at the
 * caret, so the next typed word comes out red.
 */
export function toggleHighlight({
  value,
  start,
  end,
}: TextSelection): TextSelection {
  const marker = HIGHLIGHT_MARKER;
  const isWrapped =
    start > 0 && value[start - 1] === marker && value[end] === marker;
  if (isWrapped)
    return {
      value:
        value.slice(0, start - 1) +
        value.slice(start, end) +
        value.slice(end + 1),
      start: start - 1,
      end: end - 1,
    };
  // Markers inside the selection would split it into several highlights.
  const selected = value.slice(start, end).split(marker).join("");
  return {
    value:
      value.slice(0, start) + marker + selected + marker + value.slice(end),
    start: start + 1,
    end: start + 1 + selected.length,
  };
}
