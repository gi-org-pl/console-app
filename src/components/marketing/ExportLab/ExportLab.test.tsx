import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useBufferSessionStore } from "../../../services/buffer/utils/useBufferSession";
import ExportLab from "./ExportLab";
import { loadGraphicFonts } from "./utils/loadGraphicFonts";
import { rasterizeGraphic } from "./utils/rasterizeGraphic";

vi.mock("./utils/loadGraphicFonts", () => ({ loadGraphicFonts: vi.fn() }));
vi.mock("./utils/rasterizeGraphic", () => ({ rasterizeGraphic: vi.fn() }));

describe("<ExportLab />", () => {
  beforeEach(() => {
    vi.mocked(loadGraphicFonts).mockResolvedValue();
    vi.mocked(rasterizeGraphic).mockResolvedValue({
      blob: new Blob(["png"]),
      hasOverflow: false,
    });
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  describe("when opened", () => {
    it("renders the standard template previews from its sample text", async () => {
      const { container } = render(<ExportLab />);
      expect(screen.getByRole("radio", { name: "Standard" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "PROO" })).toBeChecked();
      await waitFor(() =>
        expect(screen.getAllByRole("link", { name: /^Pobierz/ })).toHaveLength(
          4,
        ),
      );
      for (const image of container.querySelectorAll("article img"))
        fireEvent.load(image);
      expect(
        screen.getByRole("img", {
          name: /^Post kwadratowy: Dobre idee zmieniają świat\. Łączymy .* nami! Finansowanie: PROO\.$/,
        }),
      ).toBeVisible();
    });
  });

  describe("when the user switches templates", () => {
    it("shows the new template's fields and keeps shared text", async () => {
      render(<ExportLab />);
      fireEvent.change(screen.getByLabelText("Tytuł"), {
        target: { value: "Mój tytuł" },
      });
      fireEvent.click(screen.getByRole("radio", { name: "News" }));
      expect(screen.getByRole("radio", { name: "News" })).toBeChecked();
      expect(screen.getByLabelText("Osoba (opcjonalnie)")).toBeInTheDocument();
      expect(screen.getByLabelText("Podtytuł")).toBeInTheDocument();
      expect(screen.getByLabelText("Tytuł")).toHaveValue("Mój tytuł");
      await waitFor(() =>
        expect(rasterizeGraphic).toHaveBeenCalledWith(
          expect.objectContaining({ id: "news" }),
          expect.anything(),
          expect.anything(),
        ),
      );
    });
  });

  describe("when the user restyles the text", () => {
    it("renders the previews again with the new layout", async () => {
      render(<ExportLab />);
      fireEvent.click(screen.getByRole("radio", { name: "Tekst u góry" }));
      fireEvent.click(screen.getByRole("radio", { name: "Wyśrodkuj" }));
      await waitFor(() =>
        expect(rasterizeGraphic).toHaveBeenLastCalledWith(
          expect.objectContaining({ id: "standard" }),
          expect.objectContaining({
            values: expect.objectContaining({
              position: "top",
              align: "center",
            }),
          }),
          expect.anything(),
        ),
      );
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  describe("when opened by someone who is not logged in", () => {
    it("shows the publishing section under the generator with a log in", () => {
      useBufferSessionStore.setState({ status: "disconnected", session: null });
      render(<ExportLab />);
      expect(
        screen.getByRole("heading", { level: 2, name: "Publikacja." }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Zaloguj się" }),
      ).toBeInTheDocument();
    });
  });

  describe("when the user builds a post of several graphics", () => {
    const graphic = (number: number) =>
      screen.getByRole("radio", { name: new RegExp(`^Grafika ${number}`) });
    const title = () => screen.getByLabelText("Tytuł");
    const add = () =>
      fireEvent.click(screen.getByRole("button", { name: "Dodaj grafikę" }));
    const setTitle = (value: string) =>
      fireEvent.change(title(), { target: { value } });
    const region = (name: string) => screen.getByRole("region", { name });
    /** Titles drawn last for each template, in the order of the calls. */
    const drawnTitles = () =>
      vi
        .mocked(rasterizeGraphic)
        .mock.calls.map(([, content]) => content.values.title);

    it("starts with one graphic and no word about its place", () => {
      render(<ExportLab />);
      expect(graphic(1)).toBeChecked();
      expect(screen.getAllByRole("radio", { name: /^Grafika/ })).toHaveLength(
        1,
      );
      expect(region("Podgląd formatów")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^Usuń grafikę/ }),
      ).toBeNull();
    });

    it("adds a copy of the graphic being edited and edits the copy on its own", async () => {
      render(<ExportLab />);
      setTitle("Pierwsza");
      fireEvent.click(screen.getByRole("radio", { name: "News" }));
      add();

      expect(graphic(2)).toBeChecked();
      expect(region("Podgląd formatów · grafika 2 z 2")).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "News" })).toBeChecked();
      expect(title()).toHaveValue("Pierwsza");

      setTitle("Druga");
      fireEvent.click(screen.getByRole("radio", { name: "Standard" }));
      fireEvent.click(graphic(1));
      expect(title()).toHaveValue("Pierwsza");
      expect(screen.getByRole("radio", { name: "News" })).toBeChecked();

      fireEvent.click(graphic(2));
      expect(title()).toHaveValue("Druga");
      expect(screen.getByRole("radio", { name: "Standard" })).toBeChecked();
      await waitFor(() => {
        expect(drawnTitles()).toContain("Pierwsza");
        expect(drawnTitles()).toContain("Druga");
      });
    });

    it("reorders the graphics and keeps editing the one that moved", () => {
      render(<ExportLab />);
      setTitle("Pierwsza");
      add();
      setTitle("Druga");

      fireEvent.click(
        screen.getByRole("button", { name: "Przesuń grafikę 2 wcześniej" }),
      );
      expect(graphic(1)).toBeChecked();
      expect(title()).toHaveValue("Druga");
      expect(region("Podgląd formatów · grafika 1 z 2")).toBeInTheDocument();

      fireEvent.click(graphic(2));
      expect(title()).toHaveValue("Pierwsza");
    });

    it("removes a graphic and goes back to a post of one", () => {
      render(<ExportLab />);
      setTitle("Pierwsza");
      add();
      setTitle("Druga");

      fireEvent.click(screen.getByRole("button", { name: "Usuń grafikę 2" }));
      expect(screen.getAllByRole("radio", { name: /^Grafika/ })).toHaveLength(
        1,
      );
      expect(title()).toHaveValue("Pierwsza");
      expect(region("Podgląd formatów")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^Usuń grafikę/ }),
      ).toBeNull();
    });

    it("marks the graphic whose text may be clipped", async () => {
      vi.mocked(rasterizeGraphic).mockImplementation(
        async (_template, content) => ({
          blob: new Blob(["png"]),
          hasOverflow: content.values.title === "Za długi",
        }),
      );
      render(<ExportLab />);
      add();
      setTitle("Za długi");

      await waitFor(() =>
        expect(
          screen.getByRole("radio", {
            name: "Grafika 2: możliwe ucięcie treści",
          }),
        ).toBeInTheDocument(),
      );
      expect(
        screen.getByRole("radio", { name: "Grafika 1" }),
      ).toBeInTheDocument();
    });

    it("gives the composer every graphic once all of them are drawn", async () => {
      useBufferSessionStore.setState({
        status: "connected",
        session: {
          email: "marketing@gi.org.pl",
          channels: [{ id: "ig", name: "GI Instagram", service: "instagram" }],
        },
      });
      render(<ExportLab />);
      add();
      add();

      await waitFor(() =>
        expect(
          screen.getByRole("radio", { name: "Wszystkie grafiki (3)" }),
        ).toBeChecked(),
      );
    });
  });

  describe("when a graphic is edited after it was drawn", () => {
    it("stops offering its old previews at once", async () => {
      useBufferSessionStore.setState({
        status: "connected",
        session: {
          email: "marketing@gi.org.pl",
          channels: [{ id: "ig", name: "GI Instagram", service: "instagram" }],
        },
      });
      render(<ExportLab />);
      await waitFor(() =>
        expect(screen.getAllByRole("link", { name: /^Pobierz/ })).toHaveLength(
          4,
        ),
      );

      fireEvent.change(screen.getByLabelText("Tytuł"), {
        target: { value: "Nowy tytuł" },
      });
      // No waiting here: the previews of the old title must not survive the edit.
      expect(screen.queryAllByRole("link", { name: /^Pobierz/ })).toHaveLength(
        0,
      );
      expect(screen.getByText("Przygotowywanie…")).toBeVisible();
      expect(
        screen.getByText("Poczekaj, aż grafika się przygotuje."),
      ).toBeInTheDocument();

      await waitFor(() =>
        expect(screen.getAllByRole("link", { name: /^Pobierz/ })).toHaveLength(
          4,
        ),
      );
    });
  });
});
