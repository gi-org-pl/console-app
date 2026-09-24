import type { FundingTemplateField } from "../../ExportLab.types";

interface Props {
  field: FundingTemplateField;
  value: string;
  onChange: (value: string) => void;
}

/** Same card-and-radio interaction as the template list. */
const FundingPicker = ({ field, value, onChange }: Props) => (
  <div className="grid gap-2" role="radiogroup" aria-label={field.label}>
    {field.options.map((option) => (
      <label
        key={option.value}
        className="flex cursor-pointer items-center gap-4 rounded-lg border border-app-border p-2 hover:bg-app-hover has-checked:border-app-accent has-checked:bg-app-accent/10 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-app-focus"
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
        <span
          aria-hidden="true"
          className="flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-app-border bg-black"
        >
          {option.leftImage && option.rightImage ? (
            <span className="flex w-full gap-0.5 px-1">
              <img src={option.leftImage} alt="" className="w-1/2" />
              <img src={option.rightImage} alt="" className="w-1/2" />
            </span>
          ) : (
            <span className="text-2xl text-app-subtle">—</span>
          )}
        </span>
        <strong className="text-base">{option.label}</strong>
      </label>
    ))}
  </div>
);

export default FundingPicker;
