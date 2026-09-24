import { contentOverflows } from "./contentOverflows";

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

describe("contentOverflows", () => {
  describe("when every marked box fits", () => {
    it("returns false", () => {
      const root = createRoot({}, { title: {}, detail: {} });
      expect(contentOverflows(root)).toBe(false);
    });
  });

  describe("when a word is wider than its field", () => {
    it("flags the overflow", () => {
      const root = createRoot({}, { title: {}, detail: { scrollWidth: 140 } });
      expect(contentOverflows(root)).toBe(true);
    });
  });

  describe("when the box overflows vertically", () => {
    it("flags the overflow", () => {
      const root = createRoot({ scrollHeight: 80 }, { title: {}, detail: {} });
      expect(contentOverflows(root)).toBe(true);
    });
  });

  describe("when the box overflows horizontally without a field to blame", () => {
    it("still flags the format", () => {
      const root = createRoot({ scrollWidth: 120 }, {});
      expect(contentOverflows(root)).toBe(true);
    });
  });
});
