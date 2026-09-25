import { fireEvent, render, screen } from "@testing-library/react";
import type { GraphicTemplate } from "../ExportLab.types";
import { STANDARD_TEMPLATE } from "../templates/StandardTemplate/StandardTemplate.constants";
import TemplatePicker from "./TemplatePicker";

const TEMPLATES: readonly GraphicTemplate[] = [
  STANDARD_TEMPLATE,
  { ...STANDARD_TEMPLATE, id: "event", name: "Wydarzenie" },
];

describe("<TemplatePicker />", () => {
  describe("when rendered", () => {
    it("lists every template with its thumbnail and the selected one checked", () => {
      render(
        <TemplatePicker
          templates={TEMPLATES}
          selectedId="standard"
          thumbnails={{ standard: "blob:standard" }}
          onSelect={vi.fn()}
        />,
      );
      expect(screen.getByRole("radio", { name: "Standard" })).toBeChecked();
      expect(
        screen.getByRole("radio", { name: "Wydarzenie" }),
      ).not.toBeChecked();
      expect(
        document.querySelector('img[src="blob:standard"]'),
      ).toBeInTheDocument();
      // The other template's thumbnail is still rendering.
      expect(screen.getByTestId("shimmer")).toBeInTheDocument();
    });
  });

  describe("when another template is chosen", () => {
    it("reports its id", () => {
      const onSelect = vi.fn();
      render(
        <TemplatePicker
          templates={TEMPLATES}
          selectedId="standard"
          thumbnails={{}}
          onSelect={onSelect}
        />,
      );
      fireEvent.click(screen.getByRole("radio", { name: "Wydarzenie" }));
      expect(onSelect).toHaveBeenCalledWith("event");
    });
  });
});
