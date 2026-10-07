import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { downscalePhoto } from "../ExportLab/utils/downscalePhoto";
import { loadGraphicFonts } from "../ExportLab/utils/loadGraphicFonts";
import { rasterizeGraphic } from "../ExportLab/utils/rasterizeGraphic";
import GraphicRender from "./GraphicRender";

vi.mock("../ExportLab/utils/loadGraphicFonts", () => ({
  loadGraphicFonts: vi.fn(),
}));
vi.mock("../ExportLab/utils/rasterizeGraphic", () => ({
  rasterizeGraphic: vi.fn(),
}));
vi.mock("../ExportLab/utils/downscalePhoto", () => ({
  downscalePhoto: vi.fn(),
}));

const renderAt = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/marketing/render?${query}`]}>
      <GraphicRender />
    </MemoryRouter>,
  );

const root = () => screen.getByRole("main");

describe("<GraphicRender />", () => {
  beforeEach(() => {
    vi.mocked(loadGraphicFonts).mockResolvedValue();
    vi.mocked(rasterizeGraphic).mockResolvedValue({
      blob: new Blob(["png"]),
      hasOverflow: false,
    });
    vi.mocked(downscalePhoto).mockImplementation(async (file) => file);
    let urlCount = 0;
    URL.createObjectURL = vi.fn(() => `blob:${++urlCount}`);
    URL.revokeObjectURL = vi.fn();
  });

  describe("when the URL describes a graphic", () => {
    it("shows only the PNG at the format's size and signals readiness", async () => {
      renderAt("template=standard&format=landscape&title=Nowy%20tytuł");
      await waitFor(() =>
        expect(root()).toHaveAttribute("data-render-status", "ready"),
      );
      expect(root()).toHaveAttribute("data-render-template", "standard");
      expect(root()).toHaveAttribute("data-render-format", "landscape");
      expect(root()).toHaveAttribute("data-render-width", "1200");
      expect(root()).toHaveAttribute("data-render-height", "628");
      expect(root()).toHaveAttribute("data-render-overflow", "false");
      expect(root()).not.toHaveAttribute("data-render-error");
      const image = screen.getByRole("img", {
        name: /^Nowy tytuł\. Łączymy .* Finansowanie: PROO\.$/,
      });
      expect(image).toHaveAttribute("src", "blob:1");
      expect(image).toHaveAttribute("width", "1200");
      expect(image).toHaveAttribute("height", "628");
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.queryByLabelText("Zdjęcie w tle")).toBeNull();
    });

    it("exposes text that does not fit", async () => {
      vi.mocked(rasterizeGraphic).mockResolvedValue({
        blob: new Blob(["png"]),
        hasOverflow: true,
      });
      renderAt("template=news&format=square");
      await waitFor(() =>
        expect(root()).toHaveAttribute("data-render-overflow", "true"),
      );
    });
  });

  describe("when the URL cannot be rendered", () => {
    it("explains the problem instead of a blank page", async () => {
      renderAt("template=standard&format=square&position=diagonal");
      await waitFor(() =>
        expect(root()).toHaveAttribute("data-render-status", "error"),
      );
      expect(root()).toHaveAttribute("data-render-error", "invalid-content");
      expect(root()).toHaveAttribute("data-render-error-fields", "position");
      expect(root()).not.toHaveAttribute("data-render-overflow");
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Wybierz: położenie tekstu.",
      );
      expect(screen.queryByRole("img")).toBeNull();
      expect(rasterizeGraphic).not.toHaveBeenCalled();
    });
  });

  describe("when the URL announces a photo", () => {
    it("waits for the file and renders with it", async () => {
      renderAt("template=standard&format=square&photo=1&focalX=20");
      await waitFor(() =>
        expect(root()).toHaveAttribute("data-render-status", "awaiting-photo"),
      );
      expect(rasterizeGraphic).not.toHaveBeenCalled();

      fireEvent.change(screen.getByLabelText("Zdjęcie w tle"), {
        target: {
          files: [new File(["photo"], "photo.png", { type: "image/png" })],
        },
      });
      await waitFor(() =>
        expect(root()).toHaveAttribute("data-render-status", "ready"),
      );
      expect(rasterizeGraphic).toHaveBeenCalledWith(
        expect.objectContaining({ id: "standard" }),
        expect.objectContaining({
          photo: { url: "blob:1", focalX: 20, focalY: 50 },
        }),
        expect.objectContaining({ id: "square" }),
      );
    });

    it("fails on a file type the editor would refuse", async () => {
      renderAt("template=standard&format=square&photo=1");
      await waitFor(() =>
        expect(root()).toHaveAttribute("data-render-status", "awaiting-photo"),
      );
      fireEvent.change(screen.getByLabelText("Zdjęcie w tle"), {
        target: {
          files: [new File(["photo"], "photo.heic", { type: "image/heic" })],
        },
      });
      await waitFor(() =>
        expect(root()).toHaveAttribute("data-render-error", "invalid-photo"),
      );
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Wybierz JPG, PNG lub WebP.",
      );
    });
  });
});
