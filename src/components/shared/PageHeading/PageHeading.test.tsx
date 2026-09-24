import { render, screen } from "@testing-library/react";
import PageHeading from "./PageHeading";

describe("<PageHeading />", () => {
  describe("when rendered", () => {
    it("shows the eyebrow, title with accent full stop and description", () => {
      render(
        <PageHeading eyebrow="Moduł" title="Tytuł" description="Opis strony" />,
      );
      expect(screen.getByText("Moduł")).toBeVisible();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Tytuł.",
      );
      expect(screen.getByText("Opis strony")).toBeVisible();
    });
  });

  describe("when compact", () => {
    it("uses the tighter spacing", () => {
      const { container } = render(
        <PageHeading isCompact eyebrow="Moduł" title="Tytuł" description="" />,
      );
      expect(container.firstElementChild).toHaveClass("mb-4");
    });
  });
});
