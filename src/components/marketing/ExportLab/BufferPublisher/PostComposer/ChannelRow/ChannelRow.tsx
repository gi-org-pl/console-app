import {
  faCircleExclamation,
  faPen,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge } from "@gi-org-pl/athena";
import type { BufferChannel } from "../../../../../../services/buffer/schemas/buffer.schemas";
import { GRAPHIC_FORMATS } from "../../../ExportLab.constants";
import type { Preview } from "../../../ExportLab.types";
import CaptionField from "../CaptionField/CaptionField";
import FormatPicker from "../FormatPicker/FormatPicker";
import { SERVICES } from "../PostComposer.constants";
import type {
  ChannelPublishResult,
  ImageScope,
  PostContent,
  PostIssue,
} from "../PostComposer.types";

interface Props {
  channel: BufferChannel;
  content: PostContent;
  isCustomized: boolean;
  /** The formats of the first graphic of the post. */
  images: readonly Preview[];
  /** How many graphics the post holds. */
  graphicCount: number;
  /** Whether this channel gets every graphic or the first only. */
  imageScope: ImageScope;
  issues: readonly PostIssue[];
  result?: ChannelPublishResult;
  isDisabled: boolean;
  onCustomize: () => void;
  onReset: () => void;
  onChange: (content: PostContent) => void;
  onImageScopeChange: (imageScope: ImageScope) => void;
}

const SCOPE_OPTION_CLASS_NAME =
  "cursor-pointer rounded-lg border border-app-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-app-hover has-checked:border-app-accent has-checked:bg-app-accent/10 has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-app-focus";

const RESULT_BADGE: Record<
  ChannelPublishResult["status"],
  { label: string; type: "default" | "success" | "error" }
> = {
  publishing: { label: "Wysyłanie…", type: "default" },
  success: { label: "Wysłano", type: "success" },
  error: { label: "Błąd", type: "error" },
};

const BUTTON_CLASS_NAME =
  "inline-flex shrink-0 items-center gap-2 rounded-lg border border-app-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-60";

/** What goes to one channel, with the option to give it its own graphic and caption. */
const ChannelRow = ({
  channel,
  content,
  isCustomized,
  images,
  graphicCount,
  imageScope,
  issues,
  result,
  isDisabled,
  onCustomize,
  onReset,
  onChange,
  onImageScopeChange,
}: Props) => {
  const info = SERVICES[channel.service];
  const image = images.find(({ formatId }) => formatId === content.formatId);
  const format = GRAPHIC_FORMATS.find(({ id }) => id === content.formatId);
  // An empty caption is reported once by the publish bar, not on every row.
  const errors = issues.filter(
    ({ level, code }) => level === "error" && code !== "empty",
  );
  const isPublished = result?.status === "success";
  const hasSeveralGraphics = graphicCount > 1;
  // A network that takes one image has nothing to choose from.
  const canChooseScope = info.maxImages > 1;
  const sentCount = imageScope === "all" ? graphicCount : 1;
  const scopeOptions: readonly { value: ImageScope; label: string }[] = [
    { value: "all", label: `Wszystkie grafiki (${graphicCount})` },
    { value: "first", label: "Tylko pierwsza" },
  ];

  return (
    <li className="overflow-hidden rounded-lg border border-app-border">
      <div className="flex items-center gap-3 p-2 pr-3">
        <span className="relative shrink-0">
          {image ? (
            <img
              src={image.url}
              alt=""
              className="size-12 rounded-md bg-app-surface-2 object-contain"
            />
          ) : (
            <span className="block size-12 rounded-md bg-app-surface-2" />
          )}
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -bottom-1.5 grid size-6 place-items-center rounded-full border-2 border-app-surface bg-app-bg text-xs"
          >
            <FontAwesomeIcon icon={info.icon} />
          </span>
          {sentCount > 1 && (
            <span
              aria-hidden="true"
              className="absolute -top-1.5 -left-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-app-surface bg-app-accent px-1 text-xs leading-none font-semibold text-white"
            >
              {sentCount}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <strong className="block truncate font-semibold">
            {channel.name}
          </strong>
          <span className="block truncate text-sm text-app-muted">
            {info.label} · {format?.ratio} ·{" "}
            {hasSeveralGraphics &&
              `${sentCount === 1 ? "1 grafika" : `grafik: ${sentCount}`} · `}
            {isCustomized ? "własna treść" : "wspólna treść"}
          </span>
        </div>
        {result ? (
          <Badge variant="secondary" type={RESULT_BADGE[result.status].type}>
            {RESULT_BADGE[result.status].label}
          </Badge>
        ) : (
          errors.length > 0 && (
            <FontAwesomeIcon
              icon={faCircleExclamation}
              title="Do poprawy"
              className="text-app-error"
            />
          )
        )}
        {!isPublished && (
          <button
            type="button"
            disabled={isDisabled}
            onClick={isCustomized ? onReset : onCustomize}
            aria-label={`${isCustomized ? "Przywróć wspólną treść" : "Dostosuj"}: ${channel.name}`}
            className={BUTTON_CLASS_NAME}
          >
            <FontAwesomeIcon icon={isCustomized ? faRotateLeft : faPen} />
            <span className="hidden sm:inline">
              {isCustomized ? "Wspólna" : "Dostosuj"}
            </span>
          </button>
        )}
      </div>
      {(errors.length > 0 || result?.status === "error") && (
        <ul
          role="alert"
          className="grid gap-1 border-t border-app-border px-3 py-2 text-sm text-app-error"
        >
          {errors.map(({ message }) => (
            <li key={message}>{message}</li>
          ))}
          {result?.status === "error" && <li>{result.message}</li>}
        </ul>
      )}
      {hasSeveralGraphics && !isPublished && (
        <div className="grid gap-2 border-t border-app-border px-3 py-2">
          {canChooseScope && (
            <div
              role="radiogroup"
              aria-label={`Grafiki dla: ${channel.name}`}
              className="flex flex-wrap gap-2"
            >
              {scopeOptions.map(({ value, label }) => (
                <label key={value} className={SCOPE_OPTION_CLASS_NAME}>
                  <input
                    type="radio"
                    name={`image-scope-${channel.id}`}
                    value={value}
                    checked={value === imageScope}
                    disabled={isDisabled}
                    onChange={() => onImageScopeChange(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
          <p className="text-sm text-app-muted">{info.imageScopeHint}</p>
        </div>
      )}
      {isCustomized && !isPublished && (
        <div className="grid gap-4 border-t border-app-border bg-app-surface-2/40 p-3">
          <FormatPicker
            name={`format-${channel.id}`}
            label={`Grafika dla: ${channel.name}`}
            images={images}
            value={content.formatId}
            isDisabled={isDisabled}
            onChange={(formatId) => onChange({ ...content, formatId })}
          />
          <CaptionField
            id={`caption-${channel.id}`}
            label={`Treść dla: ${channel.name}`}
            value={content.text}
            services={[channel.service]}
            isDisabled={isDisabled}
            onChange={(text) => onChange({ ...content, text })}
          />
        </div>
      )}
    </li>
  );
};

export default ChannelRow;
