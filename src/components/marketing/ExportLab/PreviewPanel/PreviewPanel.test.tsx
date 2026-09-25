import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PreviewsState } from "../ExportLab.types";
import PreviewPanel from "./PreviewPanel";

const file = new File(["png"], "gi-classic-square.png", { type: "image/png" });
const readyState: PreviewsState = {
  status: "ready",
  previews: [
    { formatId: "square", hasOverflow: false, url: "blob:square", file },
  ],
  error: null,
};

const mockShareSupport = (share: () => Promise<void>) => {
  Object.defineProperty(navigator, "canShare", {
    value: () => true,
    configurable: true,
  });
  Object.defineProperty(navigator, "share", {
    value: vi.fn(share),
    configurable: true,
  });
};

const renderPanel = (state: PreviewsState, isPhotoLoading = false) =>
  render(
    <PreviewPanel
      state={state}
      description="Tytuł"
      isPhotoLoading={isPhotoLoading}
    />,
  );

const shareButton = () =>
  screen.getByRole("button", { name: "Udostępnij Post kwadratowy" });

describe("<PreviewPanel />", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "canShare");
    Reflect.deleteProperty(navigator, "share");
  });

  describe("when previews are rendering", () => {
    it("marks the panel busy with a neutral badge", () => {
      renderPanel({ status: "rendering", previews: [], error: null });
      expect(
        screen.getByRole("region", { name: "Podgląd formatów" }),
      ).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText("Przygotowywanie…")).toBeVisible();
      expect(screen.getAllByText("Przygotowujemy grafikę…")).toHaveLength(4);
    });
  });

  describe("when a field is to blame", () => {
    it("leaves the message to the form", () => {
      renderPanel({
        status: "error",
        previews: [],
        error: { message: "Skróć do 90 znaków.", fieldIds: ["title"] },
      });
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.getByText("Popraw treść")).toBeVisible();
    });
  });

  describe("when no field explains the failure", () => {
    it("shows the message as an alert", () => {
      renderPanel({
        status: "error",
        previews: [],
        error: { message: "Brak fontów", fieldIds: [] },
      });
      expect(screen.getByRole("alert")).toHaveTextContent("Brak fontów");
    });
  });

  describe("when a photo is loading", () => {
    it("keeps the panel busy", () => {
      renderPanel(readyState, true);
      expect(
        screen.getByRole("region", { name: "Podgląd formatów" }),
      ).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("when the device cannot share files", () => {
    it("offers only downloads", () => {
      renderPanel(readyState);
      expect(screen.queryByRole("button", { name: /Udostępnij/ })).toBeNull();
    });
  });

  describe("when the user shares a graphic", () => {
    it("hands the prepared file to the system share sheet", async () => {
      mockShareSupport(() => Promise.resolve());
      renderPanel(readyState);
      fireEvent.click(shareButton());
      await waitFor(() =>
        expect(navigator.share).toHaveBeenCalledWith({ files: [file] }),
      );
    });
  });

  describe("when sharing is cancelled or fails", () => {
    it.each([
      ["cancelled", new DOMException("", "AbortError")],
      ["failed", new Error("fail")],
    ])("swallows the %s share without crashing", async (_, reason) => {
      mockShareSupport(() => Promise.reject(reason));
      renderPanel(readyState);
      fireEvent.click(shareButton());
      await waitFor(() => expect(navigator.share).toHaveBeenCalled());
      expect(shareButton()).toBeEnabled();
    });
  });
});
