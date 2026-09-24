import { STANDARD_TEMPLATE } from "../templates/StandardTemplate/StandardTemplate.constants";
import { describeContent } from "./describeContent";

describe("describeContent", () => {
  describe("when texts end with and without punctuation", () => {
    it("joins them into sentences without doubling the punctuation", () => {
      expect(
        describeContent(STANDARD_TEMPLATE, {
          title: "Działajmy!",
          subtitle: " Razem ",
        }),
      ).toBe("Działajmy! Razem.");
    });
  });

  describe("when texts carry highlights and the template has choices", () => {
    it("describes only the readable text", () => {
      expect(
        describeContent(STANDARD_TEMPLATE, {
          title: "Dobre *idee*",
          titleSize: "32",
          subtitle: "",
          position: "top",
        }),
      ).toBe("Dobre idee.");
    });
  });

  describe("when texts are blank or missing", () => {
    it("skips them", () => {
      expect(describeContent(STANDARD_TEMPLATE, { title: "Tytuł." })).toBe(
        "Tytuł.",
      );
    });
  });
});
