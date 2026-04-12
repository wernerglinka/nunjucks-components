# Importing New Components from WG Art26

## Context

Two new components were built for the WG Art26 Eleventy project (`/Users/wernerglinka/Documents/Projects/WG Art26`) and reviewed for quality and correctness. This document records what was found, what was fixed, and what still needs attention — so a new session can pick up where we left off.

## Components

### `artwork`

**Location:** `/Users/wernerglinka/Documents/Projects/WG Art26/src/_includes/components/sections/artwork/`

**Purpose:** Displays a single artwork with its image, optional title/subtitle header, and a structured property list (type, year, materials, dimensions, status). Used on all individual work pages.

**Bilingual:** Yes. Reads the page-level `lang` variable to switch labels between English and German. Dimensions are stored in inches and automatically converted to centimetres (`× 2.54`, rounded) when `lang == 'de'`.

**Files:** `artwork.njk`, `artwork.css`, `manifest.json`, `README.md`

**Status: No changes needed for functionality.** Two cosmetic issues remain (see Open Items below).

---

### `multi-tab`

**Location:** `/Users/wernerglinka/Documents/Projects/WG Art26/src/_includes/components/sections/multi-tab/`

**Purpose:** A tabs wrapper where each pane can be any section type. Tabs and panes are defined explicitly in frontmatter. Supports URL hash navigation, browser back/forward, and keyboard navigation (ArrowLeft/Right/Home/End).

**Files:** `multi-tab.njk`, `multi-tab.css`, `multi-tab.js`, `manifest.json`, `README.md`

**Status: Two fixes applied this session** (see below).

---

## Fixes Applied This Session

### 1. `multi-tab` manifest missing `"type": "section"`

**File:** `manifest.json`  
Added `"type": "section"` to match every other section component. Without it, the bundler and validation tests treat the component incorrectly.

### 2. `lang` missing from `paneContext` in `multi-tab.njk`

**File:** `multi-tab.njk`  
The `paneContext` object forwarded to nested `renderSection` calls omitted `lang`. The `render-section.njk` helper destructures `lang` from context and passes it into included templates. The `artwork` component uses `lang` for bilingual label switching and inch-to-centimetre conversion — it would silently receive `undefined` when rendered inside a tab pane.

`lang` was added to `paneContext`.

Cross-reference comments were also added to both `multi-tab.njk` and `_helpers/render-section.njk` explaining that the two variable lists must stay in sync. This is an Eleventy constraint: Nunjucks macros do not inherit caller scope (unlike Metalsmith templates), so context must be explicitly bundled and forwarded.

---

## Open Items

### 3. Dead CSS in `artwork.css`

**File:** `src/_includes/components/sections/artwork/artwork.css`

Three rule sets are defined but no element in the template ever receives those classes:

- `.dim-note` — no element in `artwork.njk` uses this class.
- `.status--sold` — the template only renders the status row when `status == 'available'`; sold works silently omit the row.
- `.status--not-for-sale` — same as above.

**Decision needed:** Either remove the dead rules, or extend `artwork.njk` to actually render a status row for sold and not-for-sale works with appropriate wording. The README schema lists `sold` and `not-for-sale` as valid values, suggesting display was the original intent.

### 4. Artwork dimensions stored as strings in YAML

**Files:** `README.md` example + live work pages in `src/works/` and `src/de/werke/`

The README example quotes dimension values (`width: '9'`), making them YAML strings. The template multiplies them directly (`dims.width * 2.54`) relying on Nunjucks coercing strings to numbers silently.

**Fix:** Remove quotes from dimension values in all work page frontmatter so they are YAML numbers:

```yaml
# Before
dimensions:
  width: '9'
  height: '24'
  depth: '1'

# After
dimensions:
  width: 9
  height: 24
  depth: 1
```

Update the README example to match. Check all files under `src/works/` and `src/de/werke/` for quoted dimension values.

---

## Key Architectural Note

WG Art26 is an **Eleventy** project. The nunjucks-components library was built for **Metalsmith**. The core difference that affects wrapper components like `multi-tab`:

- In Metalsmith, global build variables (`data`, `collections`, `mainMenu`, `urlPath`, `lang`, `collection`, `pagingParams`) are injected directly into every template's scope.
- In Eleventy, Nunjucks macros are isolated and do not inherit the calling page's scope. Any wrapper component that calls `renderSection` must manually assemble a `paneContext` object containing all required variables and pass it explicitly.

The current variable list (as of this session) in both `multi-tab.njk` and `_helpers/render-section.njk`:

```
data, collections, mainMenu, urlPath, lang, collection, pagingParams
```

If a new page-level variable is added to the build, it must be added to **both** files. The cross-reference comments in each file are the reminder.
