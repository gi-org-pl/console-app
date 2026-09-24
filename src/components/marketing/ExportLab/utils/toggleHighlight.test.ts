import { toggleHighlight } from "./toggleHighlight";

describe("toggleHighlight", () => {
  describe("when plain text is selected", () => {
    it("wraps it and keeps it selected", () => {
      expect(
        toggleHighlight({ value: "Dobre idee", start: 6, end: 10 }),
      ).toEqual({ value: "Dobre *idee*", start: 7, end: 11 });
    });
  });

  describe("when the selection is already highlighted", () => {
    it("removes the markers around it", () => {
      expect(
        toggleHighlight({ value: "Dobre *idee*", start: 7, end: 11 }),
      ).toEqual({ value: "Dobre idee", start: 6, end: 10 });
    });
  });

  describe("when the selection spans existing highlights", () => {
    it("merges them into one", () => {
      expect(toggleHighlight({ value: "*a* b *c*", start: 0, end: 9 })).toEqual(
        {
          value: "*a b c*",
          start: 1,
          end: 6,
        },
      );
    });
  });

  describe("when nothing is selected", () => {
    it("opens an empty highlight at the caret", () => {
      expect(toggleHighlight({ value: "Dobre ", start: 6, end: 6 })).toEqual({
        value: "Dobre **",
        start: 7,
        end: 7,
      });
    });
  });
});
