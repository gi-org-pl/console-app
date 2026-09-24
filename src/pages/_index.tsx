import { Badge, Button } from "@gi-org-pl/athena";
import { Link } from "react-router";
import { consoleModules } from "../components/console/ConsoleShell/modules";

export default function Home() {
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">PRZESTRZEŃ ZESPOŁU</span>
        <h1>
          Mniej klikania.
          <br />
          Więcej działania<span className="accent-dot">.</span>
        </h1>
        <p>Codzienne zadania fundacji. Jeden zestaw narzędzi.</p>
      </div>
      <section aria-labelledby="modules-title">
        <div className="section-heading">
          <h2 id="modules-title">Twoje narzędzia</h2>
          <Badge type="info" variant="secondary">
            Etap 1 · Fundament
          </Badge>
        </div>
        <div className="module-grid">
          {consoleModules.map((module) => (
            <article className="module-card" key={module.path}>
              <div className="module-art" aria-hidden="true">
                <div className="art-post">
                  <span>
                    GENERACJA
                    <br />
                    INNOWACJA
                  </span>
                  <strong>
                    Dobre idee.
                    <br />
                    Dobry przekaz.
                  </strong>
                  <div className="art-orbit" />
                </div>
                <div className="art-caption">
                  Jedna treść.
                  <br />
                  <b>Każdy format.</b>
                </div>
              </div>
              <div className="module-body">
                <span className="eyebrow">01 / KOMUNIKACJA</span>
                <h3>{module.name}</h3>
                <p>{module.description}</p>
                <Button asChild>
                  <Link to={module.path}>
                    Otwórz moduł <span aria-hidden="true">↗</span>
                  </Link>
                </Button>
              </div>
            </article>
          ))}
          <aside className="coming-card">
            <span className="eyebrow">DALEJ W CONSOLE</span>
            <h3>
              Miejsce na kolejne
              <br />
              dobre narzędzia.
            </h3>
            <p>Rozwijamy Console krok po kroku, wokół potrzeb zespołu.</p>
            <ul>
              <li>
                Certyfikaty i zaświadczenia <span>↗</span>
              </li>
              <li>
                Podpisy mailowe <span>↗</span>
              </li>
              <li>
                Szablony dokumentów <span>↗</span>
              </li>
              <li>
                Linki UTM i kody QR <span>↗</span>
              </li>
            </ul>
            <span className="muted">Planowane · jeszcze niedostępne</span>
          </aside>
        </div>
      </section>
      <section className="foundation-note">
        <span className="note-symbol" aria-hidden="true">
          ✳
        </span>
        <div>
          <h2>Budujemy wspólnie. Zaczynamy od podstaw.</h2>
          <p>
            Ta wersja sprawdza nawigację i eksport grafik. Docelowe szablony GI
            powstaną po akceptacji fundamentu i przekazaniu materiałów marki.
          </p>
        </div>
        <Badge variant="outlined">Publiczny POC</Badge>
      </section>
    </>
  );
}
