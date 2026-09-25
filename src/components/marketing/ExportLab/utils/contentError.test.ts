import { ContentError } from "./contentError";

describe("ContentError", () => {
  describe("when created", () => {
    it("is an Error that remembers the blamed fields", () => {
      const error = new ContentError("Za długo", ["title"]);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("ContentError");
      expect(error.message).toBe("Za długo");
      expect(error.fieldIds).toEqual(["title"]);
    });
  });
});
