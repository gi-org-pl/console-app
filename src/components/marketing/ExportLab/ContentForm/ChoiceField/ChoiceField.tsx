import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ChoiceTemplateField } from "../../ExportLab.types";

interface Props {
  field: ChoiceTemplateField;
  value: string;
  onChange: (value: string) => void;
}

/** Segmented icon control; option names live in tooltips and for screen readers only. */
const ChoiceField = ({ field, value, onChange }: Props) => (
  <div
    role="radiogroup"
    aria-label={field.label}
    className="flex divide-x divide-app-border overflow-hidden rounded-lg border border-app-border"
  >
    {field.options.map((option) => (
      <label
        key={option.value}
        title={option.label}
        className="grid size-8 cursor-pointer place-items-center text-app-muted transition-colors hover:bg-app-hover hover:text-app-text has-checked:bg-app-active has-checked:text-app-text has-focus-visible:ring-2 has-focus-visible:ring-app-focus has-focus-visible:ring-inset"
      >
        <input
          type="radio"
          name={field.id}
          value={option.value}
          checked={option.value === value}
          onChange={() => onChange(option.value)}
          aria-label={option.label}
          className="sr-only"
        />
        {option.icon ? (
          <FontAwesomeIcon icon={option.icon} />
        ) : (
          <span
            aria-hidden="true"
            className="font-display leading-none font-bold"
            style={{ fontSize: option.sample }}
          >
            A
          </span>
        )}
      </label>
    ))}
  </div>
);

export default ChoiceField;
