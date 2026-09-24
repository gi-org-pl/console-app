import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface ConsoleModule {
  name: string;
  path: string;
  description: string;
  category: string;
  icon: IconDefinition;
}
