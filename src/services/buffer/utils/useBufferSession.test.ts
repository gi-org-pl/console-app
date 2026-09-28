import { fetchBufferSession } from "../client/buffer.api";
import { BufferApiError } from "./BufferApiError";
import { useBufferSessionStore } from "./useBufferSession";

vi.mock("../client/buffer.api", () => ({
  fetchBufferSession: vi.fn(),
  getBufferLoginUrl: vi.fn(
    (state: string) => `/api/buffer/login?state=${state}`,
  ),
  getBufferLogoutUrl: vi.fn(
    () => "https://console.gi.org.pl/cdn-cgi/access/logout",
  ),
}));

const SESSION = {
  email: "operator@example.com",
  channels: [{ id: "1", name: "Fundacja", service: "instagram" as const }],
};

function resetStore() {
  useBufferSessionStore.setState({
    status: "checking",
    session: null,
    error: null,
  });
}

describe("useBufferSessionStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("checkSession", () => {
    describe("when the Worker returns a session", () => {
      it("marks the store connected", async () => {
        vi.mocked(fetchBufferSession).mockResolvedValue(SESSION);

        await useBufferSessionStore.getState().checkSession();

        expect(useBufferSessionStore.getState().status).toBe("connected");
        expect(useBufferSessionStore.getState().session).toBe(SESSION);
      });
    });

    describe("when the Worker answers 401", () => {
      it("marks the store disconnected without an error message", async () => {
        vi.mocked(fetchBufferSession).mockRejectedValue(
          new BufferApiError("Brak sesji.", 401),
        );

        await useBufferSessionStore.getState().checkSession();

        expect(useBufferSessionStore.getState().status).toBe("disconnected");
        expect(useBufferSessionStore.getState().error).toBeNull();
      });
    });

    describe("when Access redirects to its login page (no response)", () => {
      it("treats it as logged out, not as an error", async () => {
        vi.mocked(fetchBufferSession).mockRejectedValue(
          new BufferApiError("Nie udało się połączyć z serwisem publikacji."),
        );

        await useBufferSessionStore.getState().checkSession();

        expect(useBufferSessionStore.getState().status).toBe("disconnected");
      });
    });

    describe("when the Worker fails for another reason", () => {
      it("marks the store errored with the Worker's message", async () => {
        vi.mocked(fetchBufferSession).mockRejectedValue(
          new BufferApiError("Padło.", 500),
        );

        await useBufferSessionStore.getState().checkSession();

        expect(useBufferSessionStore.getState().status).toBe("error");
        expect(useBufferSessionStore.getState().error).toBe("Padło.");
      });
    });

    describe("when the failure isn't a BufferApiError", () => {
      it("falls back to a generic message", async () => {
        vi.mocked(fetchBufferSession).mockRejectedValue(new Error("boom"));

        await useBufferSessionStore.getState().checkSession();

        expect(useBufferSessionStore.getState().status).toBe("error");
        expect(useBufferSessionStore.getState().error).toBe(
          "Nie udało się sprawdzić połączenia z Buffer.",
        );
      });
    });
  });

  describe("connect", () => {
    describe("when the popup is blocked", () => {
      it("marks the store errored", async () => {
        vi.spyOn(window, "open").mockReturnValue(null);

        await useBufferSessionStore.getState().connect();

        expect(useBufferSessionStore.getState().status).toBe("error");
        expect(useBufferSessionStore.getState().error).toMatch(/wyskakujące/);
      });
    });

    describe("when Access confirms the login", () => {
      it("re-checks the session once the popup posts back", async () => {
        let openedUrl = "";
        const popup = { closed: false } as unknown as Window;
        vi.spyOn(window, "open").mockImplementation((url) => {
          openedUrl = String(url);
          return popup;
        });
        vi.mocked(fetchBufferSession).mockResolvedValue(SESSION);

        const connectPromise = useBufferSessionStore.getState().connect();
        await Promise.resolve();
        const state = new URLSearchParams(openedUrl.split("?")[1]).get("state");
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: window.location.origin,
            data: { type: "buffer-auth", state },
          }),
        );
        await connectPromise;

        expect(useBufferSessionStore.getState().status).toBe("connected");
      });
    });

    describe("when the message is from another origin or a stale state", () => {
      it("is ignored and the popup closing still resolves the flow", async () => {
        vi.useFakeTimers();
        const popup = { closed: false } as unknown as Window & {
          closed: boolean;
        };
        vi.spyOn(window, "open").mockReturnValue(popup);
        vi.mocked(fetchBufferSession).mockRejectedValue(
          new BufferApiError("Brak sesji.", 401),
        );

        const connectPromise = useBufferSessionStore.getState().connect();
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: "https://evil.example",
            data: { type: "buffer-auth", state: "anything" },
          }),
        );
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: window.location.origin,
            data: { type: "not-buffer-auth", state: "anything" },
          }),
        );
        popup.closed = true;
        await vi.advanceTimersByTimeAsync(500);
        await connectPromise;

        expect(useBufferSessionStore.getState().status).toBe("disconnected");
        vi.useRealTimers();
      });
    });
  });

  describe("logout", () => {
    it("calls Access's logout and re-checks the session", async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response());
      vi.stubGlobal("fetch", fetchMock);
      vi.mocked(fetchBufferSession).mockRejectedValue(
        new BufferApiError("Brak sesji.", 401),
      );
      useBufferSessionStore.setState({ status: "connected", session: SESSION });

      await useBufferSessionStore.getState().logout();

      expect(fetchMock).toHaveBeenCalledWith(
        "https://console.gi.org.pl/cdn-cgi/access/logout",
        { mode: "no-cors", credentials: "include" },
      );
      expect(useBufferSessionStore.getState().status).toBe("disconnected");
      vi.unstubAllGlobals();
    });

    it("still re-checks when the logout request itself fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new TypeError("offline")),
      );
      vi.mocked(fetchBufferSession).mockResolvedValue(SESSION);

      await useBufferSessionStore.getState().logout();

      expect(useBufferSessionStore.getState().status).toBe("connected");
      vi.unstubAllGlobals();
    });
  });
});
