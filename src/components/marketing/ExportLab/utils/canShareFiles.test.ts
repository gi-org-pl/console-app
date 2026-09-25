import { canShareFiles } from "./canShareFiles";

describe("canShareFiles", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "canShare");
  });

  describe("when the browser has no share API", () => {
    it("returns false", () => {
      expect(canShareFiles()).toBe(false);
    });
  });

  describe("when the browser accepts PNG files", () => {
    it("returns true after probing with a PNG", () => {
      const canShare = vi.fn(() => true);
      Object.defineProperty(navigator, "canShare", {
        value: canShare,
        configurable: true,
      });
      expect(canShareFiles()).toBe(true);
      expect(canShare).toHaveBeenCalledWith({
        files: [expect.objectContaining({ type: "image/png" })],
      });
    });
  });
});
