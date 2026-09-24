import { stripHighlights, tokenizeHighlights } from "./tokenizeHighlights";

describe("tokenizeHighlights", () => {
  describe("when the text has no markers", () => {
    it("returns it as plain text", () => {
      expect(tokenizeHighlights("Dobre idee")).toEqual([
        { text: "Dobre idee", kind: "plain" },
      ]);
    });
  });

  describe("when a fragment is wrapped in markers", () => {
    it("splits plain, marker and highlighted parts", () => {
      expect(tokenizeHighlights("Dobre *idee* dla")).toEqual([
        { text: "Dobre ", kind: "plain" },
        { text: "*", kind: "marker" },
        { text: "idee", kind: "highlight" },
        { text: "*", kind: "marker" },
        { text: " dla", kind: "plain" },
      ]);
    });
  });

  describe("when a marker has no closing pair", () => {
    it("keeps it as plain text", () => {
      expect(tokenizeHighlights("*a* 5*")).toEqual([
        { text: "*", kind: "marker" },
        { text: "a", kind: "highlight" },
        { text: "*", kind: "marker" },
        { text: " 5", kind: "plain" },
        { text: "*", kind: "plain" },
      ]);
    });
  });

  describe("when the text is empty", () => {
    it("returns nothing", () => {
      expect(tokenizeHighlights("")).toEqual([]);
    });
  });
});

describe("stripHighlights", () => {
  describe("when the text has highlights", () => {
    it("returns what readers see", () => {
      expect(stripHighlights("Dobre *idee* i 5*")).toBe("Dobre idee i 5*");
    });
  });
});
