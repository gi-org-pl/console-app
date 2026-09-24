import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Sidebar from "./Sidebar";

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
      expect(screen.getByText("Publiczny")).toBeInTheDocument();
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
  });
});
