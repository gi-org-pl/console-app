import { z } from "zod";

/** Mirrors console-publisher-worker's `src/schemas/publishing.ts` — the contract of record. */

export const MAX_POST_TEXT_LENGTH = 5000;
export const MIN_SCHEDULE_LEAD_MS = 60_000;
export const MAX_SCHEDULE_DAYS = 30;
/** The most images one request may name; each network has its own, lower or equal, limit. */
export const MAX_POST_IMAGES = 20;

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

/** What a post can be published as. A story is there for a day and shows no caption. */
export const bufferPostTypeSchema = z.enum(["post", "story"]);

/**
 * The images of a post are given either as `mediaIds`, an ordered list, or as
 * `mediaId`, the one image a post had before it could carry several.
 */
export const bufferPublishInputSchema = z
  .object({
    requestId: z.uuid(),
    mediaId: z.uuid().optional(),
    mediaIds: z.array(z.uuid()).min(1).max(MAX_POST_IMAGES).optional(),
    channelId: z.string().min(1),
    /** Left out for a story, which shows no caption; required for a post. */
    text: z.string().trim().min(1).max(MAX_POST_TEXT_LENGTH).optional(),
    /** Left out means "post". */
    type: bufferPostTypeSchema.optional(),
    mode: bufferPublishModeSchema,
    dueAt: z.iso.datetime().optional(),
  })
  .strict()
  .refine((input) => (input.type === "story") === (input.text === undefined), {
    message: "A post needs a text; a story is sent without one.",
    path: ["text"],
  })
  .refine(
    (input) => (input.mediaId === undefined) !== (input.mediaIds === undefined),
    { message: 'Give either "mediaId" or "mediaIds".' },
  )
  .refine(
    (input) => new Set(input.mediaIds).size === (input.mediaIds?.length ?? 0),
    { message: "An image is listed twice.", path: ["mediaIds"] },
  );

export const bufferPublishResultSchema = z.object({
  postId: z.string().min(1),
});

export const bufferErrorSchema = z.object({ message: z.string() });

export type BufferChannel = z.infer<typeof bufferChannelSchema>;
export type BufferSession = z.infer<typeof bufferSessionSchema>;
export type BufferPublishMode = z.infer<typeof bufferPublishModeSchema>;
export type BufferPostType = z.infer<typeof bufferPostTypeSchema>;
export type BufferPublishInput = z.infer<typeof bufferPublishInputSchema>;
export type BufferPublishResult = z.infer<typeof bufferPublishResultSchema>;
