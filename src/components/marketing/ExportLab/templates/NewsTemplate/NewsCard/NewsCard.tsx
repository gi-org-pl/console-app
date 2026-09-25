import { twMerge } from "tailwind-merge";
import footerLogo from "../../../../../../assets/icons/footer-logo.svg";
import footerText from "../../../../../../assets/icons/footer-text.svg";
import type { GraphicContent } from "../../../ExportLab.types";
import { stripHighlights } from "../../../utils/tokenizeHighlights";
import FundingBanner from "../../FundingBanner/FundingBanner";
import type { getFundingGrant } from "../../fundingOptions";
import HighlightedText from "../../HighlightedText/HighlightedText";

interface Props extends GraphicContent {
  width: number;
  height: number;
  className?: string;
  funding?: NonNullable<ReturnType<typeof getFundingGrant>>;
}

const hasText = (value?: string) => !!value && !!stripHighlights(value).trim();

/** Photo-led news composition with a fixed footer and a side-by-side landscape layout. */
const NewsCard = ({
  values,
  photo,
  width,
  height,
  className,
  funding,
}: Props) => {
  const landscape = height / width < 0.8;
  const titleSize = Number(values.newsTitleSize) * (landscape ? 0.75 : 1);
  const subtitleSize = Number(values.subtitleSize) * (landscape ? 0.72 : 1);

  const title = hasText(values.title) && (
    <div
      data-news-title
      data-fit
      className={twMerge(
        "relative z-10 overflow-hidden bg-black/90 px-16",
        landscape
          ? "py-5"
          : "max-h-[60%] shrink-0 border-t border-white/10 py-5",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-6 rounded-r-full bg-app-accent"
      />
      <h1
        data-field="title"
        className="relative font-display font-bold leading-tight whitespace-pre-line"
        style={{ fontSize: `${titleSize}px` }}
      >
        <HighlightedText text={values.title.trim()} />
      </h1>
    </div>
  );

  const subtitle = hasText(values.subtitle) && (
    <div
      data-news-subtitle
      data-fit
      className={twMerge(
        "relative overflow-hidden bg-linear-to-b from-black/90 to-black px-16",
        landscape ? "py-5" : "max-h-[45%] shrink-0 pt-10 pb-8",
      )}
    >
      <p
        data-field="subtitle"
        className="font-display leading-snug font-normal whitespace-pre-line"
        style={{ fontSize: `${subtitleSize}px` }}
      >
        <HighlightedText text={values.subtitle.trim()} />
      </p>
    </div>
  );

  const backdrop = photo ? (
    <>
      <img
        src={photo.url}
        alt=""
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: `${photo.focalX}% ${photo.focalY}%` }}
      />
      <div className="absolute inset-0 bg-black/35" />
    </>
  ) : (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle at 55% 38%, #444 0%, #171717 55%, #050505 100%)",
      }}
    />
  );

  const photoPanel = (
    <div
      data-news-photo
      className={twMerge(
        "relative flex min-h-0 flex-col overflow-hidden",
        landscape
          ? "min-w-0 flex-[9] bg-neutral-900"
          : "flex-1 justify-between",
      )}
    >
      {landscape && backdrop}
      {hasText(values.personName) ? (
        <div
          data-fit
          className={twMerge(
            "relative z-10 min-h-0 overflow-hidden px-16 pb-4",
            landscape ? "pt-8" : "max-w-[75%] pt-16",
          )}
        >
          <p
            data-field="personName"
            className="font-display font-bold leading-none whitespace-pre-line"
            style={{ fontSize: landscape ? 40 : 80 }}
          >
            {values.personName.trim()}
          </p>
        </div>
      ) : (
        <div />
      )}
      {!landscape && title}
    </div>
  );

  return (
    <div
      className={twMerge(
        "relative flex flex-col overflow-hidden bg-black text-white",
        className,
      )}
      style={{ width, height }}
    >
      {funding && <FundingBanner grant={funding} />}
      {landscape ? (
        <div data-news-main className="flex min-h-0 flex-1 overflow-hidden">
          <div
            data-news-copy
            className="flex min-w-0 flex-[11] flex-col justify-center"
          >
            <div data-fit className="max-h-full overflow-hidden">
              {title}
              {subtitle}
            </div>
          </div>
          {photoPanel}
        </div>
      ) : (
        <div
          data-news-main
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-neutral-900"
        >
          {backdrop}
          {photoPanel}
          {subtitle}
        </div>
      )}
      <div
        data-news-footer
        className="relative flex shrink-0 items-center justify-between border-t border-white/10 bg-black px-16 py-8"
      >
        <img
          src={footerLogo}
          alt="Generacja Innowacja"
          className="h-12 w-auto"
        />
        <img src={footerText} alt="gi.org.pl" className="h-8 w-auto" />
      </div>
    </div>
  );
};

export default NewsCard;
