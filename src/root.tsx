import { Links, Outlet, Scripts } from "react-router";
import ConsoleShell from "./components/console/ConsoleShell/ConsoleShell";

import "./index.css";

export default function App() {
  return (
    <html lang="pl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#173e48" />
        <meta name="robots" content="noindex, nofollow" />
        <title>Console · Generacja Innowacja</title>
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
