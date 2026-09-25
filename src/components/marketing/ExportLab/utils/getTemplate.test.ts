import { GRAPHIC_TEMPLATES } from "../ExportLab.constants";
import { getTemplate } from "./getTemplate";

describe("getTemplate", () => {
  describe("when the id is registered", () => {
    it("returns that template", () => {
      expect(getTemplate("standard").id).toBe("standard");
    });
  });

  describe("when the id is unknown", () => {
    it("falls back to the first template", () => {
      expect(getTemplate("missing")).toBe(GRAPHIC_TEMPLATES[0]);
    });
  });
});
