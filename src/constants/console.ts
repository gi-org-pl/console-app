import { faBullhorn } from "@fortawesome/free-solid-svg-icons";
import type { ConsoleModule } from "../types/console";

/** Console modules in navigation order. Add a module by appending it here. */
export const CONSOLE_MODULES: readonly ConsoleModule[] = [
  {
    name: "Marketing",
    path: "/marketing",
    description:
      "Od pomysłu do publikacji. Przygotuj grafikę w formatach social mediów i opublikuj ją na kanałach fundacji.",
    category: "Komunikacja",
    icon: faBullhorn,
  },
];
