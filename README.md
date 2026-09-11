# SWAPI Explorer

A small vanilla-JavaScript app that browses the [Star Wars API](https://swapi.info) —
characters, films, planets, and starships — using plain ES modules (no framework,
no build step) and Bootstrap 5 for layout.

## Project structure

```
.
├── index.html            # Entry point — loaded directly in the browser
├── package.json
├── vitest.config.js      # Vitest config (jsdom environment)
├── public/               # Static assets served as-is
│   ├── favicon.svg
│   └── images/
│       └── logo.svg
├── src/
│   ├── css/
│   │   └── style.css     # Theme / styling
│   └── js/
│       ├── api.js        # Talks to SWAPI — fetch only, no DOM
│       ├── render.js     # Builds DOM from data — no fetching
│       ├── modal.js      # Minimal show/hide for the details modal
│       └── app.js        # Wires everything together, handles tab/dropdown/button interactions
└── test/
    ├── api.test.js
    ├── render.test.js
    ├── modal.test.js
    └── app.test.js
```

There's no bundler — `index.html` loads `src/js/app.js` directly as an ES module
(`<script type="module">`), which imports the other JS files the same way a
browser would. `public/` holds files that aren't imported by JS but are
referenced directly (favicon, logo image).

## Requirements

- [Node.js](https://nodejs.org) 18+ (for running tests and the dev server)
- A modern browser (for the app itself — no Node runtime needed to use it)

## Running the app

You need to serve the folder over HTTP rather than opening `index.html`
directly with `file://`, because ES modules (`type="module"`) are blocked by
CORS restrictions under the `file://` protocol.

```bash
npm install
npm start
```

This runs a static server (via `http-server`) over the project root and opens
the app in your browser. If it doesn't open automatically, visit the URL
printed in the terminal (typically `http://127.0.0.1:8080`).

Alternatively, use any static server you like, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Features

- **Tabs** — switch between Characters, Films, Planets, and Starships.
- **Card grid** — a quick-glance summary of every item in the current resource.
- **"Jump to…" dropdown + View details button** — next to the tabs, the
  dropdown is prepopulated with every item's name/title in **alphabetical
  order** for the currently loaded resource. Pick one, then click
  **View details** to open a modal with that entity's full details (fields
  the card grid doesn't have room for — e.g. a starship's cargo capacity, a
  planet's gravity and rotation period, a film's opening crawl). The button
  stays disabled until something is selected, and re-disables whenever you
  switch tabs and the dropdown resets.

The modal itself is a small hand-rolled show/hide (`src/js/modal.js`) that
reuses Bootstrap's CSS classes (`.modal`, `.show`, `.modal-backdrop`) but
doesn't depend on Bootstrap's JS bundle — see "Why no Bootstrap JS" below.

## Running the tests

Tests are written with [Vitest](https://vitest.dev) and run against a
simulated DOM via `jsdom`, since most of the app's modules read/write real
DOM elements.

```bash
npm install
npm test
```

Other test scripts:

```bash
npm run test:watch   # re-run on file changes
npm run coverage     # run tests with a coverage report (text + html)
```

Coverage currently sits at **99% statements/lines, 100% functions** across
`src/js/`. The `html` report is written to `coverage/index.html` — open it in
a browser for a file-by-file breakdown. `coverage/` is git-ignored since it's
a generated artifact, not source.

### What's covered

- **`api.test.js`** — `fetchResource` against a mocked `fetch`: correct URL,
  successful JSON parsing, error thrown on a non-OK response, and network
  failures propagating.
- **`render.test.js`** — `renderStatus` (including its error-state class),
  `getEntityName`, `renderResults` (card count/content per resource type,
  clearing stale results, empty list), `renderPicker` (alphabetical sorting
  for both `name`- and `title`-keyed resources, option population, clearing
  between loads), and `renderDetails` (modal title + full field set per
  resource type).
- **`modal.test.js`** — `openModal`/`closeModal` in isolation: class/style/
  aria toggling, backdrop creation and removal, closing on backdrop click,
  closing on the Escape key, and safe no-op behavior when called on an
  already-closed modal.
- **`app.test.js`** — `loadResource`, `setActiveTab`, `showEntityDetails`,
  and `initApp` wired together, with `api.js` mocked via `vi.mock`: loading/
  success/error status messages, dropdown population and clearing, the View
  details button's disabled state, tab-click behavior, opening the modal via
  the button, closing it via either close button, and an out-of-range
  selection being a no-op.

## Responsive design

The layout is responsive out of the box thanks to Bootstrap's grid, with a
few extra rules layered on top in `src/css/style.css`:

- **Card grid** — each card is `col-md-4` inside a `row`. Below the `md`
  breakpoint (768px) cards **snap to a single column** and stack vertically;
  at `md` and above they arrange **three per row**. This needs no custom
  media queries — it's Bootstrap's grid doing its job.
- **Tabs + dropdown + button row** — the resource tabs and the
  dropdown/button pair sit in a flex row that **wraps onto multiple lines**
  on narrow screens instead of overflowing or squashing.
- **Custom small-screen tweaks** — below 576px, tab padding/font-size
  shrinks slightly and the dropdown expands to full width, since a
  fixed-width `<select>` next to wrapped tabs looks cramped on a phone.
- **Modal** — Bootstrap's modal CSS centers and constrains it to the
  viewport by default, so entity details remain readable without extra CSS
  on mobile.

In short: resize the browser (or open it on a phone) and the card grid will
snap from three columns down to one, the controls row will wrap, and
everything stays usable without horizontal scrolling.

## Why no Bootstrap JS

An earlier version of this app loaded `bootstrap.bundle.min.js` from a CDN
purely to drive the details modal. In practice that's a real cost for a
small gain: it's a render-blocking `<script>` that has to be fetched before
the page finishes loading, and if that CDN request is slow or blocked
(corporate proxy, offline dev environment, etc.) the whole page stalls and
the modal silently never works, with no error shown.

Since Bootstrap's CSS already defines everything the modal *looks* like
(`.modal`, `.show`, `.modal-backdrop`, `.fade`), the only thing actually
missing without the JS bundle is toggling a few classes and building a
backdrop element — about 30 lines, now living in `src/js/modal.js` with no
external dependency. The same reasoning applies to the fonts: an earlier
version pulled in Google Fonts via a CSS `@import`, which is a
render-blocking network round-trip of its own. The current CSS uses the
system font stack instead, so the page has nothing to wait on before it can
render.

## Notes on the visual design

The banner logo and favicon (`public/images/logo.svg`, `public/favicon.svg`)
are original SVG artwork created for this project — not the Lucasfilm/Star
Wars trademark logo — styled to fit the app's dark, gold-accented theme,
which also adds hover/entrance animations on cards.
