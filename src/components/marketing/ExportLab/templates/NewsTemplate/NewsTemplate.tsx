import longBackground from "../../../../../assets/icons/long-bg.svg";
import type { TemplateProps } from "../../ExportLab.types";
import { getFundingGrant } from "../fundingOptions";
import NewsCard from "./NewsCard/NewsCard";

const CARD_ASPECT = 5 / 4;
const FRAME_SIDE_PADDING = 32;

/** The portrait composition stays at 4:5 inside the taller story canvas. */
const NewsTemplate = ({ values, photo, format }: TemplateProps) => {
  const funding = getFundingGrant(values.funding);
  if (format.height / format.width <= CARD_ASPECT)
    return (
      <NewsCard
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
      className="relative grid place-items-center overflow-hidden bg-black"
      style={{ width: format.width, height: format.height }}
    >
      <img
        src={longBackground}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <NewsCard
        values={values}
        photo={photo}
        width={cardWidth}
        height={Math.round(cardWidth * CARD_ASPECT)}
        className="rounded-4xl border border-white/10"
        funding={funding ?? undefined}
      />
    </div>
  );
};

export default NewsTemplate;
