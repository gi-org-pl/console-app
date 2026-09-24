# Console · Generacja Innowacja

Wspólna powłoka wewnętrznych narzędzi GI. Aktualny zakres: **etap 1 — fundament** i publiczne laboratorium eksportu Marketingu. Bez kont, backendu ani bazy. Treść demonstracji nie jest zapisywana; odświeżenie ją resetuje.

## Uruchomienie

Node.js 24+, Yarn 1.22 (np. przez Corepack).

```sh
corepack enable
yarn install --frozen-lockfile
yarn dev
```

## Sprawdzenie i demo

```sh
yarn typecheck
yarn lint
yarn test:coverage
yarn build
yarn playwright install chromium firefox webkit
yarn e2e
yarn preview --host 127.0.0.1 --port 4173
```

Playwright sam uruchamia preview **wcześniej zbudowanej** aplikacji. Zmiana kodu wymaga ponownego `yarn build`. Testy sprawdzają Chromium, Firefox, WebKit i profil mobilnego WebKit. Raport, PNG i zrzuty trafiają do `playwright-report/` oraz `test-results/`.

Standardy front-endu GI są w [CLAUDE.md](CLAUDE.md).

## Moduły i szablony grafik

- **Nowy moduł Console:** dopisz wpis do `CONSOLE_MODULES` w `src/constants/console.ts`, dodaj widok w `src/components/<domena>/` i cienki plik w `src/pages/`.
- **Nowy szablon grafiki (Marketing):** utwórz folder `src/components/marketing/ExportLab/templates/<Nazwa>Template/` z komponentem (HTML + Tailwind, rysowany w pikselach formatu) oraz plikiem `.constants.ts` (nazwa, pola, limity, obsługa zdjęcia). Dopisz go do `GRAPHIC_TEMPLATES` w `ExportLab.constants.ts`. Pojemniki, które nie mogą się przepełnić, oznacz atrybutem `data-fit`; eksport zablokuje wtedy przyciętą treść.

PNG powstaje przez rasteryzację wyrenderowanego szablonu (`modern-screenshot`); podgląd jest dokładnie pobieranym plikiem.

## Zależności do akceptacji Technical Leadera

Poza stackiem z CLAUDE.md §1 dodano: `@fortawesome/*` (ikony solid) oraz `modern-screenshot` (eksport szablonów HTML do PNG). Wymagają zatwierdzenia TL.

## Hosting

Wynik `yarn build` to statyczny katalog **build/client**. CI publikuje artefakt builda i raporty testów. Serwer Node nie jest potrzebny.

Hosting: **GitHub Pages**. Workflow `deploy-pages.yml` testuje aplikację i publikuje gałęzie `main` oraz `codex/poc` pod `https://gi-org-pl.github.io/console-app/`. Gałąź POC służy demonstracji przed akceptacją i scaleniem PR-a. Po zakończeniu POC usuń ją z triggera publikacji. W ustawieniach Pages źródłem jest GitHub Actions, a środowisko `github-pages` musi dopuszczać te gałęzie.

Build dla Pages używa `CONSOLE_BASE_PATH=/console-app/`. `scripts/preparePages.mjs` kopiuje prerenderowany HTML do korzenia artefaktu, ponieważ Pages sam montuje witrynę pod nazwą repozytorium. Router prerenderuje statyczne trasy, więc `/marketing/` działa również po odświeżeniu bez serwerowego fallbacku.

Aby podłączyć `console.gi.org.pl`, ustaw DNS CNAME `console` → `gi-org-pl.github.io`, domenę w ustawieniach Pages oraz zmienne repozytorium `PAGES_BASE_PATH=/` i `PAGES_CUSTOM_DOMAIN=console.gi.org.pl`. Uruchom deploy ponownie i włącz wymuszenie HTTPS po wydaniu certyfikatu. DNS domeny nie jest częścią repozytorium.

Przed udostępnieniem sprawdź `/`, bezpośrednie `/marketing`, odświeżenie, brak poziomego scrollowania, lokalne fonty oraz download/share na telefonie. Publiczny POC jest celowy; ograniczenie dostępu do zespołu wymaga rzeczywistej bramki SSO przed późniejszym wdrożeniem wewnętrznym.

## Materiały marki

Poppins i Roboto są dostarczone lokalnie z licencjami OFL w `public/fonts`. Logo aplikacji (`src/assets/icons/console-logo.svg`) i awatar (`src/assets/images/avatar.png`) pochodzą od zespołu. Szablony „Klasyczny” i „Cytat” są demonstracyjne i czekają na zatwierdzony standard graficzny.
