import { create } from "zustand";
import {
  fetchBufferSession,
  getBufferLoginUrl,
  getBufferLogoutUrl,
} from "../client/buffer.api";
import type { BufferSession } from "../schemas/buffer.schemas";
import { BufferApiError } from "./BufferApiError";

export type BufferSessionStatus =
  | "checking"
  | "connected"
  | "disconnected"
  | "error";

interface BufferSessionState {
  status: BufferSessionStatus;
  session: BufferSession | null;
  error: string | null;
  checkSession: () => Promise<void>;
  connect: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Global: the sidebar's account control and the publisher both read the operator's
 * session, and logging in is a multi-step popup handshake (Access login followed by
 * a session re-check) rather than a single request/response.
 */
export const useBufferSessionStore = create<BufferSessionState>((set, get) => ({
  status: "checking",
  session: null,
  error: null,

  checkSession: async () => {
    set({ status: "checking", error: null });
    try {
      const session = await fetchBufferSession();
      set({ status: "connected", session, error: null });
    } catch (error) {
      // Without a session, Access redirects to its login page, which a cross-site
      // fetch sees as a network error with no status, the same as a 401.
      if (
        error instanceof BufferApiError &&
        (error.status === 401 || error.status === undefined)
      ) {
        set({ status: "disconnected", session: null, error: null });
        return;
      }
      set({
        status: "error",
        session: null,
        error:
          error instanceof BufferApiError
            ? error.message
            : "Nie udało się sprawdzić połączenia z Buffer.",
      });
    }
  },

  connect: async () => {
    const state = crypto.randomUUID();
    const popup = window.open(
      getBufferLoginUrl(state),
      "buffer-login",
      "width=480,height=640",
    );
    if (!popup) {
      set({
        status: "error",
        error:
          "Nie udało się otworzyć okna logowania. Odblokuj wyskakujące okna i spróbuj ponownie.",
      });
      return;
    }

    await new Promise<void>((resolve) => {
      function onMessage(event: MessageEvent) {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== "buffer-auth" || event.data.state !== state)
          return;
        cleanup();
        resolve();
      }
      const interval = window.setInterval(() => {
        if (popup.closed) {
          cleanup();
          resolve();
        }
      }, 500);
      function cleanup() {
        window.removeEventListener("message", onMessage);
        window.clearInterval(interval);
      }
      window.addEventListener("message", onMessage);
    });

    await get().checkSession();
  },

  logout: async () => {
    try {
      // The response is opaque; only the cleared cookie matters, so the check below
      // reports whether the logout actually took effect.
      await fetch(getBufferLogoutUrl(), {
        mode: "no-cors",
        credentials: "include",
      });
    } catch {}
    await get().checkSession();
  },
}));
