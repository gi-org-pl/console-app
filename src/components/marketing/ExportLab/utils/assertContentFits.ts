import type { GraphicFormat } from "../ExportLab.types";
import { ContentError } from "./contentError";

const overflowsX = (element: HTMLElement) =>
  element.scrollWidth > element.clientWidth + 1;
const overflowsY = (element: HTMLElement) =>
  element.scrollHeight > element.clientHeight + 1;

/**
 * Templates mark overflow-hidden boxes with `data-fit` and the texts inside
 * with `data-field="<field id>"`, so clipped text is never exported and the
 * error lands on the field the user has to shorten.
 */
export function assertContentFits(root: HTMLElement, format: GraphicFormat) {
  for (const box of root.querySelectorAll<HTMLElement>("[data-fit]")) {
    const fields = Array.from(
      box.querySelectorAll<HTMLElement>("[data-field]"),
    );
    const tooWide = fields.find(overflowsX);
    if (tooWide)
      throw new ContentError(
        `Zbyt długie słowo nie mieści się w formacie ${format.name}. Dodaj spację lub podział wiersza.`,
        [tooWide.dataset.field ?? ""],
      );
    if (overflowsX(box) || overflowsY(box))
      throw new ContentError(
        `Treść nie mieści się w formacie ${format.name}. Skróć ją.`,
        fields.map((field) => field.dataset.field ?? ""),
      );
  }
}
