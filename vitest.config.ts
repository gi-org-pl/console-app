import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["**/*.test.tsx", "**/*.test.ts"],
    globals: true,
    clearMocks: true,
    environment: "jsdom",
    setupFiles: ["./setupTests.ts"],
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.stories.tsx",
        "src/**/*.types.ts",
        "src/types/**",
        "src/pages/**",
        "src/root.tsx",
        "src/routes.ts",
      ],
      thresholds: { statements: 95, branches: 95, functions: 95, lines: 95 },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
