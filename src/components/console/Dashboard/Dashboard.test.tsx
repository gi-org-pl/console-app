import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { CONSOLE_MODULES } from "../../../constants/console";
import Dashboard from "./Dashboard";

describe("<Dashboard />", () => {
  describe("when rendered", () => {
    it("shows a clickable card per module and a coming soon note", () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>,
      );
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: /Narzędzia dla\s*wolontariuszy/,
        }),
      ).toBeVisible();
      const tools = screen.getByRole("region", { name: "Dostępne narzędzia" });
      expect(within(tools).getAllByRole("article")).toHaveLength(
        CONSOLE_MODULES.length,
      );
      expect(within(tools).getAllByRole("link")).toHaveLength(
        CONSOLE_MODULES.length,
      );
      expect(within(tools).getByText("Więcej wkrótce")).toBeVisible();
    });
  });
});
