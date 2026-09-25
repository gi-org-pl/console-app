import { render, screen } from "@testing-library/react";
import Eyebrow from "./Eyebrow";

describe("<Eyebrow />", () => {
  describe("when given extra classes", () => {
    it("renders the label with its base style merged", () => {
      render(<Eyebrow className="mt-4">Sekcja</Eyebrow>);
      const label = screen.getByText("Sekcja");
      expect(label).toHaveClass("text-base", "mt-4");
    });
  });
});
