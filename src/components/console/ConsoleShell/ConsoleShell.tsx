import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { CONSOLE_MODULES } from "../../../constants/console";
import Sidebar from "./Sidebar/Sidebar";

interface Props {
  children: ReactNode;
}

const ConsoleShell = ({ children }: Props) => {
  const { pathname } = useLocation();
  const activeModule = CONSOLE_MODULES.find((module) =>
    pathname.startsWith(module.path),
  );

  return (
    <div className="min-h-screen sm:grid sm:grid-cols-[208px_minmax(0,1fr)] desktop:grid-cols-[240px_minmax(0,1fr)]">
      <a
        className="sr-only z-100 bg-app-text text-app-bg focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:p-2"
        href="#main"
      >
        Przejdź do treści
      </a>
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-app-border bg-app-bg p-4 text-base text-app-muted sm:px-8">
          <div>
            Console{" "}
            <span aria-hidden="true" className="px-2 text-app-subtle">
              /
            </span>{" "}
            <b className="font-medium text-app-text">
              {activeModule?.name ?? "Pulpit"}
            </b>
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1552px] flex-1 px-4 py-8 sm:px-8"
        >
          {children}
        </main>
        <footer className="flex flex-wrap items-center gap-4 border-t border-app-border p-4 text-sm leading-5 text-app-muted sm:px-8 sm:pb-8">
          <address className="not-italic">
            © Fundacja Generacja Innowacja, 2026
            <br />
            ul. Twarda 18, 00-105 Warszawa
            <br />
            KRS 0001041229, NIP 5214023308
          </address>
          <a
            className="ml-auto text-app-accent-text"
            href="https://gi.org.pl"
            target="_blank"
            rel="noreferrer"
          >
            gi.org.pl <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </a>
        </footer>
      </div>
    </div>
  );
};

export default ConsoleShell;
