import { act, renderHook } from "@testing-library/react";
import { downscalePhoto } from "./downscalePhoto";
import { usePostPhotos } from "./usePostPhotos";

vi.mock("./downscalePhoto", () => ({ downscalePhoto: vi.fn() }));

const createFile = (type = "image/png") =>
  new File(["photo"], "photo", { type });
const setup = (activeId = "a") =>
  renderHook(({ id }) => usePostPhotos(id), { initialProps: { id: activeId } });

describe("usePostPhotos", () => {
  let urlCount = 0;

  beforeEach(() => {
    urlCount = 0;
    vi.mocked(downscalePhoto).mockImplementation(async (file) => file);
    URL.createObjectURL = vi.fn(() => `blob:${++urlCount}`);
    URL.revokeObjectURL = vi.fn();
  });

  describe("when no file is given", () => {
    it("keeps the graphic without a photo", async () => {
      const { result } = setup();
      await act(() => result.current.controls.select());
      expect(result.current.controls.photo).toBeNull();
      expect(downscalePhoto).not.toHaveBeenCalled();
    });
  });

  describe("when a photo is selected for the graphic being edited", () => {
    it("stores the downscaled photo centred, for that graphic only", async () => {
      const small = new Blob(["small"]);
      vi.mocked(downscalePhoto).mockResolvedValue(small);
      const { result, rerender } = setup("a");
      await act(() => result.current.controls.select(createFile("image/jpeg")));

      expect(URL.createObjectURL).toHaveBeenCalledWith(small);
      expect(result.current.controls).toMatchObject({
        photo: { url: "blob:1", focalX: 50, focalY: 50 },
        isLoading: false,
        error: "",
      });
      expect(result.current.photoOf("a")).toBe(result.current.controls.photo);
      expect(result.current.photoOf("b")).toBeNull();

      rerender({ id: "b" });
      expect(result.current.controls.photo).toBeNull();
      expect(result.current.photoOf("a")?.url).toBe("blob:1");
    });

    it("revokes the URL of the photo it replaces", async () => {
      const { result } = setup();
      await act(() => result.current.controls.select(createFile()));
      await act(() => result.current.controls.select(createFile()));
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
      expect(result.current.controls.photo?.url).toBe("blob:2");
    });
  });

  describe("when the file type is not supported", () => {
    it("explains the accepted formats without processing it", async () => {
      const { result } = setup();
      await act(() => result.current.controls.select(createFile("image/heic")));
      expect(result.current.controls.error).toBe(
        "Wybierz JPG, PNG lub WebP. Zdjęcie HEIC zapisz najpierw jako JPG.",
      );
      expect(downscalePhoto).not.toHaveBeenCalled();
    });
  });

  describe("when the photo cannot be read", () => {
    it("reports it and keeps the previous photo", async () => {
      const { result } = setup();
      await act(() => result.current.controls.select(createFile()));
      vi.mocked(downscalePhoto).mockRejectedValue(new Error("broken"));
      await act(() => result.current.controls.select(createFile()));

      expect(result.current.controls.error).toContain(
        "Nie udało się odczytać zdjęcia",
      );
      expect(result.current.controls.isLoading).toBe(false);
      expect(result.current.controls.photo?.url).toBe("blob:1");
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
      const { result } = setup();
      let first: Promise<void> = Promise.resolve();
      act(() => {
        first = result.current.controls.select(createFile());
      });
      await act(() => result.current.controls.select(createFile()));
      await act(async () => {
        finishFirst(new Blob(["stale"]));
        await first;
      });

      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      expect(result.current.controls.photo?.url).toBe("blob:1");
    });
  });

  describe("when a selection is still being read", () => {
    it("lands on the graphic it was made for, also after another one is edited", async () => {
      let finish = (_: Blob) => {};
      vi.mocked(downscalePhoto).mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      const { result, rerender } = setup("a");
      let pending: Promise<void> = Promise.resolve();
      act(() => {
        pending = result.current.controls.select(createFile());
      });
      rerender({ id: "b" });
      expect(result.current.controls.isLoading).toBe(false);

      await act(async () => {
        finish(new Blob(["late"]));
        await pending;
      });
      expect(result.current.photoOf("a")?.url).toBe("blob:1");
      expect(result.current.photoOf("b")).toBeNull();
    });

    it("does not report a failure after the photo was removed", async () => {
      let fail = () => {};
      vi.mocked(downscalePhoto).mockReturnValueOnce(
        new Promise((_, reject) => {
          fail = () => reject(new Error("broken"));
        }),
      );
      const { result } = setup();
      let pending: Promise<void> = Promise.resolve();
      act(() => {
        pending = result.current.controls.select(createFile());
      });
      act(() => result.current.controls.remove());
      await act(async () => {
        fail();
        await pending;
      });
      expect(result.current.controls.error).toBe("");
    });
  });

  describe("when the focus point changes", () => {
    it("updates only the given axis, and only where there is a photo", async () => {
      const { result } = setup();
      act(() => result.current.controls.setFocus({ focalX: 10 }));
      expect(result.current.controls.photo).toBeNull();

      await act(() => result.current.controls.select(createFile()));
      act(() => result.current.controls.setFocus({ focalX: 10 }));
      expect(result.current.controls.photo).toMatchObject({
        focalX: 10,
        focalY: 50,
      });
    });
  });

  describe("when a graphic is copied", () => {
    it("gives the copy the same photo and focus under a URL of its own", async () => {
      const blob = new Blob(["photo"]);
      vi.mocked(downscalePhoto).mockResolvedValue(blob);
      const { result } = setup("a");
      await act(() => result.current.controls.select(createFile()));
      act(() => result.current.controls.setFocus({ focalY: 20 }));

      act(() => result.current.copy("a", "b"));

      expect(URL.createObjectURL).toHaveBeenLastCalledWith(blob);
      expect(result.current.photoOf("b")).toEqual({
        url: "blob:2",
        focalX: 50,
        focalY: 20,
      });
      expect(result.current.photoOf("a")?.url).toBe("blob:1");
    });

    it("lets the copy and the source go their own ways", async () => {
      const { result, rerender } = setup("a");
      await act(() => result.current.controls.select(createFile()));
      act(() => result.current.copy("a", "b"));

      rerender({ id: "b" });
      act(() => result.current.controls.setFocus({ focalX: 5 }));
      act(() => result.current.drop("a"));

      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
      expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:2");
      expect(result.current.photoOf("a")).toBeNull();
      expect(result.current.photoOf("b")).toMatchObject({
        url: "blob:2",
        focalX: 5,
      });
    });

    it("copies nothing from a graphic without a photo", () => {
      const { result } = setup("a");
      act(() => result.current.copy("a", "b"));
      expect(result.current.photoOf("b")).toBeNull();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
  });

  describe("when a photo is removed, a graphic goes or the editor closes", () => {
    it("revokes every URL it still holds", async () => {
      const { result, unmount } = setup("a");
      await act(() => result.current.controls.select(createFile()));
      act(() => result.current.controls.remove());
      expect(result.current.controls.photo).toBeNull();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");

      await act(() => result.current.controls.select(createFile()));
      act(() => result.current.copy("a", "b"));
      unmount();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:2");
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:3");
    });
  });
});
