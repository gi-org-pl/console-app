import { GRAPHIC_FORMATS } from "../../../ExportLab.constants";
import { getStandardBackground } from "./getStandardBackground";

const [square, , story] = GRAPHIC_FORMATS;

describe("getStandardBackground", () => {
  describe("when built for a square", () => {
    it("layers the darkening over both red glows at the design positions", () => {
      const background = getStandardBackground(square);
      const layers = background.split(/,\s(?=(?:linear|radial)-gradient)/);
      expect(layers).toHaveLength(3);
      expect(layers[0]).toMatch(/^linear-gradient\(to bottom/);
      expect(layers[1]).toContain("circle 1101px at 25.10% 92.92%");
      expect(layers[1]).toContain("rgb(217 25 25 / 0.05)");
      expect(layers[2]).toContain("circle 1195px at 86.07% 18.99%");
      expect(layers[2]).toContain("rgb(217 25 25 / 0.04)");
    });
  });

  describe("when built for a tall format", () => {
    it("scales the glows with the longer edge", () => {
      expect(getStandardBackground(story)).toContain("circle 2125px");
    });
  });
});
