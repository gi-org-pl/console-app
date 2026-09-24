import type { GraphicTemplate } from "../ExportLab.types";
import { STANDARD_TEMPLATE } from "../templates/StandardTemplate/StandardTemplate.constants";
import { getDefaultFieldValues } from "./getDefaultFieldValues";

const OTHER_TEMPLATE: GraphicTemplate = {
  ...STANDARD_TEMPLATE,
  id: "other",
  fields: [
    { kind: "text", id: "title", label: "Nagłówek", defaultValue: "Inny" },
    { kind: "text", id: "author", label: "Autor", defaultValue: "Ada" },
  ],
};

describe("getDefaultFieldValues", () => {
  describe("when called without templates", () => {
    it("returns the defaults of the registered templates", () => {
      expect(getDefaultFieldValues()).toEqual({
        title: "Dobre idee zmieniają *świat*.",
        titleSize: "64",
        subtitle:
          "Łączymy technologię i społeczne zaangażowanie. Działaj razem z nami!",
        subtitleSize: "24",
        position: "bottom",
        align: "left",
      });
    });
  });

  describe("when templates share a field id", () => {
    it("keeps the first template's default and adds the rest", () => {
      const values = getDefaultFieldValues([STANDARD_TEMPLATE, OTHER_TEMPLATE]);
      expect(values.title).toBe("Dobre idee zmieniają *świat*.");
      expect(values.author).toBe("Ada");
    });
  });
});
