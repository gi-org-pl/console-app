import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { ComponentType } from "react";

export interface GraphicFormat {
  id: string;
  name: string;
  /** Short label shown on the preview card, e.g. "1:1". */
  ratio: string;
  width: number;
  height: number;
}

export interface GraphicPhoto {
  /** Object URL owned by `usePhoto`; revoked when the photo is replaced. */
  url: string;
  focalX: number;
  focalY: number;
}

interface BaseTemplateField {
  /** Shared ids (e.g. "title") keep the value when switching templates. */
  id: string;
  label: string;
  defaultValue: string;
}

export interface TextTemplateField extends BaseTemplateField {
  kind: "text";
  /** Omit for text of any length; the layout still rejects text that does not fit. */
  maxLength?: number;
  isRequired?: boolean;
  isMultiline?: boolean;
  /** Lets the user mark fragments with `HIGHLIGHT_MARKER` to show them in the accent color. */
  canHighlight?: boolean;
}

export interface ChoiceOption {
  value: string;
  /** Tooltip and accessible name; the option itself shows only an icon. */
  label: string;
  icon?: IconDefinition;
  /** Size in px of an "A" sample, for text size options without an icon. */
  sample?: number;
}

export interface ChoiceTemplateField extends BaseTemplateField {
  kind: "choice";
  options: readonly ChoiceOption[];
  /** Text field whose toolbar holds this choice; without it the choice goes to the layout panel. */
  attachTo?: string;
}

export interface FundingOption {
  value: string;
  label: string;
  leftImage?: string;
  rightImage?: string;
}

export interface FundingTemplateField extends BaseTemplateField {
  kind: "funding";
  options: readonly FundingOption[];
}

export type TemplateField =
  | TextTemplateField
  | ChoiceTemplateField
  | FundingTemplateField;

export type FieldValues = Record<string, string>;

export interface GraphicContent {
  values: FieldValues;
  photo: GraphicPhoto | null;
}

export interface TemplateProps extends GraphicContent {
  format: GraphicFormat;
}

export interface GraphicTemplate {
  id: string;
  name: string;
  fields: readonly TemplateField[];
  supportsPhoto: boolean;
  /**
   * HTML + Tailwind layout rendered at the format's pixel size and rasterized
   * to PNG. Mark boxes that must not overflow with `data-fit`.
   */
  Component: ComponentType<TemplateProps>;
}

export interface Draft {
  templateId: string;
  /** Values of every template's fields, so switching templates keeps the text. */
  values: FieldValues;
}

export interface PhotoState {
  photo: GraphicPhoto | null;
  isLoading: boolean;
  error: string;
}

export interface PhotoControls extends PhotoState {
  select: (file?: File) => Promise<void>;
  setFocus: (focus: Partial<Pick<GraphicPhoto, "focalX" | "focalY">>) => void;
  remove: () => void;
}

export interface Preview {
  formatId: string;
  url: string;
  file: File;
}

export interface PreviewError {
  message: string;
  /** Fields to highlight; empty when no field is to blame (e.g. missing fonts). */
  fieldIds: readonly string[];
}

export interface PreviewsState {
  status: "rendering" | "ready" | "error";
  previews: Preview[];
  error: PreviewError | null;
}
