import EditorPanel from "../EditorPanel/EditorPanel";
import type {
  ChoiceTemplateField,
  FieldValues,
  FundingTemplateField,
  GraphicTemplate,
  PhotoControls,
  PreviewError,
} from "../ExportLab.types";
import { getFieldError } from "../utils/getFieldError";
import ChoiceField from "./ChoiceField/ChoiceField";
import FundingPicker from "./FundingPicker/FundingPicker";
import PhotoField from "./PhotoField/PhotoField";
import TextField from "./TextField/TextField";

interface Props {
  template: GraphicTemplate;
  values: FieldValues;
  /** Export problem to show next to the fields that cause it. */
  error: PreviewError | null;
  onChange: (fieldId: string, value: string) => void;
  photo: PhotoControls;
}

/** The template's fields as property panels: text with its toolbars, layout, background. */
const ContentForm = ({ template, values, error, onChange, photo }: Props) => {
  const choices = template.fields.filter(
    (field): field is ChoiceTemplateField => field.kind === "choice",
  );
  const layoutChoices = choices.filter((field) => !field.attachTo);
  const fundingFields = template.fields.filter(
    (field): field is FundingTemplateField => field.kind === "funding",
  );
  const renderChoice = (field: ChoiceTemplateField) => (
    <ChoiceField
      key={field.id}
      field={field}
      value={values[field.id] ?? field.defaultValue}
      onChange={(value) => onChange(field.id, value)}
    />
  );

  return (
    <>
      <EditorPanel titleId="text-title" title="Tekst">
        {template.fields.map((field) => {
          if (field.kind !== "text") return null;
          const value = values[field.id] ?? "";
          // The message sits under the first blamed field; the others are only highlighted.
          const errorText =
            getFieldError(field, value) ??
            (error?.fieldIds[0] === field.id ? error.message : undefined);
          return (
            <TextField
              key={field.id}
              id={`field-${field.id}`}
              label={field.label}
              value={value}
              onChange={(next) => onChange(field.id, next)}
              helper={
                field.maxLength === undefined
                  ? undefined
                  : `${value.length} / ${field.maxLength} znaków`
              }
              errorText={errorText}
              isError={!!error?.fieldIds.includes(field.id)}
              isMultiline={field.isMultiline}
              canHighlight={field.canHighlight}
              toolbar={choices
                .filter((choice) => choice.attachTo === field.id)
                .map(renderChoice)}
            />
          );
        })}
      </EditorPanel>
      {layoutChoices.length > 0 && (
        <EditorPanel titleId="layout-title" title="Układ">
          <div className="flex flex-wrap gap-4">
            {layoutChoices.map(renderChoice)}
          </div>
        </EditorPanel>
      )}
      {fundingFields.map((field) => (
        <EditorPanel
          key={field.id}
          titleId={`${field.id}-title`}
          title={field.label}
        >
          <FundingPicker
            field={field}
            value={values[field.id] ?? field.defaultValue}
            onChange={(value) => onChange(field.id, value)}
          />
        </EditorPanel>
      ))}
      {template.supportsPhoto && (
        <EditorPanel titleId="background-title" title="Tło">
          <PhotoField photo={photo} />
        </EditorPanel>
      )}
    </>
  );
};

export default ContentForm;
