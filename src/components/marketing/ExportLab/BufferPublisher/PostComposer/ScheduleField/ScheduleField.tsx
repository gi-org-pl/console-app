import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { twMerge } from "tailwind-merge";
import type { BufferPublishMode } from "../../../../../../services/buffer/schemas/buffer.schemas";
import {
  FIELD_CONTROL_CLASS_NAME,
  FIELD_LABEL_CLASS_NAME,
} from "../../../ContentForm/TextField/TextField.constants";
import { PUBLISH_MODES } from "../PostComposer.constants";
import { getScheduleError, scheduleBounds } from "../utils/scheduleBounds";

interface Props {
  mode: BufferPublishMode;
  dueAt: string;
  isDisabled?: boolean;
  onChange: (patch: { mode?: BufferPublishMode; dueAt?: string }) => void;
}

const DUE_AT_ID = "publish-due-at";

const ScheduleField = ({ mode, dueAt, isDisabled, onChange }: Props) => {
  const selected = PUBLISH_MODES.find(({ value }) => value === mode);
  const { min, max } = scheduleBounds();
  // An empty field is a missing step, shown by the publish bar, not an error yet.
  const error = dueAt ? getScheduleError(dueAt) : null;

  return (
    <div className="grid gap-3">
      <div
        role="radiogroup"
        aria-label="Kiedy opublikować"
        className="grid grid-cols-3 gap-2"
      >
        {PUBLISH_MODES.map((option) => (
          <label
            key={option.value}
            className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-app-border px-2 py-3 text-center transition-colors hover:bg-app-hover has-checked:border-app-accent has-checked:bg-app-accent/10 has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-app-focus"
          >
            <input
              type="radio"
              name="publish-mode"
              value={option.value}
              checked={option.value === mode}
              disabled={isDisabled}
              onChange={() => onChange({ mode: option.value })}
              className="sr-only"
            />
            <FontAwesomeIcon
              icon={option.icon}
              className="text-lg text-app-muted group-has-checked:text-app-accent-text"
            />
            <strong className="text-sm">{option.label}</strong>
          </label>
        ))}
      </div>
      <p className="text-sm text-app-muted">{selected?.hint}</p>
      {mode === "customScheduled" && (
        <div className="grid gap-2">
          <label htmlFor={DUE_AT_ID} className={FIELD_LABEL_CLASS_NAME}>
            Dzień i godzina
          </label>
          <input
            id={DUE_AT_ID}
            type="datetime-local"
            value={dueAt}
            min={min}
            max={max}
            disabled={isDisabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${DUE_AT_ID}-error` : undefined}
            onChange={(event) => onChange({ dueAt: event.target.value })}
            className={twMerge(
              FIELD_CONTROL_CLASS_NAME,
              error && "border-app-error hover:border-app-error",
            )}
          />
          {error && (
            <p id={`${DUE_AT_ID}-error`} className="text-sm text-app-error">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleField;
