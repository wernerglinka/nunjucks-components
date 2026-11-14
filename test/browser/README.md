# Browser tests

Real-browser checks of the built site, in Chromium, Firefox and WebKit. They
catch what the static suites cannot: a script that throws on load, a control
that stops responding, a component that breaks after a page transition, or
behaviour that differs between engines.

## Running

```bash
npm run build          # or leave `npm start` running; the tests read build/
npm run test:browser
BROWSERS=webkit npm run test:browser   # one engine
```

They are not part of `npm test`: they need a build, network access (pages load
libraries and media from CDNs) and about two to three minutes. Without a
`build/` directory every test skips itself.

First-time setup downloads the engines into Playwright's cache:

```bash
npx playwright install chromium firefox webkit
```

An engine that cannot start on the machine is reported as skipped with the
reason, not as a failure.

## What each file guards

- **`pages.browser.js`** loads every page in `build/` and fails on console
  errors, uncaught exceptions, and failed or 4xx/5xx requests to the site
  itself. Third-party requests are not judged. Known third-party console noise
  is listed with its reason in `ALLOWED_MESSAGES` in `lib/harness.js`; keep that
  list short.
- **`interactions.browser.js`** runs one scripted interaction per interactive
  component and asserts the visible outcome, then repeats the accordion and
  theme toggle after a page transition, where a listener attached twice would
  toggle twice and leave the state unchanged.

## Adding an interaction

Append an entry to `INTERACTIONS` with a `name`, the `path` of a page that shows
the component, and a `run(page)` that performs the interaction and asserts the
result. Components update state a moment after a click, so wait for outcomes
with `eventually()` or a locator's `waitFor()` instead of reading them at once.

## Helpers (`lib/`)

- `server.js` serves `build/` on a free local port, so no dev server is needed.
- `harness.js` picks the engines, launches them, lists the pages, and watches a
  page for problems.
