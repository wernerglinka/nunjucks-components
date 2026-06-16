# Schema-consistency tests

Each section component declares its data shape four times over, and nothing in
the build keeps those declarations in agreement:

| Where | What it is | Source of truth? |
|-------|------------|------------------|
| `<name>.njk` | the template — what data the component actually reads | **yes** |
| `manifest.json` → `validation` | dotted-path rules (`type`, `enum`, `const`) the build enforces | derived |
| `manifest.json` → `fields` | the authoring form schema a downstream editor consumes (composed via `$use` / `$extends: ["commons"]`) | derived |
| `<name>.yml` | an example instance used by the demo site | derived |

When these drift apart, an author can fill in a form that emits data the
component cannot render. These tests catch that drift in CI.

## Running

```bash
npm run test:schema      # this suite only, no build required
npm test                 # the whole test/ tree under node --test
```

The whole project runs on Node's native test runner (`node --test`). `npm test`
runs `test/**/*.test.js`; `test:schema` narrows to this directory.

## What each file guards

- **`example-validation.test.js`**
  - **A** — every `<name>.yml` validates clean against its own `validation`
    block, reusing the library's own validator
    (`metalsmith-bundled-components`, re-exported from `lib/validator.js`). What
    passes here passes the real build. Catches stale example values (e.g. a
    `sectionType` that no longer matches the component).
  - **A2 (drift #6)** — every non-structural key an example sets is authorable
    via the resolved `fields`, declared in `validation`, or a documented
    build/runtime key. Catches example keys the template never reads (the
    `expandFirst`-vs-`expandIndex` class) that validate fine yet do nothing.
- **`fields-validation-agreement.test.js` (B)** — for every constrained
  validation property, the matching `fields` node uses a compatible widget:
  `number → widget:number`, `enum → select`, `array+enum → multiselect`,
  `object → a field group (never a single leaf)`, `boolean → checkbox`. Catches
  the artwork-`dimensions`, numeric-as-text, social-shares-platforms and
  `code.theme` classes of drift.
- **`enum-defaults.test.js` (C)** — a select/multiselect `default` is a member
  of its `enum`, and where both `fields` and `validation` enum the same path the
  two enums are equal. Catches the pricing-table stale-enum class.
- **`render.test.js` (D)** — the pragmatic template-alignment oracle. Renders
  the real `.njk` from (1) materialised `fields` defaults and (2) the example,
  asserting it does not throw and that the output contains no `NaN`,
  `[object Object]`, or `undefined`.
- **`schema-resolution.test.js`**
  - **E** — every `fields` block resolves (`$use`/`$extends`) and materialises a
    defaults object without error.
  - **E2** — when a build is present, the emitted
    `build/assets/components-schema.json` matches the in-process resolution,
    section-for-section. This catches a broken emit or a stale build. Skipped
    when there is no build, so `npm run test:schema` runs standalone.

## Why static checks AND a render test

Statically parsing Nunjucks (macros, dynamic includes, partial imports) to
recover the `section.*` paths a template reads is brittle, so template alignment
(D) is done by rendering rather than parsing. The static checks (A/B/C/E) are
cheap, deterministic, and have no false positives, so they are hard gates; the
render test trades precision for robustness and is the one place we accept
judgement calls:

- **`DATA_DRIVEN_SECTIONS`** (in `lib/manifest-schema.js`) — sections that
  render from site-level data (collections, author records, map/logo feeds)
  emit little from their own defaults, and what they emit can legitimately
  contain an empty token (logos-list computes `count * width` → `NaN` with no
  logos; maps reads `data.maps[id]`). For these we assert only that rendering
  does not throw and skip the token scan. Every other section gets the full
  check.
- **`RUNTIME_KEY_ALLOWLIST`** (same file) — the only escape hatch for A2: keys a
  build plugin injects rather than the author (collection-list's `pagingParams`,
  filled by the pagination plugin). Kept short and justified.

## Helpers (`lib/`)

- `manifest-schema.js` — loads manifests/examples and adds the test-only
  helpers (materialise defaults, walk paths, flatten instances). It does NOT
  reimplement `fields` composition: `resolveManifestFields` delegates to the
  bundler's `schema-emitter` `resolveFields`, the exact code that emits
  `build/assets/components-schema.json`, so the tests resolve what the editor
  consumes. Both it and the validator are imported by file path into
  `node_modules` because the plugin's package `exports` only publishes its
  plugin entry.
- `validator.js` — re-exports the library's section validator unchanged.
- `render-env.js` — builds a Nunjucks environment mirroring `metalsmith.js`
  (loader rooted at `lib/layouts`, all custom filters, the global `data` tree
  from `lib/data/*.json`).

When you add a section, no wiring is needed: the suite discovers it from
`lib/layouts/components/sections/`. If it is data-driven, add it to
`DATA_DRIVEN_SECTIONS`; if it carries a build-injected key, add that to
`RUNTIME_KEY_ALLOWLIST`.
