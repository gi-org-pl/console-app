import { render, waitFor } from "@testing-library/react";
import type { GraphicPreviewsEntry, PostGraphic } from "../ExportLab.types";
import { getDefaultFieldValues } from "../utils/getDefaultFieldValues";
import { loadGraphicFonts } from "../utils/loadGraphicFonts";
import { rasterizeGraphic } from "../utils/rasterizeGraphic";
import GraphicPreviews from "./GraphicPreviews";

vi.mock("../utils/loadGraphicFonts", () => ({ loadGraphicFonts: vi.fn() }));
vi.mock("../utils/rasterizeGraphic", () => ({ rasterizeGraphic: vi.fn() }));
// Every real template takes a photo, so one that does not is made up here.
vi.mock("../utils/getTemplate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../utils/getTemplate")>();
  // One object, as for a real template: the previews are tied to its identity.
  const withoutPhoto = {
    ...actual.getTemplate("standard"),
    id: "no-photo",
    supportsPhoto: false,
  };
  return {
    getTemplate: (id: string) =>
      id === "no-photo" ? withoutPhoto : actual.getTemplate(id),
  };
});

const graphic = (id: string, templateId = "standard"): PostGraphic => ({
  id,
  templateId,
  values: getDefaultFieldValues(),
});
const PHOTO = { url: "blob:photo", focalX: 50, focalY: 50 };
const queue = () => ({ current: Promise.resolve() });
/** The latest state reported for a graphic; `null` once it has left the post. */
const lastState = (onChange: ReturnType<typeof vi.fn>, id: string) => {
  const entry = onChange.mock.calls
    .filter(([graphicId]) => graphicId === id)
    .at(-1)?.[1] as GraphicPreviewsEntry | null | undefined;
  return entry === null ? null : entry?.state;
};

describe("<GraphicPreviews />", () => {
  beforeEach(() => {
    vi.mocked(loadGraphicFonts).mockResolvedValue();
    vi.mocked(rasterizeGraphic).mockResolvedValue({
      blob: new Blob(["png"]),
      hasOverflow: false,
    });
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  describe("when a graphic is in the post", () => {
    it("draws nothing itself and reports its previews as they get ready", async () => {
      const onChange = vi.fn();
      const { container } = render(
        <GraphicPreviews
          graphic={graphic("a")}
          photo={null}
          queue={queue()}
          onChange={onChange}
        />,
      );

      expect(container).toBeEmptyDOMElement();
      expect(lastState(onChange, "a")?.status).toBe("rendering");
      await waitFor(() =>
        expect(lastState(onChange, "a")?.status).toBe("ready"),
      );
      expect(lastState(onChange, "a")?.previews).toHaveLength(4);
    });
  });

  describe("when the graphic holds a photo", () => {
    it.each([
      ["with it when the template takes one", "news", PHOTO],
      ["without it when the template takes none", "no-photo", null],
    ])("is drawn %s", async (_name, templateId, expected) => {
      render(
        <GraphicPreviews
          graphic={graphic("a", templateId)}
          photo={PHOTO}
          queue={queue()}
          onChange={vi.fn()}
        />,
      );
      await waitFor(() => expect(rasterizeGraphic).toHaveBeenCalled());
      expect(vi.mocked(rasterizeGraphic).mock.calls[0][1].photo).toBe(expected);
    });
  });
  describe("when the post holds several graphics", () => {
    it("draws them one after another through the shared queue", async () => {
      let running = 0;
      let mostAtOnce = 0;
      vi.mocked(rasterizeGraphic).mockImplementation(async () => {
        mostAtOnce = Math.max(mostAtOnce, ++running);
        await new Promise((resolve) => setTimeout(resolve, 5));
        running--;
        return { blob: new Blob(["png"]), hasOverflow: false };
      });
      const shared = queue();
      const onChange = vi.fn();
      render(
        <>
          <GraphicPreviews
            graphic={graphic("a")}
            photo={null}
            queue={shared}
            onChange={onChange}
          />
          <GraphicPreviews
            graphic={graphic("b", "news")}
            photo={null}
            queue={shared}
            onChange={onChange}
          />
        </>,
      );

      await waitFor(() => {
        expect(lastState(onChange, "a")?.status).toBe("ready");
        expect(lastState(onChange, "b")?.status).toBe("ready");
      });
      expect(rasterizeGraphic).toHaveBeenCalledTimes(8);
      expect(mostAtOnce).toBe(1);
    });
  });

  describe("when the graphic leaves the post", () => {
    it("says so, so that its previews are forgotten", async () => {
      const onChange = vi.fn();
      const { unmount } = render(
        <GraphicPreviews
          graphic={graphic("a")}
          photo={null}
          queue={queue()}
          onChange={onChange}
        />,
      );
      await waitFor(() =>
        expect(lastState(onChange, "a")?.status).toBe("ready"),
      );

      unmount();
      expect(lastState(onChange, "a")).toBeNull();
    });
  });
});
