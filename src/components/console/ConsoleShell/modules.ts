import type { ConsoleModule } from "../../../types/console";

const manifests = import.meta.glob<{ default: ConsoleModule }>(
  "../../../modules/*/module.ts",
  { eager: true },
);

export const consoleModules = Object.values(manifests)
  .map((module) => module.default)
  .sort((a, b) => a.order - b.order);
