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
});
