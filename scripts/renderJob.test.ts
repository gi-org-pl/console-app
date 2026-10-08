import { GRAPHIC_FORMATS } from "../src/components/marketing/ExportLab/ExportLab.constants";
import {
  buildRenderUrl,
  DEFAULT_FORMATS,
  getRenderRouteFiles,
  parseArguments,
  parseJob,
  readPngSize,
} from "./renderJob.mjs";

describe("DEFAULT_FORMATS", () => {
  describe("when the app's formats change", () => {
    it("still lists every format id", () => {
      expect(DEFAULT_FORMATS).toEqual(
        GRAPHIC_FORMATS.map((format) => format.id),
      );
    });
  });
});

describe("parseJob", () => {
  describe("when only the template is given", () => {
    it("renders every format with default values and no photo", () => {
      expect(parseJob('{"template":"standard"}')).toEqual({
        template: "standard",
        values: {},
        formats: ["square", "portrait", "story", "landscape"],
      });
    });
  });

  describe("when the job is complete", () => {
    it("turns numbers into the strings the route expects and drops repeated formats", () => {
      expect(
        parseJob(
          JSON.stringify({
            template: "standard",
            values: { title: "Nowy *projekt*", titleSize: 48 },
            formats: ["story", "square", "story"],
            photo: "photo.jpg",
            focalX: 20,
            focalY: 80.5,
          }),
        ),
      ).toEqual({
        template: "standard",
        values: { title: "Nowy *projekt*", titleSize: "48" },
        formats: ["story", "square"],
        photo: "photo.jpg",
        focalX: 20,
        focalY: 80.5,
      });
    });
  });

  describe("when the job is malformed", () => {
    it.each([
      ["{", /^The job is not valid JSON/],
      ["{}", /^template: /],
      ['{"template":"standard","format":"square"}', /Unrecognized key/],
      ['{"template":"standard","formats":[]}', /^formats: /],
      ['{"template":"standard","values":{"title":true}}', /^values\.title: /],
      [
        '{"template":"standard","values":{"format":"square"}}',
        /^values: "values" holds template fields only/,
      ],
      ['{"template":"standard","photo":"a.jpg","focalX":101}', /^focalX: /],
      [
        '{"template":"standard","focalY":10}',
        /^"focalX" and "focalY" need a "photo"\.$/,
      ],
    ])("rejects %s", (input, message) => {
      expect(() => parseJob(input)).toThrow(message);
    });
  });
});

describe("buildRenderUrl", () => {
  const job = parseJob(
    JSON.stringify({
      template: "news",
      values: { title: "Zażółć *gęślą*\njaźń", funding: "none" },
    }),
  );

  describe("when the app is served from a subpath", () => {
    it("keeps the base path and encodes the values", () => {
      const url = new URL(
        buildRenderUrl("https://gi-org-pl.github.io/console-app", job, "story"),
      );
      expect(url.origin + url.pathname).toBe(
        "https://gi-org-pl.github.io/console-app/marketing/render",
      );
      expect(Object.fromEntries(url.searchParams)).toEqual({
        template: "news",
        format: "story",
        title: "Zażółć *gęślą*\njaźń",
        funding: "none",
      });
    });
  });

  describe("when the job has a photo", () => {
    it("announces it with the focal point that was set", () => {
      const url = new URL(
        buildRenderUrl(
          "http://127.0.0.1:4174/",
          { ...job, photo: "photo.jpg", focalX: 0 },
          "square",
        ),
      );
      expect(url.pathname).toBe("/marketing/render");
      expect(url.searchParams.get("photo")).toBe("1");
      expect(url.searchParams.get("focalX")).toBe("0");
      expect(url.searchParams.has("focalY")).toBe(false);
    });

    it("passes both focal coordinates", () => {
      const url = new URL(
        buildRenderUrl(
          "http://127.0.0.1:4174/",
          { ...job, photo: "photo.jpg", focalX: 10, focalY: 90 },
          "square",
        ),
      );
      expect(url.searchParams.get("focalX")).toBe("10");
      expect(url.searchParams.get("focalY")).toBe("90");
    });
  });
});

describe("readPngSize", () => {
  describe("when the bytes are a PNG", () => {
    it("reads the size from the header", () => {
      const bytes = Buffer.alloc(24);
      Buffer.from("89504e470d0a1a0a", "hex").copy(bytes);
      bytes.writeUInt32BE(1200, 16);
      bytes.writeUInt32BE(628, 20);
      expect(readPngSize(bytes)).toEqual({ width: 1200, height: 628 });
    });
  });

  describe("when the bytes are something else", () => {
    it.each([
      ["too short", Buffer.from("89504e47", "hex")],
      ["not a PNG", Buffer.alloc(24)],
    ])("returns null for bytes that are %s", (_, bytes) => {
      expect(readPngSize(bytes)).toBeNull();
    });
  });
});

describe("parseArguments", () => {
  describe("when only the job is given", () => {
    it("writes to ./renders and serves the local build", () => {
      expect(parseArguments(["job.json"])).toEqual({
        job: "job.json",
        out: "renders",
        url: undefined,
      });
    });
  });

  describe("when options are given", () => {
    it("reads them in any order", () => {
      expect(
        parseArguments([
          "--url",
          "https://console.gi.org.pl/",
          "-",
          "--out",
          "x",
        ]),
      ).toEqual({ job: "-", out: "x", url: "https://console.gi.org.pl/" });
    });
  });

  describe("when the arguments are wrong", () => {
    it.each([
      [[], /^Usage: yarn render/],
      [["job.json", "--out"], /^--out needs a value\.$/],
      [["job.json", "--fast"], /^Unknown option --fast\.$/],
      [["a.json", "b.json"], /^Unexpected argument b\.json\.$/],
    ])("rejects %j", (argv, message) => {
      expect(() => parseArguments(argv)).toThrow(message);
    });
  });
});

describe("getRenderRouteFiles", () => {
  const normalize = (file: string) => file.replaceAll("\\", "/");

  describe("when the app is built for the root", () => {
    it.each([
      [undefined],
      ["/"],
    ])("looks in one place for base %s", (basePath) => {
      const files = getRenderRouteFiles("build/client", basePath);
      expect(normalize(files.served)).toBe(
        "build/client/marketing/render/index.html",
      );
      expect(files.prerendered).toBe(files.served);
    });
  });

  describe("when the app is built for a base path", () => {
    it("tells the served file from the one React Router prerendered", () => {
      const files = getRenderRouteFiles("build/client", "/console-app/");
      expect(normalize(files.served)).toBe(
        "build/client/marketing/render/index.html",
      );
      expect(normalize(files.prerendered)).toBe(
        "build/client/console-app/marketing/render/index.html",
      );
    });
  });
});
