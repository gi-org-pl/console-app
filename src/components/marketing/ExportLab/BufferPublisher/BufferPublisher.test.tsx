import { fireEvent, render, screen } from "@testing-library/react";
import { useBufferSessionStore } from "../../../../services/buffer/utils/useBufferSession";
import type { PreviewsState } from "../ExportLab.types";
import BufferPublisher from "./BufferPublisher";

const SESSION = {
  email: "marketing@gi.org.pl",
  channels: [{ id: "ig", name: "Fundacja", service: "instagram" as const }],
};

const preview = (url: string) => ({
  formatId: "square",
  hasOverflow: false,
  url,
  file: new File(["png"], "square.png", { type: "image/png" }),
});

const ready = (url = "blob:square"): PreviewsState => ({
  status: "ready",
  previews: [preview(url)],
  error: null,
});

function setStore(
  patch: Partial<ReturnType<typeof useBufferSessionStore.getState>>,
) {
  useBufferSessionStore.setState({
    status: "checking",
    session: null,
    error: null,
    checkSession: vi.fn().mockResolvedValue(undefined),
    connect: vi.fn().mockResolvedValue(undefined),
    ...patch,
  });
}

describe("<BufferPublisher />", () => {
  describe("while the session is being checked", () => {
    it("says so", () => {
      setStore({ status: "checking" });
      render(<BufferPublisher previews={ready()} />);
      expect(screen.getByRole("status")).toHaveTextContent(
        "Sprawdzanie połączenia z Buffer…",
      );
    });
  });

  describe("when checking the session failed", () => {
    it("shows the error and lets the user retry", () => {
      const checkSession = vi.fn().mockResolvedValue(undefined);
      setStore({ status: "error", error: "Padło.", checkSession });
      render(<BufferPublisher previews={ready()} />);

      expect(screen.getByText("Padło.")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
      expect(checkSession).toHaveBeenCalled();
    });
  });

  describe("when not logged in", () => {
    it("explains that downloads stay open and offers a log in", () => {
      const connect = vi.fn().mockResolvedValue(undefined);
      setStore({ status: "disconnected", connect });
      render(<BufferPublisher previews={ready()} />);

      expect(screen.getByText(/Grafiki możesz pobrać/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));
      expect(connect).toHaveBeenCalled();
    });
  });

  describe("when logged in", () => {
    it("shows the operator and the composer", () => {
      setStore({ status: "connected", session: SESSION });
      render(<BufferPublisher previews={ready()} />);

      expect(screen.getByText("marketing@gi.org.pl")).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: /Fundacja/ }),
      ).toBeInTheDocument();
    });

    it("keeps the last ready graphics while the generator re-renders", () => {
      setStore({ status: "connected", session: SESSION });
      const { container, rerender } = render(
        <BufferPublisher previews={ready("blob:first")} />,
      );
      rerender(
        <BufferPublisher
          previews={{ status: "rendering", previews: [], error: null }}
        />,
      );
      expect(container.querySelector('img[src="blob:first"]')).not.toBeNull();

      rerender(<BufferPublisher previews={ready("blob:second")} />);
      expect(container.querySelector('img[src="blob:second"]')).not.toBeNull();
    });
  });
});
