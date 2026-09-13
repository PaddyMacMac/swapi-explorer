# SWAPI Explorer

A dependency-light vanilla JavaScript application for exploring **Characters, Films, Planets and Starships** from SWAPI. Results are rendered as accessible cards and can be opened in a detail modal.

## Features

- Browse Characters, Films, Planets and Starships
- Artwork on cards and detail modals
- **Character artwork support with a dedicated `people → characters` mapping**
- Curated artwork metadata with a Visual Guide fallback
- If the primary image itself fails to load, the browser automatically tries the fallback image
- Resource-specific fallback icons when no image can be loaded
- Alphabetical "Jump to…" picker
- Keyboard-operable cards and modal
- Loading and error states
- Automated domain, application, infrastructure and UI tests

## Preview

![SWAPI Explorer](public/images/Screenshot.png)

## Live demo

[View SWAPI Explorer](https://paddymacmac.github.io/swapi-explorer/)

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

Then open `http://127.0.0.1:8080`.

### Test

```bash
npm test
npm run test:watch
npm run coverage
```

## Architecture

The project uses a small DDD-inspired layered design. Domain rules do not know about HTTP or the DOM; infrastructure adapters do not render; UI modules do not fetch data.

```text
src/js/
├── domain/
│   └── resources.js
├── application/
│   └── explorer.js
├── infrastructure/
│   ├── swapiClient.js
│   └── starWarsArtworkClient.js
├── ui/
│   ├── render.js
│   └── modal.js
└── app.js
```

### Layer responsibilities

| Layer | Responsibility |
|---|---|
| `domain` | Supported resources, display rules and sorting |
| `application` | Resource loading and selection use cases |
| `infrastructure` | External REST/API boundaries |
| `ui` | DOM rendering and modal interaction |
| `app.js` | Composition root and browser event wiring |

This is intentionally pragmatic rather than a full enterprise DDD model. There are no aggregates or repositories because the application has no business need for them.

## Artwork design

`infrastructure/starWarsArtworkClient.js` is the single artwork adapter. Its public vocabulary describes the domain concern rather than the implementation detail of "REST":

- `createStarWarsArtworkClient()`
- `getArtworkImageCandidates(entity, resource)`
- `getArtworkApiUrl(entity, resource)`
- `getVisualGuideImageUrl(entity, resource)`
- `clearCache()`

### Character image flow

SWAPI calls the resource `people`, while the artwork API and Visual Guide call it `characters`. That translation lives entirely in the infrastructure adapter:

| SWAPI resource | Artwork resource | Visual Guide path |
|---|---|---|
| `people` | `characters` | `characters/{id}.jpg` |
| `films` | `films` | `films/{id}.jpg` |
| `planets` | `planets` | `planets/{id}.jpg` |
| `starships` | `starships` | `starships/{id}.jpg` |

The adapter first requests curated `image_url` metadata from `https://swapi.thehiveresistance.com/api`. It then adds the deterministic Visual Guide URL as a fallback candidate. The UI loads candidates in order and advances to the next candidate if an image emits an `error` event.

This is important for Characters: even when the metadata service has no character image, or its returned image URL is broken, the card/modal can still display the corresponding Visual Guide image.

Artwork lookups are cached by API request URL. Network failures and unsuccessful responses do not break rendering.

## Clean-code refactor

An earlier pass removed a set of duplicated modules (`src/js/api.js`, an older
`render.js`/`modal.js`) so the application has one implementation per
responsibility, and gave the artwork adapter a small, intention-revealing
interface (`getArtworkImageCandidates()`) instead of exposing implementation
details to the UI.

A second pass, described here, focused on remaining smells inside the
already-layered code: primitive obsession, duplicated guard logic, a
validation call whose result was silently discarded, and hidden shared
mutable state.

| Smell | Where | Fix |
|---|---|---|
| Positional tuples (`['Height', 'height', ' cm']`) forced every reader to remember index 0/1/2 meant label/property/suffix | `domain/resources.js` | Replaced with a `field(label, property, suffix)` factory returning a named `{ label, property, suffix }` object |
| A validation call's return value was fetched and thrown away purely for its side effect | `application/explorer.js` | Added `assertSupportedResource()` to the domain module; the explorer calls it explicitly instead of discarding `getResourceDefinition()`'s result |
| State was set out of order: `selectedResource` was updated *before* the corresponding entities had actually loaded, so a mid-flight `getState()` call could report a resource with the previous resource's entities | `application/explorer.js` | Both fields are now written together after the fetch resolves |
| An eight-line optional-chaining ladder guessed every provider's JSON shape one field at a time; adding a provider meant editing the chain | `infrastructure/starWarsArtworkClient.js` | Replaced with a declarative `IMAGE_URL_PATHS` list that's iterated — adding a provider shape is now a one-line addition |
| Three URL builders each repeated "resolve the artwork resource name and entity id, bail if either is missing" | `infrastructure/starWarsArtworkClient.js` | Extracted a shared `resolveArtworkContext()` |
| Modal open/close state (`backdrop`, `escapeHandler`) lived in module-level variables — a hidden global shared by every caller and every test | `ui/modal.js` | Converted to a `createModalController(modal)` factory; each modal instance owns its own state |
| `app.js` repeated the "render results, render picker, disable the details button" sequence in both the success and error branches, and mixed dependency construction with event wiring | `app.js` | Extracted `renderEntityCollection()`; extracted `createSwapiExplorerApp({ explorer, artworkClient })` as an explicit composition root, so `app.js`'s module scope is just "build the app, start it if we're in a browser" |
| `createImage`/`createFallbackImage` named the concept as "image" even though the module's own vocabulary elsewhere is "artwork" | `ui/render.js` | Renamed to `createArtworkElement`/`createFallbackArtwork` for consistency with the infrastructure layer's naming |

The artwork adapter still follows a small-interface approach: the UI depends
only on `getArtworkImageCandidates()`, while URL construction,
provider-specific resource naming, ID extraction, caching and fallback
policy remain inside infrastructure.

## Testing strategy

Tests cover:

- Resource definitions, field shape and sorting, including the explicit `assertSupportedResource` guard
- The explorer use case, including its rejection of an unsupported resource before any client call is made
- SWAPI HTTP success, HTTP failure and network failure
- Artwork resource mapping and URL construction
- Character artwork resolution
- Primary-image → Visual Guide fallback behaviour
- Artwork caching
- Card and modal image rendering
- Safe DOM rendering
- Modal controller behaviour, including that two controller instances don't share backdrop/escape state
- Browser event wiring

The artwork client accepts an injected `fetch`, making tests deterministic and independent of the live artwork API.

## Data sources

Application data comes from SWAPI.

Artwork metadata comes from the deployed Star Wars artwork API used by the project, with the Star Wars Visual Guide used as a fallback image source.

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
│   ├── css/
│   │   └── style.css
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

## Character artwork resolution

Character cards and detail modals now resolve artwork from the dedicated `akabab/starwars-api` character endpoint (`/id/{id}.json`), whose character records expose an `image` field. This is intentionally separate from the SWAPI data source because the SWAPI people records do not provide image metadata. If that request fails or has no image, the renderer falls back to the Star Wars Visual Guide character asset.

The artwork adapter therefore has this dependency flow:

`SWAPI people entity -> character artwork API -> image URL -> Visual Guide fallback -> UI fallback`

This makes character image retrieval deterministic and prevents the character UI from depending on the unavailable/empty artwork metadata response that previously caused the cards and modal to show only the fallback icon.
