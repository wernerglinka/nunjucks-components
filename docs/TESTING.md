# Testing Guide

This project tests on two levels: the **build/structure** suite that proves the
site assembles correctly, and the **schema-consistency** suite that proves each
component's several descriptions of its own data shape stay in agreement. The
second is the more comprehensive and less obvious half, so most of this guide is
about it.

All tests run on Node's native test runner (`node --test`, asserting with
`node:assert`) — there is no Mocha, Jasmine, or Jest. Linting and formatting are
Biome (JS/JSON) and Stylelint (CSS); Nunjucks templates are hand-formatted.

```bash
npm test            # everything under test/**/*.test.js
npm run test:watch  # watch mode
npm run test:schema # just the schema-consistency suite (no build required)
npm run check       # Biome + Stylelint, no writes (the lint/format gate)
```

`npm test` runs all suites in one `node --test` invocation. A handful of
package-generator tests assert against a production build's `build/downloads`
and self-skip when it is absent — run `npm run build` first to exercise them.

---

## Why a schema-consistency suite exists

A section component declares its data shape **four times over**, and nothing in
the build keeps those declarations honest with each other:

| Where | What it is | Role |
|-------|------------|------|
| `<name>.njk` | the template — what data the component actually reads | **ground truth** |
| `manifest.json` → `validation` | dotted-path rules (`type`, `enum`, `const`) the build enforces | derived |
| `manifest.json` → `fields` | the authoring-form schema a downstream editor consumes, composed via `$use`/`$extends` | derived |
| `<name>.yml` | the example instance the demo site renders | derived |

When these drift, an author can fill in a form that emits data the component
cannot render — a class of bug that previously surfaced only when a human
noticed a broken page. The schema-consistency suite turns each way they can
disagree into an automated check. Real drift it has caught and now guards
against (all since fixed):

- `artwork` offered `dimensions` as a single text field while the template
  rendered `width`/`height`/`depth`/`unit` and validation typed it `object`.
- Numeric fields (`cycleTime`, `autoPlayDelay`, `logoWidth`, episode counts,
  `year`) used a text widget with string defaults like `"5000"` that fail the
  component's own number validation.
- `social-shares` offered `platforms` as `{name}` objects while the template
  iterated strings and validation typed an enum string array.
- `code.theme`, `pricing-table.tiers.layout`, and others carried `fields` enums
  that disagreed with the template / validation enum.
- `accordion.yml` set `expandFirst`, but the template reads `expandIndex`; the
  example silently did nothing.
- `maps.yml` declared `sectionType: mapping`, so the demo rendered no map.

---

## The invariants

The suite lives in [`test/schema-consistency/`](../test/schema-consistency/)
(see its [README](../test/schema-consistency/README.md) for the close-up). Each
file asserts one family of agreement.

| ID | File | Guards |
|----|------|--------|
| **A** | `example-validation.test.js` | every `<name>.yml` validates against its own `validation` block |
| **A2** | `example-validation.test.js` | every non-structural example key is authorable via `fields`, declared in `validation`, or an allowlisted runtime key (the `expandFirst` class) |
| **B** | `fields-validation-agreement.test.js` | `fields` widgets are compatible with `validation` (`number→number`, `enum→select`, `array+enum→multiselect`, `object→group`, `boolean→checkbox`) |
| **C** | `enum-defaults.test.js` | a select/multiselect `default` is a member of its `enum`; `fields` and `validation` enums for one path are equal |
| **D** | `render.test.js` | each template renders from materialised `fields` defaults and from the example without throwing and with no `NaN` / `[object Object]` / `undefined` in the output |
| **E** | `schema-resolution.test.js` | every `fields` block resolves (`$use`/`$extends`) and materialises defaults |
| **E2** | `schema-resolution.test.js` | the emitted `build/assets/components-schema.json` matches the in-process resolution, section-for-section (when a build is present) |
| **F** | `source-fields.test.js` | dynamic-options `source` fields are well-formed and resolve against the real data/collections oracle |

---

## The approach, and the principles behind it

### Reuse the library's own code, don't reimplement it

The two hard pieces of logic — validating a section, and resolving a `fields`
block's `$use`/`$extends` composition — are the bundler's own code, imported
rather than reproduced:

- **Validation** reuses `validateSection` from `metalsmith-bundled-components`
  (`lib/validator.js`). What passes the suite passes the real build, by
  construction.
- **Resolution** delegates to the bundler's `schema-emitter` `resolveFields`
  (`lib/manifest-schema.js`), the exact code that emits
  `build/assets/components-schema.json` for the downstream editor. The suite
  therefore checks the same artifact the editor consumes, and **E2** verifies
  the in-process resolution equals the emitted file.

Both are imported by file path into `node_modules` because the plugin's package
`exports` only publishes its plugin entry. The suite adds only test-only helpers
on top (materialise defaults, walk paths, load examples).

### Static checks where they are exact; a render oracle where parsing is brittle

Statically parsing Nunjucks — macros, dynamic includes, partial imports — to
recover the `section.*` paths a template reads is brittle and would itself need
testing. So template alignment (**D**) is done by **rendering the real
template** from materialised defaults and from the example, then scanning the
output for the tokens a shape mismatch leaks: `NaN` (a string fed to number
maths), `[object Object]` (a group printed where a scalar was expected), and
`undefined`. Everything else (A/A2/B/C/E/F) is a deterministic static check with
no false positives, so those are hard gates; the render test trades precision
for robustness.

### Two deliberate escape hatches, both documented

Honesty about coverage matters more than a green wall, so the two places the
suite relaxes are explicit and narrow (in `lib/manifest-schema.js`):

- **`DATA_DRIVEN_SECTIONS`** — components that render from site-level data
  (collections, author records, map/logo feeds) emit little from their own
  defaults, and what they emit can legitimately contain an empty-value token
  (logos-list computes `count * width` → `NaN` with no logos; maps reads
  `data.maps[id]`). For these, **D** asserts only that rendering does not throw
  and skips the token scan. Every other section gets the full check.
- **`RUNTIME_KEY_ALLOWLIST`** — the only escape hatch for **A2**: keys a build
  plugin injects rather than the author (collection-list's `pagingParams`,
  filled by the pagination plugin). Kept short and justified.

### Dynamic options: the `source` convention (F)

Some `select`/`multiselect` fields can't use a static `enum` because their valid
values are the *site's* data, known only at build time — which author, which
collection. They declare a `source` instead, which the editor resolves at
runtime:

```json
{ "widget": "select", "source": { "data": "author", "valueKey": "name" } }
{ "widget": "select", "source": { "collections": true } }
```

Invariant **F** holds these to the same standard as static enums: a select has
*exactly one* of `enum` or `source` (never both — a stale enum on a dynamic
picker — never neither), the `source` shape is valid, and it resolves against
the real oracle — a `data` namespace is a `lib/data/<name>.json` array whose
entries all carry the value key, and `collections: true` requires the build's
`collections()` config to be non-empty. (Not to be confused with a field
literally named `source`, e.g. accordion's `faqs.source` text input.)

---

## The build/structure suite

The original suite (top-level `test/*.test.js`) covers the pipeline rather than
the schema:

- `build-integration.test.js` — a real Metalsmith build: HTML generation,
  collections, pagination, permalinks, asset handling.
- `component-manifests.test.js` — manifest validity and field correctness.
- `content-structure.test.js` — frontmatter, global data files, SEO metadata.
- `component-dependency-bundler.test.js` — component layout and bundler
  integration.
- `component-package-generator.test.js` — the production package generator
  (needs a prior `npm run build`).

---

## Toolchain

| Concern | Tool | Scope |
|---------|------|-------|
| Test runner | Node `node --test` | all `test/**/*.test.js` |
| JS/JSON lint + format | Biome (`biome.json`) | `**/*.{js,json}`, excluding `build/`, lotties, `.claude`, the generated maps `icon-loader.js`, `package*.json` |
| CSS lint | Stylelint (`.stylelintrc.json`, `stylelint-config-standard`) | `lib/**/*.css`, plus a build-time pass in the PostCSS pipeline |
| Nunjucks | none (manual) | Biome cannot parse Nunjucks; `.njk` is hand-formatted |

This replaced Mocha (→ `node --test`) and ESLint + Prettier (→ Biome) — see the
[Tooling migration](#tooling-migration) note. Biome's lint config mirrors the
rules the old ESLint config enforced and stays behaviour-neutral on pre-existing
code: rules whose autofix would change untested browser runtime behaviour
(`useOptionalChain`, `useParseIntRadix`, `noGlobalIsNan`) are warnings, not
errors.

---

## Extending the suite

Adding a component needs no wiring — every suite discovers components from
`lib/layouts/components/sections/`. Two cases need a one-line registration:

- The component renders empty without site data → add it to
  `DATA_DRIVEN_SECTIONS`.
- The component carries a build-injected example key → add it to
  `RUNTIME_KEY_ALLOWLIST`.

When you add a field, the suite enforces the contract automatically: declare a
numeric field as `widget: number`, give a select an `enum` (or a `source`) whose
default is a real option, declare an object as a field group, and keep the
example in sync with what the template reads.

---

## Tooling migration

The test and lint stack was modernised in three steps, each an isolated commit
range:

1. **Mocha → `node --test`.** All suites already asserted with `node:assert`, so
   this was mostly swapping imports; callback tests took the `(t, done)` shape
   and `this.timeout` became the `--test-timeout` flag.
2. **ESLint + Prettier → Biome** for JS/JSON, with a one-time reformat isolated
   from the config change. Stylelint kept ownership of CSS.
3. **Stylelint cleanup** — removed config rules deleted in Stylelint 16,
   fixed invalid `//` CSS comments, modernised colour notation to
   `stylelint-config-standard@40`, and fixed three genuinely-invalid
   declarations (`ease-in-out-out`, `display: in-situ-block`, a two-value
   `padding-right`) that browsers had been silently ignoring.
