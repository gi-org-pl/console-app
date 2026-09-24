import { GRAPHIC_FORMATS } from "../ExportLab.constants";
import { assertContentFits } from "./assertContentFits";

const format = GRAPHIC_FORMATS[0];

interface Size {
  scrollWidth?: number;
  clientWidth?: number;
  scrollHeight?: number;
  clientHeight?: number;
}

const FITTING: Required<Size> = {
  scrollWidth: 100,
  clientWidth: 100,
  scrollHeight: 51,
  clientHeight: 50,
};

function sized<T extends HTMLElement>(element: T, size: Size) {
  for (const [key, value] of Object.entries({ ...FITTING, ...size }))
    Object.defineProperty(element, key, { value });
  return element;
}

function createRoot(box: Size, fields: Record<string, Size>) {
  const root = document.createElement("div");
  const fitBox = sized(document.createElement("div"), box);
  fitBox.dataset.fit = "";
  for (const [id, size] of Object.entries(fields)) {
    const field = sized(document.createElement("p"), size);
    field.dataset.field = id;
    fitBox.append(field);
  }
  root.append(fitBox);
  return root;
}

const catchError = (run: () => void) => {
  try {
    run();
  } catch (error) {
    return error;
  }
};

describe("assertContentFits", () => {
  describe("when every marked box fits", () => {
    it("does not throw", () => {
      const root = createRoot({}, { title: {}, detail: {} });
      expect(() => assertContentFits(root, format)).not.toThrow();
    });
  });

  describe("when a word is wider than its field", () => {
    it("blames only that field", () => {
      const root = createRoot({}, { title: {}, detail: { scrollWidth: 140 } });
      expect(catchError(() => assertContentFits(root, format))).toMatchObject({
        message: expect.stringContaining(
          "Zbyt długie słowo nie mieści się w formacie Post kwadratowy",
        ),
        fieldIds: ["detail"],
      });
    });
  });

  describe("when the box overflows vertically", () => {
    it("blames every field inside it", () => {
      const root = createRoot({ scrollHeight: 80 }, { title: {}, detail: {} });
      expect(catchError(() => assertContentFits(root, format))).toMatchObject({
        message: "Treść nie mieści się w formacie Post kwadratowy. Skróć ją.",
        fieldIds: ["title", "detail"],
      });
    });
  });

  describe("when the box overflows horizontally without a field to blame", () => {
    it("still blocks the export", () => {
      const root = createRoot({ scrollWidth: 120 }, {});
      expect(catchError(() => assertContentFits(root, format))).toMatchObject({
        fieldIds: [],
      });
    });
  });

  describe("when a field element has no id", () => {
    it("reports an empty id rather than crashing", () => {
      const root = createRoot({}, { title: { scrollWidth: 140 } });
      const field = root.querySelector<HTMLElement>("[data-field]");
      field?.setAttribute("data-field", "");
      expect(catchError(() => assertContentFits(root, format))).toMatchObject({
        fieldIds: [""],
      });
    });
  });
});
