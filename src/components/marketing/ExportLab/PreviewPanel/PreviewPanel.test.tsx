import { render, screen } from "@testing-library/react";
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

const renderPanel = (state: PreviewsState, isPhotoLoading = false) =>
  render(
    <PreviewPanel
      state={state}
      description="Tytuł"
      isPhotoLoading={isPhotoLoading}
    />,
  );

describe("<PreviewPanel />", () => {
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

  describe("when previews are ready", () => {
    it("offers one download per format and no share", () => {
      renderPanel(readyState);
      expect(
        screen.getByRole("link", { name: "Pobierz Post kwadratowy PNG" }),
      ).toHaveAttribute("href", "blob:square");
      expect(screen.queryByRole("button", { name: /Udostępnij/ })).toBeNull();
    });
  });
});
