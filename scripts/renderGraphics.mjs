import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { text } from "node:stream/consumers";
import {
  buildRenderUrl,
  parseArguments,
  parseJob,
  readPngSize,
} from "./renderJob.mjs";

// Exports graphics as PNG files through the app's /marketing/render route.
// Usage and the job format are documented in the README ("Rendering graphics from the command line").

const RENDER_TIMEOUT_MS = 30_000;
const BUILD_DIR = "build/client";
const PREVIEW_PORT = 4174;

/** Stdout carries only the JSON result, so callers can parse it as is. */
function finish(files, errors) {
  process.stdout.write(
    `${JSON.stringify({ ok: errors.length === 0, files, errors }, null, 2)}\n`,
    // Vite's plugins keep the event loop alive after the preview server closes.
    () => process.exit(errors.length === 0 ? 0 : 1),
  );
}

class SetupError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function readJob(source) {
  let input;
  try {
    input =
      source === "-"
        ? await text(process.stdin)
        : await readFile(source, "utf8");
  } catch (cause) {
    throw new SetupError(
      "invalid-job",
      `Cannot read the job: ${cause.message}`,
    );
  }
  try {
    return parseJob(input);
  } catch (cause) {
    throw new SetupError("invalid-job", cause.message);
  }
}

/** Serves the built app the way `yarn preview` does, on a free local port. */
async function servePreview() {
  try {
    await access(path.join(BUILD_DIR, "index.html"));
  } catch {
    throw new SetupError(
      "missing-build",
      `No build in ${BUILD_DIR}. Run "yarn build" first, or pass --url.`,
    );
  }
  const { preview } = await import("vite");
  const server = await preview({
    logLevel: "silent",
    build: { outDir: BUILD_DIR },
    preview: { host: "127.0.0.1", port: PREVIEW_PORT },
  });
  const url = server.resolvedUrls?.local[0];
  if (!url) {
    await server.close();
    throw new SetupError("preview-failed", "The preview server has no URL.");
  }
  return { url, close: () => server.close() };
}

async function launchBrowser() {
  try {
    const { chromium } = await import("playwright");
    return await chromium.launch();
  } catch (cause) {
    throw new SetupError(
      "browser-unavailable",
      `Cannot start Chromium: ${cause.message.split("\n")[0]} Run "yarn playwright install chromium".`,
    );
  }
}

/** Renders one format; returns either the written file or the route's error. */
async function renderFormat(page, baseUrl, job, format, photo, outDir) {
  const root = page.locator("main[data-render-status]");
  const waitFor = (statuses) =>
    page.waitForFunction(
      (expected) =>
        expected.includes(
          document.querySelector("main")?.dataset.renderStatus ?? "",
        ),
      statuses,
      { timeout: RENDER_TIMEOUT_MS },
    );

  await page.goto(buildRenderUrl(baseUrl, job, format), {
    timeout: RENDER_TIMEOUT_MS,
  });
  await waitFor(["ready", "error", "awaiting-photo"]);
  if ((await root.getAttribute("data-render-status")) === "awaiting-photo") {
    await page.locator('input[type="file"]').setInputFiles(photo);
    await waitFor(["ready", "error"]);
  }

  if ((await root.getAttribute("data-render-status")) === "error")
    return {
      error: {
        format,
        code: await root.getAttribute("data-render-error"),
        message: await page.getByRole("alert").innerText(),
        fields: ((await root.getAttribute("data-render-error-fields")) ?? "")
          .split(" ")
          .filter(Boolean),
      },
    };

  const expected = {
    width: Number(await root.getAttribute("data-render-width")),
    height: Number(await root.getAttribute("data-render-height")),
  };
  const bytes = Buffer.from(
    await page.locator("main img").evaluate(async (image) => {
      const blob = await (await fetch(image.src)).blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.readAsDataURL(blob);
      });
    }),
    "base64",
  );
  const size = readPngSize(bytes);
  if (size?.width !== expected.width || size.height !== expected.height)
    return {
      error: {
        format,
        code: "size-mismatch",
        message: `Expected a ${expected.width}x${expected.height} PNG, got ${size ? `${size.width}x${size.height}` : "no PNG"}.`,
        fields: [],
      },
    };

  const file = path.join(outDir, `gi-${job.template}-${format}.png`);
  await writeFile(file, bytes);
  return {
    file: {
      format,
      path: file,
      ...size,
      hasOverflow: (await root.getAttribute("data-render-overflow")) === "true",
    },
  };
}

async function main() {
  const files = [];
  const errors = [];
  let server;
  let browser;
  try {
    let options;
    try {
      options = parseArguments(process.argv.slice(2));
    } catch (cause) {
      throw new SetupError("invalid-arguments", cause.message);
    }
    const job = await readJob(options.job);
    const photo = job.photo ? path.resolve(job.photo) : undefined;
    if (photo)
      await access(photo).catch(() => {
        throw new SetupError("invalid-job", `Cannot read the photo ${photo}.`);
      });
    const outDir = path.resolve(options.out);
    await mkdir(outDir, { recursive: true });

    if (!options.url) server = await servePreview();
    const baseUrl = options.url ?? server.url;
    browser = await launchBrowser();
    const page = await browser.newPage();

    for (const format of job.formats) {
      try {
        const result = await renderFormat(
          page,
          baseUrl,
          job,
          format,
          photo,
          outDir,
        );
        if (result.file) files.push(result.file);
        else errors.push(result.error);
      } catch (cause) {
        errors.push({
          format,
          code: cause.name === "TimeoutError" ? "timeout" : "render-failed",
          message: cause.message.split("\n")[0],
          fields: [],
        });
      }
    }
  } catch (cause) {
    if (!(cause instanceof SetupError)) throw cause;
    errors.push({ code: cause.code, message: cause.message, fields: [] });
  } finally {
    await browser?.close();
    await server?.close();
  }
  finish(files, errors);
}

await main();
