import { useRef, useState } from "react";
import {
  createBufferPost,
  uploadBufferMedia,
} from "../../../../../../services/buffer/client/buffer.api";
import type { ChannelPublishResult, PlannedPost } from "../PostComposer.types";

/**
 * Publishes posts one channel at a time. A retry of an unchanged post reuses its uploaded
 * image and idempotency key, so the Worker replays it instead of creating a duplicate.
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
    for (const { channelId, file, ...post } of posts) {
      setResult(channelId, { status: "publishing" });
      try {
        if (!file) throw new Error("Grafika nie jest jeszcze gotowa.");
        const mediaId = await upload(file);
        const payload = { ...post, mediaId, channelId };
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
