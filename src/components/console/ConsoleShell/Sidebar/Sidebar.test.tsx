import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Sidebar from "./Sidebar";

// A module with submodules, so the nested navigation stays covered.
vi.mock("../../../../constants/console", async () => {
  const { faBullhorn } = await import("@fortawesome/free-solid-svg-icons");
  return {
    CONSOLE_MODULES: [
      {
        name: "Marketing",
        path: "/marketing",
        description: "",
        category: "Komunikacja",
        icon: faBullhorn,
        subModules: [
          { name: "Generator grafik", path: "/marketing" },
          { name: "Publikacja", path: "/marketing/publisher" },
        ],
      },
    ],
  };
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
    </MemoryRouter>,
  );

describe("<Sidebar />", () => {
  describe("when on the dashboard", () => {
    it("links home, lists modules and marks the dashboard active", () => {
      renderAt("/");
      expect(
        screen.getByRole("link", { name: "Console — strona główna" }),
      ).toHaveAttribute("href", "/");
      expect(screen.getByRole("link", { name: "Pulpit" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(
        screen.getByRole("link", { name: "Marketing" }),
      ).not.toHaveAttribute("aria-current");
    });

    it("keeps submodules collapsed until their module is open", () => {
      renderAt("/");
      expect(
        screen.queryByRole("link", { name: "Generator grafik" }),
      ).toBeNull();
      expect(screen.queryByRole("link", { name: "Publikacja" })).toBeNull();
    });
  });

  describe("when inside a module", () => {
    it("marks only that module active", () => {
      renderAt("/marketing");
      expect(screen.getByRole("link", { name: "Marketing" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(screen.getByRole("link", { name: "Pulpit" })).not.toHaveAttribute(
        "aria-current",
      );
    });

    it("expands the module's submodules as their own links", () => {
      renderAt("/marketing");
      expect(
        screen.getByRole("link", { name: "Generator grafik" }),
      ).toHaveAttribute("href", "/marketing");
      expect(screen.getByRole("link", { name: "Publikacja" })).toHaveAttribute(
        "href",
        "/marketing/publisher",
      );
    });

    it("marks the matching submodule active and not the sibling", () => {
      renderAt("/marketing");
      expect(
        screen.getByRole("link", { name: "Generator grafik" }),
      ).toHaveAttribute("aria-current", "page");
      expect(
        screen.getByRole("link", { name: "Publikacja" }),
      ).not.toHaveAttribute("aria-current");
    });
  });

  describe("when inside a submodule", () => {
    it("marks the submodule active and keeps the parent module active too", () => {
      renderAt("/marketing/publisher");
      expect(screen.getByRole("link", { name: "Marketing" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(screen.getByRole("link", { name: "Publikacja" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(
        screen.getByRole("link", { name: "Generator grafik" }),
      ).not.toHaveAttribute("aria-current");
    });
  });
});
