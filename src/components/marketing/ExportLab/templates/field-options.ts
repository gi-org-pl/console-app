import type {
  IconDefinition,
  IconName,
} from "@fortawesome/fontawesome-svg-core";
import {
  faAlignCenter,
  faAlignLeft,
  faAlignRight,
} from "@fortawesome/free-solid-svg-icons";
import type { ChoiceOption } from "../ExportLab.types";

// Font Awesome has no "centre vertically" icon, so the three positions share one drawing:
// a bar with the text block at its top, middle or bottom (512 × 512 grid).
const positionIcon = (name: string, path: string): IconDefinition => ({
  prefix: "fas",
  iconName: name as IconName,
  icon: [512, 512, [], "", path],
});

export const TEXT_POSITION_OPTIONS: readonly ChoiceOption[] = [
  {
    value: "top",
    label: "Tekst u góry",
    icon: positionIcon(
      "gi-align-top",
      "M32 32h448v48H32zM160 128h192v288H160z",
    ),
  },
  {
    value: "middle",
    label: "Tekst na środku",
    icon: positionIcon(
      "gi-align-middle",
      "M160 64h192v168h128v48H352v168H160V280H32v-48h128z",
    ),
  },
  {
    value: "bottom",
    label: "Tekst na dole",
    icon: positionIcon(
      "gi-align-bottom",
      "M32 432h448v48H32zM160 96h192v288H160z",
    ),
  },
];

export const TEXT_ALIGN_OPTIONS: readonly ChoiceOption[] = [
  { value: "left", label: "Wyrównaj do lewej", icon: faAlignLeft },
  { value: "center", label: "Wyśrodkuj", icon: faAlignCenter },
  { value: "right", label: "Wyrównaj do prawej", icon: faAlignRight },
];

const SIZE_LABELS = ["Mały", "Średni", "Duży", "Bardzo duży"];
const SIZE_SAMPLES = [12, 16, 20, 24];

/** Four text sizes shown as growing "A" samples, e.g. `[32, 48, 64, 80]`. */
export function textSizeOptions(sizes: readonly number[]): ChoiceOption[] {
  return sizes.map((size, index) => ({
    value: String(size),
    label: `${SIZE_LABELS[index]} (${size} px)`,
    sample: SIZE_SAMPLES[index],
  }));
}
