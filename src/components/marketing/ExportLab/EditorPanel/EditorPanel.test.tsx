import { render, screen } from "@testing-library/react";
import EditorPanel from "./EditorPanel";

describe("<EditorPanel />", () => {
  describe("when rendered", () => {
    it("labels the section with its title", () => {
      render(
        <EditorPanel titleId="panel" title="Szablon">
          Treść
        </EditorPanel>,
      );
      expect(screen.getByRole("region", { name: "Szablon" })).toHaveTextContent(
        "Treść",
      );
    });
  });

  describe("when given an aside", () => {
    it("shows it next to the title", () => {
      render(
        <EditorPanel
          titleId="panel"
          title="Kanały"
          aside={<button type="button">Zaznacz wszystkie</button>}
        >
          Lista
        </EditorPanel>,
      );
      expect(
        screen.getByRole("button", { name: "Zaznacz wszystkie" }),
      ).toBeInTheDocument();
    });
  });
});
