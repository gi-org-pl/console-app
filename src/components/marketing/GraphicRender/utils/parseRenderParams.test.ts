import { getDefaultFieldValues } from "../../ExportLab/utils/getDefaultFieldValues";
import { parseRenderParams } from "./parseRenderParams";

const parse = (query: string) => parseRenderParams(new URLSearchParams(query));

describe("parseRenderParams", () => {
  describe("when only the template and the format are given", () => {
    it("uses the editor's default values and expects no photo", () => {
      const { request, error } = parse("template=standard&format=portrait");
      expect(error).toBeUndefined();
      expect(request?.template.id).toBe("standard");
      expect(request?.format).toMatchObject({
        id: "portrait",
        width: 1080,
        height: 1350,
      });
      expect(request?.values).toEqual(getDefaultFieldValues());
      expect(request?.photoFocus).toBeNull();
    });
  });

  describe("when field values are given", () => {
    it("overrides only those fields, keeping line breaks and markers", () => {
      const { request } = parse(
        `template=news&format=story&title=${encodeURIComponent("Nowy *projekt*\nrusza")}&newsTitleSize=64&funding=none&personName=`,
      );
      expect(request?.values).toEqual({
        ...getDefaultFieldValues(),
        title: "Nowy *projekt*\nrusza",
        newsTitleSize: "64",
        funding: "none",
        personName: "",
      });
    });
  });

  describe("when a photo is announced", () => {
    it("centres the focal point by default", () => {
      expect(
        parse("template=standard&format=square&photo=1").request?.photoFocus,
      ).toEqual({ focalX: 50, focalY: 50 });
    });

    it("takes the focal point from the URL", () => {
      expect(
        parse("template=standard&format=square&photo=1&focalX=5&focalY=87.5")
          .request?.photoFocus,
      ).toEqual({ focalX: 5, focalY: 87.5 });
    });

    it.each([
      ["photo=yes", 'Parametr "photo" przyjmuje tylko wartość 1.'],
      ["photo=1&focalX=101", 'Parametr "focalX" musi być liczbą od 0 do 100.'],
      ["photo=1&focalY=-1", 'Parametr "focalY" musi być liczbą od 0 do 100.'],
      ["photo=1&focalX=left", 'Parametr "focalX" musi być liczbą od 0 do 100.'],
      ["photo=1&focalY=", 'Parametr "focalY" musi być liczbą od 0 do 100.'],
      ["focalX=20", 'Parametr "focalX" wymaga photo=1.'],
      ["focalY=20", 'Parametr "focalY" wymaga photo=1.'],
    ])("rejects %s", (query, message) => {
      expect(parse(`template=standard&format=square&${query}`)).toEqual({
        error: { code: "invalid-photo", message, fieldIds: [] },
      });
    });
  });

  describe("when the template or the format is missing", () => {
    it.each([
      ["format=square", 'Podaj parametr "template".'],
      ["template=standard", 'Podaj parametr "format".'],
      ["template=&format=square", 'Podaj parametr "template".'],
    ])("asks for it in %s", (query, message) => {
      expect(parse(query)).toEqual({
        error: { code: "missing-parameter", message, fieldIds: [] },
      });
    });
  });

  describe("when the template is unknown", () => {
    it("lists the available templates", () => {
      expect(parse("template=poster&format=square")).toEqual({
        error: {
          code: "unknown-template",
          message: 'Nieznany szablon "poster". Dostępne: standard, news.',
          fieldIds: [],
        },
      });
    });
  });

  describe("when the format is unknown", () => {
    it("lists the available formats", () => {
      expect(parse("template=standard&format=banner")).toEqual({
        error: {
          code: "unknown-format",
          message:
            'Nieznany format "banner". Dostępne: square, portrait, story, landscape.',
          fieldIds: [],
        },
      });
    });
  });

  describe("when a parameter is not a field of the template", () => {
    it("lists the template's fields", () => {
      expect(parse("template=standard&format=square&personName=Ala")).toEqual({
        error: {
          code: "unknown-parameter",
          message:
            'Nieznany parametr "personName". Pola szablonu Standard: title, titleSize, subtitle, subtitleSize, position, align, funding.',
          fieldIds: [],
        },
      });
    });
  });

  describe("when a parameter is repeated", () => {
    it("refuses to guess which value was meant", () => {
      expect(parse("template=standard&format=square&title=A&title=B")).toEqual({
        error: {
          code: "duplicate-parameter",
          message: 'Parametr "title" podano więcej niż raz.',
          fieldIds: [],
        },
      });
    });
  });

  describe("when a value breaks the editor's rules", () => {
    it("blames the field with the editor's message", () => {
      expect(
        parse("template=standard&format=square&position=diagonal"),
      ).toEqual({
        error: {
          code: "invalid-content",
          message: "Wybierz: położenie tekstu.",
          fieldIds: ["position"],
        },
      });
    });
  });
});
