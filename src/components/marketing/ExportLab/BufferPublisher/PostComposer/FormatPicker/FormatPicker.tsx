import { useId } from "react";
import { FIELD_LABEL_CLASS_NAME } from "../../../ContentForm/TextField/TextField.constants";
import { GRAPHIC_FORMATS } from "../../../ExportLab.constants";
import type { Preview } from "../../../ExportLab.types";

interface Props {
  name: string;
  label: string;
  images: readonly Preview[];
  value: string;
  isDisabled?: boolean;
  onChange: (formatId: string) => void;
}

/** The generated formats as small cards; the radios stay for keyboard and screen readers. */
const FormatPicker = ({
  name,
  label,
  images,
  value,
  isDisabled,
  onChange,
}: Props) => {
  const labelId = useId();

  return (
    <div className="grid gap-2">
      <span id={labelId} className={FIELD_LABEL_CLASS_NAME}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid grid-cols-4 gap-2"
      >
        {GRAPHIC_FORMATS.map((format) => {
          const image = images.find(({ formatId }) => formatId === format.id);
          if (!image) return null;
          return (
            <label
              key={format.id}
              title={format.name}
              className="grid cursor-pointer gap-1 rounded-lg border border-app-border p-1.5 text-center transition-colors hover:bg-app-hover has-checked:border-app-accent has-checked:bg-app-accent/10 has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-app-focus"
            >
              <input
                type="radio"
                name={name}
                value={format.id}
                checked={format.id === value}
                disabled={isDisabled}
                onChange={() => onChange(format.id)}
                aria-label={`${format.name} (${format.ratio})`}
                className="sr-only"
              />
              <span className="flex h-16 items-center justify-center overflow-hidden rounded-sm bg-app-surface-2 p-1 sm:h-20">
                <img
                  src={image.url}
                  alt=""
                  className="max-h-full max-w-full rounded-xs object-contain shadow-[0_2px_6px_rgb(0_0_0/50%)]"
                />
              </span>
              <span className="text-sm font-semibold">{format.ratio}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default FormatPicker;
