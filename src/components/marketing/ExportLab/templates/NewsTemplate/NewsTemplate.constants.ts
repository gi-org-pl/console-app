import type { GraphicTemplate } from "../../ExportLab.types";
import { textSizeOptions } from "../field-options";
import { FUNDING_OPTIONS } from "../fundingOptions";
import NewsTemplate from "./NewsTemplate";

export const NEWS_TEMPLATE: GraphicTemplate = {
  id: "news",
  name: "News",
  supportsPhoto: true,
  fields: [
    {
      kind: "text",
      id: "personName",
      label: "Osoba (opcjonalnie)",
      isMultiline: true,
      defaultValue: "",
    },
    {
      kind: "text",
      id: "title",
      label: "Tytuł",
      isMultiline: true,
      canHighlight: true,
      defaultValue: "Dobre idee zmieniają *świat*.",
    },
    {
      kind: "choice",
      id: "newsTitleSize",
      label: "Rozmiar tytułu",
      attachTo: "title",
      options: textSizeOptions([32, 48, 64, 80]),
      defaultValue: "48",
    },
    {
      kind: "text",
      id: "subtitle",
      label: "Podtytuł",
      isMultiline: true,
      canHighlight: true,
      defaultValue:
        "Łączymy technologię i społeczne zaangażowanie. Działaj razem z nami!",
    },
    {
      kind: "choice",
      id: "subtitleSize",
      label: "Rozmiar podtytułu",
      attachTo: "subtitle",
      options: textSizeOptions([24, 32, 40, 48]),
      defaultValue: "40",
    },
    {
      kind: "funding",
      id: "funding",
      label: "Finansowanie",
      options: FUNDING_OPTIONS,
      defaultValue: "proo",
    },
  ],
  Component: NewsTemplate,
};
