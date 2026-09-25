import type { GraphicTemplate } from "../../ExportLab.types";
import {
  TEXT_ALIGN_OPTIONS,
  TEXT_POSITION_OPTIONS,
  textSizeOptions,
} from "../field-options";
import { FUNDING_OPTIONS } from "../fundingOptions";
import StandardTemplate from "./StandardTemplate";

export const STANDARD_TEMPLATE: GraphicTemplate = {
  id: "standard",
  name: "Standard",
  supportsPhoto: true,
  fields: [
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
      id: "titleSize",
      label: "Rozmiar tytułu",
      attachTo: "title",
      options: textSizeOptions([32, 48, 64, 80]),
      defaultValue: "64",
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
      kind: "choice",
      id: "position",
      label: "Położenie tekstu",
      options: TEXT_POSITION_OPTIONS,
      defaultValue: "bottom",
    },
    {
      kind: "choice",
      id: "align",
      label: "Wyrównanie tekstu",
      options: TEXT_ALIGN_OPTIONS,
      defaultValue: "left",
    },
    {
      kind: "funding",
      id: "funding",
      label: "Finansowanie",
      options: FUNDING_OPTIONS,
      defaultValue: "proo",
    },
  ],
  Component: StandardTemplate,
};
