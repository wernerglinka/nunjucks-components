/**
 * Initialize PageTransitions registry at the very top of the entry point.
 * This ensures it exists before any component scripts try to register.
 * The actual SWUP initialization happens in page-transitions.js on DOMContentLoaded.
 */
if ( !window.PageTransitions ) {
  const componentRegistry = new Map();
  const cleanupRegistry = new Map();

  window.PageTransitions = {
    registerComponent: ( name, initFn ) => componentRegistry.set( name, initFn ),
    registerCleanup: ( name, cleanupFn ) => cleanupRegistry.set( name, cleanupFn ),
    // Expose registries for page-transitions.js to use
    _componentRegistry: componentRegistry,
    _cleanupRegistry: cleanupRegistry
  };
}

/**
 * Theme switcher
 * Applies saved theme preference on page load for theme persistence
 */
function initTheme() {
  const theme = localStorage.getItem( 'theme' ) || 'light';
  document.body.classList.toggle( 'dark-theme', theme === 'dark' );
}

/**
 * Generate IDs for headings that don't have them
 * This enables anchor linking to any heading on the page
 */
function initHeadingIds() {
  const headings = document.querySelectorAll( 'h1, h2, h3, h4, h5, h6' );

  headings.forEach( heading => {
    // Skip if heading already has an ID
    if ( heading.id ) {
      return;
    }

    // Generate a slug from the heading text
    const text = heading.textContent.trim();
    const slug = text
      .toLowerCase()
      .replace( /[^\w\s-]/g, '' )  // Remove special characters
      .replace( /\s+/g, '-' )       // Replace spaces with hyphens
      .replace( /-+/g, '-' )        // Replace multiple hyphens with single hyphen
      .replace( /^-|-$/g, '' );     // Remove leading/trailing hyphens

    // Only add ID if we generated a valid slug
    if ( slug ) {
      heading.id = slug;
    }
  } );
}

/**
 * Page Highlight Utility
 * Highlights search terms on pages based on URL query parameters
 */
function initHighlights() {
  const urlParams = new URLSearchParams( window.location.search );
  const highlightTerm = urlParams.get( 'highlight' );

  if ( highlightTerm && highlightTerm.trim().length >= 2 ) {
    highlightPageContent( highlightTerm.trim() );

    // If no hash in URL, find and scroll to closest heading
    if ( !window.location.hash ) {
      scrollToClosestHeading( highlightTerm.trim() );
    }

    showClearButton();
  }
}

/**
 * Find and scroll to the closest heading above the first highlight
 */
function scrollToClosestHeading( _searchTerm ) {
  // Wait a bit for highlights to be added to the DOM
  setTimeout( () => {
    const firstHighlight = document.querySelector( 'mark[data-highlight]' );

    if ( !firstHighlight ) {
      return;
    }

    // Find the closest heading (h1-h6) that comes before the highlight
    let currentElement = firstHighlight;
    let closestHeading = null;

    // Walk up the DOM tree
    while ( currentElement && !closestHeading ) {
      // Check previous siblings
      let sibling = currentElement.previousElementSibling;

      while ( sibling ) {
        // Check if this sibling is a heading
        if ( /^H[1-6]$/.test( sibling.tagName ) && sibling.id ) {
          closestHeading = sibling;
          break;
        }

        // Check if this sibling contains a heading
        const headingInSibling = sibling.querySelector( 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]' );
        if ( headingInSibling ) {
          // Get the last heading in this sibling
          const headingsInSibling = sibling.querySelectorAll( 'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]' );
          closestHeading = headingsInSibling[ headingsInSibling.length - 1 ];
          break;
        }

        sibling = sibling.previousElementSibling;
      }

      // If no heading found in siblings, move up to parent
      if ( !closestHeading ) {
        currentElement = currentElement.parentElement;

        // Check if the parent itself is a heading
        if ( currentElement && /^H[1-6]$/.test( currentElement.tagName ) && currentElement.id ) {
          closestHeading = currentElement;
        }
      }
    }

    if ( closestHeading ) {
      closestHeading.scrollIntoView( { behavior: 'smooth', block: 'start' } );

      // Update URL hash without triggering page jump
      history.replaceState( null, '', `${ window.location.pathname }${ window.location.search }#${ closestHeading.id }` );
    }
  }, 100 );
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex( string ) {
  return string.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

/**
 * Check if a text node should be skipped during highlighting
 */
function shouldSkipTextNode( node ) {
  const parentTag = node.parentElement.tagName.toLowerCase();
  if ( [ 'script', 'style', 'mark' ].includes( parentTag ) ) {
    return true;
  }
  // Skip interactive components that break when DOM is modified
  if ( node.parentElement.closest( '.js-hero-slider, .js-slider, .js-carousel' ) ) {
    return true;
  }
  return false;
}

/**
 * Get all text nodes within an element
 */
function getTextNodes( element ) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function( node ) {
        if ( shouldSkipTextNode( node ) ) {
          return NodeFilter.FILTER_REJECT;
        }
        if ( node.textContent.length > 0 ) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      }
    }
  );

  const textNodes = [];
  let node;
  while ( node = walker.nextNode() ) {
    textNodes.push( node );
  }
  return textNodes;
}

/**
 * Get the block-level ancestor of a node
 * Used to group text nodes that should be searched together
 */
function getBlockAncestor( node ) {
  const blockTags = [
    'P', 'DIV', 'LI', 'TD', 'TH', 'DD', 'DT',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'ARTICLE', 'SECTION', 'ASIDE', 'HEADER', 'FOOTER', 'MAIN',
    'BLOCKQUOTE', 'FIGCAPTION', 'FIGURE', 'ADDRESS', 'PRE'
  ];

  let current = node.parentElement;
  while ( current && current !== document.body ) {
    if ( blockTags.includes( current.tagName ) ) {
      return current;
    }
    current = current.parentElement;
  }
  return document.body;
}

/**
 * Build a position map for text nodes
 * Returns combined text and tracks which node owns each character position
 */
function buildPositionMap( textNodes ) {
  let combinedText = '';
  const nodeMap = [];

  textNodes.forEach( node => {
    const start = combinedText.length;
    combinedText += node.textContent;
    const end = combinedText.length;
    nodeMap.push( { node, start, end } );
  } );

  return { combinedText, nodeMap };
}

/**
 * Find all matches of a search term in text
 */
function findMatches( text, searchTerm ) {
  const regex = new RegExp( escapeRegex( searchTerm ), 'gi' );
  const matches = [];
  let match;

  while ( ( match = regex.exec( text ) ) !== null ) {
    matches.push( {
      start: match.index,
      end: match.index + match[ 0 ].length,
      text: match[ 0 ]
    } );
  }

  return matches;
}

/**
 * Highlight a portion of a text node by wrapping it in a mark element
 */
function highlightTextNodePortion( textNode, highlightStart, highlightEnd ) {
  const text = textNode.textContent;

  const before = text.substring( 0, highlightStart );
  const highlight = text.substring( highlightStart, highlightEnd );
  const after = text.substring( highlightEnd );

  const fragment = document.createDocumentFragment();

  if ( before ) {
    fragment.appendChild( document.createTextNode( before ) );
  }

  const mark = document.createElement( 'mark' );
  mark.setAttribute( 'data-highlight', '' );
  mark.textContent = highlight;
  fragment.appendChild( mark );

  if ( after ) {
    fragment.appendChild( document.createTextNode( after ) );
  }

  textNode.parentNode.replaceChild( fragment, textNode );
}

/**
 * Highlight search term within a group of text nodes
 * Handles phrases that span multiple text nodes (across inline elements)
 */
function highlightInTextNodeGroup( textNodes, searchTerm ) {
  if ( textNodes.length === 0 ) {
    return;
  }

  const { combinedText, nodeMap } = buildPositionMap( textNodes );
  const matches = findMatches( combinedText, searchTerm );

  if ( matches.length === 0 ) {
    return;
  }

  // Process matches in reverse order to preserve node positions
  matches.reverse().forEach( match => {
    // Find which text nodes are involved in this match
    const involvedNodes = nodeMap.filter( n =>
      n.start < match.end && n.end > match.start
    );

    // Process involved nodes in reverse order
    involvedNodes.reverse().forEach( ( { node, start: nodeStart } ) => {
      const highlightStart = Math.max( 0, match.start - nodeStart );
      const highlightEnd = Math.min( node.textContent.length, match.end - nodeStart );

      if ( highlightEnd > highlightStart ) {
        highlightTextNodePortion( node, highlightStart, highlightEnd );
      }
    } );
  } );
}

/**
 * Highlight all instances of search term on the page
 * Supports highlighting phrases that span inline element boundaries
 * (e.g., "Use <strong>markdown</strong>" highlights across the strong tag)
 */
function highlightPageContent( searchTerm ) {
  const allTextNodes = getTextNodes( document.body );

  // Group text nodes by their block-level ancestor
  // This ensures we only match phrases within the same paragraph/block
  const groups = new Map();

  allTextNodes.forEach( node => {
    const blockAncestor = getBlockAncestor( node );
    if ( !groups.has( blockAncestor ) ) {
      groups.set( blockAncestor, [] );
    }
    groups.get( blockAncestor ).push( node );
  } );

  // Process each group
  groups.forEach( textNodes => {
    highlightInTextNodeGroup( textNodes, searchTerm );
  } );
}

/**
 * Show the clear highlights button
 */
function showClearButton() {
  // Check if button already exists
  if ( document.getElementById( 'clear-highlights-btn' ) ) {
    return;
  }

  const button = document.createElement( 'button' );
  button.id = 'clear-highlights-btn';
  button.className = 'clear-highlights button primary';
  button.innerHTML = 'Clear highlights';
  button.setAttribute( 'aria-label', 'Clear highlighted search terms' );

  // Add click handler
  button.addEventListener( 'click', clearHighlights );

  // Append to body
  document.body.appendChild( button );
}

/**
 * Clear all highlights and reload page without query parameter
 */
function clearHighlights() {
  window.location = window.location.pathname;
}

/**
 * Responsive Table Wrapper
 * Wraps all tables in a scrollable container for responsive behavior
 */
function initTableWrappers() {
  const tables = document.querySelectorAll( 'table' );

  tables.forEach( table => {
    // Skip if already wrapped
    if ( table.parentElement.classList.contains( 'table-scroll' ) ) {
      return;
    }

    // Create scroll container
    const scrollContainer = document.createElement( 'div' );
    scrollContainer.className = 'table-scroll';

    // Create mask wrapper for gradient effects
    const mask = document.createElement( 'div' );
    mask.className = 'table-mask';

    // Insert mask before table
    table.parentNode.insertBefore( mask, table );

    // Move scroll container inside mask
    mask.appendChild( scrollContainer );

    // Move table inside scroll container
    scrollContainer.appendChild( table );

    // Track scroll position to show/hide gradients
    function updateScrollIndicator() {
      const isScrollable = scrollContainer.scrollWidth > scrollContainer.clientWidth;
      const isScrolledToEnd =
        scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 1;
      const isAtStart = scrollContainer.scrollLeft <= 1;

      if ( isScrollable ) {
        scrollContainer.classList.add( 'is-scrollable' );

        if ( isAtStart ) {
          scrollContainer.classList.remove( 'is-scrolled' );
        } else {
          scrollContainer.classList.add( 'is-scrolled' );
        }

        if ( isScrolledToEnd ) {
          scrollContainer.classList.add( 'is-scrolled-end' );
        } else {
          scrollContainer.classList.remove( 'is-scrolled-end' );
        }
      } else {
        scrollContainer.classList.remove( 'is-scrollable', 'is-scrolled', 'is-scrolled-end' );
      }
    }

    // Initial check
    updateScrollIndicator();

    // Update on scroll
    scrollContainer.addEventListener( 'scroll', updateScrollIndicator );

    // Update on window resize
    window.addEventListener( 'resize', updateScrollIndicator );
  } );
}

/**
 * Cleanup highlights before page transition
 */
function cleanupHighlights() {
  // Remove the clear button if it exists
  const clearBtn = document.getElementById( 'clear-highlights-btn' );
  if ( clearBtn ) {
    clearBtn.remove();
  }
}

/**
 * Initialize all main.js functionality
 */
function initMain() {
  initTheme();
  initHeadingIds();
  initHighlights();
  initTableWrappers();
}

// Register with page transitions for SWUP support
// PageTransitions is defined at the top of this file, so it always exists
window.PageTransitions.registerComponent( 'main', initMain );
window.PageTransitions.registerCleanup( 'main', cleanupHighlights );

// Initialize when DOM is ready
if ( document.readyState === 'loading' ) {
  document.addEventListener( 'DOMContentLoaded', initMain );
} else {
  initMain();
}

// Global escape key handler for clearing highlights (only needs to be added once)
document.addEventListener( 'keydown', ( event ) => {
  if ( event.key === 'Escape' && document.getElementById( 'clear-highlights-btn' ) ) {
    clearHighlights();
  }
} );
