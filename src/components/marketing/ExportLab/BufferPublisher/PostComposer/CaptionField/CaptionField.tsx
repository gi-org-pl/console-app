import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { InfoMessage } from "@gi-org-pl/athena";
import { twMerge } from "tailwind-merge";
import type { BufferChannel } from "../../../../../../services/buffer/schemas/buffer.schemas";
import {
  FIELD_CONTROL_CLASS_NAME,
  FIELD_LABEL_CLASS_NAME,
} from "../../../ContentForm/TextField/TextField.constants";
import { SERVICES } from "../PostComposer.constants";
import { containsLink } from "../utils/validatePost";

interface Props {
  id: string;
  label: string;
  value: string;
  /** Networks this caption goes to; each gets its own length counter. */
  services: readonly BufferChannel["service"][];
  isDisabled?: boolean;
  onChange: (value: string) => void;
}

const CaptionField = ({
  id,
  label,
  value,
  services,
  isDisabled,
  onChange,
}: Props) => {
  const length = value.trim().length;
  const uniqueServices = [...new Set(services)];
  const linkBlindLabels = uniqueServices
    .filter((service) => !SERVICES[service].hasClickableLinks)
    .map((service) => SERVICES[service].label);
  const isOverLimit = uniqueServices.some(
    (service) => length > SERVICES[service].maxLength,
  );
  const countersId = `${id}-counters`;

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className={FIELD_LABEL_CLASS_NAME}>
        {label}
      </label>
      <textarea
        id={id}
        rows={5}
        value={value}
        disabled={isDisabled}
        placeholder="Napisz, o czym jest post…"
        aria-invalid={isOverLimit}
        aria-describedby={countersId}
        onChange={(event) => onChange(event.target.value)}
        className={twMerge(
          FIELD_CONTROL_CLASS_NAME,
          "min-h-32 resize-y placeholder:text-app-subtle disabled:cursor-not-allowed disabled:opacity-60",
          isOverLimit && "border-app-error hover:border-app-error",
        )}
      />
      <ul
        id={countersId}
        aria-label="Limity znaków"
        className="flex flex-wrap gap-2 text-sm"
      >
        {uniqueServices.length === 0 && (
          <li className="text-app-muted">{length} znaków</li>
        )}
        {uniqueServices.map((service) => {
          const info = SERVICES[service];
          const isOver = length > info.maxLength;
          return (
            <li
              key={service}
              title={`${info.label}: limit ${info.maxLength} znaków`}
              className={twMerge(
                "inline-flex items-center gap-1.5 rounded-full border border-app-border px-2.5 py-0.5 text-app-muted tabular-nums",
                isOver && "border-app-error text-app-error",
              )}
            >
              <FontAwesomeIcon icon={info.icon} />
              <span className="sr-only">{info.label}:</span>
              {length} / {info.maxLength}
            </li>
          );
        })}
      </ul>
      {linkBlindLabels.length > 0 && containsLink(value) && (
        <InfoMessage variant="warning">
          {linkBlindLabels.join(", ")}: linki w opisie nie są klikalne. Dodaj
          link w bio profilu i napisz „link w bio”.
        </InfoMessage>
      )}
    </div>
  );
};

export default CaptionField;
