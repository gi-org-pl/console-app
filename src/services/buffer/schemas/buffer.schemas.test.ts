import { bufferPublishInputSchema, MAX_POST_IMAGES } from "./buffer.schemas";

const ID = "d1b1e6c0-0000-4000-8000-000000000000";
const OTHER_ID = "d1b1e6c0-0000-4000-8000-000000000001";
const base = {
  requestId: "d1b1e6c0-0000-4000-8000-00000000000f",
  channelId: "ig",
  text: "Hej",
  mode: "addToQueue",
};
const accepts = (input: object) =>
  bufferPublishInputSchema.safeParse(input).success;

describe("bufferPublishInputSchema", () => {
  describe("when a post has one image", () => {
    it("takes it as a single ID or as a list of one", () => {
      expect(accepts({ ...base, mediaId: ID })).toBe(true);
      expect(accepts({ ...base, mediaIds: [ID] })).toBe(true);
    });
  });

  describe("when a post has several images", () => {
    it("takes an ordered list up to the most one request may name", () => {
      const most = Array.from({ length: MAX_POST_IMAGES }, () =>
        crypto.randomUUID(),
      );
      expect(accepts({ ...base, mediaIds: [ID, OTHER_ID] })).toBe(true);
      expect(accepts({ ...base, mediaIds: most })).toBe(true);
      expect(accepts({ ...base, mediaIds: [...most, ID] })).toBe(false);
    });
  });

  describe("when the images are given the wrong way", () => {
    it.each([
      ["both forms", { mediaId: ID, mediaIds: [OTHER_ID] }],
      ["neither", {}],
      ["an empty list", { mediaIds: [] }],
      ["the same image twice", { mediaIds: [ID, ID] }],
      ["an ID that is no UUID", { mediaIds: [ID, "x"] }],
    ])("refuses %s", (_name, images) => {
      expect(accepts({ ...base, ...images })).toBe(false);
    });
  });
});

describe("bufferPublishInputSchema for a story", () => {
  const { text: _caption, ...withoutText } = base;

  it("takes a story without a text, and a post with one", () => {
    expect(accepts({ ...withoutText, mediaId: ID, type: "story" })).toBe(true);
    expect(accepts({ ...base, mediaId: ID, type: "post" })).toBe(true);
    expect(accepts({ ...base, mediaId: ID })).toBe(true);
  });

  it.each([
    ["a story with a caption", { ...base, type: "story" }],
    ["a post without a text", withoutText],
    ["a post without a text, named as one", { ...withoutText, type: "post" }],
    ["a type that is not known", { ...base, type: "reel" }],
  ])("refuses %s", (_name, input) => {
    expect(accepts({ ...input, mediaId: ID })).toBe(false);
  });
});
