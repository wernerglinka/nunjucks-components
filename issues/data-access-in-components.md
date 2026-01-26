# Data Access in Nunjucks Components

## The Problem

Components from the nunjucks-components library access external data using `data.podcasts`, `data.videos`, etc. This pattern works in Metalsmith where `data` is passed directly to templates.

In Eleventy, global data files in `_data/` are accessible by their filename (e.g., `podcasts` instead of `data.podcasts`). However, when templates are rendered inside Nunjucks macros or `{% include %}` statements, the data cascade variables are not accessible due to macro scope isolation.

## The Solution

Use a `_data/data/` folder structure combined with explicit context passing through the render chain.

### 1. Folder Structure

Place component data inside `_data/data/`. Eleventy's data cascade automatically makes this available as `data.podcasts`, `data.videos`, etc. at the template level:

```
src/_data/
├── data/                    # Folder creates "data" namespace
│   ├── podcasts/
│   │   ├── my-show.json
│   │   └── another-show.json
│   ├── videos/
│   │   └── promo.json
│   └── languages.json       # Direct file = data.languages
└── site.json                # Still accessible as `site` directly
```

### 2. Context Object Pattern

Instead of using Nunjucks globals, pass a context object through the render chain. This makes data flow explicit and keeps components portable.

In `sections-renderer.njk`:

```nunjucks
{% from "components/_helpers/render-section.njk" import renderSection %}

{# Build context object with all data needed by section components #}
{% set context = {
  data: data,
  collections: collections,
  urlPath: page.url
} %}

{% for section in sections %}
  {{ renderSection(section, context) }}
{% endfor %}
```

In `render-section.njk`:

```nunjucks
{% macro renderSection(section, context) %}
  {# Extract context properties for use in included templates #}
  {% set data = context.data %}
  {% set collections = context.collections %}
  {% set urlPath = context.urlPath %}

  {% include "components/sections/" + section.sectionType + "/" + section.sectionType + ".njk" ignore missing %}
{% endmacro %}
```

## Why This Works

- Eleventy's data cascade provides `data.podcasts` at template level from the folder structure
- The `context` object passes data explicitly through the macro boundary
- Variables set inside the macro (`{% set data = context.data %}`) are available to included templates
- Components can use `data.podcasts['my-podcast']` exactly as in Metalsmith
- No globals needed - data flow is explicit and traceable

## Adding New Data Types

Just create new folders or files inside `_data/data/`:

```
src/_data/data/
├── podcasts/          # data.podcasts['show-name']
├── videos/            # data.videos['video-name']
├── testimonials/      # data.testimonials['customer-name']
└── languages.json     # data.languages
```

No code changes needed. The data cascade handles loading automatically.

## Comparison with Metalsmith

| Aspect | Metalsmith | Eleventy |
|--------|------------|----------|
| Data access | `data.podcasts` via props | `data.podcasts` via data cascade |
| Macro scope | Props passed explicitly | Context object passed explicitly |
| Adding data | Update data loading code | Create folder in `_data/data/` |
| Component code | No changes needed | No changes needed |

Both approaches use explicit data passing - the difference is where the data originates (Metalsmith loads it, Eleventy's data cascade loads it).
