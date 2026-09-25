import { faAlignLeft } from "@fortawesome/free-solid-svg-icons";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ChoiceTemplateField } from "../../ExportLab.types";
import ChoiceField from "./ChoiceField";

const field: ChoiceTemplateField = {
  kind: "choice",
  id: "align",
  label: "Wyrównanie tekstu",
  defaultValue: "left",
  options: [
    { value: "left", label: "Do lewej", icon: faAlignLeft },
    { value: "big", label: "Duży", sample: 20 },
  ],
};

describe("<ChoiceField />", () => {
  describe("when rendered", () => {
    it("offers each option as a named radio with a tooltip and no visible text", () => {
      render(<ChoiceField field={field} value="left" onChange={vi.fn()} />);
      expect(
        screen.getByRole("radiogroup", { name: "Wyrównanie tekstu" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Do lewej" })).toBeChecked();
      expect(screen.getByTitle("Do lewej").querySelector("svg")).not.toBeNull();
      expect(screen.getByTitle("Duży")).toHaveTextContent("A");
      expect(screen.getByText("A")).toHaveStyle({ fontSize: "20px" });
    });
  });

  describe("when another option is picked", () => {
    it("reports its value", () => {
      const onChange = vi.fn();
      render(<ChoiceField field={field} value="left" onChange={onChange} />);
      fireEvent.click(screen.getByRole("radio", { name: "Duży" }));
      expect(onChange).toHaveBeenCalledWith("big");
    });
  });
});
