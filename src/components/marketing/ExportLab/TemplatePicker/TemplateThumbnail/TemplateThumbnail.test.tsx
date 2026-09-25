import { render, screen } from "@testing-library/react";
import TemplateThumbnail from "./TemplateThumbnail";

const image = (container: HTMLElement) => container.querySelector("img");

describe("<TemplateThumbnail />", () => {
  describe("when no image is ready yet", () => {
    it("shimmers in the thumbnail box, hidden from assistive tech", () => {
      const { container } = render(<TemplateThumbnail />);
      expect(container.firstElementChild).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(container.firstElementChild).toHaveStyle({
        width: "72px",
        height: "72px",
      });
      expect(screen.getByTestId("shimmer")).toBeInTheDocument();
    });
  });

  describe("when an image arrives and later re-renders", () => {
    it("shows it and keeps it until the next one is ready", () => {
      const { container, rerender } = render(
        <TemplateThumbnail url="blob:first" />,
      );
      expect(image(container)).toHaveAttribute("src", "blob:first");
      rerender(<TemplateThumbnail />);
      expect(image(container)).toHaveAttribute("src", "blob:first");
      rerender(<TemplateThumbnail url="blob:next" />);
      expect(image(container)).toHaveAttribute("src", "blob:next");
    });
  });
});
