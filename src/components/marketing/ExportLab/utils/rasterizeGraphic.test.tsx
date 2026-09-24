import { domToBlob } from "modern-screenshot";
import { GRAPHIC_FORMATS } from "../ExportLab.constants";
import type { GraphicTemplate } from "../ExportLab.types";
import { contentOverflows } from "./contentOverflows";
import { rasterizeGraphic } from "./rasterizeGraphic";

vi.mock("modern-screenshot", () => ({ domToBlob: vi.fn() }));
vi.mock("./contentOverflows", () => ({ contentOverflows: vi.fn() }));

const format = GRAPHIC_FORMATS[3];
const png = new Blob(["png"]);
const content = { values: { title: "Tytuł" }, photo: null };

const createTemplate = (
  Component: GraphicTemplate["Component"],
): GraphicTemplate => ({
  id: "test",
  name: "Test",
  fields: [],
  supportsPhoto: true,
  Component,
});

describe("rasterizeGraphic", () => {
  beforeEach(() => {
    HTMLImageElement.prototype.decode = vi.fn().mockResolvedValue(undefined);
    vi.mocked(domToBlob).mockResolvedValue(png);
    vi.mocked(contentOverflows).mockReturnValue(false);
  });

  describe("when the template renders", () => {
    it("rasterizes it at the format size and cleans up the host", async () => {
      const template = createTemplate(({ values }) => (
        <div>
          <img src="blob:photo" alt="" />
          {values.title}
        </div>
      ));
      const result = await rasterizeGraphic(template, content, format);

      expect(result).toEqual({ blob: png, hasOverflow: false });
      // domToBlob is overloaded; the mock records the (node, options) call form.
      const [node, options] = vi.mocked(domToBlob).mock.calls[0] as unknown as [
        HTMLElement,
        Record<string, unknown>,
      ];
      expect(node).toHaveTextContent("Tytuł");
      expect(options).toMatchObject({ width: 1200, height: 628, scale: 1 });
      expect(HTMLImageElement.prototype.decode).toHaveBeenCalled();
      expect(contentOverflows).toHaveBeenCalledWith(node);
      expect(document.body).toBeEmptyDOMElement();
    });

    it("still creates the PNG when text overflows", async () => {
      vi.mocked(contentOverflows).mockReturnValue(true);
      const result = await rasterizeGraphic(
        createTemplate(() => <div data-fit />),
        content,
        format,
      );
      expect(result).toEqual({ blob: png, hasOverflow: true });
      expect(domToBlob).toHaveBeenCalled();
    });
  });

  describe("when a smaller image is requested", () => {
    it("passes the scale on while keeping the layout size", async () => {
      await rasterizeGraphic(
        createTemplate(() => <div />),
        content,
        format,
        0.25,
      );
      const [, options] = vi.mocked(domToBlob).mock.calls[0] as unknown as [
        HTMLElement,
        Record<string, unknown>,
      ];
      expect(options).toMatchObject({
        width: 1200,
        height: 628,
        scale: 0.25,
      });
    });
  });

  describe("when the template renders nothing", () => {
    it("rejects and still cleans up", async () => {
      await expect(
        rasterizeGraphic(
          createTemplate(() => null),
          content,
          format,
        ),
      ).rejects.toThrow("Szablon nie wyrenderował grafiki.");
      expect(document.body).toBeEmptyDOMElement();
    });
  });
});
