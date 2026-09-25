# Console

A shared shell for Generacja Innowacja's internal tools. It currently ships one module, **Marketing**, a browser-based graphics export lab. There are no accounts, backend or database. Demo content is not stored anywhere; a page refresh resets it.

The UI copy is in Polish because the app is built for the foundation's team. Code, comments and docs are in English.

## Getting started

Requires Node.js 24+ and Yarn 1.22 (e.g. via Corepack).

```sh
corepack enable
yarn install --frozen-lockfile
yarn dev
```

## Checks

```sh
yarn typecheck
yarn lint
yarn test:coverage
yarn build
yarn playwright install chromium firefox webkit
yarn e2e
yarn preview --host 127.0.0.1 --port 4173
```

Playwright serves the **previously built** app through `vite preview`, so run `yarn build` again after changing code. The e2e suite covers Chromium, Firefox, WebKit and a mobile WebKit profile. Reports, exported PNGs and screenshots are written to `playwright-report/` and `test-results/`.

Front-end standards live in [CLAUDE.md](CLAUDE.md).

## Extending Console

- **New Console module:** add an entry to `CONSOLE_MODULES` in `src/constants/console.ts`, put the view in `src/components/<domain>/` and add a thin route file in `src/pages/`. The module then appears in the sidebar and on the dashboard.
- **New graphic template (Marketing):** create `src/components/marketing/ExportLab/templates/<Name>Template/` with the component (HTML + Tailwind, laid out in the format's pixels) and a `.constants.ts` file describing its name, fields, limits and photo support. Register it in `GRAPHIC_TEMPLATES` in `ExportLab.constants.ts`. Mark containers with `data-fit` to show a red warning on formats where text may be clipped; export remains available.
- **New funding grant:** add its two images to `public/grants/` and an entry to `src/components/marketing/ExportLab/templates/fundingOptions.ts`. Standard and News share this list; the `none` value means no banner.

PNGs are produced by rasterizing the rendered template with `modern-screenshot`, so the preview is exactly the file you download.

## Dependencies pending Technical Leader approval

On top of the stack in CLAUDE.md §1, the project adds `@fortawesome/*` (solid icons) and `modern-screenshot` (HTML template to PNG export). Both need TL approval.

## Hosting

`yarn build` outputs a static site in **build/client**; no Node server is needed. CI publishes the build artifact and test reports.

The app is hosted on **GitHub Pages**. The `deploy-pages.yml` workflow tests the app and publishes the `main` branch to `https://gi-org-pl.github.io/console-app/`. In the Pages settings, the source must be GitHub Actions and the `github-pages` environment must allow `main`.

The Pages build uses `CONSOLE_BASE_PATH=/console-app/`. `scripts/preparePages.mjs` copies the prerendered HTML to the artifact root, because Pages itself mounts the site under the repository name. Static routes are prerendered, so `/marketing/` also works after a refresh without a server-side fallback.

To serve the app from `console.gi.org.pl`:

1. Add a DNS CNAME record `console` → `gi-org-pl.github.io`. DNS is managed outside this repository.
2. Set the custom domain in the Pages settings.
3. Set the repository variables `PAGES_BASE_PATH=/` and `PAGES_CUSTOM_DOMAIN=console.gi.org.pl`.
4. Re-run the deploy and enable "Enforce HTTPS" once the certificate is issued.

Before sharing a deploy, check `/`, a direct visit to `/marketing`, a page refresh, no horizontal scrolling, locally served fonts, and download/share on a phone. The app is intentionally public for now; restricting it to the team requires a real SSO gate before any internal rollout.

## Brand assets

Poppins and Roboto are bundled locally in `public/fonts`, together with their OFL licenses. The app logo (`src/assets/icons/console-logo.svg`) and avatar (`src/assets/images/avatar.png`) were provided by the team.
