import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { CONSOLE_MODULES } from "../../../../constants/console";
import ModuleCard from "./ModuleCard";

describe("<ModuleCard />", () => {
  describe("when rendered", () => {
    it("shows the numbered category, description and links the whole card to the module", () => {
      const [module] = CONSOLE_MODULES;
      render(
        <MemoryRouter>
          <ModuleCard module={module} position={1} />
        </MemoryRouter>,
      );
      expect(screen.getByText("01 / Komunikacja")).toBeVisible();
      expect(screen.getByRole("heading", { name: module.name })).toBeVisible();
      expect(screen.getByText(module.description)).toBeVisible();
      const link = screen.getByRole("link", {
        name: `${module.name} Otwórz moduł`,
      });
      expect(link).toHaveAttribute("href", module.path);
      expect(link).toContainElement(screen.getByText(module.description));
    });
  });
});
