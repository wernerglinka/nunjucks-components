# Making Code Highlighting Work in Eleventy

This solution uses `marked-highlight`, a marked extension, to integrate Prism syntax highlighting with the marked markdown parser.

## The Problem

When porting the code component from Metalsmith to Eleventy, the code section rendered but without syntax highlighting. The Prism theme CSS was being fetched successfully (200 OK), but no highlighting was applied to the code.

## Root Cause

In this component-based architecture, code blocks are defined in YAML frontmatter and passed through a `mdToHTML` filter (using the `marked` library) to convert markdown to HTML. However, `marked` alone doesn't perform syntax highlighting—it just outputs plain `<code>` blocks without the Prism token classes (`token`, `keyword`, `string`, etc.) needed for styling.

Additionally, the Prism theme CSS expects the language class on the `<pre>` tag:

```css
.theme-prism pre[class*=language-] {
    background: #f5f2f0;
}
```

But marked's default output only puts the class on the `<code>` tag:

```html
<pre><code class="language-javascript">...</code></pre>
```

## Solution

### 1. Install Dependencies

```bash
npm install marked-highlight prismjs
```

- `marked-highlight` - A marked extension that integrates syntax highlighters with marked
- `prismjs` - The actual syntax highlighting library

### 2. Update the Markdown Filter

In `lib/filters/markdown-filter.js`:

```javascript
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import Prism from 'prismjs';

// Load language components for the languages you need
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-markdown.js';

/**
 * Configured marked instance with syntax highlighting
 */
const markedInstance = new Marked(
  markedHighlight( {
    langPrefix: 'language-',
    highlight( code, lang ) {
      if ( lang && Prism.languages[ lang ] ) {
        return Prism.highlight( code, Prism.languages[ lang ], lang );
      }
      return code;
    }
  } )
);

/**
 * Custom renderer to add language class to pre tag
 * The text parameter contains the already-highlighted code from markedHighlight
 */
const renderer = {
  code( { text, lang } ) {
    const langClass = lang ? `language-${lang}` : '';
    return `<pre class="${langClass}"><code class="${langClass}">${text}</code></pre>`;
  }
};

markedInstance.use( { renderer } );

/**
 * Converts markdown string to HTML with syntax highlighting
 * @param {string} mdString - The markdown string to convert
 * @returns {string} The HTML output
 */
export const mdToHTML = ( mdString ) => {
  try {
    return markedInstance.parse( mdString, {
      mangle: false,
      headerIds: false
    } );
  } catch ( e ) {
    console.error( 'Error parsing markdown:', e );
    return mdString;
  }
};
```

## Key Points

1. **markedHighlight runs first** - It processes the code through `Prism.highlight()` which adds token spans like `<span class="token keyword">function</span>`.

2. **Custom renderer wraps the output** - The renderer receives the already-highlighted code in the `text` parameter and wraps it with `<pre>` and `<code>` tags that both have the language class.

3. **Language components must be imported** - Prism only knows about languages you explicitly import. Add more as needed from `prismjs/components/`.

4. **No need for Eleventy's syntax highlight plugin** - In this component-based content architecture, all code comes from YAML frontmatter rather than markdown body content. The `@11ty/eleventy-plugin-syntaxhighlight` plugin only processes markdown body content and Nunjucks shortcodes, so it's unnecessary here. All syntax highlighting is handled entirely within the `mdToHTML` Nunjucks filter.

## Result

The output now looks like:

```html
<pre class="language-javascript"><code class="language-javascript"><span class="token keyword">function</span> <span class="token function">greet</span><span class="token punctuation">(</span><span class="token parameter">name</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  <span class="token keyword">return</span> <span class="token template-string"><span class="token template-punctuation string">`</span><span class="token string">Hello, </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span>name<span class="token interpolation-punctuation punctuation">}</span></span><span class="token string">!</span><span class="token template-punctuation string">`</span></span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></code></pre>
```

The existing dynamic theme loader in `code.js` fetches the appropriate Prism CSS theme based on the `data-theme` attribute, and the theme styles now apply correctly since both `<pre>` and `<code>` have the language class.
