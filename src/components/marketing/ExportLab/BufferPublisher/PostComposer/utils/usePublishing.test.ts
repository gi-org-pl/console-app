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
  key: channelId,
  kind: "post" as const,
  channelId,
  files: [file],
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
        result.current.publish([{ ...post("a"), files: [undefined] }]),
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

  describe("when a post has one graphic", () => {
    it("sends it the way a post was always sent", async () => {
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([post("a")]));

      const [input] = vi.mocked(createBufferPost).mock.calls[0];
      expect(input.mediaId).toBe(MEDIA_ID);
      expect(input).not.toHaveProperty("mediaIds");
    });
  });

  describe("when a post has several graphics", () => {
    const second = new File(["png"], "second.png", { type: "image/png" });
    const SECOND_ID = "d1b1e6c0-0000-4000-8000-000000000001";
    const several = (channelId: string) => ({
      ...post(channelId),
      files: [file, second],
    });
    const uploadByFile = () =>
      vi
        .mocked(uploadBufferMedia)
        .mockImplementation(async (png) =>
          png === file ? MEDIA_ID : SECOND_ID,
        );

    it("uploads each once and sends their IDs in the order shown", async () => {
      uploadByFile();
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([several("a"), several("b")]));

      expect(uploadBufferMedia).toHaveBeenCalledTimes(2);
      for (const [input] of vi.mocked(createBufferPost).mock.calls) {
        expect(input.mediaIds).toEqual([MEDIA_ID, SECOND_ID]);
        expect(input).not.toHaveProperty("mediaId");
      }
      expect(result.current.results.b.status).toBe("success");
    });

    it("creates no post when one upload fails and says which graphic it was", async () => {
      vi.mocked(uploadBufferMedia)
        .mockResolvedValueOnce(MEDIA_ID)
        .mockRejectedValueOnce(new Error("Plik jest za duży."));
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([several("a")]));

      expect(result.current.results.a).toEqual({
        status: "error",
        message: "Nie udało się wysłać grafiki 2: Plik jest za duży.",
      });
      expect(createBufferPost).not.toHaveBeenCalled();
    });

    it("names the graphic also when the failure has no message", async () => {
      vi.mocked(uploadBufferMedia).mockRejectedValueOnce("offline");
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([several("a")]));

      expect(result.current.results.a.message).toBe(
        "Nie udało się wysłać grafiki 1.",
      );
    });

    it("uploads only the failed graphic again on the next attempt", async () => {
      vi.mocked(uploadBufferMedia)
        .mockResolvedValueOnce(MEDIA_ID)
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValueOnce(SECOND_ID);
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([several("a")]));
      await act(() => result.current.publish([several("a")]));

      expect(uploadBufferMedia).toHaveBeenCalledTimes(3);
      expect(vi.mocked(createBufferPost).mock.calls[0][0].mediaIds).toEqual([
        MEDIA_ID,
        SECOND_ID,
      ]);
    });

    it.each([
      ["one of them is not ready", [file, undefined]],
      ["there is none", []],
    ])("sends nothing when %s", async (_name, files) => {
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([{ ...post("a"), files }]));

      expect(result.current.results.a.message).toBe(
        "Grafika nie jest jeszcze gotowa.",
      );
      expect(uploadBufferMedia).not.toHaveBeenCalled();
      expect(createBufferPost).not.toHaveBeenCalled();
    });
  });

  describe("when a channel publishes a story", () => {
    const story = (channelId: string) => ({
      key: `${channelId}:story`,
      kind: "story" as const,
      channelId,
      files: [file],
      mode: "addToQueue" as const,
    });

    it("sends it with the story type and without a caption", async () => {
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([story("a")]));

      const [input] = vi.mocked(createBufferPost).mock.calls[0];
      expect(input).toMatchObject({
        channelId: "a",
        type: "story",
        mediaId: MEDIA_ID,
      });
      expect(input).not.toHaveProperty("text");
      expect(input).not.toHaveProperty("kind");
      expect(input).not.toHaveProperty("key");
    });

    it("names no type for a post, so a post goes out as it always did", async () => {
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([post("a")]));

      const [input] = vi.mocked(createBufferPost).mock.calls[0];
      expect(input).not.toHaveProperty("type");
      expect(input).not.toHaveProperty("kind");
      expect(input).not.toHaveProperty("key");
    });

    it("keeps the post and the story of one channel apart: two requests, two results", async () => {
      vi.mocked(createBufferPost)
        .mockResolvedValueOnce("post-1")
        .mockRejectedValueOnce(new Error("Buffer odmówił."));
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([post("a"), story("a")]));

      expect(result.current.results).toEqual({
        a: { status: "success", message: "post-1" },
        "a:story": { status: "error", message: "Buffer odmówił." },
      });
      const [first, second] = vi
        .mocked(createBufferPost)
        .mock.calls.map(([input]) => input.requestId);
      expect(second).not.toBe(first);
      // The same image in the same format is uploaded once for both.
      expect(uploadBufferMedia).toHaveBeenCalledTimes(1);
    });

    it("reuses the request ID of the story when only the story is retried", async () => {
      vi.mocked(createBufferPost)
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValueOnce("post-2");
      const { result } = renderHook(() => usePublishing());
      await act(() => result.current.publish([story("a")]));
      await act(() => result.current.publish([story("a")]));

      const [first, second] = vi
        .mocked(createBufferPost)
        .mock.calls.map(([input]) => input.requestId);
      expect(second).toBe(first);
      expect(result.current.results["a:story"].status).toBe("success");
    });
  });
});
