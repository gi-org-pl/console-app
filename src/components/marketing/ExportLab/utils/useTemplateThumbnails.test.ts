import { act, renderHook } from "@testing-library/react";
import { GRAPHIC_FORMATS, THUMBNAIL_DEBOUNCE_MS } from "../ExportLab.constants";
import type { FieldValues, GraphicTemplate } from "../ExportLab.types";
import { STANDARD_TEMPLATE } from "../templates/StandardTemplate/StandardTemplate.constants";
import { getDefaultFieldValues } from "./getDefaultFieldValues";
import { loadGraphicFonts } from "./loadGraphicFonts";
import { rasterizeGraphic } from "./rasterizeGraphic";
import { useTemplateThumbnails } from "./useTemplateThumbnails";

vi.mock("./loadGraphicFonts", () => ({ loadGraphicFonts: vi.fn() }));
vi.mock("./rasterizeGraphic", () => ({ rasterizeGraphic: vi.fn() }));

const PHOTOLESS: GraphicTemplate = {
  ...STANDARD_TEMPLATE,
  id: "plain",
  supportsPhoto: false,
};
const TEMPLATES = [STANDARD_TEMPLATE, PHOTOLESS];
const values = getDefaultFieldValues();
const photo = { url: "blob:photo", focalX: 50, focalY: 50 };

const flush = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(THUMBNAIL_DEBOUNCE_MS);
  });

describe("useTemplateThumbnails", () => {
  let urlCount = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    urlCount = 0;
    vi.mocked(loadGraphicFonts).mockResolvedValue();
    vi.mocked(rasterizeGraphic).mockResolvedValue({
      blob: new Blob(["png"]),
      hasOverflow: false,
    });
    URL.createObjectURL = vi.fn(() => `blob:${++urlCount}`);
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => vi.useRealTimers());

  describe("when the content settles", () => {
    it("renders small 1:1 PNGs of the other templates only", async () => {
      const { result } = renderHook(() =>
        useTemplateThumbnails(TEMPLATES, values, photo, "standard"),
      );
      expect(result.current).toEqual({});
      await flush();
      expect(result.current).toEqual({ plain: "blob:1" });
      expect(rasterizeGraphic).toHaveBeenCalledTimes(1);
      expect(rasterizeGraphic).toHaveBeenCalledWith(
        PHOTOLESS,
        { values, photo: null },
        GRAPHIC_FORMATS[0],
        144 / 1080,
      );
    });

    it("passes the photo to templates that support it", async () => {
      renderHook(() =>
        useTemplateThumbnails(TEMPLATES, values, photo, "plain"),
      );
      await flush();
      expect(rasterizeGraphic).toHaveBeenCalledWith(
        STANDARD_TEMPLATE,
        { values, photo },
        expect.anything(),
        expect.any(Number),
      );
    });
  });

  describe("when the content changes before the pause ends", () => {
    it("renders once, for the latest content", async () => {
      const { rerender } = renderHook(
        ({ current }: { current: FieldValues }) =>
          useTemplateThumbnails(TEMPLATES, current, null, "standard"),
        { initialProps: { current: values } },
      );
      rerender({ current: { ...values, title: "Nowy" } });
      await flush();
      expect(rasterizeGraphic).toHaveBeenCalledTimes(1);
    });
  });

  describe("when new thumbnails replace old ones", () => {
    it("releases the old images and, on unmount, the current ones", async () => {
      const { rerender, unmount } = renderHook(
        ({ current }: { current: FieldValues }) =>
          useTemplateThumbnails(TEMPLATES, current, null, "standard"),
        { initialProps: { current: values } },
      );
      await flush();
      rerender({ current: { ...values, title: "Nowy" } });
      await flush();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
      unmount();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:2");
    });
  });

  describe("when a render finishes after the content changed", () => {
    it("drops and releases the stale image", async () => {
      let finish = (_: { blob: Blob; hasOverflow: boolean }) => {};
      vi.mocked(rasterizeGraphic).mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      const { result, rerender } = renderHook(
        ({ current }: { current: FieldValues }) =>
          useTemplateThumbnails(TEMPLATES, current, null, "standard"),
        { initialProps: { current: values } },
      );
      await flush();
      rerender({ current: { ...values, title: "Nowy" } });
      await act(async () =>
        finish({ blob: new Blob(["stale"]), hasOverflow: false }),
      );
      expect(result.current).toEqual({});
      await flush();
      expect(result.current).toEqual({ plain: "blob:1" });
    });
  });

  describe("when a template cannot render the content", () => {
    it("leaves that template without a thumbnail", async () => {
      vi.mocked(loadGraphicFonts).mockRejectedValue(new Error("fonts"));
      vi.mocked(rasterizeGraphic).mockRejectedValue(new Error("overflow"));
      const { result } = renderHook(() =>
        useTemplateThumbnails(TEMPLATES, values, null, "standard"),
      );
      await flush();
      expect(result.current).toEqual({});
    });
  });
});
