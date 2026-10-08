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

## Render route (Marketing)

`/marketing/render` shows one graphic with its state taken from the URL, without the Console shell. It exists for scripts and agents that need a specific PNG without clicking through the editor. It runs the editor's own templates, validation and rasterizer, so the same values give the same image.

```txt
/marketing/render?template=standard&format=portrait&title=Nowy%20*projekt*&funding=none
```

| Parameter | Required | Value |
| --- | --- | --- |
| `template` | yes | A template id from `GRAPHIC_TEMPLATES`: `standard`, `news`. |
| `format` | yes | A format id from `GRAPHIC_FORMATS`: `square` (1080×1080), `portrait` (1080×1350), `story` (1080×1920), `landscape` (1200×628). |
| _field id_ | no | A value for one of the template's `fields`, under the same `id` as in the editor. A missing field keeps its `defaultValue`. Wrap a fragment in `*` to highlight it; encode a line break as `%0A`. |
| `photo` | no | `1` announces a background photo. The file cannot travel in a URL, so the page then waits for it in its file input (see below). |
| `focalX`, `focalY` | no | Focal point of the photo in percent, 0-100, default 50. Only with `photo=1`. |

Fields per template:

- **standard:** `title`, `titleSize` (32, 48, 64, 80), `subtitle`, `subtitleSize` (24, 32, 40, 48), `position` (top, middle, bottom), `align` (left, center, right), `funding` (none, proo).
- **news:** `personName`, `title`, `newsTitleSize` (32, 48, 64, 80), `subtitle`, `subtitleSize` (24, 32, 40, 48), `funding` (none, proo).

The result is reported on the page's root element, `<main>`:

| Attribute | Meaning |
| --- | --- |
| `data-render-status` | `loading` while fonts load and the graphic is rasterized, `awaiting-photo` until a file is put into the file input, then `ready` or `error`. Wait for one of the last two instead of a timeout. |
| `data-render-template`, `data-render-format`, `data-render-width`, `data-render-height` | What was requested, once the URL is understood. |
| `data-render-overflow` | With `ready`: `true` when text does not fit a box marked with `data-fit`. The PNG is still produced; shorten the text or pick a smaller size and render again. |
| `data-render-error` | With `error`: `missing-parameter`, `duplicate-parameter`, `unknown-template`, `unknown-format`, `unknown-parameter`, `invalid-photo`, `invalid-content` or `render-failed`. The message (in Polish, like the editor's) is in the `role="alert"` element. |
| `data-render-error-fields` | With `invalid-content`: the ids of the fields to fix, separated by spaces. |

When ready, the page contains a single `<img>` whose `src` is a blob URL of the PNG at the format's exact pixel size. Read the file with `fetch(img.src)` inside the page; a screenshot of the page is not the export.

**Background photo:** open the URL with `photo=1`, wait for `data-render-status="awaiting-photo"`, put a JPG, PNG or WebP into the `input[type=file]` (Playwright: `setInputFiles`), then wait for `ready`. The photo goes through the editor's own downscaling.

The route is a prerendered static page like the others, so it works under `CONSOLE_BASE_PATH` and on GitHub Pages.

## Rendering graphics from the command line

`yarn render` turns a JSON job into PNG files by opening the render route in headless Chromium. It needs no knowledge of the code: everything below is the whole interface.

```sh
yarn build                                  # once, and again after changing the app
# built with CONSOLE_BASE_PATH other than "/"? then also: node scripts/preparePages.mjs
yarn playwright install chromium            # once per machine
yarn -s render job.json --out renders       # -s keeps Yarn's own lines out of stdout
echo '{"template":"news"}' | yarn -s render - --out renders
```

| Argument | Meaning |
| --- | --- |
| `<job.json>` or `-` | The job file, or `-` to read the job from stdin. |
| `--out <dir>` | Where to write the PNGs. Default: `renders`. Created when missing. |
| `--url <base URL>` | Render against a running app, e.g. `https://console.gi.org.pl/`, instead of the local build in `build/client`. |

A build made with a `CONSOLE_BASE_PATH` other than `/` keeps its pages under that path, where `vite preview` does not serve them. Run `node scripts/preparePages.mjs` with the same variable first (the Pages workflow does the same); without it the script stops with `missing-build` and says so.

The job:

```json
{
  "template": "standard",
  "values": { "title": "Nowy *projekt*", "titleSize": 48, "funding": "none" },
  "formats": ["square", "portrait"],
  "photo": "photos/team.jpg",
  "focalX": 50,
  "focalY": 30
}
```

- `template` (required) and the field names in `values` are the ones listed under [Render route](#render-route-marketing). Fields left out keep their defaults; numbers are accepted for sizes.
- `formats` defaults to all four.
- `photo` is a JPG, PNG or WebP path, relative to the current directory. `focalX` and `focalY` (0-100) are optional and need a `photo`.

Stdout is one JSON document; nothing else is printed there:

```json
{
  "ok": false,
  "files": [
    {
      "format": "square",
      "path": "/abs/renders/gi-standard-square.png",
      "width": 1080,
      "height": 1080,
      "hasOverflow": true
    }
  ],
  "errors": [
    {
      "format": "portrait",
      "code": "invalid-content",
      "message": "Wybierz: położenie tekstu.",
      "fields": ["position"]
    }
  ]
}
```

- The exit code is `0` when every format was written and `1` otherwise. Formats that succeeded are still written and listed.
- `hasOverflow: true` means the text does not fit that format. The file exists, but the text may be clipped: shorten it or lower `titleSize` / `subtitleSize` and run again.
- Error codes of a format are the render route's `data-render-error` values, plus `timeout`, `render-failed` and `size-mismatch` (the PNG is not the format's size). Errors without a `format` stop the whole run: `invalid-arguments`, `invalid-job`, `missing-build`, `output-failed`, `preview-failed`, `browser-unavailable`, `unexpected`. Stdout is the JSON document in every one of these cases.
- Files are named `gi-<template>-<format>.png`, like the editor's downloads, and overwrite earlier ones in the same directory.

## Dependencies pending Technical Leader approval

On top of the stack in CLAUDE.md §1, the project adds `@fortawesome/*` (solid icons) and `modern-screenshot` (HTML template to PNG export). Both need TL approval.

## Hosting

`yarn build` outputs a static site in **build/client**; no Node server is needed. CI publishes the build artifact and test reports.

The app is hosted on **GitHub Pages**. The `deploy-pages.yml` workflow tests the app and publishes the `main` branch to `https://console.gi.org.pl/`. In the Pages settings, the source must be GitHub Actions, the custom domain must be `console.gi.org.pl`, and the `github-pages` environment must allow `main`. DNS (CNAME `console` → `gi-org-pl.github.io`) is managed outside this repository.

The Pages build uses `CONSOLE_BASE_PATH=/`. Static routes are prerendered, so `/marketing/` also works after a refresh without a server-side fallback.

To serve the app from `https://gi-org-pl.github.io/console-app/` instead, remove the custom domain in the Pages settings and set the repository variable `PAGES_BASE_PATH=/console-app/`. `scripts/preparePages.mjs` then copies the prerendered HTML to the artifact root, because Pages itself mounts the site under the repository name.

Before sharing a deploy, check `/`, a direct visit to `/marketing`, a page refresh, no horizontal scrolling, locally served fonts, and download/share on a phone. The app is intentionally public for now; restricting it to the team requires a real SSO gate before any internal rollout.

## Brand assets

Poppins and Roboto are bundled locally in `public/fonts`, together with their OFL licenses. The app logo (`src/assets/icons/console-logo.svg`) and avatar (`src/assets/images/avatar.png`) were provided by the team.
