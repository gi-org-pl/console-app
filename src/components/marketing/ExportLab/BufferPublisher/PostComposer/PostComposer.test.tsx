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

const renderComposer = (session = SESSION, graphicStatus = "ready" as const) =>
  render(
    <PostComposer
      session={session}
      images={IMAGES}
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
          images={IMAGES}
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
});
