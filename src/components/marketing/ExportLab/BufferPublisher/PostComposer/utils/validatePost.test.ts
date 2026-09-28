import { containsLink, getPostIssues } from "./validatePost";

const codes = (...args: Parameters<typeof getPostIssues>) =>
  getPostIssues(...args).map(({ code, level }) => `${level}:${code}`);

describe("containsLink", () => {
  it.each([
    ["https://gi.org.pl", true],
    ["www.gi.org.pl", true],
    ["gi.org.pl bez protokołu", false],
    ["Zwykły tekst", false],
  ])("detects a link in %j", (text, expected) => {
    expect(containsLink(text)).toBe(expected);
  });
});

describe("getPostIssues", () => {
  describe("when the caption is blank", () => {
    it("reports it as missing", () => {
      expect(codes("facebook", { formatId: "square", text: "  " })).toEqual([
        "error:empty",
      ]);
    });
  });

  describe("when the caption exceeds the network's limit", () => {
    it("reports the length against that network's limit only", () => {
      const content = { formatId: "square", text: "a".repeat(281) };
      expect(getPostIssues("twitter", content)[0].message).toBe(
        "Treść jest za długa: 281 z 280 znaków.",
      );
      expect(codes("linkedin", content)).toEqual([]);
    });
  });

  describe("when Instagram gets a format it cannot post", () => {
    it("reports the format", () => {
      expect(codes("instagram", { formatId: "story", text: "Hej" })).toEqual([
        "error:format",
      ]);
    });
  });

  describe("when a caption with a link goes to Instagram", () => {
    it("warns without blocking, and only there", () => {
      const content = { formatId: "square", text: "Więcej: https://gi.org.pl" };
      expect(codes("instagram", content)).toEqual(["warning:links"]);
      expect(codes("threads", content)).toEqual([]);
    });
  });
});
