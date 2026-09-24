import { render, screen } from "@testing-library/react";
import HighlightedText from "./HighlightedText";

describe("<HighlightedText />", () => {
  describe("when the text has a highlight", () => {
    it("paints it in the accent color and hides the markers", () => {
      const { container } = render(
        <p>
          <HighlightedText text="Dobre *idee* dla" />
        </p>,
      );
      expect(container).toHaveTextContent("Dobre idee dla");
      expect(screen.getByText("idee")).toHaveClass("text-app-accent");
      expect(container.textContent).not.toContain("*");
    });
  });
});
