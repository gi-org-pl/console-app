import { render, screen } from "@testing-library/react";
import ComingSoonCard from "./ComingSoonCard";

describe("<ComingSoonCard />", () => {
  describe("when rendered", () => {
    it("announces that more tools are coming soon", () => {
      render(<ComingSoonCard />);
      expect(screen.getByText("Więcej wkrótce")).toBeVisible();
    });
  });
});
