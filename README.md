# SWAPI Explorer

A small, dependency-free JavaScript application for exploring [SWAPI](https://swapi.info), the Star Wars API.

Browse **Characters, Films, Planets and Starships**, see results as cards, and open any card for a detailed record — built with plain ES modules and a domain-driven-inspired structure rather than a framework.

## Preview

![SWAPI Explorer](public/images/Screenshot.png)

## Live demo

[View SWAPI Explorer](https://paddymacmac.github.io/swapi-explorer/)

## Features

- Browse Characters, Films, Planets, and Starships
- Responsive, card-based grid layout
- "Jump to…" dropdown for quickly locating a specific entity
- Alphabetically sorted entity selection
- Full record detail shown in an accessible modal
- Loading and error states surfaced to the user
- Keyboard-operable cards and modal (`Enter`/`Space` to open, `Escape` to close)
- Automated test suite covering domain, application, infrastructure and UI layers

## Tech stack

- Vanilla JavaScript (ES modules) — no framework, no build step
- HTML5 / CSS3
- Node.js (dependency-free static file server for local dev)
- [Vitest](https://vitest.dev) + [jsdom](https://github.com/jsdom/jsdom) for testing
- [SWAPI](https://swapi.info) as the data source

## Getting started

### Requirements

- Node.js 18+
- A modern browser

### Install

```bash
npm install
```

### Run

```bash
npm start
```

This starts a small Node standard-library static server — no extra HTTP server dependency is downloaded. Then open:

```text
http://127.0.0.1:8080
```

To use a different port (Windows PowerShell):

```powershell
$env:PORT=8081; npm start
```

The app must be served over HTTP rather than opened as a `file://` path, since browsers restrict ES module loading from the local filesystem.

## Testing

```bash
npm test              # run the full suite once
npm run test:watch    # re-run on change
npm run coverage      # generate a coverage report
```

The suite covers domain rules, the SWAPI HTTP boundary, application use cases, rendering, modal behaviour, and browser event wiring — including an end-to-end-style test that loads mocked SWAPI data, renders it into `#results`, and confirms clicking a card opens the modal with the right entity.

## Architecture

The codebase favours small, single-purpose modules over classes or inheritance — enough separation to show clear boundaries, without the ceremony a browser app of this size doesn't need.

```text
src/js/
├── domain/
│   └── resources.js          # Resource definitions and pure domain rules
├── application/
│   └── explorer.js           # Resource loading and selection use cases
├── infrastructure/
│   └── swapiClient.js        # SWAPI HTTP boundary
├── ui/
│   ├── render.js             # DOM rendering only
│   └── modal.js              # Modal behaviour only
└── app.js                    # Composition root and browser event wiring
```

**Responsibilities**

| Layer | Owns | Does not own |
|---|---|---|
| `domain` | What resources exist, how entities are named/sorted, which fields display | The DOM, HTTP |
| `application` | Use-case coordination (load, select) | The DOM, `fetch` |
| `infrastructure` | Calling SWAPI, via an injectable fetch function | Rendering, app state |
| `ui` | Rendering data, modal open/close | Fetching data, app state |
| `app.js` | Wiring browser events to use cases | Business logic, rendering logic |

This is **DDD-inspired rather than a full DDD implementation** — a small app like this doesn't need repositories, aggregates or rich domain objects to benefit from the same underlying idea: keep what the app *knows* separate from how it *fetches* and how it *displays*.

### Design decisions

- **Why plain functions instead of classes?** Nothing here needs mutable identity or inheritance; closures and small pure functions keep behaviour easy to isolate and test.
- **Why not a repository abstraction?** The only I/O is a GET request to SWAPI. `infrastructure/swapiClient.js` already isolates that boundary and accepts an injectable `fetch`, so tests run without the network — a repository layer on top would add indirection without solving a real problem here.
- **Why one configuration object for four resource types?** Characters, films, planets and starships each have different fields but identical behaviour. A small per-resource config (in `domain/resources.js`) avoids four near-duplicate renderers while keeping the differences explicit and easy to extend.
- **Why does `app.js` stay small?** It's the composition root — it wires DOM events to use cases and nothing else, so it doesn't grow into a controller that also knows how to render or fetch.

## Project structure

```text
.
├── index.html
├── package.json
├── vitest.config.js
├── scripts/
│   └── server.js
├── public/
│   └── images/
├── src/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── domain/resources.js
│       ├── application/explorer.js
│       ├── infrastructure/swapiClient.js
│       ├── ui/render.js
│       ├── ui/modal.js
│       └── app.js
└── test/
    ├── domain.test.js
    ├── swapiClient.test.js
    ├── application.test.js
    ├── render.test.js
    ├── modal.test.js
    └── app.test.js
```

## What this project demonstrates

- REST API integration via `fetch`, with an injectable HTTP boundary for testability
- Separation of concerns across domain / application / infrastructure / UI
- DDD-inspired layering, applied pragmatically rather than dogmatically
- Configuration over duplication for structurally-similar resource types
- DOM manipulation and event delegation without a framework
- Accessible, keyboard-operable UI (roles, `aria-*` attributes, focus states)
- Loading and error handling as first-class UI states
- Unit and DOM-integration testing with Vitest + jsdom

## With more time

A few things I'd tackle next, given more than the ~2-hour scope of this task:

- Pagination or infinite scroll instead of loading each resource in full
- A search/filter box alongside the "Jump to…" picker for larger result sets
- Resolving related-entity URLs (e.g. a character's homeworld or films) into readable links inside the modal
- Client-side caching of already-fetched resources to avoid re-requesting on tab switches
- A retry affordance on the error state, rather than requiring a manual tab reselect
- TypeScript (or JSDoc types) at the `infrastructure`/`domain` boundary for stronger contracts

## API

Data is provided by [SWAPI](https://swapi.info). The application currently uses:

- `/api/people`
- `/api/films`
- `/api/planets`
- `/api/starships`