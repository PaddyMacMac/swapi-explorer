# SWAPI Explorer

A small, framework-free JavaScript application for browsing **Characters, Films, Planets and Starships** from [SWAPI](https://swapi.dev), with artwork, an entity detail modal, and a full automated test suite.

Built as a technical interview task, the goal was to keep the scope small while making the architecture, dependency boundaries, and testing strategy clearly visible in the code rather than hidden behind framework conventions.

## Preview

![SWAPI Explorer](public/images/Screenshot.png)

## Live demo

[View SWAPI Explorer](https://paddymacmac.github.io/swapi-explorer/)

## Getting started

**Requirements:** Node.js 18+ and a modern browser.

```bash
npm install
npm start   # serves at http://127.0.0.1:8080
```

### Running the tests

```bash
npm test           # run once
npm run test:watch # re-run on file changes
npm run coverage   # generate the coverage report (enforces an 80% threshold)
```

## Features


## Technology used

| Layer | Choice | Why |
|---|---|---|
| Language | Vanilla JavaScript (ES modules) | No framework overhead — the design decisions stay visible in the code itself |
| UI | Static HTML5 + CSS | The UI is simple enough that a component library would add more overhead than value |
| Testing | [Vitest](https://vitest.dev) + jsdom | Fast, native ESM support, a Jest-like API, and coverage via `@vitest/coverage-v8` |
| Dev server | `http-server` (via `npx`) | The app is fully static, so no bundler or build step is needed |
| Data sources | [SWAPI](https://swapi.dev) for core data, plus a couple of supporting image APIs for character artwork | Each source has a different shape, so that complexity is isolated in one place |

No bundler was used on purpose — the app is small enough that plain ES modules keep the runtime simple and let the folder structure itself communicate the architecture.

## Project structure

```text
.
├── index.html
├── package.json
├── vitest.config.js
├── public/
│   ├── favicon.svg
│   └── images/
├── src/
│   ├── css/style.css
│   └── js/
│       ├── domain/
│       │   └── swapiResourceDefinitions.js
│       ├── application/
│       │   └── swapiResourceBrowser.js
│       ├── infrastructure/
│       │   ├── swapiApiClient.js
│       │   └── starWarsArtworkProvider.js
│       ├── presentation/
│       │   ├── entityDetailsModalController.js
│       │   ├── swapiBrowserController.js
│       │   └── swapiBrowserView.js
│       └── main.js
└── test/
    ├── swapiResourceDefinitions.test.js
    ├── swapiResourceBrowser.test.js
    ├── swapiApiClient.test.js
    ├── starWarsArtworkProvider.test.js
    ├── entityDetailsModalController.test.js
    ├── swapiBrowserView.test.js
    ├── swapiBrowserController.test.js
    ├── main.test.js
    └── testDomEnvironment.js
```

The code is organised in **DDD-inspired layers** — not textbook Domain-Driven Design, but the same underlying idea: keep domain rules, application logic, infrastructure concerns and presentation separate so each can change independently. Every file is named after the single thing it does, so the folder listing itself is a table of contents for the architecture.

| Layer | Module | Responsibility |
|---|---|---|
| `domain` | `swapiResourceDefinitions.js` | What the app knows: supported resources, display fields, sorting rules. No dependencies on anything else. |
| `application` | `swapiResourceBrowser.js` | Orchestrates the "load a resource, select an entity" use case. Knows the domain rules, nothing about the DOM or HTTP. |
| `infrastructure` | `swapiApiClient.js` | Talks to SWAPI and returns raw resource collections. |
| `infrastructure` | `starWarsArtworkProvider.js` | Resolves artwork image URLs through a fallback chain and translates each provider's response shape into a plain candidate list. |
| `presentation` | `swapiBrowserView.js` | Renders domain entities into DOM — status, cards, the "jump to" picker, and the details pane. |
| `presentation` | `entityDetailsModalController.js` | Owns one modal's visibility, backdrop and keyboard handling. |
| `presentation` | `swapiBrowserController.js` | Wires page DOM events to the application and view layers. Testable with fakes, no real network required. |
| — | `main.js` | The composition root — the one place that builds every dependency and wires the whole app together. |

This is intentionally lightweight. A read-only explorer over public APIs doesn't need aggregates, repositories or persistence patterns, and adding them would only add ceremony without solving a real problem. Good architecture is the minimum structure that keeps change safe, not the maximum number of patterns.

## Design decisions and trade-offs

### Clean code and SOLID

The codebase leans on a few practical habits rather than a strict checklist:


Functions, files and parameters are named to communicate intent (`assertSupportedResource` rather than a bare lookup, `resourceName` rather than the ambiguous `resource`, `getResourceCollection` rather than a bare `get`), dependencies are always explicit, and unnecessary abstraction is avoided — the aim is code that's easy to read and safe to change, not code that ticks every design-pattern box.

### Functional composition over classes

The app uses factory functions and closures rather than `class`. There's no real inheritance hierarchy here (a `Character` isn't a specialised `Entity`) — most of the code just transforms data and coordinates a few collaborators. Factories keep state ownership explicit, make dependency injection lightweight (plain function arguments, no DI container needed), and keep test doubles simple to swap in.

### Isolating artwork behind a fallback chain

SWAPI doesn't provide character artwork, and the external image sources used to fill that gap each return differently shaped data. `starWarsArtworkProvider.js` absorbs that inconsistency: it tries a preferred source, falls back to another if needed, and finally falls back to a placeholder — returning an ordered list of candidates the UI can step through if an image fails to load. This keeps third-party quirks out of the domain and presentation layers, at the cost of a few extra external dependencies — a trade-off worth making since artwork is part of the intended experience.

### Atomic state updates

`swapiResourceBrowser.loadResource()` updates the selected resource and its entities together, once the fetch resolves — avoiding a moment where the UI shows the new resource name against the previous resource's data.

## Testing and coverage

Run the complete test suite with:

```bash
npm test
```

Testing is organised around behaviour and boundaries, with an 80% coverage threshold for lines, statements, functions and branches (see `vitest.config.js`):

- **Domain** (`swapiResourceDefinitions.test.js`) — resource definitions, sorting and validation rules.
- **Application** (`swapiResourceBrowser.test.js`) — loading, sorting, state isolation and failed-load behavior.
- **Infrastructure** (`swapiApiClient.test.js`, `starWarsArtworkProvider.test.js`) — HTTP responses, network errors, artwork fallback paths and caching.
- **Presentation** (`entityDetailsModalController.test.js`, `swapiBrowserView.test.js`, `swapiBrowserController.test.js`) — modal behavior, DOM rendering, keyboard interaction, stale requests and event wiring.
- **Composition** (`main.test.js`) — integration through the real composition root with only the network faked.

`testDomEnvironment.js` centralises the page markup fixture so DOM tests use the same structure as `index.html`. The artwork provider accepts `fetch` as an injected dependency, so tests use deterministic fakes instead of live third-party APIs.

## Interview Task and Approach

This project was built for the SWAPI Explorer interview task, with a deliberately small scope and a roughly two-hour time budget. The priority was a working, understandable application with visible engineering decisions rather than a large feature set.

### Priorities

- **Working product:** load and browse Characters, Films, Planets and Starships from SWAPI.
- **Clear boundaries:** keep domain rules, application state, infrastructure adapters and DOM presentation separate.
- **Testable design:** inject network, artwork and view dependencies so each boundary can be tested without live services.
- **Resilient UI:** handle failed requests, missing artwork, keyboard activation and stale overlapping resource requests.

### Deliberate trade-offs

- Vanilla JavaScript and static HTML/CSS keep the runtime and setup small for a read-only explorer.
- The application supports four resources rather than every SWAPI collection, keeping resource-specific display rules clear.
- Artwork is handled through a separate adapter because image providers have different response shapes and failure modes.
- The domain uses configuration data instead of introducing classes, repositories or persistence that the task does not require.

### Considered but not completed

- Runtime validation of external API response shapes.
- Request cancellation, timeouts and retry/backoff for transient failures.
- Pagination or search if the dataset grows.
- Automated CI, a formal accessibility audit and broader browser-level testing.

### AI assistance

I used GitHub Copilot as a pair-programming aid to explore implementation options, identify edge cases, improve test coverage and review refactoring ideas. I kept the architectural decisions and trade-offs under my control: suggestions were checked against the codebase, implemented selectively, and verified with the test suite and coverage report.
