import type { FieldValues, GraphicTemplate } from "../ExportLab.types";
import { STANDARD_TEMPLATE } from "../templates/StandardTemplate/StandardTemplate.constants";
import { ContentError } from "./contentError";
import { getDefaultFieldValues } from "./getDefaultFieldValues";
import { validateContent } from "./validateContent";

const REQUIRED_TEMPLATE: GraphicTemplate = {
  ...STANDARD_TEMPLATE,
  fields: [
    {
      kind: "text",
      id: "headline",
      label: "Nagłówek",
      maxLength: 10,
      isRequired: true,
      defaultValue: "",
    },
  ],
};

const catchError = (run: () => void) => {
  try {
    run();
  } catch (error) {
    return error;
  }
};

describe("validateContent", () => {
  describe("when every field is valid", () => {
    it("does not throw", () => {
      expect(() =>
        validateContent(STANDARD_TEMPLATE, getDefaultFieldValues()),
      ).not.toThrow();
    });
  });

  describe("when a required field is blank or missing", () => {
    it.each<FieldValues>([
      { headline: "   " },
      {},
    ])("blames that field (%o)", (values) => {
      const error = catchError(() =>
        validateContent(REQUIRED_TEMPLATE, values),
      );
      expect(error).toBeInstanceOf(ContentError);
      expect(error).toMatchObject({
        message: "Wpisz nagłówek, aby przygotować grafikę.",
        fieldIds: ["headline"],
      });
    });
  });

  describe("when a choice is not one of its options", () => {
    it("blames that choice", () => {
      const error = catchError(() =>
        validateContent(STANDARD_TEMPLATE, {
          ...getDefaultFieldValues(),
          position: "diagonal",
        }),
      );
      expect(error).toMatchObject({ fieldIds: ["position"] });
    });
  });
});
