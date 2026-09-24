import { faDownload, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@gi-org-pl/athena";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import type { GraphicFormat, Preview } from "../../ExportLab.types";
import Shimmer from "../../Shimmer/Shimmer";

interface Props {
  format: GraphicFormat;
  preview?: Preview;
  description: string;
  isRendering: boolean;
  areActionsDisabled: boolean;
  canShare: boolean;
  onShare: (file: File) => void;
}

const IMAGE_CLASS_NAME =
  "absolute inset-0 size-full transition-opacity duration-500 ease-out motion-reduce:transition-none";

const PreviewCard = ({
  format,
  preview,
  description,
  isRendering,
  areActionsDisabled,
  canShare,
  onShare,
}: Props) => {
  // Images stack in one box: the shown one stays while the next loads on top,
  // fades in over it, and only then does the previous one leave.
  const [shownUrl, setShownUrl] = useState<string>();
  const [previousUrl, setPreviousUrl] = useState<string>();
  const pendingUrl =
    preview && preview.url !== shownUrl ? preview.url : undefined;
  const hasFailed = !isRendering && !preview;
  const isBusy = isRendering || !!pendingUrl;
  const isDisabled = !preview || areActionsDisabled;
  const alt = `${format.name}: ${description}`;

  return (
    <article className="overflow-hidden rounded-[10px] border border-app-border bg-app-surface">
      <div className="grid h-80 place-items-center bg-app-surface-2 p-4 @container-[size] sm:h-72 tablet:h-56 desktop:h-72 wide:h-88">
        <div
          className="relative overflow-hidden rounded-xs bg-app-surface shadow-[0_5px_12px_rgb(0_0_0/50%)]"
          style={{
            aspectRatio: `${format.width} / ${format.height}`,
            width: `min(100cqw, 100cqh * ${format.width / format.height})`,
          }}
        >
          {/* One keyed list, so a loaded image keeps its element and animates in place. */}
          {[hasFailed ? undefined : previousUrl, shownUrl, pendingUrl].map(
            (url) => {
              if (!url) return null;
              const isShown = url === shownUrl;
              const isPending = url === pendingUrl;
              return (
                <img
                  key={url}
                  src={url}
                  alt={isShown && !hasFailed ? alt : ""}
                  aria-hidden={!isShown || hasFailed}
                  onLoad={
                    isPending
                      ? () => {
                          setPreviousUrl(shownUrl);
                          setShownUrl(url);
                        }
                      : undefined
                  }
                  onTransitionEnd={
                    isShown ? () => setPreviousUrl(undefined) : undefined
                  }
                  className={twMerge(
                    IMAGE_CLASS_NAME,
                    isPending || (isShown && hasFailed)
                      ? "opacity-0"
                      : isShown && isBusy
                        ? "opacity-60"
                        : "opacity-100",
                  )}
                />
              );
            },
          )}
          {/* Drawn over whatever is on screen, so re-rendering never blanks the card. */}
          <Shimmer
            className={twMerge(
              "absolute inset-0 bg-transparent transition-opacity duration-300 motion-reduce:transition-none",
              isBusy ? "opacity-100" : "opacity-0",
            )}
          />
          {hasFailed && (
            <p className="absolute inset-0 grid place-items-center p-4 text-center text-base text-app-muted">
              Popraw treść, aby zobaczyć grafikę
            </p>
          )}
        </div>
        {isBusy && <span className="sr-only">Przygotowujemy grafikę…</span>}
      </div>
      <div className="flex items-center justify-between gap-4 px-4 py-2">
        <h3 className="font-display text-base font-semibold">
          {format.ratio}
          <span className="sr-only"> · {format.name}</span>
        </h3>
        <div className="flex gap-2">
          <Button
            asChild
            isIconButton
            type="outlined"
            size="small"
            disabled={isDisabled}
            className="size-8 max-sm:size-12"
          >
            {/* Without href a disabled link is neither focusable nor announced as a link. */}
            <a
              href={isDisabled ? undefined : preview?.url}
              download={preview?.file.name}
              aria-label={`Pobierz ${format.name} PNG`}
              title="Pobierz PNG"
            >
              <FontAwesomeIcon icon={faDownload} />
            </a>
          </Button>
          {canShare && (
            <Button
              isIconButton
              type="outlined"
              size="small"
              disabled={isDisabled}
              className="size-8 max-sm:size-12"
              aria-label={`Udostępnij ${format.name}`}
              title="Udostępnij"
              onClick={() => preview && onShare(preview.file)}
            >
              <FontAwesomeIcon icon={faShareNodes} />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export default PreviewCard;
