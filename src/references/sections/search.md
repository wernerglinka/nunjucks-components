---
layout: pages/sections-with-sidebar.njk
bodyClasses: 'sections-page'
hasHero: true
title: Search

navigation:
  navLabel: 'Search'
  navIndex: 6

card:
  title: 'Search'
  description: 'Interactive search component with fuzzy search, filtering, and real-time results using Fuse.js and metalsmith-search plugin.'
  image: '/assets/images/sample19.jpg'
  tags: ['search', 'find', 'filter', 'site-search', 'fuzzy-search']

seo:
  title: Search Component - Interactive Search for Metalsmith
  description: 'Interactive search component with fuzzy search, filtering, and real-time results. Perfect for component libraries, documentation sites, and content-heavy Metalsmith static sites.'
  socialImage: '/assets/images/sample.jpg'
  canonicalURL: ''
  keywords: 'metalsmith search, fuzzy search, search component, fuse.js, interactive search, site search, content discovery'

sections:
  - sectionType: rich-text
    containerTag: article
    id: ''
    isDisabled: false
    isAnimated: true
    containerFields:
      inContainer: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: true
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: ''
      title: 'Search Section'
      titleTag: 'h1'
      subTitle: ''
      prose: 'An interactive search component that provides search functionality across your Metalsmith site content using [Fuse.js](https://www.fusejs.io/) and the metalsmith-search plugin. The section component provides a wrapper for the [search particle](/references/partials/search). Please refer to it for more info.'

  - sectionType: search-only
    containerTag: section
    classes: ''
    id: ''
    isDisabled: false
    isAnimated: true
    containerFields:
      inContainer: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: true
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: ''
      title: 'Search'
      titleTag: 'h2'
      subTitle: 'Find components, examples, and documentation'
      prose:
    placeholder: 'Search components, features, or documentation...'
    settings:
      maxResults: 15
      minCharacters: 3

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'search-architecture'
    isDisabled: false
    isAnimated: true
    containerFields:
      inContainer: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Two-Step Search Architecture'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        The search uses a two-step approach to balance discovery with precision:

        **Fuzzy Discovery** - Fuse.js finds potential matches with typo tolerance and weighted field matching across titles, content, tags, and metadata.

        **Exact Verification** - Only shows results where the search term actually appears as a substring in the content, preventing false positives like "dors" matching "doors."

        This eliminates the common trade-off between search recall and precision. Users get results that handle typos while ensuring all results contain their search terms.

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'plugin-configuration'
    isDisabled: false
    isAnimated: true
    containerFields:
      inContainer: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Plugin Configuration'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        The search component requires the `metalsmith-search` plugin to be configured in your `metalsmith.js` build file.

        ### Basic Plugin Installation

        ```javascript
        import search from 'metalsmith-search';

        const metalsmith = Metalsmith(__dirname)
          .source('src')
          .destination('build')

          // Render layouts FIRST so the plugin can parse the final HTML
          .use(layouts())

          // Then generate the search index from rendered HTML
          .use(search({
            ignore: ['**/search.md', '**/search-index.json']
          }))

          .build((err) => {
            if (err) throw err;
            console.log('Build complete with search index!');
          });
        ```

        ### Plugin Position

        Place the search plugin **after** `@metalsmith/layouts` so it operates on fully rendered HTML, not raw Markdown. The plugin uses Cheerio to parse the DOM and extract real, user-visible text — indexing before layout rendering would miss component output.

        ### Configuration Options

        | Property | Type | Default | Description |
        |----------|------|---------|-------------|
        | `pattern` | string \| string[] | `'**/*.html'` | Rendered files to index |
        | `ignore` | string \| string[] | `['**/search-index.json']` | Patterns to exclude |
        | `indexPath` | string | `'search-index.json'` | Output path for the generated index |
        | `excludeSelectors` | string[] | `['nav', 'header', 'footer']` | CSS selectors to strip before extraction |
        | `fuseOptions` | object | see below | Fuse.js configuration embedded in the index |

        **Default `fuseOptions`:**

        ```javascript
        {
          keys: [
            { name: 'title', weight: 10 },   // <title> or first <h1>
            { name: 'content', weight: 5 },  // All page text
            { name: 'excerpt', weight: 3 }   // Auto-generated 250-char excerpt
          ],
          threshold: 0.3,
          includeScore: true,
          includeMatches: true,
          minMatchCharLength: 3
        }
        ```

        **Complete Example:**
        ```javascript
        .use(search({
          pattern: '**/*.html',
          ignore: ['**/search.md', '**/search-index.json'],
          indexPath: 'search-index.json',
          excludeSelectors: ['nav', 'header', 'footer', '.related-posts'],

          fuseOptions: {
            keys: [
              { name: 'title', weight: 10 },
              { name: 'content', weight: 5 },
              { name: 'excerpt', weight: 3 }
            ],
            threshold: 0.3,
            includeScore: true,
            includeMatches: true,
            minMatchCharLength: 3
          }
        }))
        ```

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'content-architecture'
    isDisabled: false
    isAnimated: true
    containerFields:
      inContainer: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Why HTML-First Indexing'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        Because the plugin runs on rendered HTML, it works with any content architecture without special configuration.

        ### Structured Content Sites

        For sites using structured frontmatter with component sections, each page's components render into the final HTML — and that HTML is what gets indexed:

        ```yaml
        ---
        title: "My Page"
        sections:
          - sectionType: hero
            text:
              title: "Welcome"
              leadIn: "Get started"
              prose: "This content is automatically indexed"
          - sectionType: rich-text
            text:
              prose: "More searchable content here"
        ---
        ```

        There's no need to declare component types, field names, or section schemas. Anything that ends up as visible text on the rendered page (after the `excludeSelectors` are removed) is part of the index.

        ### Traditional Markdown Sites

        For traditional long-form content, the Markdown is rendered to HTML by `@metalsmith/layouts` before the plugin sees it:

        ```yaml
        ---
        title: "My Article"
        ---

        # Article Title

        Long-form content that becomes searchable once rendered.
        ```

        All body text is captured in the `content` field. Headings (h1–h6) are collected separately into the `headings` array so the client can jump to the matching section.

        ### Excluding Site Chrome

        Use `excludeSelectors` to keep navigation, repeated promo banners, or related-post widgets out of the index:

        ```javascript
        .use(search({
          excludeSelectors: ['nav', 'header', 'footer', '.site-promo', '.related-posts']
        }))
        ```

        `<script>` and `<style>` elements are always stripped automatically.

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'field-mapping'
    isDisabled: false
    isAnimated: true
    containerFields:
      inContainer: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Index Structure and Client Configuration'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        ### Generated Index Fields

        The plugin writes one entry per page to `/search-index.json`. Each entry has this shape:

        ```json
        {
          "id": "page:/blog/post",
          "type": "page",
          "url": "/blog/post",
          "title": "Page Title",
          "content": "All page text extracted from rendered HTML...",
          "excerpt": "Auto-generated 250-character excerpt...",
          "headings": [
            { "level": "h2", "id": "introduction", "title": "Introduction" },
            { "level": "h3", "id": "overview", "title": "Overview" }
          ],
          "wordCount": 1523
        }
        ```

        The full JSON file also includes top-level metadata: `version`, `generated`, `totalEntries`, `stats`, and `config.fuseOptions` (so clients can reconstruct the same Fuse configuration if they want).

        ### Client-Side Fuse.js Configuration

        The search partial (`search.js`) applies its own weights on top of the loaded index:

        ```javascript
        const fuseOptions = {
          keys: [
            { name: 'title', weight: 10 },          // Page titles
            { name: 'headings.title', weight: 7 },  // Section headings
            { name: 'content', weight: 5 },         // Main content
            { name: 'excerpt', weight: 3 }          // Excerpt
          ],
          threshold: 0.4,
          includeScore: true,
          includeMatches: true,
          minMatchCharLength: 3,
          ignoreLocation: true
        };
        ```

        When a match falls inside a heading's title, the client appends `#<headingId>` to the result URL so users land on the correct section.

        ### Performance Optimization

        **Two-Stage Relevance Filtering** (in `search.js`):
        - Fuse returns fuzzy matches above threshold `0.4`
        - Client then drops any result below 50% relevance (`(1 - score) * 100 < 50`)
        - Client also requires an **exact case-insensitive substring match** in title, content, excerpt, or a heading — this removes typical fuzzy-search false positives

        **Dynamic Library Loading:**
        - Fuse.js is loaded from jsDelivr CDN only when the search component renders
        - The loader caches its promise so multiple search instances on a page share one network request

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'debugging'
    isDisabled: false
    isAnimated: true
    containerFields:
      inContainer: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Debugging & Troubleshooting'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        Enable debug output to troubleshoot plugin behavior:

        ```bash
        DEBUG=metalsmith-search* node metalsmith.js
        ```

        This shows detailed information about:
        - Which HTML files were matched and processed
        - Title, URL, and heading extraction for each page
        - Total entries written and the index output path

        ## Common Issues & Solutions

        **Empty search index:**
        - Ensure the plugin runs **after** `@metalsmith/layouts` so HTML exists to parse
        - Verify the `pattern` matches your output (default `**/*.html`)
        - Confirm pages actually produce text content after `excludeSelectors` are stripped

        **Poor search results:**
        - Adjust the client-side relevance threshold (50%) in `search.js`
        - Tune the client-side `threshold` in `fuseOptions` (lower = stricter)
        - Add more specific `excludeSelectors` to remove repetitive chrome text

        **Missing anchor links:**
        - Headings without existing IDs get auto-generated slug IDs at index time
        - If you want stable, readable IDs, add `id` attributes in your templates
        - Verify the rendered HTML actually contains the headings (not injected later by client JS)

  - sectionType: rich-text
    containerTag: section
    id: ''
    isDisabled: false
    isAnimated: true
    containerFields:
      inContainer: false
      noMargin:
        top: false
        bottom: false
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Configuration'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        ```yaml
        - sectionType: search-only
          containerTag: section
          # container settings

          title: 'Search Components'                      # Main heading (optional)
          subtitle: 'Find what you need'                  # Subtitle text (optional)
          placeholder: 'Search...'                        # Input placeholder (default: "Search...")
          source: '/search-index.json'                    # Index URL (optional)
          searchType: 'default'                           # 'site', 'library', or 'default'

          settings:
            maxResults: 20                                # Maximum results to display (default: 20)
            minCharacters: 2                              # Min characters to trigger search (default: 2)
        ```

        ### Notes

        - **Fuzzy Search**: Powered by Fuse.js for typo-tolerant matching
        - **Two-Stage Filter**: Fuzzy matching followed by exact substring verification to prevent false positives
        - **Real-time Results**: Instant search with debounced input (300ms)
        - **URL Auto-Execute**: Visiting `/search/?q=term` pre-fills and runs the query
        - **Heading Anchors**: Matches inside headings append `#id` to result URLs for scroll-to
        - **Keyboard Shortcut**: Escape clears the input
        - **Match Highlighting**: Wraps the query in `<mark>` inside titles and excerpts
        - **SWUP-Compatible**: Re-initializes after page transitions
        - **Accessibility**: ARIA live region for status updates; full keyboard support

        ### Prerequisites

        1. **metalsmith-search plugin** must be installed and configured in your Metalsmith build (after `@metalsmith/layouts`)
        2. **Fuse.js** is loaded from CDN automatically when the search component renders
        3. The plugin generates a `/search-index.json` file during build

        ### Search Properties

        - `title`: Main heading above the search input (optional)
        - `subtitle`: Subtitle or description text (optional)
        - `placeholder`: Placeholder text for search input (default: "Search...")
        - `source` / `settings.source`: Index URL (default: `/search-index.json`)
        - `searchType` / `settings.searchType`: Selects client-side Fuse weight presets (`site`, `library`, `default`)
        - `settings.maxResults`: Maximum number of results to display (default: 20)
        - `settings.minCharacters`: Minimum characters to trigger search (default: 2)

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    isAnimated: false
    componentDownload: 'search'
    containerFields:
      inContainer: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        isDark: false
        color: 'var(--color-background-light)'
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Download Search Section'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete search component package including template, styles, manifest, examples, and installation script.'
    ctas:
      - url: '/downloads/sections/search.zip'
        label: 'Download Search Section'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
