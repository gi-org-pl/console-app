import {
  TEXT_ALIGN_OPTIONS,
  TEXT_POSITION_OPTIONS,
  textSizeOptions,
} from "./field-options";

describe("field options", () => {
  describe("when building text sizes", () => {
    it("names each size and shows a growing sample", () => {
      expect(textSizeOptions([32, 48, 64, 80])).toEqual([
        { value: "32", label: "Mały (32 px)", sample: 12 },
        { value: "48", label: "Średni (48 px)", sample: 16 },
        { value: "64", label: "Duży (64 px)", sample: 20 },
        { value: "80", label: "Bardzo duży (80 px)", sample: 24 },
      ]);
    });
  });

  describe("when listing layout choices", () => {
    it("gives every position and alignment an icon", () => {
      for (const option of [...TEXT_POSITION_OPTIONS, ...TEXT_ALIGN_OPTIONS])
        expect(option.icon?.icon).toHaveLength(5);
      expect(TEXT_POSITION_OPTIONS.map((option) => option.value)).toEqual([
        "top",
        "middle",
        "bottom",
      ]);
    });
  });
});
