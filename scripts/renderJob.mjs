import { z } from "zod";

/** Keep in sync with `GRAPHIC_FORMATS`; `renderJob.test.ts` fails when they drift. */
export const DEFAULT_FORMATS = ["square", "portrait", "story", "landscape"];

/** Job keys the render route takes as its own parameters, not as template fields. */
const RESERVED_VALUES = ["template", "format", "photo", "focalX", "focalY"];

const focal = z.number().min(0).max(100);

const jobSchema = z.strictObject({
  template: z.string().min(1),
  values: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .default({})
    .refine(
      (values) => !RESERVED_VALUES.some((name) => name in values),
      `"values" holds template fields only; ${RESERVED_VALUES.join(", ")} are top-level keys.`,
    ),
  formats: z.array(z.string().min(1)).min(1).default(DEFAULT_FORMATS),
  photo: z.string().min(1).optional(),
  focalX: focal.optional(),
  focalY: focal.optional(),
});

/**
 * Validates the shape of a job. Template, format and field names are checked
 * by the render route itself, which owns those lists.
 */
export function parseJob(input) {
  let json;
  try {
    json = JSON.parse(input);
  } catch (cause) {
    throw new Error(`The job is not valid JSON: ${cause.message}`);
  }
  const result = jobSchema.safeParse(json);
  if (!result.success)
    throw new Error(
      result.error.issues
        .map((issue) =>
          issue.path.length > 0
            ? `${issue.path.join(".")}: ${issue.message}`
            : issue.message,
        )
        .join("; "),
    );
  const { focalX, focalY, photo } = result.data;
  if (!photo && (focalX !== undefined || focalY !== undefined))
    throw new Error('"focalX" and "focalY" need a "photo".');
  return {
    ...result.data,
    formats: [...new Set(result.data.formats)],
    values: Object.fromEntries(
      Object.entries(result.data.values).map(([id, value]) => [
        id,
        String(value),
      ]),
    ),
  };
}

/** The render route URL of one format; `baseUrl` is where the app is served. */
export function buildRenderUrl(baseUrl, job, format) {
  const url = new URL(
    "marketing/render",
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  );
  url.searchParams.set("template", job.template);
  url.searchParams.set("format", format);
  for (const [id, value] of Object.entries(job.values))
    url.searchParams.set(id, value);
  if (job.photo) {
    url.searchParams.set("photo", "1");
    if (job.focalX !== undefined)
      url.searchParams.set("focalX", String(job.focalX));
    if (job.focalY !== undefined)
      url.searchParams.set("focalY", String(job.focalY));
  }
  return url.href;
}

const PNG_SIGNATURE = "89504e470d0a1a0a";

/** Width and height from the PNG header, or null when the bytes are not a PNG. */
export function readPngSize(bytes) {
  if (
    bytes.length < 24 ||
    bytes.subarray(0, 8).toString("hex") !== PNG_SIGNATURE
  )
    return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/** Parses `<job> [--out <dir>] [--url <base URL>]`; `-` reads the job from stdin. */
export function parseArguments(argv) {
  const options = { job: undefined, out: "renders", url: undefined };
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === "--out" || argument === "--url") {
      const value = argv[++index];
      if (!value) throw new Error(`${argument} needs a value.`);
      options[argument.slice(2)] = value;
    } else if (argument.startsWith("--")) {
      throw new Error(`Unknown option ${argument}.`);
    } else if (options.job === undefined) {
      options.job = argument;
    } else {
      throw new Error(`Unexpected argument ${argument}.`);
    }
  }
  if (options.job === undefined)
    throw new Error(
      "Usage: yarn render <job.json | -> [--out <dir>] [--url <base URL>]",
    );
  return options;
}
