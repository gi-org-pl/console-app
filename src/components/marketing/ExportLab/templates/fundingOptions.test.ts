import { describe, expect, it } from "vitest";
import { FUNDING_OPTIONS, getFundingGrant } from "./fundingOptions";

describe("fundingOptions", () => {
  describe("when the options are listed", () => {
    it("offers no banner first, then one option per grant", () => {
      expect(FUNDING_OPTIONS.map(({ value, label }) => [value, label])).toEqual(
        [
          ["none", "Bez belki"],
          ["proo", "PROO"],
          ["fm", "Fundusz Młodzieżowy"],
        ],
      );
    });
  });

  describe("when a grant is looked up", () => {
    it.each([
      ["proo", "PROO"],
      ["fm", "Fundusz Młodzieżowy"],
    ])("returns the two banner images of %s", (value, label) => {
      expect(getFundingGrant(value)).toEqual({
        value,
        label,
        leftImage: `${import.meta.env.BASE_URL}grants/${value}-left.png`,
        rightImage: `${import.meta.env.BASE_URL}grants/${value}-right.png`,
      });
    });

    it.each([
      ["none"],
      ["unknown"],
      [""],
    ])("returns nothing for %j", (value) => {
      expect(getFundingGrant(value)).toBeNull();
    });
  });
});
