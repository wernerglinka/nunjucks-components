# Code Syntax Highlighting

This document explains how syntax highlighting works in the Nunjucks Components library and how to extend it for additional languages.

## Overview

Syntax highlighting is handled entirely within the `mdToHTML` Nunjucks filter using `marked-highlight` and Prism.js. This approach integrates highlighting directly into the markdown parsing step rather than post-processing HTML.

## Why This Approach?

In a component-based content architecture, code blocks are defined in YAML frontmatter and passed through the `mdToHTML` filter to convert markdown to HTML. This differs from traditional static site generators where code blocks appear in markdown body content.

The filter-based approach provides several benefits:

1. **Portability** - Components work identically in Metalsmith, Eleventy, or any other SSG using the same Nunjucks filter
2. **Simpler build pipeline** - No separate post-processing plugin required
3. **Consistent behavior** - Highlighting happens at the source during markdown parsing

## How It Works

The `mdToHTML` filter in `nunjucks-filters/markdown-filter.js` uses three components:

1. **marked** - The markdown parser that converts markdown to HTML
2. **marked-highlight** - A marked extension that integrates syntax highlighters
3. **prismjs** - The actual syntax highlighting library

When markdown containing a code block is parsed:

1. `marked-highlight` intercepts the code block and passes it to Prism
2. Prism tokenizes the code and wraps tokens in spans with appropriate classes (e.g., `<span class="token keyword">`)
3. A custom renderer wraps the output in `<pre>` and `<code>` tags with the language class on both elements

The resulting HTML looks like:

```html
<pre class="language-javascript"><code class="language-javascript"><span class="token keyword">function</span> <span class="token function">greet</span><span class="token punctuation">(</span><span class="token parameter">name</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token template-string"><span class="token template-punctuation string">`</span><span class="token string">Hello, </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>name<span class="token interpolation-punctuation punctuation">}</span></span><span class="token string">!</span><span class="token template-punctuation string">`</span></span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></code></pre>
```

## Supported Languages

The following languages are loaded by default:

- JavaScript (`javascript`, `js`)
- TypeScript (`typescript`, `ts`)
- CSS (`css`)
- HTML/XML (`markup`, `html`, `xml`)
- Bash (`bash`, `shell`)
- JSON (`json`)
- YAML (`yaml`)
- Markdown (`markdown`, `md`)

## Adding New Languages

To add support for additional languages, import the corresponding Prism language component in `nunjucks-filters/markdown-filter.js`:

```javascript
// Add at the top with other language imports
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-ruby.js';
import 'prismjs/components/prism-go.js';
```

Available language components can be found in `node_modules/prismjs/components/`. Each file follows the naming pattern `prism-{language}.js`.

Some languages have dependencies on other languages. For example, `prism-jsx.js` requires `prism-javascript.js` to be loaded first. Prism handles these dependencies automatically when you import the dependent language.

## Prism Themes

The code component (`lib/layouts/components/sections/code/`) includes a dynamic theme loader that fetches Prism CSS themes based on a `data-theme` attribute. The theme CSS expects the `language-*` class on the `<pre>` tag, which is why the custom renderer adds it to both `<pre>` and `<code>` elements.

Available themes include:

- `prism` (default light theme)
- `prism-dark`
- `prism-okaidia`
- `prism-tomorrow`
- `prism-twilight`
- `prism-coy`
- `prism-solarizedlight`
- `prism-funky`

## Usage in Components

In YAML frontmatter, code blocks are defined as markdown strings:

```yaml
sections:
  - sectionType: code
    text:
      title: "Example Code"
      prose: |
        Here's a simple function:

        ```javascript
        function add(a, b) {
          return a + b;
        }
        ```
```

The template then uses the `mdToHTML` filter:

```nunjucks
{{ section.text.prose | mdToHTML | safe }}
```

## Migration Notes

This approach replaces the previous `metalsmith-prism` plugin. If you're migrating from an older version:

1. The `metalsmith-prism` plugin is no longer needed
2. Syntax highlighting now happens during template rendering, not as a post-build step
3. The output HTML structure remains compatible with existing Prism themes
