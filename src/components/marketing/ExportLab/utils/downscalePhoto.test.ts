import { downscalePhoto } from "./downscalePhoto";

let imageSize = { width: 800, height: 600 };
let decodeResult: () => Promise<void>;

class MockImage {
  src = "";
  get naturalWidth() {
    return imageSize.width;
  }
  get naturalHeight() {
    return imageSize.height;
  }
  decode() {
    return decodeResult();
  }
}

const createFile = (type = "image/jpeg") =>
  new File(["photo"], "photo", { type });

describe("downscalePhoto", () => {
  let context: { drawImage: ReturnType<typeof vi.fn> } | null;
  let encoded: Blob | null;

  beforeEach(() => {
    imageSize = { width: 800, height: 600 };
    decodeResult = () => Promise.resolve();
    context = { drawImage: vi.fn() };
    encoded = new Blob(["small"]);
    vi.stubGlobal("Image", MockImage);
    URL.createObjectURL = vi.fn(() => "blob:original");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      () => context as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function (this: HTMLCanvasElement, callback) {
        callback(encoded);
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("when the photo already fits", () => {
    it("returns the original file without re-encoding", async () => {
      const file = createFile();
      expect(await downscalePhoto(file)).toBe(file);
      expect(HTMLCanvasElement.prototype.toBlob).not.toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:original");
    });
  });

  describe("when a JPEG is larger than the templates need", () => {
    it("scales the longest edge down to 2160 px as JPEG", async () => {
      imageSize = { width: 8000, height: 6000 };
      expect(await downscalePhoto(createFile())).toBe(encoded);
      const canvas = vi.mocked(HTMLCanvasElement.prototype.toBlob).mock
        .contexts[0] as HTMLCanvasElement;
      expect(context?.drawImage).toHaveBeenCalledWith(
        expect.any(MockImage),
        0,
        0,
        2160,
        1620,
      );
      expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        "image/jpeg",
        0.92,
      );
      // The bitmap is released right after encoding.
      expect(canvas.width).toBe(0);
    });
  });

  describe("when a large PNG or WebP may have transparency", () => {
    it("keeps it as PNG", async () => {
      imageSize = { width: 3000, height: 6000 };
      await downscalePhoto(createFile("image/webp"));
      expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        "image/png",
        0.92,
      );
      expect(context?.drawImage).toHaveBeenCalledWith(
        expect.any(MockImage),
        0,
        0,
        1080,
        2160,
      );
    });
  });

  describe("when the photo cannot be decoded", () => {
    it("rejects and releases the URL", async () => {
      decodeResult = () => Promise.reject(new Error("broken"));
      await expect(downscalePhoto(createFile())).rejects.toThrow("broken");
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:original");
    });
  });

  describe("when canvas is unavailable or encoding fails", () => {
    it("rejects without a 2D context", async () => {
      imageSize = { width: 8000, height: 6000 };
      context = null;
      await expect(downscalePhoto(createFile())).rejects.toThrow(
        "nie obsługuje canvasu",
      );
    });

    it("rejects when no blob comes back", async () => {
      imageSize = { width: 8000, height: 6000 };
      encoded = null;
      await expect(downscalePhoto(createFile())).rejects.toThrow(
        "Nie udało się zmniejszyć zdjęcia.",
      );
    });
  });
});
