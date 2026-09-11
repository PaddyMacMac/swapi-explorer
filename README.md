# SWAPI Explorer

A vanilla JavaScript web application for exploring data from the [Star Wars API](https://swapi.info).

The application allows users to browse **Characters, Films, Planets, and Starships**, view results in a responsive card layout, and open detailed information for individual entities.

Built with **plain JavaScript ES modules**, **Bootstrap 5**, and **Vitest** — with no frontend framework or bundler.

## Demo

[View SWAPI Explorer](https://paddymacmac.github.io/swapi-explorer/)

## Features

* Browse Characters, Films, Planets, and Starships
* Responsive card-based layout
* "Jump to..." dropdown for quickly finding an entity
* Alphabetically sorted entity selection
* Detailed information displayed in a modal
* Loading and error states
* Responsive design for desktop and mobile
* Hand-written modal behaviour without requiring Bootstrap's JavaScript bundle
* Automated tests covering the application's JavaScript modules
* **99% statement/line coverage and 100% function coverage**

## Technologies

* JavaScript (ES modules)
* HTML5
* CSS3
* Bootstrap 5
* Node.js
* Vitest
* jsdom
* SWAPI

## Project Structure

```text
.
├── index.html
├── package.json
├── vitest.config.js
├── public/
│   ├── favicon.svg
│   └── images/
│       └── logo.svg
├── src/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       ├── render.js
│       ├── modal.js
│       └── app.js
└── test/
    ├── api.test.js
    ├── render.test.js
    ├── modal.test.js
    └── app.test.js
```

### JavaScript modules

* **`api.js`** — Handles API requests and contains no DOM logic.
* **`render.js`** — Converts application data into DOM elements and contains no API requests.
* **`modal.js`** — Handles opening and closing the details modal.
* **`app.js`** — Connects the application together and handles user interactions.

This separation keeps API, rendering, modal behaviour, and application logic relatively independent and easier to test.

## Getting Started

### Requirements

* Node.js 18+
* A modern web browser

Node.js is required for running the development server and tests. The application itself runs in the browser.

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

### Running the application

```bash
npm start
```

This starts a static HTTP server using `http-server`.

If the browser does not open automatically, visit the URL shown in the terminal, typically:

```text
http://127.0.0.1:8080
```

The application needs to be served over HTTP rather than opened directly with `file://` because ES modules are restricted when loaded from the local file system.

Alternatively, you can use another static server:

```bash
npx serve .
```

or:

```bash
python3 -m http.server 8080
```

## Testing

Tests are written using **Vitest** and run against a simulated DOM provided by **jsdom**.

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate a coverage report:

```bash
npm run coverage
```

The coverage report is generated in:

```text
coverage/index.html
```

The current test suite achieves:

* **99% statements/lines**
* **100% functions**

The generated `coverage/` directory is excluded from Git because it is a build artifact rather than source code.

## Test Coverage

### `api.test.js`

Tests API behaviour including:

* Successful requests
* JSON parsing
* Non-OK HTTP responses
* Network failures

### `render.test.js`

Tests rendering functionality including:

* Status messages
* Error states
* Entity name handling
* Card rendering
* Empty results
* Clearing previous results
* Alphabetical sorting
* Dropdown population
* Entity detail rendering

### `modal.test.js`

Tests modal behaviour including:

* Opening and closing
* ARIA attributes
* Backdrop creation and removal
* Backdrop-click closing
* Escape-key closing
* Safe behaviour when the modal is already closed

### `app.test.js`

Tests application behaviour including:

* Resource loading
* Tab switching
* Entity selection
* Error and success states
* Dropdown behaviour
* Button disabled/enabled states
* Opening and closing the modal
* Handling invalid selections

## Responsive Design

The application uses Bootstrap's responsive grid alongside custom CSS.

* Cards display three per row on medium and larger screens.
* Cards stack into a single column on smaller screens.
* Navigation controls wrap on narrow screens.
* The entity dropdown expands to the available width on very small screens.
* Modal content remains constrained to the viewport.

The layout is designed to remain usable across desktop, tablet, and mobile screen sizes.

## Design Decisions

### Why no Bootstrap JavaScript?

The application uses Bootstrap's CSS for the modal styling but does not depend on Bootstrap's JavaScript bundle.

The modal behaviour is implemented in `modal.js`, which handles the small amount of functionality required:

* Toggling modal visibility
* Managing ARIA attributes
* Creating and removing the backdrop
* Closing via backdrop clicks
* Closing via the Escape key

This removes an unnecessary JavaScript dependency for a relatively small piece of functionality.

### Performance considerations

The application avoids unnecessary external dependencies where possible.

An earlier version used Google Fonts through CSS `@import`. The current version uses the system font stack instead, avoiding an additional external network request before the page can render.

## Visual Design

The project includes original SVG artwork for the application logo and favicon.

The interface uses a dark theme with gold accents and includes hover and entrance animations for cards.

The artwork is original project artwork and is not intended to reproduce the official Lucasfilm/Star Wars trademark logo.

## What This Project Demonstrates

This project demonstrates:

* Working with a third-party REST API
* Asynchronous JavaScript and `fetch`
* ES modules and separation of concerns
* DOM manipulation
* Responsive web design
* Accessibility considerations such as ARIA attributes and keyboard interaction
* Error and loading-state handling
* Automated unit/integration testing
* Mocking API requests with Vitest
* DOM testing with jsdom
* Test coverage and maintainable project structure

## Author

**Paddy Mac**

[GitHub](https://github.com/PaddyMacMac)