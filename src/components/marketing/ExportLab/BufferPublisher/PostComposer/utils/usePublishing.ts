import { useRef, useState } from "react";
import {
  createBufferPost,
  uploadBufferMedia,
} from "../../../../../../services/buffer/client/buffer.api";
import type { ChannelPublishResult, PlannedPost } from "../PostComposer.types";

/**
 * Publishes posts one channel at a time. A retry of an unchanged post reuses its uploaded
 * images and idempotency key, so the Worker replays it instead of creating a duplicate.
 */
export function usePublishing() {
  const uploads = useRef(new WeakMap<File, Promise<string>>());
  const attempts = useRef(
    new Map<string, { key: string; requestId: string }>(),
  );
  const [results, setResults] = useState<Record<string, ChannelPublishResult>>(
    {},
  );
  const [isPublishing, setIsPublishing] = useState(false);

  function upload(file: File) {
    let pending = uploads.current.get(file);
    if (!pending) {
      pending = uploadBufferMedia(file);
      uploads.current.set(file, pending);
      pending.catch(() => uploads.current.delete(file));
    }
    return pending;
  }

  function requestIdFor(channelId: string, payload: object) {
    const key = JSON.stringify(payload);
    const previous = attempts.current.get(channelId);
    if (previous?.key === key) return previous.requestId;
    const requestId = crypto.randomUUID();
    attempts.current.set(channelId, { key, requestId });
    return requestId;
  }

  function setResult(channelId: string, result: ChannelPublishResult) {
    setResults((prev) => ({ ...prev, [channelId]: result }));
  }

  async function publish(posts: readonly PlannedPost[]) {
    setIsPublishing(true);
    for (const { channelId, files, ...post } of posts) {
      setResult(channelId, { status: "publishing" });
      try {
        if (files.length === 0 || files.includes(undefined))
          throw new Error("Grafika nie jest jeszcze gotowa.");
        // Every image is uploaded before the post is created: one that fails
        // leaves the channel without a post, and the message says which one.
        const mediaIds: string[] = [];
        for (const [index, file] of (files as File[]).entries()) {
          try {
            mediaIds.push(await upload(file));
          } catch (cause) {
            if (files.length === 1) throw cause;
            throw new Error(
              `Nie udało się wysłać grafiki ${index + 1}${cause instanceof Error ? `: ${cause.message}` : "."}`,
            );
          }
        }
        // One image goes out the way it always did, so a post with a single
        // graphic does not depend on the Worker knowing the list.
        const payload = {
          ...post,
          ...(mediaIds.length === 1 ? { mediaId: mediaIds[0] } : { mediaIds }),
          channelId,
        };
        const postId = await createBufferPost({
          ...payload,
          requestId: requestIdFor(channelId, payload),
        });
        setResult(channelId, { status: "success", message: postId });
      } catch (cause) {
        setResult(channelId, {
          status: "error",
          message:
            cause instanceof Error
              ? cause.message
              : "Nie udało się opublikować.",
        });
      }
    }
    setIsPublishing(false);
  }

  function reset() {
    attempts.current.clear();
    setResults({});
  }

  return { results, isPublishing, publish, reset };
}
