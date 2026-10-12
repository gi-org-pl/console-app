import type {
  BufferPostType,
  BufferPublishMode,
} from "../../../../../services/buffer/schemas/buffer.schemas";

export interface PostContent {
  /** One of the generator's `GraphicFormat` ids, e.g. "square". */
  formatId: string;
  text: string;
}

/** What a channel publishes from the material: a feed post, a story, or both. */
export type PostKind = BufferPostType;

/** Which graphics of the post a channel gets: every one, or the first only. */
export type ImageScope = "all" | "first";

export interface PublishDraft {
  channelIds: readonly string[];
  shared: PostContent;
  /** Channels with their own graphic or caption; the others use `shared`. */
  overrides: Readonly<Record<string, PostContent>>;
  /** Channels whose scope was chosen by hand; the others use their network's default. */
  imageScopes: Readonly<Record<string, ImageScope>>;
  /** Channels whose kinds were chosen by hand; the others publish a post. */
  kinds: Readonly<Record<string, readonly PostKind[]>>;
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
  /** Names the entry among the results: a channel may publish a post and a story in one run. */
  key: string;
  channelId: string;
  kind: PostKind;
  /** The graphics of the post in the order shown; `undefined` for one that is not ready. */
  files: readonly (File | undefined)[];
  /** Left out for a story, which shows no caption. */
  text?: string;
  mode: BufferPublishMode;
  dueAt?: string;
}

export interface ChannelPublishResult {
  status: "publishing" | "success" | "error";
  message?: string;
}
