import type { FundingOption } from "../ExportLab.types";

/** Add future grants here; the picker and the graphic share this catalog. */
export const FUNDING_OPTIONS: readonly FundingOption[] = [
  { value: "none", label: "Bez belki" },
  {
    value: "proo",
    label: "PROO",
    leftImage: `${import.meta.env.BASE_URL}grants/proo-left.png`,
    rightImage: `${import.meta.env.BASE_URL}grants/proo-right.png`,
  },
];

export function getFundingGrant(value: string) {
  const option = FUNDING_OPTIONS.find((item) => item.value === value);
  return option?.leftImage && option.rightImage
    ? { ...option, leftImage: option.leftImage, rightImage: option.rightImage }
    : null;
}
