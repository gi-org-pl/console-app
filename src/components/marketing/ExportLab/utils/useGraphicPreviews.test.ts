import { renderHook, waitFor } from "@testing-library/react";
import { PREVIEW_DEBOUNCE_MS } from "../ExportLab.constants";
import { STANDARD_TEMPLATE } from "../templates/StandardTemplate/StandardTemplate.constants";
import { getDefaultFieldValues } from "./getDefaultFieldValues";
import { loadGraphicFonts } from "./loadGraphicFonts";
import { rasterizeGraphic } from "./rasterizeGraphic";
import { useGraphicPreviews } from "./useGraphicPreviews";

vi.mock("./loadGraphicFonts", () => ({ loadGraphicFonts: vi.fn() }));
vi.mock("./rasterizeGraphic", () => ({ rasterizeGraphic: vi.fn() }));

const validContent = { values: getDefaultFieldValues(), photo: null };
const invalidContent = {
  values: { ...getDefaultFieldValues(), position: "diagonal" },
  photo: null,
};

describe("useGraphicPreviews", () => {
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

  describe("when the content is valid", () => {
    it("prepares one named PNG per format", async () => {
      const { result } = renderHook(() =>
        useGraphicPreviews(STANDARD_TEMPLATE, validContent),
      );
      expect(result.current.status).toBe("rendering");
      await waitFor(() => expect(result.current.status).toBe("ready"));
      expect(result.current.error).toBeNull();
      expect(result.current.previews.map((p) => p.file.name)).toEqual([
        "gi-standard-square.png",
        "gi-standard-portrait.png",
        "gi-standard-story.png",
        "gi-standard-landscape.png",
      ]);
    });
  });

  describe("when the content is invalid", () => {
    it("blames the field without rendering", async () => {
      const { result } = renderHook(() =>
        useGraphicPreviews(STANDARD_TEMPLATE, invalidContent),
      );
      await waitFor(() => expect(result.current.status).toBe("error"));
      expect(result.current.error).toEqual({
        message: "Wybierz: położenie tekstu.",
        fieldIds: ["position"],
      });
      expect(rasterizeGraphic).not.toHaveBeenCalled();
    });
  });

  describe("when a format does not fit", () => {
    it("keeps every export and marks only that format", async () => {
      vi.mocked(rasterizeGraphic).mockImplementation(async (_, __, format) => ({
        blob: new Blob(["png"]),
        hasOverflow: format.id === "landscape",
      }));
      const { result } = renderHook(() =>
        useGraphicPreviews(STANDARD_TEMPLATE, validContent),
      );
      await waitFor(() => expect(result.current.status).toBe("ready"));
      expect(result.current.error).toBeNull();
      expect(
        result.current.previews.map((preview) => preview.hasOverflow),
      ).toEqual([false, false, false, true]);
      expect(result.current.previews).toHaveLength(4);
    });
  });

  describe("when rendering fails for a reason no field explains", () => {
    it("keeps the message without blaming fields", async () => {
      vi.mocked(loadGraphicFonts).mockRejectedValue(new Error("Brak fontów"));
      const { result } = renderHook(() =>
        useGraphicPreviews(STANDARD_TEMPLATE, validContent),
      );
      await waitFor(() =>
        expect(result.current.error).toEqual({
          message: "Brak fontów",
          fieldIds: [],
        }),
      );
    });

    it("shows a generic message for non-Error values", async () => {
      vi.mocked(rasterizeGraphic).mockRejectedValue("boom");
      const { result } = renderHook(() =>
        useGraphicPreviews(STANDARD_TEMPLATE, validContent),
      );
      await waitFor(() =>
        expect(result.current.error?.message).toBe(
          "Nie udało się przygotować grafik.",
        ),
      );
    });
  });

  describe("when the content changes while rendering", () => {
    it("renders only the latest value after rapid edits", async () => {
      const { result, rerender } = renderHook(
        ({ content }) => useGraphicPreviews(STANDARD_TEMPLATE, content),
        { initialProps: { content: validContent } },
      );
      rerender({
        content: {
          ...validContent,
          values: { ...validContent.values, title: "Pierwsza wersja" },
        },
      });
      const latest = {
        ...validContent,
        values: { ...validContent.values, title: "Ostateczna wersja" },
      };
      rerender({ content: latest });
      await waitFor(() => expect(result.current.status).toBe("ready"));
      expect(rasterizeGraphic).toHaveBeenCalledTimes(4);
      expect(rasterizeGraphic).toHaveBeenCalledWith(
        STANDARD_TEMPLATE,
        latest,
        expect.anything(),
      );
    });

    it("drops the stale result and revokes its URLs", async () => {
      const { result, rerender } = renderHook(
        ({ content }) => useGraphicPreviews(STANDARD_TEMPLATE, content),
        { initialProps: { content: validContent } },
      );
      await waitFor(() => expect(result.current.status).toBe("ready"));
      rerender({ content: { ...validContent } });
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
      await waitFor(() => expect(result.current.status).toBe("ready"));
      expect(result.current.previews[0].url).toBe("blob:5");
    });

    it("ignores a late failure of the stale render", async () => {
      let failStale = (_: unknown) => {};
      vi.mocked(rasterizeGraphic).mockReturnValueOnce(
        new Promise((_, reject) => {
          failStale = reject;
        }),
      );
      const { result, rerender } = renderHook(
        ({ content }) => useGraphicPreviews(STANDARD_TEMPLATE, content),
        { initialProps: { content: validContent } },
      );
      await waitFor(() => expect(rasterizeGraphic).toHaveBeenCalled());
      rerender({ content: { ...validContent } });
      await new Promise((resolve) =>
        setTimeout(resolve, PREVIEW_DEBOUNCE_MS + 20),
      );
      expect(rasterizeGraphic).toHaveBeenCalledTimes(1);
      failStale(new Error("stale"));
      await waitFor(() => expect(result.current.status).toBe("ready"));
      expect(rasterizeGraphic).toHaveBeenCalledTimes(5);
      expect(result.current.status).toBe("ready");
    });

    it("ignores a late success of the stale render", async () => {
      let finishStale = (_: { blob: Blob; hasOverflow: boolean }) => {};
      vi.mocked(rasterizeGraphic).mockReturnValueOnce(
        new Promise((resolve) => {
          finishStale = resolve;
        }),
      );
      const { result, rerender } = renderHook(
        ({ content }) => useGraphicPreviews(STANDARD_TEMPLATE, content),
        { initialProps: { content: validContent } },
      );
      await waitFor(() => expect(rasterizeGraphic).toHaveBeenCalled());
      rerender({ content: { ...validContent } });
      await new Promise((resolve) =>
        setTimeout(resolve, PREVIEW_DEBOUNCE_MS + 20),
      );
      expect(rasterizeGraphic).toHaveBeenCalledTimes(1);
      finishStale({ blob: new Blob(["stale"]), hasOverflow: false });
      await waitFor(() => expect(result.current.status).toBe("ready"));
      expect(rasterizeGraphic).toHaveBeenCalledTimes(5);
      expect(result.current.previews).toHaveLength(4);
    });
  });
});
