import type { FundingTemplateField } from "../../ExportLab.types";

interface Props {
  field: FundingTemplateField;
  value: string;
  onChange: (value: string) => void;
}

/** Compact card-and-radio interaction like the template list. */
const FundingPicker = ({ field, value, onChange }: Props) => (
  <div
    className="grid grid-cols-2 gap-2"
    role="radiogroup"
    aria-label={field.label}
  >
    {field.options.map((option) => (
      <label
        key={option.value}
        className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-app-border px-3 py-2 text-center hover:bg-app-hover has-checked:border-app-accent has-checked:bg-app-accent/10 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-app-focus"
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
        <strong className="text-sm">{option.label}</strong>
      </label>
    ))}
  </div>
);

export default FundingPicker;
