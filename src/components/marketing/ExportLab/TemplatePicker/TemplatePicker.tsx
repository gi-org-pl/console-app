import EditorPanel from "../EditorPanel/EditorPanel";
import type { GraphicTemplate } from "../ExportLab.types";
import TemplateThumbnail from "./TemplateThumbnail/TemplateThumbnail";

interface Props {
  templates: readonly GraphicTemplate[];
  selectedId: string;
  /** 1:1 PNG per template id, drawn from the current content. */
  thumbnails: Readonly<Record<string, string | undefined>>;
  onSelect: (id: string) => void;
}

const TemplatePicker = ({
  templates,
  selectedId,
  thumbnails,
  onSelect,
}: Props) => (
  <EditorPanel titleId="template-title" title="Szablon">
    <div
      className="grid gap-2"
      role="radiogroup"
      aria-labelledby="template-title"
    >
      {templates.map((template) => {
        const nameId = `template-${template.id}-name`;
        return (
          <label
            key={template.id}
            className="flex cursor-pointer items-center gap-4 rounded-lg border border-app-border p-2 hover:bg-app-hover has-checked:border-app-accent has-checked:bg-app-accent/10 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-app-focus"
          >
            {/* The card shows the selection; the radio stays for keyboard and screen readers. */}
            <input
              type="radio"
              name="template"
              value={template.id}
              checked={template.id === selectedId}
              onChange={() => onSelect(template.id)}
              aria-labelledby={nameId}
              className="sr-only"
            />
            <TemplateThumbnail url={thumbnails[template.id]} />
            <strong id={nameId} className="text-base">
              {template.name}
            </strong>
          </label>
        );
      })}
    </div>
  </EditorPanel>
);

export default TemplatePicker;
