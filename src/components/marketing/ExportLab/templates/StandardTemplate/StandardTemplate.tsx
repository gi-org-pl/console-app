import longBackground from "../../../../../assets/icons/long-bg.svg";
import type { TemplateProps } from "../../ExportLab.types";
import StandardCard from "./StandardCard/StandardCard";

/** The 4:5 card is the design; taller formats show it framed instead of stretched. */
const CARD_ASPECT = 5 / 4;
const FRAME_SIDE_PADDING = 32;

const StandardTemplate = ({ values, photo, format }: TemplateProps) => {
  if (format.height / format.width <= CARD_ASPECT)
    return (
      <StandardCard
        values={values}
        photo={photo}
        width={format.width}
        height={format.height}
      />
    );

  const cardWidth = format.width - FRAME_SIDE_PADDING * 2;
  return (
    <div
      className="relative grid place-items-center overflow-hidden bg-app-bg"
      style={{ width: format.width, height: format.height }}
    >
      <img
        src={longBackground}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <StandardCard
        values={values}
        photo={photo}
        width={cardWidth}
        height={Math.round(cardWidth * CARD_ASPECT)}
        className="rounded-4xl border border-white/10"
      />
    </div>
  );
};

export default StandardTemplate;
