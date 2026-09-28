import { BufferApiError } from "../utils/BufferApiError";
import { bufferClient } from "./bufferClient";

// axios exposes registered interceptors on the manager, undocumented but stable across versions.
interface InterceptorManagerWithHandlers {
  handlers: { rejected: (error: unknown) => Promise<never> }[];
}

async function reject(error: unknown): Promise<BufferApiError> {
  const { rejected } = (
    bufferClient.interceptors
      .response as unknown as InterceptorManagerWithHandlers
  ).handlers[0];
  return rejected(error).catch((cause: unknown) => cause as BufferApiError);
}

describe("bufferClient", () => {
  describe("when the Worker responds with a JSON error body", () => {
    it("rejects with a BufferApiError carrying the Worker's message", async () => {
      const error = await reject({
        response: { status: 403, data: { message: "Zabronione." } },
      });

      expect(error).toBeInstanceOf(BufferApiError);
      expect(error.message).toBe("Zabronione.");
      expect(error.status).toBe(403);
    });
  });

  describe("when the response has no parseable error body", () => {
    it("rejects with a generic BufferApiError", async () => {
      const error = await reject({
        response: { status: 500, data: "oops" },
      });

      expect(error).toBeInstanceOf(BufferApiError);
      expect(error.message).toBe(
        "Nie udało się połączyć z serwisem publikacji.",
      );
      expect(error.status).toBe(500);
    });
  });

  describe("when there is no response at all (network error)", () => {
    it("rejects with a generic BufferApiError and no status", async () => {
      const error = await reject({});

      expect(error).toBeInstanceOf(BufferApiError);
      expect(error.status).toBeUndefined();
    });
  });
});
