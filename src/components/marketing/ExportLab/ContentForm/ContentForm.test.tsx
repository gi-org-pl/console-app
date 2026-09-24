import { fireEvent, render, screen, within } from "@testing-library/react";
import type { GraphicTemplate, PhotoControls } from "../ExportLab.types";
import { STANDARD_TEMPLATE } from "../templates/StandardTemplate/StandardTemplate.constants";
import { getDefaultFieldValues } from "../utils/getDefaultFieldValues";
import ContentForm from "./ContentForm";

const photo: PhotoControls = {
  photo: null,
  isLoading: false,
  error: "",
  select: vi.fn(),
  setFocus: vi.fn(),
  remove: vi.fn(),
};

const TEXT_ONLY_TEMPLATE: GraphicTemplate = {
  ...STANDARD_TEMPLATE,
  supportsPhoto: false,
  fields: [
    {
      kind: "text",
      id: "headline",
      label: "Nagłówek",
      maxLength: 10,
      defaultValue: "",
    },
  ],
};

const baseProps = {
  template: STANDARD_TEMPLATE,
  values: getDefaultFieldValues(),
  error: null,
  onChange: vi.fn(),
  photo,
};

describe("<ContentForm />", () => {
  describe("when the template has text, layout choices and a photo", () => {
    it("groups them into text, layout and background panels", () => {
      render(<ContentForm {...baseProps} />);
      const text = screen.getByRole("region", { name: "Tekst" });
      expect(within(text).getByLabelText("Tytuł")).toBeInTheDocument();
      expect(
        within(text).getByRole("radiogroup", { name: "Rozmiar tytułu" }),
      ).toBeInTheDocument();
      const layout = screen.getByRole("region", { name: "Układ" });
      expect(
        within(layout).getByRole("radiogroup", { name: "Położenie tekstu" }),
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole("region", { name: "Finansowanie" })).getByRole(
          "radio",
          { name: "Bez belki" },
        ),
      ).toBeChecked();
      expect(
        within(screen.getByRole("region", { name: "Tło" })).getByLabelText(
          "Dodaj zdjęcie",
        ),
      ).toBeInTheDocument();
    });

    it("shows no counters for texts without a limit", () => {
      render(<ContentForm {...baseProps} />);
      expect(screen.queryByText(/znaków/)).toBeNull();
    });

    it("starts the title at the large size", () => {
      render(<ContentForm {...baseProps} />);
      expect(
        screen.getByRole("radio", { name: /Duży \(64 px\)/ }),
      ).toBeChecked();
    });
  });

  describe("when the template has only a limited text", () => {
    it("shows its counter and hides the layout and background panels", () => {
      render(
        <ContentForm
          {...baseProps}
          template={TEXT_ONLY_TEMPLATE}
          values={{ headline: "Tytuł" }}
        />,
      );
      expect(screen.getByText("5 / 10 znaków")).toBeVisible();
      expect(screen.queryByRole("region", { name: "Układ" })).toBeNull();
      expect(screen.queryByRole("region", { name: "Tło" })).toBeNull();
    });

    it("flags a value over the limit right away", () => {
      render(
        <ContentForm
          {...baseProps}
          template={TEXT_ONLY_TEMPLATE}
          values={{ headline: "a".repeat(11) }}
        />,
      );
      expect(screen.getByText("Skróć do 10 znaków.")).toBeVisible();
    });
  });

  describe("when an export error blames several fields", () => {
    it("puts the message under the first one and marks the others", () => {
      render(
        <ContentForm
          {...baseProps}
          error={{ message: "Nie mieści się", fieldIds: ["title", "subtitle"] }}
        />,
      );
      expect(screen.getAllByText("Nie mieści się")).toHaveLength(1);
      expect(screen.getByLabelText("Podtytuł")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    });
  });

  describe("when the user edits", () => {
    it("reports texts and choices by field id", () => {
      const onChange = vi.fn();
      render(<ContentForm {...baseProps} onChange={onChange} />);
      fireEvent.change(screen.getByLabelText("Tytuł"), {
        target: { value: "Nowy" },
      });
      fireEvent.click(screen.getByRole("radio", { name: "Tekst u góry" }));
      fireEvent.click(screen.getByRole("radio", { name: /Mały \(32 px\)/ }));
      fireEvent.click(screen.getByRole("radio", { name: "PROO" }));
      expect(onChange).toHaveBeenCalledWith("title", "Nowy");
      expect(onChange).toHaveBeenCalledWith("position", "top");
      expect(onChange).toHaveBeenCalledWith("titleSize", "32");
      expect(onChange).toHaveBeenCalledWith("funding", "proo");
    });
  });

  describe("when a choice has no value yet", () => {
    it("shows its default as selected", () => {
      render(<ContentForm {...baseProps} values={{}} />);
      expect(
        screen.getByRole("radio", { name: "Tekst na dole" }),
      ).toBeChecked();
    });
  });
});
