import { act, renderHook } from "@testing-library/react";
import { downscalePhoto } from "./downscalePhoto";
import { usePhoto } from "./usePhoto";

vi.mock("./downscalePhoto", () => ({ downscalePhoto: vi.fn() }));

const createFile = (type = "image/png") =>
  new File(["photo"], "photo", { type });

describe("usePhoto", () => {
  let urlCount = 0;

  beforeEach(() => {
    urlCount = 0;
    vi.mocked(downscalePhoto).mockImplementation(async (file) => file);
    URL.createObjectURL = vi.fn(() => `blob:${++urlCount}`);
    URL.revokeObjectURL = vi.fn();
  });

  describe("when no file is given", () => {
    it("keeps the empty state", async () => {
      const { result } = renderHook(() => usePhoto());
      await act(() => result.current.select());
      expect(result.current.photo).toBeNull();
      expect(downscalePhoto).not.toHaveBeenCalled();
    });
  });

  describe("when a supported photo of any size is selected", () => {
    it("stores the downscaled photo centred", async () => {
      const small = new Blob(["small"]);
      vi.mocked(downscalePhoto).mockResolvedValue(small);
      const { result } = renderHook(() => usePhoto());
      await act(() => result.current.select(createFile("image/jpeg")));
      expect(URL.createObjectURL).toHaveBeenCalledWith(small);
      expect(result.current).toMatchObject({
        photo: { url: "blob:1", focalX: 50, focalY: 50 },
        isLoading: false,
        error: "",
      });
    });
  });

  describe("when a second photo replaces the first", () => {
    it("revokes the first URL", async () => {
      const { result } = renderHook(() => usePhoto());
      await act(() => result.current.select(createFile()));
      await act(() => result.current.select(createFile()));
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
      expect(result.current.photo?.url).toBe("blob:2");
    });
  });

  describe("when the file type is not supported", () => {
    it("explains the accepted formats without processing it", async () => {
      const { result } = renderHook(() => usePhoto());
      await act(() => result.current.select(createFile("image/heic")));
      expect(result.current.error).toBe(
        "Wybierz JPG, PNG lub WebP. Zdjęcie HEIC zapisz najpierw jako JPG.",
      );
      expect(downscalePhoto).not.toHaveBeenCalled();
    });
  });

  describe("when the photo cannot be read", () => {
    it("reports it and keeps the previous photo", async () => {
      const { result } = renderHook(() => usePhoto());
      await act(() => result.current.select(createFile()));
      vi.mocked(downscalePhoto).mockRejectedValue(new Error("broken"));
      await act(() => result.current.select(createFile()));
      expect(result.current.error).toContain("Nie udało się odczytać zdjęcia");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.photo?.url).toBe("blob:1");
    });
  });

  describe("when an older selection finishes after a newer one", () => {
    it("drops the older result without creating a URL for it", async () => {
      let finishFirst = (_: Blob) => {};
      vi.mocked(downscalePhoto).mockReturnValueOnce(
        new Promise((resolve) => {
          finishFirst = resolve;
        }),
      );
      const { result } = renderHook(() => usePhoto());
      let first: Promise<void> = Promise.resolve();
      act(() => {
        first = result.current.select(createFile());
      });
      await act(() => result.current.select(createFile()));
      await act(async () => {
        finishFirst(new Blob(["stale"]));
        await first;
      });
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(result.current.photo?.url).toBe("blob:1");
    });
  });

  describe("when an older selection fails after the photo was removed", () => {
    it("does not report the stale error", async () => {
      let failFirst = () => {};
      vi.mocked(downscalePhoto).mockReturnValueOnce(
        new Promise((_, reject) => {
          failFirst = () => reject(new Error("broken"));
        }),
      );
      const { result } = renderHook(() => usePhoto());
      let first: Promise<void> = Promise.resolve();
      act(() => {
        first = result.current.select(createFile());
      });
      act(() => result.current.remove());
      await act(async () => {
        failFirst();
        await first;
      });
      expect(result.current.error).toBe("");
    });
  });

  describe("when the focus point changes", () => {
    it("updates only the given axis", async () => {
      const { result } = renderHook(() => usePhoto());
      act(() => result.current.setFocus({ focalX: 10 }));
      expect(result.current.photo).toBeNull();
      await act(() => result.current.select(createFile()));
      act(() => result.current.setFocus({ focalX: 10 }));
      expect(result.current.photo).toMatchObject({ focalX: 10, focalY: 50 });
    });
  });

  describe("when the photo is removed or the hook unmounts", () => {
    it("revokes the kept URL", async () => {
      const { result, unmount } = renderHook(() => usePhoto());
      await act(() => result.current.select(createFile()));
      act(() => result.current.remove());
      expect(result.current.photo).toBeNull();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
      await act(() => result.current.select(createFile()));
      unmount();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:2");
    });
  });
});
