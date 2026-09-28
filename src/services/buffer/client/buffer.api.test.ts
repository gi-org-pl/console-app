import {
  createBufferPost,
  fetchBufferSession,
  getBufferLoginUrl,
  getBufferLogoutUrl,
  uploadBufferMedia,
} from "./buffer.api";
import { bufferClient } from "./bufferClient";

vi.mock("./bufferClient", () => ({
  BUFFER_API_ORIGIN: "https://console.gi.org.pl",
  bufferClient: { get: vi.fn(), post: vi.fn() },
}));

describe("getBufferLoginUrl", () => {
  it("builds the absolute login URL carrying the state", () => {
    expect(getBufferLoginUrl("abc def")).toBe(
      "https://console.gi.org.pl/api/buffer/login?state=abc%20def",
    );
  });
});

describe("getBufferLogoutUrl", () => {
  it("points at Cloudflare Access's logout on the Worker's host", () => {
    expect(getBufferLogoutUrl()).toBe(
      "https://console.gi.org.pl/cdn-cgi/access/logout",
    );
  });
});

describe("fetchBufferSession", () => {
  it("parses a valid session response", async () => {
    vi.mocked(bufferClient.get).mockResolvedValue({
      data: {
        email: "operator@example.com",
        channels: [{ id: "1", name: "Foundation", service: "instagram" }],
      },
    });

    const session = await fetchBufferSession();

    expect(bufferClient.get).toHaveBeenCalledWith("/session");
    expect(session.email).toBe("operator@example.com");
    expect(session.channels).toHaveLength(1);
  });

  it("throws when the response does not match the contract", async () => {
    vi.mocked(bufferClient.get).mockResolvedValue({ data: { email: "x" } });

    await expect(fetchBufferSession()).rejects.toThrow();
  });
});

describe("uploadBufferMedia", () => {
  it("uploads the PNG and returns its media id", async () => {
    const mediaId = "d1b1e6c0-0000-4000-8000-000000000000";
    vi.mocked(bufferClient.post).mockResolvedValue({ data: { mediaId } });
    const png = new Blob(["png"], { type: "image/png" });

    const result = await uploadBufferMedia(png);

    expect(bufferClient.post).toHaveBeenCalledWith("/media", png, {
      headers: { "Content-Type": "image/png" },
    });
    expect(result).toBe(mediaId);
  });
});

describe("createBufferPost", () => {
  it("sends the validated input and returns the post id", async () => {
    vi.mocked(bufferClient.post).mockResolvedValue({
      data: { postId: "post1" },
    });
    const input = {
      requestId: "d1b1e6c0-0000-4000-8000-000000000001",
      mediaId: "d1b1e6c0-0000-4000-8000-000000000002",
      channelId: "channel-1",
      text: "Hello",
      mode: "shareNow" as const,
    };

    const postId = await createBufferPost(input);

    expect(bufferClient.post).toHaveBeenCalledWith("/posts", input);
    expect(postId).toBe("post1");
  });

  it("rejects an input that fails the shared publishing contract", async () => {
    await expect(
      createBufferPost({
        requestId: "not-a-uuid",
        mediaId: "d1b1e6c0-0000-4000-8000-000000000002",
        channelId: "channel-1",
        text: "Hello",
        mode: "shareNow",
      }),
    ).rejects.toThrow();
    expect(bufferClient.post).not.toHaveBeenCalled();
  });
});
