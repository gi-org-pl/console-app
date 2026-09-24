import { render, screen } from "@testing-library/react";
import Shimmer from "./Shimmer";

describe("<Shimmer />", () => {
  describe("when rendered with extra classes and style", () => {
    it("is hidden from assistive tech and keeps the animation", () => {
      render(<Shimmer className="rounded-lg" style={{ width: 10 }} />);
      const shimmer = screen.getByTestId("shimmer");
      expect(shimmer).toHaveAttribute("aria-hidden", "true");
      expect(shimmer).toHaveClass("animate-shimmer", "rounded-lg");
      expect(shimmer).toHaveStyle({ width: "10px" });
    });
  });
});
