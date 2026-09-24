import type { TemplateField } from "../ExportLab.types";
import { getFieldError } from "./getFieldError";

const choice: TemplateField = {
  kind: "choice",
  id: "position",
  label: "Położenie tekstu",
  options: [
    { value: "top", label: "Góra" },
    { value: "bottom", label: "Dół" },
  ],
  defaultValue: "bottom",
};
const requiredText: TemplateField = {
  kind: "text",
  id: "title",
  label: "Nagłówek",
  maxLength: 10,
  isRequired: true,
  defaultValue: "",
};
const freeText: TemplateField = {
  kind: "text",
  id: "subtitle",
  label: "Podtytuł",
  defaultValue: "",
};

describe("getFieldError", () => {
  describe("when a choice is one of its options", () => {
    it.each(["top", "bottom"])("accepts %s", (value) => {
      expect(getFieldError(choice, value)).toBeUndefined();
    });
  });

  describe("when a choice is unknown", () => {
    it("asks to pick one", () => {
      expect(getFieldError(choice, "left")).toBe("Wybierz: położenie tekstu.");
    });
  });

  describe("when a required text is blank", () => {
    it("asks for it", () => {
      expect(getFieldError(requiredText, "  ")).toBe(
        "Wpisz nagłówek, aby przygotować grafikę.",
      );
    });
  });

  describe("when a text exceeds its limit", () => {
    it("names the limit", () => {
      expect(getFieldError(requiredText, "a".repeat(11))).toBe(
        "Skróć do 10 znaków.",
      );
    });
  });

  describe("when a text has no limit and is optional", () => {
    it.each(["", "a".repeat(5000)])("accepts any length", (value) => {
      expect(getFieldError(freeText, value)).toBeUndefined();
    });
  });
});
