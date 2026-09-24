/**
 * Wraps a highlighted fragment, e.g. "Dobre *idee*"; kept plain so values stay strings.
 * Lives here rather than in ExportLab.constants, which imports the templates that use it.
 */
export const HIGHLIGHT_MARKER = "*";

export interface HighlightToken {
  text: string;
  kind: "plain" | "highlight" | "marker";
}

/**
 * Splits "Dobre *idee* dla" into plain, marker and highlighted parts. A marker
 * without a closing pair stays plain text, so a lone "*" is never swallowed.
 */
export function tokenizeHighlights(text: string): HighlightToken[] {
  const parts = text.split(HIGHLIGHT_MARKER);
  const pairedParts = parts.length % 2 === 1 ? parts.length : parts.length - 1;
  const tokens: HighlightToken[] = [];
  for (const [index, part] of parts.entries()) {
    if (index >= pairedParts) {
      tokens.push({ text: HIGHLIGHT_MARKER + part, kind: "plain" });
      continue;
    }
    if (index > 0) tokens.push({ text: HIGHLIGHT_MARKER, kind: "marker" });
    if (part)
      tokens.push({ text: part, kind: index % 2 ? "highlight" : "plain" });
  }
  return tokens;
}

/** The text as readers see it, without markers. */
export function stripHighlights(text: string) {
  return tokenizeHighlights(text)
    .filter((token) => token.kind !== "marker")
    .map((token) => token.text)
    .join("");
}
