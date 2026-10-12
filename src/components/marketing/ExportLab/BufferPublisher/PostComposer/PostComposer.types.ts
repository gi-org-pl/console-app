import type { BufferPublishMode } from "../../../../../services/buffer/schemas/buffer.schemas";

export interface PostContent {
  /** One of the generator's `GraphicFormat` ids, e.g. "square". */
  formatId: string;
  text: string;
}

/** Which graphics of the post a channel gets: every one, or the first only. */
export type ImageScope = "all" | "first";

export interface PublishDraft {
  channelIds: readonly string[];
  shared: PostContent;
  /** Channels with their own graphic or caption; the others use `shared`. */
  overrides: Readonly<Record<string, PostContent>>;
  /** Channels whose scope was chosen by hand; the others use their network's default. */
  imageScopes: Readonly<Record<string, ImageScope>>;
  mode: BufferPublishMode;
  /** `datetime-local` value; only used when `mode` is "customScheduled". */
  dueAt: string;
}

export type PostIssueCode =
  | "empty"
  | "tooLong"
  | "format"
  | "links"
  | "tooManyImages";

export interface PostIssue {
  code: PostIssueCode;
  level: "error" | "warning";
  message: string;
}

export interface PlannedPost {
  channelId: string;
  /** The graphics of the post in the order shown; `undefined` for one that is not ready. */
  files: readonly (File | undefined)[];
  text: string;
  mode: BufferPublishMode;
  dueAt?: string;
}

export interface ChannelPublishResult {
  status: "publishing" | "success" | "error";
  message?: string;
}
