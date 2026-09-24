import { render, screen } from "@testing-library/react";
import SectionHeading from "./SectionHeading";

describe("<SectionHeading />", () => {
  describe("when given an aside", () => {
    it("renders the identifiable heading next to it", () => {
      render(
        <SectionHeading
          id="tools"
          title="Narzędzia"
          aside={<span>Etap 1</span>}
        />,
      );
      expect(
        screen.getByRole("heading", { level: 2, name: "Narzędzia" }),
      ).toHaveAttribute("id", "tools");
      expect(screen.getByText("Etap 1")).toBeVisible();
    });
  });
});
