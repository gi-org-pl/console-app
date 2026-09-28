import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { useBufferSessionStore } from "../../../services/buffer/utils/useBufferSession";
import ConsoleShell from "./ConsoleShell";

vi.mock("../../../constants/console", async () => {
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

const checkSession = vi.fn().mockResolvedValue(undefined);
beforeEach(() => {
  useBufferSessionStore.setState({
    status: "checking",
    session: null,
    checkSession,
  });
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ConsoleShell>Treść strony</ConsoleShell>
    </MemoryRouter>,
  );

describe("<ConsoleShell />", () => {
  describe("when on the dashboard", () => {
    it("shows the page inside the landmark layout", () => {
      renderAt("/");
      expect(screen.getByRole("main")).toHaveTextContent("Treść strony");
      expect(screen.getByRole("banner")).toHaveTextContent("Console / Pulpit");
      expect(
        screen.getByRole("link", { name: "Przejdź do treści" }),
      ).toHaveAttribute("href", "#main");
      expect(screen.getByRole("link", { name: /gi\.org\.pl/ })).toHaveAttribute(
        "href",
        "https://gi.org.pl",
      );
      expect(screen.getByRole("contentinfo")).toHaveTextContent(
        "© Fundacja Generacja Innowacja, 2026ul. Twarda 18, 00-105 WarszawaKRS 0001041229, NIP 5214023308",
      );
    });
  });

  describe("when inside a module", () => {
    it("shows the module in the breadcrumb", () => {
      renderAt("/marketing");
      expect(screen.getByRole("banner")).toHaveTextContent(
        "Console / Marketing",
      );
    });
  });

  describe("when the app loads", () => {
    it("checks the login session once", () => {
      renderAt("/");
      expect(checkSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("when inside a submodule", () => {
    it("shows the module and the submodule in the breadcrumb", () => {
      renderAt("/marketing/publisher");
      expect(screen.getByRole("banner")).toHaveTextContent(
        "Console / Marketing / Publikacja",
      );
    });
  });
});
