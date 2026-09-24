import longBackground from "../../../../../assets/icons/long-bg.svg";
import type { TemplateProps } from "../../ExportLab.types";
import { getFundingGrant } from "./fundingOptions";
import StandardCard from "./StandardCard/StandardCard";

/** The 4:5 card is the design; taller formats show it framed instead of stretched. */
const CARD_ASPECT = 5 / 4;
const FRAME_SIDE_PADDING = 32;

const StandardTemplate = ({ values, photo, format }: TemplateProps) => {
  const funding = getFundingGrant(values.funding);
  if (format.height / format.width <= CARD_ASPECT)
    return (
      <StandardCard
        values={values}
        photo={photo}
        width={format.width}
        height={format.height}
        funding={funding ?? undefined}
      />
    );

  const cardWidth = format.width - FRAME_SIDE_PADDING * 2;
  return (
    <div
      className="relative flex flex-col overflow-hidden bg-app-bg"
      style={{ width: format.width, height: format.height }}
    >
      <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden">
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
          funding={funding ?? undefined}
        />
      </div>
    </div>
  );
};

export default StandardTemplate;
