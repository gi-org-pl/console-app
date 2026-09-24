import { Badge } from "@gi-org-pl/athena";
import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { consoleModules } from "./modules";

export default function ConsoleShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const active = consoleModules.find((module) =>
    pathname.startsWith(module.path),
  );
  return (
    <div className="console-layout">
      <a className="skip-link" href="#main">
        Przejdź do treści
      </a>
      <aside className="sidebar">
        <Link to="/" className="wordmark" aria-label="Console — strona główna">
          <span className="brand-symbol" aria-hidden="true">
            gi<span>↗</span>
          </span>
          <span>
            console<span className="wordmark-dot">.</span>
            <small>GENERACJA INNOWACJA</small>
          </span>
        </Link>
        <div className="nav-label">PRZESTRZEŃ ROBOCZA</div>
        <nav aria-label="Nawigacja główna">
          <NavLink to="/" end>
            <span aria-hidden="true">▦</span>Pulpit
          </NavLink>
          {consoleModules.map((module) => (
            <NavLink key={module.path} to={module.path}>
              <span aria-hidden="true">◈</span>
              {module.name}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="team-mark">GI</div>
          <div>
            Tworzymy zmianę.<small>Narzędzia dla naszego zespołu</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            Console <span aria-hidden="true">/</span>{" "}
            <b>{active?.name ?? "Pulpit"}</b>
          </div>
          <Badge type="info" variant="secondary">
            POC · otwarty dostęp
          </Badge>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer>
          Generacja Innowacja <span>Technologia w służbie społeczeństwa.</span>
          <a href="https://gi.org.pl" target="_blank" rel="noreferrer">
            gi.org.pl ↗
          </a>
        </footer>
      </div>
    </div>
  );
}
