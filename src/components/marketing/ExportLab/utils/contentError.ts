/** A problem the user fixes by editing the listed fields; shown next to them. */
export class ContentError extends Error {
  readonly fieldIds: readonly string[];

  constructor(message: string, fieldIds: readonly string[]) {
    super(message);
    this.name = "ContentError";
    this.fieldIds = fieldIds;
  }
}
