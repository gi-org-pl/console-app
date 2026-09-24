import { twMerge } from "tailwind-merge";
import footerLogo from "../../../../../../assets/icons/footer-logo.svg";
import footerText from "../../../../../../assets/icons/footer-text.svg";
import type { GraphicContent } from "../../../ExportLab.types";
import { stripHighlights } from "../../../utils/tokenizeHighlights";
import HighlightedText from "../../HighlightedText/HighlightedText";
import FundingBanner from "../FundingBanner/FundingBanner";
import type { getFundingGrant } from "../fundingOptions";
import { getStandardBackground } from "../utils/getStandardBackground";

interface Props extends GraphicContent {
  width: number;
  height: number;
  className?: string;
  funding?: NonNullable<ReturnType<typeof getFundingGrant>>;
}

// Safe alignment falls back to the top when text overflows, so the fit check sees it.
const TEXT_POSITION_CLASS_NAME: Record<string, string> = {
  top: "justify-start",
  middle: "justify-center-safe",
  bottom: "justify-end-safe",
};

const TEXT_ALIGN_CLASS_NAME: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const hasText = (value?: string) => !!value && !!stripHighlights(value).trim();

/** The standard GI composition: background or photo, text and the footer. */
const StandardCard = ({
  values,
  photo,
  width,
  height,
  className,
  funding,
}: Props) => (
  <div
    className={twMerge(
      "relative flex flex-col overflow-hidden bg-app-bg text-app-text",
      className,
    )}
    style={{
      width,
      height,
      backgroundImage: photo
        ? undefined
        : getStandardBackground({ width, height }),
    }}
  >
    {photo && (
      <>
        <img
          src={photo.url}
          alt=""
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: `${photo.focalX}% ${photo.focalY}%` }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/50 to-black" />
      </>
    )}
    {funding && <FundingBanner grant={funding} />}
    <div
      data-fit
      className={twMerge(
        "relative flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-16",
        TEXT_POSITION_CLASS_NAME[values.position] ??
          TEXT_POSITION_CLASS_NAME.bottom,
        TEXT_ALIGN_CLASS_NAME[values.align] ?? TEXT_ALIGN_CLASS_NAME.left,
      )}
    >
      {hasText(values.title) && (
        <h1
          data-field="title"
          className="font-display leading-tight font-bold whitespace-pre-line"
          style={{ fontSize: `${values.titleSize}px` }}
        >
          <HighlightedText text={values.title.trim()} />
        </h1>
      )}
      {hasText(values.subtitle) && (
        <p
          data-field="subtitle"
          className="font-display leading-snug font-medium whitespace-pre-line"
          style={{ fontSize: `${values.subtitleSize}px` }}
        >
          <HighlightedText text={values.subtitle.trim()} />
        </p>
      )}
    </div>
    <div className="relative flex shrink-0 items-center justify-between border-t border-white/10 px-16 py-8">
      <img src={footerLogo} alt="Generacja Innowacja" className="h-12 w-auto" />
      <img src={footerText} alt="gi.org.pl" className="h-8 w-auto" />
    </div>
  </div>
);

export default StandardCard;
