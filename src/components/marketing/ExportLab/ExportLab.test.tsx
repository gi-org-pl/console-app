import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ExportLab from "./ExportLab";
import { loadGraphicFonts } from "./utils/loadGraphicFonts";
import { rasterizeGraphic } from "./utils/rasterizeGraphic";

vi.mock("./utils/loadGraphicFonts", () => ({ loadGraphicFonts: vi.fn() }));
vi.mock("./utils/rasterizeGraphic", () => ({ rasterizeGraphic: vi.fn() }));
// A second template, so switching is covered while only "Standard" ships.
vi.mock("./ExportLab.constants", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("./ExportLab.constants")>();
  const [standard] = original.GRAPHIC_TEMPLATES;
  return {
    ...original,
    GRAPHIC_TEMPLATES: [
      standard,
      {
        ...standard,
        id: "plain",
        name: "Prosty",
        fields: standard.fields.filter((field) => field.id === "title"),
      },
    ],
  };
});

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
      fireEvent.click(screen.getByRole("radio", { name: "Prosty" }));
      expect(screen.getByRole("radio", { name: "Prosty" })).toBeChecked();
      expect(screen.queryByLabelText("Podtytuł")).toBeNull();
      expect(screen.getByLabelText("Tytuł")).toHaveValue("Mój tytuł");
      await waitFor(() =>
        expect(rasterizeGraphic).toHaveBeenLastCalledWith(
          expect.objectContaining({ id: "plain" }),
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
});
