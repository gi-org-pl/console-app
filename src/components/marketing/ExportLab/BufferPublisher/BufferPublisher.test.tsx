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

const RENDERING: PreviewsState = {
  status: "rendering",
  previews: [],
  error: null,
};

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
      render(<BufferPublisher graphics={[ready()]} />);
      expect(screen.getByRole("status")).toHaveTextContent(
        "Sprawdzanie połączenia z Buffer…",
      );
    });
  });

  describe("when checking the session failed", () => {
    it("shows the error and lets the user retry", () => {
      const checkSession = vi.fn().mockResolvedValue(undefined);
      setStore({ status: "error", error: "Padło.", checkSession });
      render(<BufferPublisher graphics={[ready()]} />);

      expect(screen.getByText("Padło.")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
      expect(checkSession).toHaveBeenCalled();
    });
  });

  describe("when not logged in", () => {
    it("explains that downloads stay open and offers a log in", () => {
      const connect = vi.fn().mockResolvedValue(undefined);
      setStore({ status: "disconnected", connect });
      render(<BufferPublisher graphics={[ready()]} />);

      expect(screen.getByText(/Grafiki możesz pobrać/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));
      expect(connect).toHaveBeenCalled();
    });
  });

  describe("when logged in", () => {
    it("shows the operator and the composer", () => {
      setStore({ status: "connected", session: SESSION });
      render(<BufferPublisher graphics={[ready()]} />);

      expect(screen.getByText("marketing@gi.org.pl")).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: /Fundacja/ }),
      ).toBeInTheDocument();
    });

    it("keeps the last ready graphics while the generator re-renders", () => {
      setStore({ status: "connected", session: SESSION });
      const { container, rerender } = render(
        <BufferPublisher graphics={[ready("blob:first")]} />,
      );
      rerender(<BufferPublisher graphics={[RENDERING]} />);
      expect(container.querySelector('img[src="blob:first"]')).not.toBeNull();

      rerender(<BufferPublisher graphics={[ready("blob:second")]} />);
      expect(container.querySelector('img[src="blob:second"]')).not.toBeNull();
    });
  });

  describe("when the post has several graphics", () => {
    const status = () => screen.getAllByRole("status").at(-1);
    const failed: PreviewsState = {
      status: "error",
      previews: [],
      error: { message: "Za długi tytuł.", fieldIds: ["title"] },
    };

    beforeEach(() => setStore({ status: "connected", session: SESSION }));

    it("waits for every graphic before it lets the post go", () => {
      const { rerender } = render(
        <BufferPublisher graphics={[ready("blob:one"), RENDERING]} />,
      );
      expect(status()).toHaveTextContent(
        "Poczekaj, aż grafika się przygotuje.",
      );

      rerender(
        <BufferPublisher graphics={[ready("blob:one"), ready("blob:two")]} />,
      );
      expect(status()).not.toHaveTextContent("Poczekaj");
    });

    it("asks to fix the graphics when any of them cannot be drawn", () => {
      render(<BufferPublisher graphics={[ready(), failed, RENDERING]} />);
      expect(status()).toHaveTextContent(
        "Popraw grafikę powyżej, aby ją opublikować.",
      );
    });

    it("keeps the ready set of each graphic while another one re-renders", () => {
      const { rerender } = render(
        <BufferPublisher graphics={[ready("blob:one"), ready("blob:two")]} />,
      );
      rerender(<BufferPublisher graphics={[RENDERING, ready("blob:two")]} />);
      // The first graphic stands for the post in the composer.
      expect(document.querySelector('img[src="blob:one"]')).toBeInTheDocument();

      rerender(<BufferPublisher graphics={[ready("blob:two")]} />);
      expect(document.querySelector('img[src="blob:two"]')).toBeInTheDocument();
      expect(document.querySelector('img[src="blob:one"]')).toBeNull();
    });
  });
});
