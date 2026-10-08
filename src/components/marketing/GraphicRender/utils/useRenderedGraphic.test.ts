import { renderHook, waitFor } from "@testing-library/react";
import type { PhotoState } from "../../ExportLab/ExportLab.types";
import { loadGraphicFonts } from "../../ExportLab/utils/loadGraphicFonts";
import { rasterizeGraphic } from "../../ExportLab/utils/rasterizeGraphic";
import type { RenderRequest } from "../GraphicRender.types";
import { parseRenderParams } from "./parseRenderParams";
import { useRenderedGraphic } from "./useRenderedGraphic";

vi.mock("../../ExportLab/utils/loadGraphicFonts", () => ({
  loadGraphicFonts: vi.fn(),
}));
vi.mock("../../ExportLab/utils/rasterizeGraphic", () => ({
  rasterizeGraphic: vi.fn(),
}));

const requestFor = (query: string) =>
  parseRenderParams(new URLSearchParams(query)).request as RenderRequest;

const plain = requestFor("template=standard&format=landscape&title=Tytuł");
const withPhoto = requestFor(
  "template=standard&format=square&photo=1&focalX=10&focalY=90",
);
const NO_PHOTO: PhotoState = { photo: null, isLoading: false, error: "" };
const PHOTO: PhotoState = {
  photo: { url: "blob:photo", focalX: 50, focalY: 50 },
  isLoading: false,
  error: "",
};

describe("useRenderedGraphic", () => {
  let urlCount = 0;

  beforeEach(() => {
    urlCount = 0;
    vi.mocked(loadGraphicFonts).mockResolvedValue();
    vi.mocked(rasterizeGraphic).mockResolvedValue({
      blob: new Blob(["png"]),
      hasOverflow: false,
    });
    URL.createObjectURL = vi.fn(() => `blob:${++urlCount}`);
    URL.revokeObjectURL = vi.fn();
  });

  describe("when there is no request yet", () => {
    it("stays loading without rendering", () => {
      const { result } = renderHook(() => useRenderedGraphic(null, NO_PHOTO));
      expect(result.current).toEqual({ status: "loading" });
      expect(rasterizeGraphic).not.toHaveBeenCalled();
    });
  });

  describe("when the request needs no photo", () => {
    it("rasterizes the format once the fonts are loaded", async () => {
      const { result } = renderHook(() => useRenderedGraphic(plain, NO_PHOTO));
      expect(result.current).toEqual({ status: "loading" });
      await waitFor(() =>
        expect(result.current).toEqual({
          status: "ready",
          url: "blob:1",
          hasOverflow: false,
        }),
      );
      expect(rasterizeGraphic).toHaveBeenCalledWith(
        plain.template,
        { values: plain.values, photo: null },
        plain.format,
      );
    });

    it("ignores a photo that was not announced in the URL", async () => {
      const { result } = renderHook(() => useRenderedGraphic(plain, PHOTO));
      await waitFor(() => expect(result.current.status).toBe("ready"));
      expect(rasterizeGraphic).toHaveBeenCalledWith(
        plain.template,
        { values: plain.values, photo: null },
        plain.format,
      );
    });

    it("reports text that does not fit", async () => {
      vi.mocked(rasterizeGraphic).mockResolvedValue({
        blob: new Blob(["png"]),
        hasOverflow: true,
      });
      const { result } = renderHook(() => useRenderedGraphic(plain, NO_PHOTO));
      await waitFor(() =>
        expect(result.current).toMatchObject({
          status: "ready",
          hasOverflow: true,
        }),
      );
    });
  });

  describe("when the request announces a photo", () => {
    it("waits for the file, then renders it at the requested focal point", async () => {
      const { result, rerender } = renderHook(
        ({ photo }) => useRenderedGraphic(withPhoto, photo),
        { initialProps: { photo: NO_PHOTO } },
      );
      expect(result.current).toEqual({ status: "awaiting-photo" });
      expect(rasterizeGraphic).not.toHaveBeenCalled();

      rerender({ photo: { ...NO_PHOTO, isLoading: true } });
      expect(result.current).toEqual({ status: "loading" });
      expect(rasterizeGraphic).not.toHaveBeenCalled();

      rerender({ photo: PHOTO });
      await waitFor(() => expect(result.current.status).toBe("ready"));
      expect(rasterizeGraphic).toHaveBeenCalledWith(
        withPhoto.template,
        {
          values: withPhoto.values,
          photo: { url: "blob:photo", focalX: 10, focalY: 90 },
        },
        withPhoto.format,
      );
    });

    it("fails when the file cannot be used", () => {
      const { result } = renderHook(() =>
        useRenderedGraphic(withPhoto, {
          ...NO_PHOTO,
          error: "Wybierz JPG, PNG lub WebP.",
        }),
      );
      expect(result.current).toEqual({
        status: "error",
        error: {
          code: "invalid-photo",
          message: "Wybierz JPG, PNG lub WebP.",
          fieldIds: [],
        },
      });
    });
  });

  describe("when rendering fails", () => {
    it("keeps the cause's message", async () => {
      vi.mocked(loadGraphicFonts).mockRejectedValue(new Error("Brak fontów"));
      const { result } = renderHook(() => useRenderedGraphic(plain, NO_PHOTO));
      await waitFor(() =>
        expect(result.current).toEqual({
          status: "error",
          error: {
            code: "render-failed",
            message: "Brak fontów",
            fieldIds: [],
          },
        }),
      );
    });

    it("shows a generic message for non-Error values", async () => {
      vi.mocked(rasterizeGraphic).mockRejectedValue("boom");
      const { result } = renderHook(() => useRenderedGraphic(plain, NO_PHOTO));
      await waitFor(() =>
        expect(result.current).toMatchObject({
          error: { message: "Nie udało się przygotować grafiki." },
        }),
      );
    });
  });

  describe("when the request changes while rendering", () => {
    it("drops the stale result and revokes the replaced URL", async () => {
      const { result, rerender } = renderHook(
        ({ request }) => useRenderedGraphic(request, NO_PHOTO),
        { initialProps: { request: plain } },
      );
      await waitFor(() => expect(result.current.status).toBe("ready"));
      rerender({ request: { ...plain } });
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
      await waitFor(() =>
        expect(result.current).toMatchObject({ url: "blob:2" }),
      );
    });

    it("ignores a late success of the stale render", async () => {
      let finishStale = (_: { blob: Blob; hasOverflow: boolean }) => {};
      vi.mocked(rasterizeGraphic).mockReturnValueOnce(
        new Promise((resolve) => {
          finishStale = resolve;
        }),
      );
      const { result, rerender } = renderHook(
        ({ request }) => useRenderedGraphic(request, NO_PHOTO),
        { initialProps: { request: plain } },
      );
      await waitFor(() => expect(rasterizeGraphic).toHaveBeenCalledTimes(1));
      rerender({ request: { ...plain } });
      await waitFor(() => expect(result.current.status).toBe("ready"));
      finishStale({ blob: new Blob(["stale"]), hasOverflow: true });
      await Promise.resolve();
      expect(result.current).toEqual({
        status: "ready",
        url: "blob:1",
        hasOverflow: false,
      });
    });

    it("ignores a late failure of the stale render", async () => {
      let failStale = (_: unknown) => {};
      vi.mocked(rasterizeGraphic).mockReturnValueOnce(
        new Promise((_, reject) => {
          failStale = reject;
        }),
      );
      const { result, rerender } = renderHook(
        ({ request }) => useRenderedGraphic(request, NO_PHOTO),
        { initialProps: { request: plain } },
      );
      await waitFor(() => expect(rasterizeGraphic).toHaveBeenCalledTimes(1));
      rerender({ request: { ...plain } });
      await waitFor(() => expect(result.current.status).toBe("ready"));
      failStale(new Error("stale"));
      await Promise.resolve();
      expect(result.current.status).toBe("ready");
    });

    it("skips rasterizing when replaced while the fonts load", async () => {
      let finishFonts = () => {};
      vi.mocked(loadGraphicFonts).mockReturnValueOnce(
        new Promise((resolve) => {
          finishFonts = resolve;
        }),
      );
      const { result, rerender } = renderHook(
        ({ request }) => useRenderedGraphic(request, NO_PHOTO),
        { initialProps: { request: plain } },
      );
      rerender({ request: { ...plain } });
      await waitFor(() => expect(result.current.status).toBe("ready"));
      finishFonts();
      await Promise.resolve();
      expect(rasterizeGraphic).toHaveBeenCalledTimes(1);
    });
  });
});
