import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  createBufferPost,
  uploadBufferMedia,
} from "../../../../../services/buffer/client/buffer.api";
import type { BufferSession } from "../../../../../services/buffer/schemas/buffer.schemas";
import { BufferApiError } from "../../../../../services/buffer/utils/BufferApiError";
import type { Preview } from "../../ExportLab.types";
import PostComposer from "./PostComposer";

vi.mock("../../../../../services/buffer/client/buffer.api", () => ({
  uploadBufferMedia: vi.fn(),
  createBufferPost: vi.fn(),
}));

const MEDIA_ID = "d1b1e6c0-0000-4000-8000-000000000000";

const SESSION = {
  email: "marketing@gi.org.pl",
  channels: [
    { id: "ig", name: "GI Instagram", service: "instagram" as const },
    { id: "x", name: "GI X", service: "twitter" as const },
  ],
};

const image = (formatId: string): Preview => ({
  formatId,
  hasOverflow: false,
  url: `blob:${formatId}`,
  file: new File(["png"], `${formatId}.png`, { type: "image/png" }),
});
const IMAGES = ["square", "portrait", "story", "landscape"].map(image);

const renderComposer = (
  session: BufferSession = SESSION,
  graphicStatus = "ready" as const,
) =>
  render(
    <PostComposer
      session={session}
      graphics={[IMAGES]}
      graphicStatus={graphicStatus}
    />,
  );

const publishButton = () =>
  screen.getByRole("button", {
    name: /Dodaj do kolejki|Opublikuj teraz|Zaplanuj|Ponów/,
  });
const status = () => screen.getByRole("status");
const select = (name: RegExp) =>
  fireEvent.click(screen.getByRole("checkbox", { name }));
const write = (text: string) =>
  fireEvent.change(screen.getByLabelText("Treść"), { target: { value: text } });

describe("<PostComposer />", () => {
  beforeEach(() => {
    vi.mocked(uploadBufferMedia).mockResolvedValue(MEDIA_ID);
    vi.mocked(createBufferPost).mockResolvedValue("post-1");
  });

  describe("when opened with several channels", () => {
    it("selects none, defaults to the 4:5 format and asks for a channel", () => {
      renderComposer();
      expect(
        screen.getByRole("radio", { name: "Post pionowy (4:5)" }),
      ).toBeChecked();
      expect(
        screen.getByRole("checkbox", { name: /GI Instagram/ }),
      ).not.toBeChecked();
      expect(status()).toHaveTextContent("Wybierz co najmniej jeden kanał.");
      expect(publishButton()).toBeDisabled();
    });

    it("selects and clears every channel at once", () => {
      renderComposer();
      fireEvent.click(
        screen.getByRole("button", { name: "Zaznacz wszystkie" }),
      );
      expect(screen.getByRole("checkbox", { name: /GI X/ })).toBeChecked();
      fireEvent.click(screen.getByRole("button", { name: "Odznacz" }));
      expect(screen.getByRole("checkbox", { name: /GI X/ })).not.toBeChecked();
    });
  });

  describe("when the account has a single channel", () => {
    it("selects it right away", () => {
      renderComposer({ ...SESSION, channels: [SESSION.channels[0]] });
      expect(
        screen.getByRole("checkbox", { name: /GI Instagram/ }),
      ).toBeChecked();
      expect(
        screen.queryByRole("button", { name: "Zaznacz wszystkie" }),
      ).toBeNull();
    });
  });

  describe("when a channel is selected but the caption is empty", () => {
    it("asks for the caption", () => {
      renderComposer();
      select(/GI X/);
      expect(status()).toHaveTextContent("Dodaj treść posta.");
    });
  });

  describe("when the graphic is not ready", () => {
    it.each([
      ["rendering", "Poczekaj, aż grafika się przygotuje."],
      ["error", "Popraw grafikę powyżej, aby ją opublikować."],
    ] as const)("blocks publishing while %s", (graphicStatus, message) => {
      render(
        <PostComposer
          session={SESSION}
          graphics={[IMAGES]}
          graphicStatus={graphicStatus}
        />,
      );
      select(/GI X/);
      expect(status()).toHaveTextContent(message);
    });
  });

  describe("when the caption is too long for one network", () => {
    it("counts per network and blocks only with a clear reason", () => {
      renderComposer();
      select(/GI Instagram/);
      select(/GI X/);
      write("a".repeat(300));

      const counters = screen.getByRole("list", { name: "Limity znaków" });
      expect(within(counters).getByTitle("X: limit 280 znaków")).toHaveClass(
        "text-app-error",
      );
      expect(
        within(counters).getByTitle("Instagram: limit 2200 znaków"),
      ).not.toHaveClass("text-app-error");
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Treść jest za długa: 300 z 280 znaków.",
      );
      expect(status()).toHaveTextContent("Popraw posty oznaczone na czerwono.");
      expect(publishButton()).toBeDisabled();
    });
  });

  describe("when an Instagram caption contains a link", () => {
    it("reminds that links are not clickable there", () => {
      renderComposer();
      select(/GI Instagram/);
      write("Zapisy na https://gi.org.pl");
      expect(
        screen.getByText(/linki w opisie nie są klikalne/),
      ).toBeInTheDocument();
      expect(publishButton()).toBeEnabled();
    });
  });

  describe("when Instagram gets the 9:16 format", () => {
    it("blocks it with the reason on its row", () => {
      renderComposer();
      select(/GI Instagram/);
      write("Hej");
      fireEvent.click(
        screen.getByRole("radio", { name: "Story / Reels (9:16)" }),
      );
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Instagram nie opublikuje formatu 9:16 jako posta.",
      );
    });
  });

  describe("when one channel gets its own content", () => {
    it("edits it separately and can go back to the shared post", () => {
      renderComposer();
      select(/GI X/);
      write("Wspólny");
      fireEvent.click(screen.getByRole("button", { name: "Dostosuj: GI X" }));

      const own = screen.getByLabelText("Treść dla: GI X");
      expect(own).toHaveValue("Wspólny");
      fireEvent.change(own, { target: { value: "Tylko dla X" } });
      fireEvent.click(
        within(
          screen.getByRole("radiogroup", { name: "Grafika dla: GI X" }),
        ).getByRole("radio", { name: "Post kwadratowy (1:1)" }),
      );
      expect(screen.getByText(/1:1 · własna treść/)).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Przywróć wspólną treść: GI X" }),
      );
      expect(screen.queryByLabelText("Treść dla: GI X")).toBeNull();
      expect(screen.getByText(/4:5 · wspólna treść/)).toBeInTheDocument();
    });
  });

  describe("when scheduling", () => {
    it("requires a valid date before publishing", () => {
      renderComposer();
      select(/GI X/);
      write("Hej");
      fireEvent.click(screen.getByRole("radio", { name: "Zaplanuj" }));
      expect(status()).toHaveTextContent("Wybierz dzień i godzinę publikacji.");

      fireEvent.change(screen.getByLabelText("Dzień i godzina"), {
        target: { value: "2000-01-01T10:00" },
      });
      expect(
        screen.getByLabelText("Dzień i godzina"),
      ).toHaveAccessibleDescription(
        "Termin musi być co najmniej minutę od teraz.",
      );
    });
  });

  describe("when everything is valid and the user publishes", () => {
    it("uploads the image once, posts to every channel and confirms", async () => {
      renderComposer();
      select(/GI Instagram/);
      select(/GI X/);
      write("  Nowa grafika  ");
      fireEvent.click(screen.getByRole("radio", { name: "Teraz" }));
      expect(status()).toHaveTextContent("Gotowe: 2 kanały · Teraz");

      fireEvent.click(screen.getByRole("button", { name: "Opublikuj teraz" }));

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("Opublikowano"),
      );
      expect(uploadBufferMedia).toHaveBeenCalledTimes(1);
      expect(createBufferPost).toHaveBeenCalledWith(
        expect.objectContaining({
          channelId: "x",
          mediaId: MEDIA_ID,
          text: "Nowa grafika",
          mode: "shareNow",
        }),
      );

      fireEvent.click(screen.getByRole("button", { name: "Nowa publikacja" }));
      expect(screen.getByLabelText("Treść")).toHaveValue("");
      expect(screen.getByRole("checkbox", { name: /GI X/ })).toBeChecked();
    });

    it("sends a scheduled time as ISO and names it in the confirmation", async () => {
      renderComposer();
      select(/GI X/);
      write("Hej");
      fireEvent.click(screen.getByRole("radio", { name: "Zaplanuj" }));
      const dueAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const local = new Date(
        dueAt.getTime() - dueAt.getTimezoneOffset() * 60_000,
      )
        .toISOString()
        .slice(0, 16);
      fireEvent.change(screen.getByLabelText("Dzień i godzina"), {
        target: { value: local },
      });

      fireEvent.click(screen.getByRole("button", { name: "Zaplanuj" }));

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("Zaplanowano na"),
      );
      expect(createBufferPost).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "customScheduled",
          dueAt: new Date(local).toISOString(),
        }),
      );
    });
  });

  describe("when one channel fails", () => {
    it("shows the error on that row and retries only the failed one", async () => {
      vi.mocked(createBufferPost)
        .mockResolvedValueOnce("post-ig")
        .mockRejectedValueOnce(new BufferApiError("Kanał niedozwolony.", 403))
        .mockResolvedValueOnce("post-x");
      renderComposer();
      select(/GI Instagram/);
      select(/GI X/);
      write("Hej");
      fireEvent.click(publishButton());

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Kanał niedozwolony.",
        ),
      );
      expect(screen.getByText("Wysłano")).toBeInTheDocument();
      expect(status()).toHaveTextContent("Gotowe: 1 kanał · Do kolejki");

      fireEvent.click(screen.getByRole("button", { name: "Ponów nieudane" }));
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "Dodano do kolejki",
        ),
      );
      const [, failed, retried] = vi.mocked(createBufferPost).mock.calls;
      expect(retried[0].requestId).toBe(failed[0].requestId);
    });
  });

  describe("when the post has several graphics", () => {
    const copy = (number: number): Preview[] =>
      IMAGES.map((preview) => ({
        ...preview,
        url: `${preview.url}-${number}`,
        file: new File(["png"], `${number}-${preview.formatId}.png`, {
          type: "image/png",
        }),
      }));
    const SECOND = copy(2);
    const THIRD = copy(3);
    const SEVERAL = {
      ...SESSION,
      channels: [
        SESSION.channels[0],
        { id: "li", name: "GI LinkedIn", service: "linkedin" as const },
        SESSION.channels[1],
      ],
    };
    const renderSeveral = (graphics = [IMAGES, SECOND, THIRD]) =>
      render(
        <PostComposer
          session={SEVERAL}
          graphics={graphics}
          graphicStatus="ready"
        />,
      );
    const scope = (channel: string, name: RegExp | string) =>
      within(
        screen.getByRole("radiogroup", { name: `Grafiki dla: ${channel}` }),
      ).getByRole("radio", { name });
    const sentTo = (channelId: string) =>
      vi
        .mocked(createBufferPost)
        .mock.calls.map(([input]) => input)
        .find((input) => input.channelId === channelId);
    const publish = async () => {
      fireEvent.click(screen.getByRole("button", { name: "Dodaj do kolejki" }));
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("Dodano"),
      );
    };

    beforeEach(() => {
      // The media ID of an upload is the name of its file, so the order can be read back.
      vi.mocked(uploadBufferMedia).mockImplementation(
        async (png) => (png as File).name,
      );
    });

    it("offers no choice of graphics while the post has one", () => {
      renderSeveral([IMAGES]);
      select(/GI Instagram/);
      expect(
        screen.queryByRole("radiogroup", { name: /^Grafiki dla/ }),
      ).toBeNull();
      expect(screen.getByText(/4:5 · wspólna treść/)).toBeInTheDocument();
    });

    it("gives Instagram all of them and LinkedIn the first by default, and says why", () => {
      renderSeveral();
      select(/GI Instagram/);
      select(/GI LinkedIn/);

      expect(scope("GI Instagram", "Wszystkie grafiki (3)")).toBeChecked();
      expect(scope("GI LinkedIn", "Tylko pierwsza")).toBeChecked();
      expect(screen.getByText(/grafik: 3 · wspólna treść/)).toBeInTheDocument();
      expect(screen.getByText(/1 grafika · wspólna treść/)).toBeInTheDocument();
      expect(
        screen.getByText(/Instagram pokaże grafiki jako karuzelę/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/LinkedIn układa kilka grafik w kolaż/),
      ).toBeInTheDocument();
    });

    it("sends every graphic to Instagram in the order shown and the first one to LinkedIn", async () => {
      renderSeveral();
      select(/GI Instagram/);
      select(/GI LinkedIn/);
      write("Seria");
      await publish();

      expect(sentTo("ig")?.mediaIds).toEqual([
        "portrait.png",
        "2-portrait.png",
        "3-portrait.png",
      ]);
      expect(sentTo("ig")).not.toHaveProperty("mediaId");
      expect(sentTo("li")?.mediaId).toBe("portrait.png");
      expect(sentTo("li")).not.toHaveProperty("mediaIds");
      // Three graphics in one format: each is uploaded once for both channels.
      expect(uploadBufferMedia).toHaveBeenCalledTimes(3);
    });

    it("sends every graphic to LinkedIn once it is switched, in the format of that channel", async () => {
      renderSeveral();
      select(/GI LinkedIn/);
      write("Seria");
      fireEvent.click(scope("GI LinkedIn", "Wszystkie grafiki (3)"));
      fireEvent.click(
        screen.getByRole("radio", { name: "Post kwadratowy (1:1)" }),
      );
      await publish();

      expect(sentTo("li")?.mediaIds).toEqual([
        "square.png",
        "2-square.png",
        "3-square.png",
      ]);
    });

    it("offers no choice on a network that takes one image, and gives it the first", async () => {
      renderSeveral();
      select(/GI X/);
      write("Seria");

      expect(
        screen.queryByRole("radiogroup", { name: "Grafiki dla: GI X" }),
      ).toBeNull();
      expect(
        screen.getByText(
          "Ten kanał przyjmuje jedną grafikę w poście, więc dostaje pierwszą.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText(/1 grafika · wspólna treść/)).toBeInTheDocument();
      await publish();
      expect(sentTo("x")?.mediaId).toBe("portrait.png");
    });

    it("blocks only the channel that would get more graphics than its network takes", () => {
      renderSeveral(Array.from({ length: 11 }, (_, index) => copy(index + 1)));
      select(/GI Instagram/);
      select(/GI LinkedIn/);
      write("Seria");

      expect(screen.getByRole("alert")).toHaveTextContent(
        "Instagram przyjmuje najwyżej 10 grafik w poście, a ten ma 11. Usuń część grafik albo wyślij tylko pierwszą.",
      );
      expect(status()).toHaveTextContent("Popraw posty oznaczone na czerwono.");
      expect(publishButton()).toBeDisabled();

      // LinkedIn was never the problem: without Instagram the post can go.
      select(/GI Instagram/);
      expect(screen.queryByRole("alert")).toBeNull();
      expect(publishButton()).toBeEnabled();
    });

    it("lets the blocked channel go once it gets the first graphic only", () => {
      renderSeveral(Array.from({ length: 11 }, (_, index) => copy(index + 1)));
      select(/GI Instagram/);
      write("Seria");
      expect(publishButton()).toBeDisabled();

      fireEvent.click(scope("GI Instagram", "Tylko pierwsza"));
      expect(screen.queryByRole("alert")).toBeNull();
      expect(publishButton()).toBeEnabled();
    });
    it("forgets the choices when a new post is started", async () => {
      renderSeveral();
      select(/GI LinkedIn/);
      write("Seria");
      fireEvent.click(scope("GI LinkedIn", "Wszystkie grafiki (3)"));
      await publish();

      fireEvent.click(screen.getByRole("button", { name: "Nowa publikacja" }));
      expect(scope("GI LinkedIn", "Tylko pierwsza")).toBeChecked();
    });
  });

  describe("when a channel can publish a story", () => {
    const kind = (channel: string, name: string) =>
      within(
        screen.getByRole("group", { name: `Publikuj jako: ${channel}` }),
      ).getByRole("checkbox", { name });
    const sent = () =>
      vi.mocked(createBufferPost).mock.calls.map(([input]) => input);
    const queue = async () => {
      fireEvent.click(screen.getByRole("button", { name: "Dodaj do kolejki" }));
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("Dodano"),
      );
    };

    beforeEach(() => {
      // The media ID of an upload is the name of its file, so the format can be read back.
      vi.mocked(uploadBufferMedia).mockImplementation(
        async (png) => (png as File).name,
      );
    });

    it("offers a post and a story on Instagram, a post only elsewhere", () => {
      renderComposer();
      select(/GI Instagram/);
      select(/GI X/);

      expect(kind("GI Instagram", "Post")).toBeChecked();
      expect(kind("GI Instagram", "Relacja")).not.toBeChecked();
      expect(
        screen.queryByRole("group", { name: "Publikuj jako: GI X" }),
      ).toBeNull();
    });

    it("offers the story to an Instagram channel but not to a Facebook one", () => {
      renderComposer({
        ...SESSION,
        channels: [
          { id: "ig", name: "GI Instagram", service: "instagram" as const },
          { id: "fb", name: "GI Facebook", service: "facebook" as const },
        ],
      });
      select(/GI Instagram/);
      select(/GI Facebook/);

      expect(kind("GI Instagram", "Relacja")).toBeEnabled();
      expect(
        screen.queryByRole("group", { name: "Publikuj jako: GI Facebook" }),
      ).toBeNull();
    });

    it("never leaves a channel with nothing to publish: its only kind turns into the other", () => {
      renderComposer();
      select(/GI Instagram/);
      const chosen = () =>
        ["Post", "Relacja"].filter(
          (name) => (kind("GI Instagram", name) as HTMLInputElement).checked,
        );
      expect(chosen()).toEqual(["Post"]);

      fireEvent.click(kind("GI Instagram", "Post"));
      expect(chosen()).toEqual(["Relacja"]);
      fireEvent.click(kind("GI Instagram", "Relacja"));
      expect(chosen()).toEqual(["Post"]);

      fireEvent.click(kind("GI Instagram", "Relacja"));
      expect(chosen()).toEqual(["Post", "Relacja"]);
      fireEvent.click(kind("GI Instagram", "Post"));
      expect(chosen()).toEqual(["Relacja"]);
      expect(kind("GI Instagram", "Relacja")).toBeEnabled();
    });

    it("publishes a story alone without asking for a caption", async () => {
      renderComposer();
      select(/GI Instagram/);
      fireEvent.click(kind("GI Instagram", "Relacja"));
      fireEvent.click(kind("GI Instagram", "Post"));

      expect(
        screen.getByText(/9:16 · relacja bez podpisu/),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Dostosuj: GI Instagram" }),
      ).toBeNull();
      expect(screen.queryByTitle("Instagram: limit 2200 znaków")).toBeNull();
      expect(publishButton()).toBeEnabled();
      await queue();

      expect(sent()).toHaveLength(1);
      expect(sent()[0]).toMatchObject({
        channelId: "ig",
        type: "story",
        mediaId: "story.png",
      });
      expect(sent()[0]).not.toHaveProperty("text");
    });

    it("publishes a post and a story of the same material as two posts of one channel", async () => {
      renderComposer();
      select(/GI Instagram/);
      write("Nowość");
      fireEvent.click(kind("GI Instagram", "Relacja"));
      expect(
        screen.getByText(
          "Relacja to pierwsza grafika w formacie 9:16, bez podpisu.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/wspólna treść · oraz relacja/),
      ).toBeInTheDocument();
      await queue();

      expect(sent()).toHaveLength(2);
      const [feed, story] = sent();
      expect(feed).toMatchObject({
        channelId: "ig",
        mediaId: "portrait.png",
        text: "Nowość",
      });
      expect(feed).not.toHaveProperty("type");
      expect(story).toMatchObject({
        channelId: "ig",
        type: "story",
        mediaId: "story.png",
      });
      expect(story).not.toHaveProperty("text");
      expect(story.requestId).not.toBe(feed.requestId);
      // The confirmation lists the story as an entry of its own.
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.getByText("· relacja")).toBeInTheDocument();
    });

    it("still asks for a caption when the channel publishes a post next to the story", () => {
      renderComposer();
      select(/GI Instagram/);
      fireEvent.click(kind("GI Instagram", "Relacja"));
      expect(status()).toHaveTextContent("Dodaj treść posta.");
      expect(publishButton()).toBeDisabled();
    });

    it("shows each result on the row and retries only what failed", async () => {
      vi.mocked(createBufferPost)
        .mockResolvedValueOnce("post-1")
        .mockRejectedValueOnce(new Error("Buffer odmówił relacji."))
        .mockResolvedValueOnce("post-2");
      renderComposer();
      select(/GI Instagram/);
      write("Nowość");
      fireEvent.click(kind("GI Instagram", "Relacja"));
      fireEvent.click(screen.getByRole("button", { name: "Dodaj do kolejki" }));

      await waitFor(() =>
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Relacja: Buffer odmówił relacji.",
        ),
      );
      expect(screen.getByText("Post: Wysłano")).toBeInTheDocument();
      expect(screen.getByText("Relacja: Błąd")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Ponów nieudane" }));
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("Dodano"),
      );
      expect(sent()).toHaveLength(3);
      expect(sent()[2]).toMatchObject({ type: "story" });
      expect(sent()[2].requestId).toBe(sent()[1].requestId);
    });

    it("points at the story when the 9:16 format is chosen for a post", () => {
      renderComposer();
      select(/GI Instagram/);
      write("Hej");
      fireEvent.click(
        screen.getByRole("radio", { name: "Story / Reels (9:16)" }),
      );
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Instagram nie opublikuje formatu 9:16 jako posta. Wybierz inny format albo opublikuj go jako relację.",
      );
    });

    it("forgets the choice when a new post is started", async () => {
      renderComposer({ ...SESSION, channels: [SESSION.channels[0]] });
      fireEvent.click(kind("GI Instagram", "Relacja"));
      fireEvent.click(kind("GI Instagram", "Post"));
      await queue();

      fireEvent.click(screen.getByRole("button", { name: "Nowa publikacja" }));
      expect(kind("GI Instagram", "Post")).toBeChecked();
      expect(kind("GI Instagram", "Relacja")).not.toBeChecked();
    });
  });
});
