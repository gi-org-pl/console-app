import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface ConsoleSubModule {
  name: string;
  path: string;
}

export interface ConsoleModule {
  name: string;
  path: string;
  description: string;
  category: string;
  icon: IconDefinition;
  /** Selectable subviews nested under this module's navigation entry. */
  subModules?: readonly ConsoleSubModule[];
}
