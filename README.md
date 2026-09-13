# SWAPI Explorer

A dependency-light vanilla JavaScript app for browsing **Characters, Films, Planets and Starships** from [SWAPI](https://swapi.dev), with artwork, a detail modal, and full test coverage.

![SWAPI Explorer](public/images/Screenshot.png)

**[Live demo](https://paddymacmac.github.io/swapi-explorer/)**

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Language | Vanilla JavaScript (ES modules) | No framework overhead to explain away — every architectural decision below is visible in plain JS, not hidden behind React/Vue conventions |
| Markup/styling | Static HTML5 + hand-written CSS | No CSS framework; small enough surface area that a design system would be overkill |
| Testing | [Vitest](https://vitest.dev) + jsdom | Fast, native ESM support, Jest-compatible API, built-in coverage via `@vitest/coverage-v8` |
| Dev server | `http-server` (via `npx`) | Static files only — no bundler, no build step, no transpilation. What runs locally is exactly what ships |
| Data sources | [SWAPI](https://swapi.dev) (core data), a hosted artwork metadata API, the [akabab Star Wars API](https://akabab.github.io/starwars-api/) (character images), Star Wars Visual Guide (fallback images) | Multiple third-party APIs with inconsistent shapes — a good excuse to show adapter/anti-corruption-layer thinking |

No build tooling was chosen deliberately: it keeps the codebase's structure the *only* thing doing the work, which is the point of this exercise.

## Architecture: DDD-inspired layering

```text
src/js/
├── domain/           what the app knows, independent of how it's shown or fetched
│   └── resources.js
├── application/       use-case orchestration
│   └── explorer.js
├── infrastructure/     external boundaries (HTTP)
│   ├── swapiClient.js
│   └── starWarsArtworkClient.js
├── ui/                DOM rendering & interaction
│   ├── render.js
│   └── modal.js
└── app.js             composition root
```

| Layer | Responsibility | Depends on |
|---|---|---|
| `domain` | Which resources exist, their display fields, sorting | Nothing |
| `application` | "Load a resource, then select an entity" use case | `domain` |
| `infrastructure` | REST calls to SWAPI and the artwork APIs | Nothing (returns plain data) |
| `ui` | Renders entities to the DOM, owns modal state | Nothing (takes data in) |
| `app.js` | Builds the dependency graph, wires DOM events | Everything |

The dependency rule is enforced by convention, not tooling: `domain` never imports `infrastructure` or the DOM; `infrastructure` never renders; `ui` never fetches. `app.js` is the only module that knows every layer exists — that's intentional, it's the composition root.

This is a **pragmatic** DDD application, not a textbook one. There are no aggregates, repositories, or domain events, because a read-only explorer over a public API has no invariants to protect and no persistence to abstract. Reaching for that machinery here would be over-engineering; knowing *when to stop* applying a pattern is as much a design decision as applying it.

## SOLID, applied

| Principle | Where it shows up |
|---|---|
| **Single Responsibility** | Each module has one reason to change: `resources.js` changes only if display rules change; `swapiClient.js` only if the SWAPI contract changes; `modal.js` only if modal behaviour changes |
| **Open/Closed** | `RESOURCE_DEFINITIONS` and `IMAGE_URL_PATHS` are data, not `if`/`switch` chains — adding a new resource or a new artwork-provider shape means adding an entry, not editing existing logic |
| **Liskov Substitution** | `swapiClient` and `artworkClient` are structural contracts (an object exposing `.get()` / `.getArtworkImageCandidates()`), so test doubles and real HTTP clients are interchangeable anywhere one is expected |
| **Interface Segregation** | `starWarsArtworkClient` exposes one call the UI actually needs — `getArtworkImageCandidates()` — instead of leaking `fetch`, cache internals, or URL-building helpers into the rendering code |
| **Dependency Inversion** | `createExplorer({ swapiClient })` and `createSwapiExplorerApp({ explorer, artworkClient })` take their dependencies as arguments. The composition root decides what's real; every other module depends on a shape, not a concrete implementation |

## Why functional over class-based

The whole app is built from factory functions and closures rather than `class`. That's a deliberate trade-off, not a default:

- **State is opt-in, not inherited.** A factory like `createModalController(modal)` closes over exactly the variables it needs (`backdrop`, `escapeHandler`) and returns only the methods that should be public. There's no `this`, no risk of a subclass reaching into private state, and no ambiguity about what a method can mutate.
- **Dependency injection falls out for free.** `createExplorer({ swapiClient })` and `createStarWarsArtworkClient(baseUrl, { fetch, cache })` take collaborators as plain arguments. Swapping in a fake `fetch` for tests, or a fake `swapiClient` for the app, needs no mocking framework, no inheritance hierarchy, and no DI container.
- **Composition beats hierarchy for this problem.** Nothing in the domain is naturally "a kind of" something else — there's no `Character extends Entity` relationship to model. The problems here are all "given this data, produce that shape" — a natural fit for pure functions (`getEntityName`, `sortEntitiesByName`, `assertSupportedResource`) that are trivial to unit test in isolation, with no instance to construct first.
- **`Object.freeze` gives real encapsulation.** Returned objects like the artwork client are frozen, so consumers can't monkey-patch a method — something `class` instances don't prevent by default without extra boilerplate (`#private` fields, `Object.freeze(this)` in the constructor, etc.).

Classes are a good tool when you need shared mutable state across many instances with inheritance-based specialisation. Nothing in this app needs that, so the simpler tool won.

## Key design decisions

**Artwork resolution is a fallback chain, isolated in one adapter.** SWAPI's `people` resource has no image data, and the artwork providers each use different resource names and JSON shapes. `starWarsArtworkClient.js` absorbs all of that: it tries a character-specific API, falls back to a general artwork metadata API, and falls back again to a deterministic Visual Guide URL — returning an ordered list of candidate URLs. The `<img>` element itself advances to the next candidate on an `error` event, so a broken or missing image never blocks rendering. Results are cached by request URL.

**Validation isn't allowed to be a no-op.** An earlier version called `getResourceDefinition(resource)` purely to trigger its internal validation and discarded the result — a validation call whose outcome nobody used. It's now `assertSupportedResource(resource)`, a function whose entire purpose is the side effect, so the intent at the call site matches what the code does.

**State is written atomically.** `explorer.loadResource()` used to set `selectedResource` before the matching entities had loaded, so a `getState()` call mid-fetch could report the *new* resource with the *previous* resource's entities. Both fields are now written together, after the fetch resolves, so there's no window where the two are out of sync.

## Testing strategy

Each layer is tested at the boundary that matters to it:

- **Domain** — field/sort rules, and that `assertSupportedResource` actually rejects unsupported resources
- **Application** — the explorer use case, including that it rejects an unsupported resource *before* any network call is made
- **Infrastructure** — SWAPI success/HTTP-failure/network-failure, artwork resource-name mapping, character-artwork resolution, the primary→fallback image chain, and caching
- **UI** — card/modal rendering, safe DOM construction, and that two `createModalController` instances don't share backdrop/escape state
- **App** — browser event wiring via the composition root

The artwork client takes `fetch` as an injected dependency, so tests run deterministically against fakes instead of the live third-party API.

## Getting started

**Requirements:** Node.js 18+, a modern browser.

```bash
npm install
npm start   # serves at http://127.0.0.1:8080
```

### Running the tests

```bash
npm test           # run once
npm run test:watch # re-run on file changes
npm run coverage    # coverage report (@vitest/coverage-v8)
```

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
│       ├── domain/resources.js
│       ├── application/explorer.js
│       ├── infrastructure/swapiClient.js
│       ├── infrastructure/starWarsArtworkClient.js
│       ├── ui/render.js
│       ├── ui/modal.js
│       └── app.js
└── test/
    ├── domain.test.js
    ├── swapiClient.test.js
    ├── artworkClient.test.js
    ├── application.test.js
    ├── render.test.js
    ├── modal.test.js
    └── app.test.js
```