import { act, renderHook } from "@testing-library/react";
import {
  createBufferPost,
  uploadBufferMedia,
} from "../../../../../../services/buffer/client/buffer.api";
import { usePublishing } from "./usePublishing";

vi.mock("../../../../../../services/buffer/client/buffer.api", () => ({
  uploadBufferMedia: vi.fn(),
  createBufferPost: vi.fn(),
}));

const MEDIA_ID = "d1b1e6c0-0000-4000-8000-000000000000";
const file = new File(["png"], "square.png", { type: "image/png" });
const post = (channelId: string, text = "Hej") => ({
  channelId,
  file,
  text,
  mode: "addToQueue" as const,
});

describe("usePublishing", () => {
  beforeEach(() => {
    vi.mocked(uploadBufferMedia).mockResolvedValue(MEDIA_ID);
    vi.mocked(createBufferPost).mockResolvedValue("post-1");
  });

  describe("when several channels share an image", () => {
    it("uploads it once and records each result", async () => {
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([post("a"), post("b")]));

      expect(uploadBufferMedia).toHaveBeenCalledTimes(1);
      expect(result.current.results).toEqual({
        a: { status: "success", message: "post-1" },
        b: { status: "success", message: "post-1" },
      });
      expect(result.current.isPublishing).toBe(false);
    });
  });

  describe("when the image is missing", () => {
    it("fails that channel without calling the Worker", async () => {
      const { result } = renderHook(() => usePublishing());
      await act(() =>
        result.current.publish([{ ...post("a"), file: undefined }]),
      );
      expect(result.current.results.a).toEqual({
        status: "error",
        message: "Grafika nie jest jeszcze gotowa.",
      });
      expect(createBufferPost).not.toHaveBeenCalled();
    });
  });

  describe("when the upload fails", () => {
    it("reports it and uploads again on the next attempt", async () => {
      vi.mocked(uploadBufferMedia).mockRejectedValueOnce("offline");
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([post("a")]));
      expect(result.current.results.a.message).toBe(
        "Nie udało się opublikować.",
      );

      await act(() => result.current.publish([post("a")]));
      expect(uploadBufferMedia).toHaveBeenCalledTimes(2);
      expect(result.current.results.a.status).toBe("success");
    });
  });

  describe("when a post is retried", () => {
    it("keeps the idempotency key for the same content and renews it for new content", async () => {
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([post("a")]));
      await act(() => result.current.publish([post("a")]));
      await act(() => result.current.publish([post("a", "Inny tekst")]));

      const ids = vi
        .mocked(createBufferPost)
        .mock.calls.map(([input]) => input.requestId);
      expect(ids[1]).toBe(ids[0]);
      expect(ids[2]).not.toBe(ids[0]);
    });

    it("starts fresh after a reset", async () => {
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([post("a")]));
      act(() => result.current.reset());
      expect(result.current.results).toEqual({});

      await act(() => result.current.publish([post("a")]));
      const [first, second] = vi.mocked(createBufferPost).mock.calls;
      expect(second[0].requestId).not.toBe(first[0].requestId);
    });
  });
});
