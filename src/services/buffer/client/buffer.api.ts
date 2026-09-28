import {
  type BufferPublishInput,
  type BufferSession,
  bufferMediaUploadResultSchema,
  bufferPublishInputSchema,
  bufferPublishResultSchema,
  bufferSessionSchema,
} from "../schemas/buffer.schemas";
import { BUFFER_API_ORIGIN, bufferClient } from "./bufferClient";

/** Opens in a popup: a path protected by Cloudflare Access, not a Buffer OAuth flow. */
export function getBufferLoginUrl(state: string): string {
  return `${BUFFER_API_ORIGIN}/api/buffer/login?state=${encodeURIComponent(state)}`;
}

/** Cloudflare Access's own logout endpoint; it clears the session cookie for the domain. */
export function getBufferLogoutUrl(): string {
  return `${BUFFER_API_ORIGIN}/cdn-cgi/access/logout`;
}

export async function fetchBufferSession(): Promise<BufferSession> {
  const { data } = await bufferClient.get("/session");
  return bufferSessionSchema.parse(data);
}

export async function uploadBufferMedia(png: File | Blob): Promise<string> {
  const { data } = await bufferClient.post("/media", png, {
    headers: { "Content-Type": "image/png" },
  });
  return bufferMediaUploadResultSchema.parse(data).mediaId;
}

export async function createBufferPost(
  input: BufferPublishInput,
): Promise<string> {
  const { data } = await bufferClient.post(
    "/posts",
    bufferPublishInputSchema.parse(input),
  );
  return bufferPublishResultSchema.parse(data).postId;
}
