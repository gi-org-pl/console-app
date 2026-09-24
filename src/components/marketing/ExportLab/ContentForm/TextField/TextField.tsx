import { faHighlighter } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type ReactNode, useLayoutEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import {
  type TextSelection,
  toggleHighlight,
} from "../../utils/toggleHighlight";
import { tokenizeHighlights } from "../../utils/tokenizeHighlights";
import {
  FIELD_CONTROL_CLASS_NAME,
  FIELD_LABEL_CLASS_NAME,
  TOKEN_CLASS_NAME,
} from "./TextField.constants";

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  /** Replaces the helper and marks the field invalid. */
  errorText?: string;
  /** Highlights the field without a message, e.g. when another field explains the error. */
  isError?: boolean;
  isMultiline?: boolean;
  /** Adds the highlight button and shows marked fragments in red while typing. */
  canHighlight?: boolean;
  /** Extra controls next to the highlight button, e.g. the text size. */
  toolbar?: ReactNode;
}

/**
 * One look for every form field. Athena's Input and TextArea differ in label,
 * text size and width, which made the form look inconsistent.
 */
const TextField = ({
  id,
  label,
  value,
  onChange,
  helper,
  errorText,
  isError,
  isMultiline,
  canHighlight,
  toolbar,
}: Props) => {
  const control = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const pendingSelection = useRef<TextSelection | null>(null);
  const isInvalid = !!errorText || !!isError;
  const message = errorText ?? helper;
  const helperId = `${id}-helper`;
  const hasMirror = canHighlight && isMultiline;

  // Restores the selection after the highlight markers changed the value.
  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    if (!selection || selection.value !== value) return;
    pendingSelection.current = null;
    control.current?.focus();
    control.current?.setSelectionRange(selection.start, selection.end);
  }, [value]);

  function highlightSelection() {
    const element = control.current;
    if (!element) return;
    const next = toggleHighlight({
      value,
      start: element.selectionStart ?? value.length,
      end: element.selectionEnd ?? value.length,
    });
    pendingSelection.current = next;
    onChange(next.value);
  }

  const controlProps = {
    id,
    value,
    "aria-invalid": isInvalid,
    "aria-describedby": message ? helperId : undefined,
    onChange: (event: { target: { value: string } }) =>
      onChange(event.target.value),
  };
  const borderClassName =
    isInvalid && "border-app-error hover:border-app-error";

  return (
    <div className="grid gap-2">
      <label
        htmlFor={id}
        className={twMerge(
          FIELD_LABEL_CLASS_NAME,
          isInvalid && "text-app-error",
        )}
      >
        {label}
      </label>
      {hasMirror ? (
        // The textarea's own text is transparent; the mirror underneath paints the same
        // text with highlights and sets the height, so the field grows with its content.
        <div className="relative">
          <div
            aria-hidden="true"
            className={twMerge(
              FIELD_CONTROL_CLASS_NAME,
              "min-h-20 border-transparent whitespace-pre-wrap wrap-break-word",
            )}
          >
            {tokenizeHighlights(value).map((token, index) => (
              <span
                key={`${index}-${token.kind}`}
                className={TOKEN_CLASS_NAME[token.kind]}
              >
                {token.text}
              </span>
            ))}
            {value.endsWith("\n") ? " " : null}
          </div>
          <textarea
            ref={control}
            {...controlProps}
            className={twMerge(
              FIELD_CONTROL_CLASS_NAME,
              "absolute inset-0 resize-none overflow-hidden bg-transparent text-transparent caret-app-text selection:bg-app-accent/30",
              borderClassName,
            )}
          />
        </div>
      ) : isMultiline ? (
        <textarea
          ref={control}
          rows={4}
          {...controlProps}
          className={twMerge(
            FIELD_CONTROL_CLASS_NAME,
            "min-h-32 resize-y",
            borderClassName,
          )}
        />
      ) : (
        <input
          ref={control}
          type="text"
          {...controlProps}
          className={twMerge(FIELD_CONTROL_CLASS_NAME, borderClassName)}
        />
      )}
      {(canHighlight || toolbar) && (
        <div className="flex flex-wrap items-center gap-2">
          {canHighlight && (
            <button
              type="button"
              title="Wyróżnij zaznaczony tekst"
              aria-label="Wyróżnij zaznaczony tekst"
              // Keeps the textarea selection, which a click would otherwise clear.
              onMouseDown={(event) => event.preventDefault()}
              onClick={highlightSelection}
              className="grid size-8 place-items-center rounded-lg border border-app-border text-app-accent-text transition-colors hover:bg-app-hover"
            >
              <FontAwesomeIcon icon={faHighlighter} />
            </button>
          )}
          {toolbar}
        </div>
      )}
      {message && (
        <p
          id={helperId}
          className={errorText ? "text-app-error" : "text-app-muted"}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default TextField;
