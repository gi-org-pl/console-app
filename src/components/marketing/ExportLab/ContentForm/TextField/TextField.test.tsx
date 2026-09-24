import { fireEvent, render, screen } from "@testing-library/react";
import TextField from "./TextField";

const baseProps = {
  id: "field-title",
  label: "Tytuł",
  value: "Tytuł",
  onChange: vi.fn(),
};

const highlightButton = () =>
  screen.getByRole("button", { name: "Wyróżnij zaznaczony tekst" });

describe("<TextField />", () => {
  describe("when single-line", () => {
    it("renders a labelled input described by its helper", () => {
      render(<TextField {...baseProps} helper="5 / 90 znaków" />);
      const input = screen.getByLabelText("Tytuł");
      expect(input.tagName).toBe("INPUT");
      expect(input).toHaveValue("Tytuł");
      expect(input).toHaveAttribute("aria-invalid", "false");
      expect(input).toHaveAccessibleDescription("5 / 90 znaków");
    });
  });

  describe("when there is no helper", () => {
    it("renders no description", () => {
      render(<TextField {...baseProps} />);
      expect(screen.getByLabelText("Tytuł")).not.toHaveAttribute(
        "aria-describedby",
      );
    });
  });

  describe("when multi-line without highlights", () => {
    it("renders a resizable textarea without a toolbar", () => {
      render(<TextField {...baseProps} isMultiline />);
      const textarea = screen.getByLabelText("Tytuł");
      expect(textarea.tagName).toBe("TEXTAREA");
      expect(textarea).toHaveAttribute("rows", "4");
      expect(screen.queryByRole("button")).toBeNull();
    });
  });

  describe("when the user types", () => {
    it.each([
      [false, false],
      [true, false],
      [true, true],
    ])("reports the new value (multiline: %s, highlight: %s)", (isMultiline, canHighlight) => {
      const onChange = vi.fn();
      render(
        <TextField
          {...baseProps}
          isMultiline={isMultiline}
          canHighlight={canHighlight}
          onChange={onChange}
        />,
      );
      fireEvent.change(screen.getByLabelText("Tytuł"), {
        target: { value: "Nowy" },
      });
      expect(onChange).toHaveBeenCalledWith("Nowy");
    });
  });

  describe("when highlights are enabled", () => {
    it("paints marked fragments in the mirror behind the text", () => {
      const { container } = render(
        <TextField
          {...baseProps}
          value={"Dobre *idee*\n"}
          isMultiline
          canHighlight
          toolbar={<span>Rozmiar</span>}
        />,
      );
      expect(screen.getByText("idee")).toHaveClass("text-app-accent-text");
      expect(screen.getAllByText("*")[0]).toHaveClass("text-app-subtle");
      expect(container.querySelector("[aria-hidden='true']")?.textContent).toBe(
        "Dobre *idee*\n ",
      );
      expect(screen.getByText("Rozmiar")).toBeVisible();
    });

    it("wraps the selection and keeps it selected", () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <TextField
          {...baseProps}
          value="Dobre idee"
          isMultiline
          canHighlight
          onChange={onChange}
        />,
      );
      const textarea = screen.getByLabelText("Tytuł") as HTMLTextAreaElement;
      textarea.setSelectionRange(6, 10);
      fireEvent.mouseDown(highlightButton());
      fireEvent.click(highlightButton());
      expect(onChange).toHaveBeenCalledWith("Dobre *idee*");

      rerender(
        <TextField
          {...baseProps}
          value="Dobre *idee*"
          isMultiline
          canHighlight
          onChange={onChange}
        />,
      );
      expect(textarea).toHaveFocus();
      expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([7, 11]);
    });

    it("ignores unrelated value changes while a selection is pending", () => {
      const { rerender } = render(
        <TextField {...baseProps} value="a" isMultiline canHighlight />,
      );
      fireEvent.click(highlightButton());
      rerender(<TextField {...baseProps} value="b" isMultiline canHighlight />);
      expect(screen.getByLabelText("Tytuł")).not.toHaveFocus();
    });
  });

  describe("when it has an error message", () => {
    it("replaces the helper and marks the field invalid", () => {
      render(
        <TextField
          {...baseProps}
          helper="5 / 90 znaków"
          errorText="Skróć do 90 znaków."
        />,
      );
      const input = screen.getByLabelText("Tytuł");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription("Skróć do 90 znaków.");
      expect(screen.queryByText("5 / 90 znaków")).toBeNull();
    });
  });

  describe("when only highlighted as invalid", () => {
    it.each([
      false,
      true,
    ])("keeps the helper and marks the field (highlight: %s)", (canHighlight) => {
      render(
        <TextField
          {...baseProps}
          helper="5 / 90 znaków"
          isError
          isMultiline={canHighlight}
          canHighlight={canHighlight}
        />,
      );
      expect(screen.getByLabelText("Tytuł")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      expect(screen.getByText("5 / 90 znaków")).toBeVisible();
    });
  });
});
