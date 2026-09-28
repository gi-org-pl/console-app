import { fireEvent, render, screen } from "@testing-library/react";
import { useBufferSessionStore } from "../../../../../services/buffer/utils/useBufferSession";
import AccountControl from "./AccountControl";

const connect = vi.fn().mockResolvedValue(undefined);
const logout = vi.fn().mockResolvedValue(undefined);

const setStore = (
  patch: Partial<ReturnType<typeof useBufferSessionStore.getState>>,
) =>
  useBufferSessionStore.setState({
    status: "checking",
    session: null,
    connect,
    logout,
    ...patch,
  });

describe("<AccountControl />", () => {
  describe("while the session is being checked", () => {
    it("keeps its place without offering anything yet", () => {
      setStore({ status: "checking" });
      render(<AccountControl />);
      expect(screen.queryByRole("button")).toBeNull();
    });
  });

  describe("when not logged in", () => {
    it.each([
      "disconnected",
      "error",
    ] as const)("offers a log in (%s)", (status) => {
      setStore({ status });
      render(<AccountControl />);
      fireEvent.click(screen.getByRole("button", { name: "Zaloguj się" }));
      expect(connect).toHaveBeenCalled();
    });
  });

  describe("when logged in", () => {
    it("shows the email and an icon-only log out", () => {
      setStore({
        status: "connected",
        session: { email: "marketing@gi.org.pl", channels: [] as never },
      });
      render(<AccountControl />);

      expect(screen.getByText("marketing@gi.org.pl")).toBeVisible();
      const button = screen.getByRole("button", { name: "Wyloguj" });
      expect(button).not.toHaveTextContent(/\S/);
      fireEvent.click(button);
      expect(logout).toHaveBeenCalled();
    });
  });
});
