import type { BufferPublishMode } from "../../../../../services/buffer/schemas/buffer.schemas";

export interface PostContent {
  /** One of the generator's `GraphicFormat` ids, e.g. "square". */
  formatId: string;
  text: string;
}

export interface PublishDraft {
  channelIds: readonly string[];
  shared: PostContent;
  /** Channels with their own graphic or caption; the others use `shared`. */
  overrides: Readonly<Record<string, PostContent>>;
  mode: BufferPublishMode;
  /** `datetime-local` value; only used when `mode` is "customScheduled". */
  dueAt: string;
}

export type PostIssueCode = "empty" | "tooLong" | "format" | "links";

export interface PostIssue {
  code: PostIssueCode;
  level: "error" | "warning";
  message: string;
}

export interface PlannedPost {
  channelId: string;
  file?: File;
  text: string;
  mode: BufferPublishMode;
  dueAt?: string;
}

export interface ChannelPublishResult {
  status: "publishing" | "success" | "error";
  message?: string;
}
