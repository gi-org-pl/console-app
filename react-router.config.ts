import type { Config } from "@react-router/dev/config";

export default {
  appDirectory: "src",
  buildDirectory: "build",
  ssr: false,
  basename: process.env.CONSOLE_BASE_PATH || "/",
  prerender: true,
} satisfies Config;
