# Context Requirements

Some components need access to external data or site-wide information that isn't passed through frontmatter. This data flows through a context object from your template renderer to each component.

## Why Context?

In a component-based architecture, section components are rendered via `{% include %}` statements inside a Nunjucks macro. Due to macro scope isolation, template-level variables aren't automatically available inside included templates. The context object pattern solves this by explicitly passing required data through the render chain.

This approach also makes components portable across different static site generators (Metalsmith, Eleventy, etc.) since each SSG can adapt its data model to the same context interface.

## How It Works

Your `sections-renderer.njk` builds a context object and passes it to `render-section.njk`, which extracts the properties before including the component template:

```nunjucks
{# sections-renderer.njk #}
{% set context = {
  data: data,
  collections: collections,
  collection: collection,
  urlPath: urlPath,
  crumbs: navigation.breadcrumbs
} %}

{% for section in sections %}
  {{ renderSection(section, context) }}
{% endfor %}
```

```nunjucks
{# render-section.njk #}
{% macro renderSection(section, context) %}
  {% set data = context.data %}
  {% set collections = context.collections %}
  {% set urlPath = context.urlPath %}
  {# ... extract other properties as needed #}

  {% include "components/sections/" + section.sectionType + "/" + section.sectionType + ".njk" ignore missing %}
{% endmacro %}
```

## Context Properties Reference

### Data Properties

These access external JSON data files:

| Property | Used by | Description |
|----------|---------|-------------|
| `data.artworks` | artist-slider | Artwork metadata for slider |
| `data.author` | blog-author | Author profiles |
| `data.blurbs` | blurbs | Blurb content blocks |
| `data.calendars` | calendar | Calendar configurations |
| `data.languages` | header, language-switcher | Language switcher config |
| `data.maps` | maps | Map configurations |
| `data.podcasts` | podcast | Podcast feed configurations |
| `data.pricing` | pricing-table | Pricing tier data |
| `data.team` | team-grid | Team member profiles |

### Site Properties

These provide site-wide or page-specific information:

| Property | Used by | Description |
|----------|---------|-------------|
| `collections` | collection-list, compound | Named content collections |
| `collection` | collection-links | Current page's collection info (prev/next) |
| `crumbs` | breadcrumbs | Breadcrumb trail array |
| `urlPath` | compound, header, navigation | Current page URL path |

## Adding Context for New Components

When you install a component that requires context:

1. Check the component's `manifest.json` for a `context` array
2. Ensure your `sections-renderer.njk` includes that property in the context object
3. Ensure your `render-section.njk` extracts it before the `{% include %}`

## Data File Locations

Context properties prefixed with `data.` expect JSON files in specific locations:

**Metalsmith:** `lib/data/` directory, loaded into metadata

**Eleventy:** `src/_data/data/` directory (the nested `data/` folder creates the `data.*` namespace)

For example, `data.podcasts` expects:
- Metalsmith: `lib/data/podcasts/*.json`
- Eleventy: `src/_data/data/podcasts/*.json`

## Components Without Context Requirements

Most components are self-contained and only need their `section` frontmatter data. These include:

- text-only, hero, image-only, video-only, audio-only
- accordion, banner, cards-list, code, columns
- flip-cards, icon-only, image-compare, image-grid
- logos-list, lottie-only, multi-media, slider
- stats, steps, testimonial, timeline
- And most partials (audio, button, ctas, flip-card, icon, image, etc.)

These components work out of the box without any context configuration.
