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

  describe("when a channel gets more graphics than its network takes", () => {
    const content = { formatId: "square", text: "Hej" };

    it.each([
      ["instagram", 10],
      ["facebook", 10],
      ["linkedin", 20],
      ["twitter", 1],
      ["threads", 1],
    ] as const)("lets %s have %i and reports one more", (service, limit) => {
      expect(codes(service, content, limit)).toEqual([]);
      expect(codes(service, content, limit + 1)).toEqual([
        "error:tooManyImages",
      ]);
    });

    it("names the limit and the number the post has", () => {
      expect(getPostIssues("linkedin", content, 21)[0].message).toBe(
        "LinkedIn przyjmuje najwyżej 20 grafik w poście, a ten ma 21. Usuń część grafik albo wyślij tylko pierwszą.",
      );
      expect(getPostIssues("bluesky", content, 2)[0].message).toBe(
        "Bluesky przyjmuje jedną grafikę w poście. Wyślij tylko pierwszą.",
      );
    });

    it("assumes one graphic when no number is given", () => {
      expect(codes("mastodon", content)).toEqual([]);
    });
  });

  describe("when a network with stories gets the story format as a post", () => {
    it("says that it can go out as a story", () => {
      expect(
        getPostIssues("instagram", { formatId: "story", text: "Hej" })[0]
          .message,
      ).toBe(
        "Instagram nie opublikuje formatu 9:16 jako posta. Wybierz inny format albo opublikuj go jako relację.",
      );
    });
  });
});
