import type { BufferChannel } from "../../../../../../services/buffer/schemas/buffer.schemas";
import { GRAPHIC_FORMATS } from "../../../ExportLab.constants";
import { SERVICES } from "../PostComposer.constants";
import type { PostContent, PostIssue } from "../PostComposer.types";

const LINK_PATTERN = /(?:https?:\/\/|www\.)\S+/i;

export const containsLink = (text: string) => LINK_PATTERN.test(text);

export function getPostIssues(
  service: BufferChannel["service"],
  content: PostContent,
): PostIssue[] {
  const info = SERVICES[service];
  const text = content.text.trim();
  const issues: PostIssue[] = [];

  if (!text) {
    issues.push({
      code: "empty",
      level: "error",
      message: "Dodaj treść posta.",
    });
  } else if (text.length > info.maxLength) {
    issues.push({
      code: "tooLong",
      level: "error",
      message: `Treść jest za długa: ${text.length} z ${info.maxLength} znaków.`,
    });
  }
  if (info.unsupportedFormatIds.includes(content.formatId)) {
    const format = GRAPHIC_FORMATS.find(({ id }) => id === content.formatId);
    issues.push({
      code: "format",
      level: "error",
      message: `${info.label} nie opublikuje formatu ${format?.ratio ?? content.formatId} jako posta. Wybierz inny format.`,
    });
  }
  if (!info.hasClickableLinks && containsLink(text)) {
    issues.push({
      code: "links",
      level: "warning",
      message: `${info.label}: linki w opisie nie są klikalne. Dodaj link w bio profilu.`,
    });
  }
  return issues;
}
