import { z } from "zod";

/** Mirrors console-publisher-worker's `src/schemas/publishing.ts` — the contract of record. */

export const MAX_POST_TEXT_LENGTH = 5000;
export const MIN_SCHEDULE_LEAD_MS = 60_000;
export const MAX_SCHEDULE_DAYS = 30;

export const bufferChannelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  service: z.enum([
    "facebook",
    "instagram",
    "linkedin",
    "threads",
    "bluesky",
    "mastodon",
    "twitter",
  ]),
});

export const bufferSessionSchema = z.object({
  email: z.email(),
  channels: z.array(bufferChannelSchema).min(1),
});

export const bufferMediaUploadResultSchema = z.object({ mediaId: z.uuid() });

export const bufferPublishModeSchema = z.enum([
  "addToQueue",
  "shareNow",
  "customScheduled",
]);

export const bufferPublishInputSchema = z
  .object({
    requestId: z.uuid(),
    mediaId: z.uuid(),
    channelId: z.string().min(1),
    text: z.string().trim().min(1).max(MAX_POST_TEXT_LENGTH),
    mode: bufferPublishModeSchema,
    dueAt: z.iso.datetime().optional(),
  })
  .strict();

export const bufferPublishResultSchema = z.object({
  postId: z.string().min(1),
});

export const bufferErrorSchema = z.object({ message: z.string() });

export type BufferChannel = z.infer<typeof bufferChannelSchema>;
export type BufferSession = z.infer<typeof bufferSessionSchema>;
export type BufferPublishMode = z.infer<typeof bufferPublishModeSchema>;
export type BufferPublishInput = z.infer<typeof bufferPublishInputSchema>;
export type BufferPublishResult = z.infer<typeof bufferPublishResultSchema>;
