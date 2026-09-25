import { config } from "@fortawesome/fontawesome-svg-core";
import { Links, Outlet, Scripts } from "react-router";
import ConsoleShell from "./components/console/ConsoleShell/ConsoleShell";
import "@fortawesome/fontawesome-svg-core/styles.css";
import favicon from "./assets/images/avatar.png";
import "./index.css";

// Styles are imported above; runtime injection would flash unstyled icons on SSR.
config.autoAddCss = false;

export default function App() {
  return (
    <html lang="pl" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#000000" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" type="image/png" href={favicon} />
        <title>Console | Generacja Innowacja</title>
        <Links />
      </head>
      <body>
        <ConsoleShell>
          <Outlet />
        </ConsoleShell>
        <Scripts />
      </body>
    </html>
  );
}
