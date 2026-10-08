import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

const run = promisify(execFile);

interface Result {
  ok: boolean;
  files: {
    format: string;
    path: string;
    width: number;
    height: number;
    hasOverflow: boolean;
  }[];
  errors: {
    format?: string;
    code: string;
    message: string;
    fields: string[];
  }[];
}

/** Runs `yarn render` as a caller would; a failed job exits non-zero but still prints JSON. */
async function render(job: unknown, jobPath: string, ...options: string[]) {
  await writeFile(jobPath, JSON.stringify(job));
  const finished = await run(
    process.execPath,
    ["scripts/renderGraphics.mjs", jobPath, ...options],
    { timeout: 120_000 },
  ).then(
    ({ stdout }) => ({ stdout, code: 0 }),
    (error: { stdout: string; code: number }) => error,
  );
  return {
    code: finished.code,
    result: JSON.parse(finished.stdout) as Result,
  };
}

test.describe("Feature: Marketing graphics from the command line", () => {
  // The script drives its own Chromium, so one project is enough.
  test.skip(({ browserName }) => browserName !== "chromium");
  test.setTimeout(150_000);

  test("Scenario: exporting two formats of a template from the served app", async ({
    baseURL,
  }, info) => {
    const { code, result } = await render(
      {
        template: "standard",
        values: { title: "Zażółć *gęślą* jaźń", titleSize: 48 },
        formats: ["square", "landscape"],
      },
      info.outputPath("job.json"),
      "--out",
      info.outputPath("renders"),
      "--url",
      baseURL!,
    );

    expect(code).toBe(0);
    expect(result).toMatchObject({ ok: true, errors: [] });
    expect(
      result.files.map(({ format, width, height, hasOverflow }) => ({
        format,
        width,
        height,
        hasOverflow,
      })),
    ).toEqual([
      { format: "square", width: 1080, height: 1080, hasOverflow: false },
      { format: "landscape", width: 1200, height: 628, hasOverflow: false },
    ]);
    for (const file of result.files) {
      expect(file.path).toBe(
        info.outputPath("renders", `gi-standard-${file.format}.png`),
      );
      const bytes = await readFile(file.path);
      expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(bytes.readUInt32BE(16)).toBe(file.width);
      expect(bytes.readUInt32BE(20)).toBe(file.height);
    }
  });

  test("Scenario: the script serves the local build when no URL is given", async ({}, info) => {
    const { code, result } = await render(
      { template: "news", formats: ["portrait"] },
      info.outputPath("job.json"),
      "--out",
      info.outputPath("renders"),
    );

    expect(code).toBe(0);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatchObject({
      format: "portrait",
      width: 1080,
      height: 1350,
    });
  });

  test("Scenario: overflow and wrong values come back for another attempt", async ({
    baseURL,
  }, info) => {
    const { code, result } = await render(
      {
        template: "standard",
        values: {
          subtitle: "Wspólnie tworzymy zmiany dla młodych ludzi. ".repeat(8),
        },
        formats: ["landscape", "banner"],
      },
      info.outputPath("job.json"),
      "--out",
      info.outputPath("renders"),
      "--url",
      baseURL!,
    );

    expect(code).toBe(1);
    expect(result.ok).toBe(false);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]).toMatchObject({
      format: "landscape",
      hasOverflow: true,
    });
    expect(result.errors).toEqual([
      {
        format: "banner",
        code: "unknown-format",
        message:
          'Nieznany format "banner". Dostępne: square, portrait, story, landscape.',
        fields: [],
      },
    ]);
  });

  test("Scenario: a setup failure still comes back as JSON", async ({
    baseURL,
  }, info) => {
    const { code, result } = await render(
      { template: "standard", formats: ["square"] },
      info.outputPath("job.json"),
      "--out",
      // A file where the directory should be.
      info.outputPath("job.json"),
      "--url",
      baseURL!,
    );

    expect(code).toBe(1);
    expect(result).toMatchObject({
      ok: false,
      files: [],
      errors: [{ code: "output-failed", fields: [] }],
    });
  });
});
