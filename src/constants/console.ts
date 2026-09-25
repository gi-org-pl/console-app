import { faBullhorn } from "@fortawesome/free-solid-svg-icons";
import type { ConsoleModule } from "../types/console";

/** Console modules in navigation order. Add a module by appending it here. */
export const CONSOLE_MODULES: readonly ConsoleModule[] = [
  {
    name: "Marketing",
    path: "/marketing",
    description:
      "Od pomysłu do grafiki. Przygotuj spójny przekaz w formatach dopasowanych do social mediów.",
    category: "Komunikacja",
    icon: faBullhorn,
  },
];
