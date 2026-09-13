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
npm run coverage   # generate the coverage report
```

## Features

- Browse Characters, Films, Planets and Starships
- Load resource data directly from SWAPI
- Resolve character artwork through a fallback chain, so a missing image never blocks the UI
- View entity details in a modal
- Clear separation between rendering, application logic, domain rules and HTTP concerns
- Unit and integration-style tests at every architectural boundary

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

The code is organised in **DDD-inspired layers** — not textbook Domain-Driven Design, but the same underlying idea: keep domain rules, application logic and infrastructure concerns separate so each can change independently.

| Layer | Responsibility |
|---|---|
| `domain` | What the app knows: supported resources, display fields, sorting rules. No dependencies on anything else. |
| `application` | Orchestrates the "load a resource, select an entity" use case. |
| `infrastructure` | Talks to SWAPI and the artwork APIs, and translates their responses into a shape the app understands. |
| `ui` | Renders data to the DOM and manages modal state. |
| `app.js` | The composition root — the one place that wires everything together. |

This is intentionally lightweight. A read-only explorer over public APIs doesn't need aggregates, repositories or persistence patterns, and adding them would only add ceremony without solving a real problem. Good architecture is the minimum structure that keeps change safe, not the maximum number of patterns.

## Design decisions and trade-offs

### Clean code and SOLID

The codebase leans on a few practical habits rather than a strict checklist:

- **Single Responsibility** — each module has one clear job (`swapiClient.js` only talks to SWAPI, `modal.js` only manages the modal, etc.)
- **Open/Closed** — supported resources and image paths are defined as data, so adding a new resource doesn't mean adding another `if`/`switch` branch
- **Dependency Inversion** — collaborators like the SWAPI client are passed into factory functions (e.g. `createExplorer({ swapiClient })`) rather than constructed deep inside business logic, which keeps the code both testable and easy to follow

Functions are named to communicate intent (`assertSupportedResource` rather than a bare lookup), dependencies are always explicit, and unnecessary abstraction is avoided — the aim is code that's easy to read and safe to change, not code that ticks every design-pattern box.

### Functional composition over classes

The app uses factory functions and closures rather than `class`. There's no real inheritance hierarchy here (a `Character` isn't a specialised `Entity`) — most of the code just transforms data and coordinates a few collaborators. Factories keep state ownership explicit, make dependency injection lightweight (plain function arguments, no DI container needed), and keep test doubles simple to swap in.

### Isolating artwork behind a fallback chain

SWAPI doesn't provide character artwork, and the external image sources used to fill that gap each return differently shaped data. `starWarsArtworkClient.js` absorbs that inconsistency: it tries a preferred source, falls back to another if needed, and finally falls back to a placeholder — returning an ordered list of candidates the UI can step through if an image fails to load. This keeps third-party quirks out of the domain and UI layers, at the cost of a few extra external dependencies — a trade-off worth making since artwork is part of the intended experience.

### Atomic state updates

`explorer.loadResource()` updates the selected resource and its entities together, once the fetch resolves — avoiding a moment where the UI shows the new resource name against the previous resource's data.

## Testing and coverage

Testing is organised around behaviour and boundaries rather than chasing a coverage number for its own sake:

- **Domain** — resource definitions, sorting/validation rules
- **Application** — the explorer use case, successful loads, rejecting unsupported resources before a network call is even made
- **Infrastructure** — SWAPI success/failure responses, network errors, artwork resolution and fallback behaviour, caching
- **UI** — card and modal rendering, safe DOM construction, independent modal state
- **Composition** — event wiring through `app.js`

The artwork client accepts `fetch` as an injected dependency, so tests use deterministic fakes instead of hitting live third-party APIs. The project is strongly influenced by TDD: dependencies are shaped so each boundary can be tested in isolation, and tests were also used to validate AI-suggested implementations rather than accepting generated code at face value.

## Working with Claude

Claude was used as a pair-programming and prototyping aid throughout the build — helping explore implementation approaches, suggest test cases and edge cases (unsupported resources, network failures, artwork fallback paths, caching), and prototype front-end rendering and modal interactions before they were reviewed against the project's architecture.

Every suggestion was treated as a starting point, not a final answer. Generated code was evaluated against the same standards as any hand-written code: separation of concerns, testability, explicit dependencies, and whether the abstraction was actually justified by the problem. The value Claude added was speed — shortening the path from idea to prototype to tested implementation — while the architectural and design decisions remained mine.

## What I'd do with more time

The current scope is deliberately small and fully tested. These are additions I considered but left out to stay within time, not gaps in the current design:

**Robustness**
- Validate external API responses at the infrastructure boundary (e.g. with Zod)
- Add retry/backoff for transient artwork failures
- Add request timeouts via `AbortController`

**Performance and scale**
- Pagination or virtualisation, if the dataset grew
- A debounced search/filter over loaded entities

**Security**
- A Content Security Policy restricting allowed external origins
- Subresource Integrity for any third-party scripts/styles
- Clearer documentation of the safe DOM-rendering approach

**DevOps / CI**
- GitHub Actions to run tests and coverage on every pull request
- Automated deployment to GitHub Pages
- A minimal Docker/nginx setup, if deployment needs grew beyond a static site

**Code quality tooling**
- ESLint + Prettier to enforce conventions automatically
- TypeScript (or stricter JSDoc) for compile-time safety on resource/entity shapes

**UX and accessibility**
- An accessibility audit with axe/Lighthouse
- Persisting the last-viewed tab via `localStorage`

## Final thoughts

The most important decision here isn't any single technology choice — it's the combination of clear boundaries, explicit dependencies, and tests that make those boundaries safe to change. The improvements above are extensions for a larger, longer-lived codebase, not evidence that this version is incomplete for what it set out to do.