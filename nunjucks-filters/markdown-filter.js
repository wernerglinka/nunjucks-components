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
