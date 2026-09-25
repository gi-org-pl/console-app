import { loadGraphicFonts } from "./loadGraphicFonts";

const mockFonts = (load: () => Promise<unknown[]>) =>
  Object.defineProperty(document, "fonts", {
    value: { load: vi.fn(load) },
    configurable: true,
  });

describe("loadGraphicFonts", () => {
  describe("when both fonts load", () => {
    it("resolves", async () => {
      mockFonts(async () => [{}]);
      await expect(loadGraphicFonts()).resolves.toBeUndefined();
    });
  });

  describe("when a font is missing", () => {
    it("rejects with a refresh hint", async () => {
      mockFonts(async () => []);
      await expect(loadGraphicFonts()).rejects.toThrow(
        "Nie udało się wczytać fontów",
      );
    });
  });
});
