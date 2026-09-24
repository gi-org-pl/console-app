import { cp, stat } from "node:fs/promises";
import path from "node:path";

// React Router puts prerendered HTML under basename; Pages mounts the artifact there itself.
// Copy HTML to the artifact root. Keeping the original build avoids destructive cleanup.
const base = process.env.CONSOLE_BASE_PATH || "/";
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base)) {
  throw new Error("CONSOLE_BASE_PATH must be an absolute path ending in /.");
}
const root = path.resolve("build/client");
const rendered = path.resolve(root, base.slice(1));
if (rendered !== root) {
  await stat(path.join(rendered, "index.html"));
  await cp(rendered, root, { recursive: true });
}
