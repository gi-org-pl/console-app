import type { GraphicFormat } from "../../../ExportLab.types";

// Taken from the GI background (bg.svg), designed on a 1024 px square.
const DESIGN_SIZE = 1024;
const GLOW = "217 25 25";
const TOP_GLOW = { x: 881.353, y: 194.467, radius: 1133.34, opacity: 0.04 };
const BOTTOM_GLOW = {
  x: 257,
  y: 951.5,
  radius: 1043.98,
  opacity: 0.05,
  fadeAt: 0.714_091,
};

const percent = (value: number) =>
  `${((value / DESIGN_SIZE) * 100).toFixed(2)}%`;

/** CSS layers over the black base: two red glows and a darkening towards the bottom. */
export function getStandardBackground({
  width,
  height,
}: Pick<GraphicFormat, "width" | "height">) {
  // Glows keep their size relative to the longer edge, so every format gets the same light.
  const scale = Math.max(width, height) / DESIGN_SIZE;
  const topRadius = Math.round(TOP_GLOW.radius * scale);
  const bottomRadius = Math.round(BOTTOM_GLOW.radius * scale);
  return [
    "linear-gradient(to bottom, rgb(0 0 0 / 0%), rgb(0 0 0 / 50%))",
    `radial-gradient(circle ${bottomRadius}px at ${percent(BOTTOM_GLOW.x)} ${percent(BOTTOM_GLOW.y)}, rgb(${GLOW} / ${BOTTOM_GLOW.opacity}), rgb(${GLOW} / 0) ${BOTTOM_GLOW.fadeAt * 100}%)`,
    `radial-gradient(circle ${topRadius}px at ${percent(TOP_GLOW.x)} ${percent(TOP_GLOW.y)}, rgb(${GLOW} / ${TOP_GLOW.opacity}), rgb(${GLOW} / 0))`,
  ].join(", ");
}
