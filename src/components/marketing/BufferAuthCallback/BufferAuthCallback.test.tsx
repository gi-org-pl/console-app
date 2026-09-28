import { render, screen } from "@testing-library/react";
import BufferAuthCallback from "./BufferAuthCallback";

describe("<BufferAuthCallback />", () => {
  describe("when opened as the Access login popup's redirect target", () => {
    it("hands the state back to the opener and closes", () => {
      const postMessage = vi.fn();
      const close = vi.fn();
      vi.stubGlobal("opener", { postMessage });
      vi.spyOn(window, "close").mockImplementation(close);
      window.history.pushState({}, "", "/buffer-auth#my-state");

      render(<BufferAuthCallback />);

      expect(postMessage).toHaveBeenCalledWith(
        { type: "buffer-auth", state: "my-state" },
        window.location.origin,
      );
      expect(close).toHaveBeenCalled();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Logowanie do Buffer zakończone.",
      );
    });
  });
});
