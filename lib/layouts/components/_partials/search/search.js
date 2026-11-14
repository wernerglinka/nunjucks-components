/**
 * Enhanced Search Component
 * Provides fuzzy search functionality using Fuse.js with configurable JSON sources
 * Supports multiple search instances on the same page
 */

// Bundled from the fuse.js npm package; the version is managed in package.json
import Fuse from 'fuse.js';

// Search instances by their container element. Pages come and go with page
// transitions; a WeakMap lets the instances of a replaced page go with them.
const searchInstances = new WeakMap();

// Default configuration; instances can override via data attributes
// (data-min-characters, data-max-results, data-highlight-matches)
const defaultConfig = {
  minCharacters: 2,
  maxResults: 20,
  debounceDelay: 300,
  highlightMatches: true
};

/**
 * Build the effective config for a search container from its data attributes
 * @param {HTMLElement} container - The search container element
 * @returns {Object} Merged configuration
 */
function getInstanceConfig(container) {
  const config = { ...defaultConfig };
  const minCharacters = parseInt(container.dataset.minCharacters, 10);
  const maxResults = parseInt(container.dataset.maxResults, 10);
  if (!Number.isNaN(minCharacters)) {
    config.minCharacters = minCharacters;
  }
  if (!Number.isNaN(maxResults)) {
    config.maxResults = maxResults;
  }
  if (container.dataset.highlightMatches === 'false') {
    config.highlightMatches = false;
  }
  return config;
}

/**
 * Initialize search component
 */
async function initSearch() {
  // The index has to be loaded before a query from the URL can run
  await initAllSearchInstances();

  // Auto-execute search from URL parameter if present
  autoExecuteFromURL();
}

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('search', initSearch);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSearch);
} else {
  initSearch();
}

/**
 * Initialize all search instances on the page
 */
async function initAllSearchInstances() {
  try {
    // Find all search containers and initialize them in parallel
    const searchContainers = document.querySelectorAll('.search-container');

    await Promise.all(Array.from(searchContainers).map((container) => initSearchInstance(container)));
  } catch (error) {
    console.error('Failed to initialize search:', error);
  }
}

/**
 * Initialize a single search instance
 */
async function initSearchInstance(container) {
  // Skip if already initialized
  if (container.dataset.initialized) {
    return;
  }
  container.dataset.initialized = 'true';

  const searchSource = container.dataset.searchSource || '/search-index.json';
  const searchType = container.dataset.searchType || 'default';

  // Get DOM elements for this instance
  const searchInput = container.querySelector('.search-input');
  const searchResults = container.querySelector('.search-results');
  const searchStatus = container.querySelector('.search-status');
  const searchClear = container.querySelector('.search-clear');

  if (!searchInput || !searchResults) {
    console.warn('Search elements not found in container - search functionality disabled');
    return;
  }

  // Create search instance object
  const searchInstance = {
    container,
    searchInput,
    searchResults,
    searchStatus,
    searchClear,
    searchType,
    config: getInstanceConfig(container),
    fuse: null,
    searchData: null,
    debounceTimeout: null
  };

  try {
    // Show loading state
    showStatus(searchInstance, 'Loading search index...', 'loading');

    // Load search index
    const response = await fetch(searchSource);
    if (!response.ok) {
      throw new Error(`Failed to load search index: ${response.status}`);
    }

    searchInstance.searchData = await response.json();

    // Get Fuse options based on search type
    const fuseOptions = getFuseOptions(searchType, searchInstance.config.minCharacters);

    // Initialize Fuse.js with the loaded index
    const dataArray = searchInstance.searchData.entries || searchInstance.searchData.items || searchInstance.searchData;
    searchInstance.fuse = new Fuse(dataArray, fuseOptions);

    // Store the instance
    searchInstances.set(container, searchInstance);

    // Set up event listeners
    setupEventListeners(searchInstance);

    // Hide loading state
    hideStatus(searchInstance);
  } catch (error) {
    console.error('Failed to initialize search instance:', error);
    showStatus(searchInstance, 'Failed to load search. Please try again later.', 'error');
  }
}

/**
 * Get Fuse.js options based on search type
 * @param {string} searchType - 'library' or 'default'
 * @param {number} minCharacters - Shortest query the instance accepts
 * @returns {Object} Fuse.js options
 */
function getFuseOptions(searchType, minCharacters = defaultConfig.minCharacters) {
  const baseOptions = {
    threshold: 0.4, // Balanced - not too strict, not too loose
    includeScore: true,
    includeMatches: true,
    // Blocks fragments, but never asks for more characters than the shortest
    // query the instance accepts, or that query could not match anything
    minMatchCharLength: Math.max(1, Math.min(3, minCharacters)),
    ignoreLocation: true, // Focus on match quality, not position
    findAllMatches: false,
    useExtendedSearch: false, // Disable extended search patterns to avoid false positives
    distance: 100, // Allow flexibility for real words
    isCaseSensitive: false
  };

  switch (searchType) {
    case 'library':
      return {
        ...baseOptions,
        keys: [
          { name: 'title', weight: 10 },
          { name: 'content', weight: 5 },
          { name: 'excerpt', weight: 3 },
          { name: 'headings.title', weight: 7 }
        ]
      };
    default:
      return {
        ...baseOptions,
        keys: [
          { name: 'title', weight: 10 },
          { name: 'content', weight: 5 },
          { name: 'excerpt', weight: 3 },
          { name: 'headings.title', weight: 7 }
        ]
      };
  }
}

/**
 * Set up event listeners for a search instance
 */
function setupEventListeners(searchInstance) {
  // Search input with debouncing
  searchInstance.searchInput.addEventListener('input', (event) => {
    handleSearchInput(searchInstance, event);
  });

  // Clear button
  if (searchInstance.searchClear) {
    searchInstance.searchClear.addEventListener('click', () => {
      clearSearch(searchInstance);
    });
  }

  // Keyboard shortcuts
  searchInstance.searchInput.addEventListener('keydown', (event) => {
    handleKeyboardShortcuts(searchInstance, event);
  });
}

/**
 * Handle search input with debouncing
 */
function handleSearchInput(searchInstance, _event) {
  clearTimeout(searchInstance.debounceTimeout);
  searchInstance.debounceTimeout = setTimeout(() => {
    handleSearch(searchInstance);
  }, searchInstance.config.debounceDelay);
}

/**
 * Handle search execution
 */
function handleSearch(searchInstance) {
  if (!searchInstance.fuse) {
    return;
  }

  const query = searchInstance.searchInput.value.trim();

  // Clear results if query is too short
  if (query.length < searchInstance.config.minCharacters) {
    clearResults(searchInstance);
    if (query.length > 0) {
      showStatus(searchInstance, `Type at least ${searchInstance.config.minCharacters} characters to search`);
    } else {
      hideStatus(searchInstance);
    }
    return;
  }

  // Perform search
  let results = searchInstance.fuse.search(query);

  // Fuse ranks the entries and tolerates typos, which also lets through
  // entries that only resemble the query. Keep the ones that really contain
  // it. There is no score cut-off: Fuse scores a match in a long page body
  // low, and a cut-off would drop pages that do contain the query.
  const queryLower = query.toLowerCase();
  results = results.filter((result) =>
    searchableText(result.item).some((text) => text.toLowerCase().includes(queryLower))
  );

  // Limit results
  if (results.length > searchInstance.config.maxResults) {
    results = results.slice(0, searchInstance.config.maxResults);
  }

  // Display results
  displayResults(searchInstance, results, query);

  // Update status
  updateSearchStatus(searchInstance, results.length, query);
}

/**
 * The text of an index entry a query is matched against
 * @param {Object} item - Search index entry
 * @returns {string[]} Title, body, excerpt and heading titles that are present
 */
function searchableText(item) {
  const headings = Array.isArray(item.headings) ? item.headings.map((heading) => heading.title) : [];
  return [item.title, item.content, item.excerpt, ...headings].filter((text) => typeof text === 'string');
}

/**
 * Pick the text shown under a result: the passage around the first place the
 * query occurs in the page body, so the visitor can see why the page matched.
 * Falls back to the start of the page when the match is in the title only.
 * @param {Object} item - Search index entry
 * @param {string} queryLower - Lower-cased query
 * @param {number} [length=150] - Approximate length of the passage
 * @returns {string} Text to display, with an ellipsis where it was cut
 */
function resultSnippet(item, queryLower, length = 150) {
  const content = item.content || '';
  const position = content.toLowerCase().indexOf(queryLower);
  const lead = Math.round(length / 3);

  if (position <= lead) {
    const opening = item.excerpt || content;
    return opening.length > length ? `${opening.substring(0, length)}...` : opening;
  }

  // Start a little before the match, at a word boundary
  const from = content.indexOf(' ', position - lead) + 1;
  const passage = content.substring(from, from + length);
  return `...${passage}${from + length < content.length ? '...' : ''}`;
}

/**
 * Display search results
 */
function displayResults(searchInstance, results, query) {
  if (results.length === 0) {
    searchInstance.searchResults.innerHTML = '<div class="no-results">No results found. Try different keywords.</div>';
    return;
  }

  const resultElements = results.map((result) => {
    const item = result.item;
    const queryLower = query.toLowerCase().trim();

    // Prepare content for display. Index content is only ever inserted as
    // text nodes, so it cannot be parsed as markup.
    const title = item.title || 'Untitled';
    const description = resultSnippet(item, queryLower);
    const highlightQuery = searchInstance.config.highlightMatches ? query : '';

    // Add highlight parameter to URL for term highlighting on target page
    // Fix home page URL - if it starts with /index, change to /
    let itemUrl = item.url;
    if (itemUrl?.startsWith('/index')) {
      // Replace /index with / while preserving anything after (like #anchor)
      itemUrl = itemUrl.replace('/index', '');
      // Ensure we have at least a /
      if (!itemUrl) {
        itemUrl = '/';
      }
    }

    const url = new URL(itemUrl, window.location.origin);
    url.searchParams.set('highlight', query);

    // Check if the match was found in a heading and add anchor if so
    let matchingHeading = null;
    if (Array.isArray(item.headings)) {
      matchingHeading = item.headings.find((heading) => heading.title?.toLowerCase().includes(queryLower));
    }

    // If we found a matching heading, add it as an anchor
    if (matchingHeading) {
      // Use existing ID or generate slug from title
      const headingId = matchingHeading.id || generateSlug(matchingHeading.title);
      if (headingId) {
        url.hash = `#${headingId}`;
      }
    }

    const highlightUrl = url.pathname + url.search + url.hash;

    const link = document.createElement('a');
    link.href = highlightUrl;
    link.dataset.searchResult = '';
    link.append(...highlightText(title, highlightQuery));

    const heading = document.createElement('h3');
    heading.append(link);

    const resultElement = document.createElement('div');
    resultElement.className = 'search-result';
    resultElement.append(heading);

    if (description) {
      const excerpt = document.createElement('p');
      excerpt.className = 'excerpt';
      excerpt.append(...highlightText(description, highlightQuery));
      resultElement.append(excerpt);
    }

    return resultElement;
  });

  searchInstance.searchResults.replaceChildren(...resultElements);

  // Track search for analytics
  trackSearchResults(results, query);
}

/**
 * Split text into nodes, wrapping each match of the query in a <mark>
 * @param {string} text - Text to display
 * @param {string} query - Search query; empty to skip highlighting
 * @returns {Array<string|HTMLElement>} Strings and mark elements, in order
 */
function highlightText(text, query) {
  if (!text || !query || query.length < 2) {
    return [text ?? ''];
  }

  // Splitting on a capturing group keeps the matches, at the odd positions
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.split(regex).map((part, index) => {
    if (index % 2 === 0) {
      return part;
    }
    const mark = document.createElement('mark');
    mark.textContent = part;
    return mark;
  });
}

/**
 * Generate a URL-safe slug from text
 * Matches the slug generation in main.js for consistency
 */
function generateSlug(text) {
  if (!text) {
    return '';
  }

  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Clear search results and input
 */
function clearSearch(searchInstance) {
  searchInstance.searchInput.value = '';
  clearResults(searchInstance);
  hideStatus(searchInstance);
  searchInstance.searchInput.focus();
}

/**
 * Clear search results only
 */
function clearResults(searchInstance) {
  if (searchInstance.searchResults) {
    searchInstance.searchResults.innerHTML = '';
  }
}

/**
 * Show status message
 */
function showStatus(searchInstance, message, type = 'info') {
  if (!searchInstance.searchStatus) {
    return;
  }

  searchInstance.searchStatus.textContent = message;
  searchInstance.searchStatus.className = `search-status search-${type}`;
  searchInstance.searchStatus.style.display = 'block';
}

/**
 * Hide status message
 */
function hideStatus(searchInstance) {
  if (!searchInstance.searchStatus) {
    return;
  }

  searchInstance.searchStatus.style.display = 'none';
}

/**
 * Update search status with results information
 */
function updateSearchStatus(searchInstance, count, query) {
  let message = '';

  if (count === 0) {
    message = `No results for "${query}"`;
  } else if (count === 1) {
    message = `1 result for "${query}"`;
  } else {
    message = `${count} results for "${query}"`;
    if (count === searchInstance.config.maxResults) {
      message += ` (showing first ${searchInstance.config.maxResults})`;
    }
  }

  showStatus(searchInstance, message);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(searchInstance, event) {
  // Clear search with Escape
  if (event.key === 'Escape') {
    clearSearch(searchInstance);
  }
}

/**
 * Track search results for analytics (placeholder)
 */
function trackSearchResults() {
  // Placeholder for future analytics implementation
  // When implemented, this could track: query, results.length, timestamp, etc.
}

/**
 * Auto-execute search from URL parameter
 * Reads ?q= parameter and executes search if present
 */
function autoExecuteFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');

  if (!query || query.trim().length === 0) {
    return;
  }

  // The first search on the page takes the query (usually the main one on
  // the dedicated search page). It has no instance if its index failed to load.
  const firstContainer = document.querySelector('.search-container');
  const firstInstance = firstContainer && searchInstances.get(firstContainer);

  if (firstInstance?.searchInput) {
    // Set the input value
    firstInstance.searchInput.value = query;

    // Execute the search
    handleSearch(firstInstance);

    // Focus the input for immediate user interaction
    firstInstance.searchInput.focus();
  }
}
