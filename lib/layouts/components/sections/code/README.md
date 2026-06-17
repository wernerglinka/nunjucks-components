# Code Section Component

Displays a syntax-highlighted code block with an optional filename and a
copy-to-clipboard button.

Highlighting is done **at build time by [Shiki](https://shiki.style/)**, inside
the `mdToHTML` markdown filter. Shiki inlines every token color as a `style`
attribute, so there is **no theme stylesheet, no client-side highlighter, and no
per-section theme setting** — the theme is configured once in the markdown
filter (`nunjucks-filters/markdown-filter.js`). The component itself is a thin
wrapper that adds chrome (filename, copy button) around that output.

## Content contract

`content` is a **fenced markdown code block**. The fence info string carries the
language, so there is no separate `language` field:

````yaml
content: |
  ```js
  const greeting = 'Hello, World!';
  console.log(greeting);
  ```
````

`content` is piped straight through `mdToHTML`, which emits a `.code-block`
wrapper, a `.code-lang` label, and the highlighted `pre.shiki`. The component
does **not** re-wrap or re-label that output.

- Language comes from the fence (` ```js `, ` ```css `, ` ```yaml `, …).
- For Nunjucks templates, use ` ```njk ` or ` ```nunjucks ` — both are aliased
  to Shiki's `jinja-html` grammar, which tokenizes template tags. The label
  shown to readers stays "nunjucks".
- To show a fenced block *inside* a fenced example, use a longer outer fence
  (four backticks), since same-length fences close early.

## Data structure

```yaml
- sectionType: code
  containerTag: section      # section, article, or div
  isDisabled: false
  id: ''
  classes: ''
  containerFields:
    inContainer: true
    isAnimated: true
  code:
    filename: 'example.js'   # optional, shown in the header
    showCopy: true           # optional, default true
    content: |
      ```js
      function greet(name) {
        return `Hello, ${name}!`;
      }
      ```
```

## Properties

The component reads three properties under `code`:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `content` | string | Yes | A fenced markdown code block; the fence info string sets the language |
| `filename` | string | No | Filename shown in the header |
| `showCopy` | boolean | No | Show the copy button (default: `true`) |

The section also accepts the shared `commons` fields (`isDisabled`,
`containerFields`, …) via `$extends`.

## Rendered structure

```html
<div class="content container">
  <div class="code-section">
    <div class="code-header">
      <span class="code-filename">example.js</span>
      <button class="copy-button" type="button" aria-label="Copy code to clipboard">…</button>
    </div>
    <!-- everything below is emitted by mdToHTML (Shiki), not the section: -->
    <div class="code-block">
      <span class="code-lang light">js</span>
      <pre class="shiki monokai" style="background-color:#272822;color:#F8F8F2" tabindex="0">
        <code>… per-token <span style="color:…">…</span> …</code>
      </pre>
    </div>
  </div>
</div>
```

There is a single `.code-block` (from `mdToHTML`) and the language appears once
(`.code-lang`). The section adds only `.code-section` and `.code-header`.

## Styling

`code.css` is **chrome only**: the section wrapper, the filename/copy header,
the language-label position, and horizontal scrolling of long lines. Token
colors and the code background come from Shiki's inline styles, so this file
carries no syntax-color CSS.

## JavaScript

`code.js` wires the copy button to the clipboard (Clipboard API with a
`document.execCommand` fallback) and shows a brief "copied" state. It is
SWUP-compatible (re-initializes after page swaps, guards against double-binding
via `dataset.initialized`). There is no theme loading.

## Notes

- Changing the highlighting theme is a one-line change to `THEME` in
  `nunjucks-filters/markdown-filter.js` and affects every code block on the site
  (the `code` section and markdown bodies alike). Consuming sites that need a
  configurable theme use the async factory form of the filter (see
  `@wernerglinka/m-plus`).
- The bundled Shiki grammars are JavaScript, TypeScript, CSS, HTML, Bash, JSON,
  YAML, Markdown, and `jinja-html` (for Nunjucks). An unknown fence language
  falls back to an unhighlighted block.
