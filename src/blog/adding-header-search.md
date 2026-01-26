---
layout: pages/sections.njk
bodyClasses: 'sections-page'
hasHero: true

card:
  title: 'Adding Header Search to Your Site'
  description: 'A step-by-step guide to adding a header search form from the Nunjucks Components library to your starter project'
  date: '2025-11-04'
  author: 'Nunjucks Components Team'
  thumbnail: '/assets/images/sample15.jpg'

seo:
  title: 'Adding Header Search to Your Metalsmith Site'
  description: 'Complete beginner-friendly guide to adding a header search form with overlay to the Metalsmith2025 Structured Content Starter'
  socialImage: '/assets/images/sample15.jpg'
  canonicalURL: ''
  keywords: 'metalsmith components, search, header search, how-to tutorial, component integration'

sections:
  - sectionType: hero
    containerTag: section
    classes: 'first-section'
    id: ''
    isDisabled: false
    isFullScreen: false
    isReverse: true
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        isDark: true
        color: ''
        image: '/assets/images/sample15.jpg'
        imageScreen: 'dark'
    text:
      leadIn: 'How-To Tutorial'
      title: 'Adding Header Search'
      titleTag: 'h1'
      subTitle: 'From library to starter in 10 steps'
      prose: 'Learn how to add a complete search system to your Metalsmith site, including a header search form with overlay, search index generation, and a dedicated search results page. This beginner-friendly guide walks through every step.'
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''

  - sectionType: text-only
    containerTag: article
    classes: ''
    id: ''
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: true
      isAnimated: true
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
      title: ''
      titleTag: 'h2'
      isCentered: false
      subTitle: ''
      prose: |-
        ## What You'll Build

        By the end of this tutorial, you'll have a complete search system that includes:
        - A search icon button in your header that opens an overlay
        - A search form with keyboard shortcuts (Cmd/Ctrl + K)
        - Automatic redirection to a dedicated search results page
        - A search index generated at build time
        - A search results page powered by Fuse.js fuzzy matching
        - Persistent URL parameters for shareable search results

        ## Prerequisites

        Before starting, make sure you have:
        - The [Metalsmith2025 Structured Content Starter](https://github.com/wernerglinka/metalsmith2025-structured-content-starter) set up and running
        - Access to the [Nunjucks Components library](https://github.com/wernerglinka/nunjucks-components) (either cloned locally or downloaded)
        - Basic understanding of HTML, CSS, and JavaScript
        - A code editor and terminal access

        ## Understanding the Search Architecture

        This search implementation uses a two-part architecture:

        ### Header Search Form
        A lightweight search form in the header that collects user input and redirects to a dedicated search page. It provides a clean, non-intrusive way to access search without cluttering every page.

        ### Search Results Page
        A dedicated page that performs the actual search using Fuse.js fuzzy matching against a search index generated at build time. This separation keeps the header lightweight while providing powerful search capabilities.

        ## Step 1: Install the metalsmith-search Plugin

        The first step is to install the plugin that generates the search index at build time.

        ### Install the Package

        Navigate to your project root and run:

        ```bash
        npm install metalsmith-search
        ```

        This plugin scans your pages during the build process and creates a JSON search index containing page titles, content, excerpts, and headings.

        ## Step 2: Configure the Search Plugin

        Now we need to add the plugin to the Metalsmith build pipeline.

        ### Update metalsmith.js

        Open `metalsmith.js` and add the search plugin configuration. The plugin should be placed **after** the layouts plugin but before any HTML manipulation plugins.

        ```javascript
        import search from 'metalsmith-search';

        export default (options = {}) => {
          // ... other configuration

          metalsmith
            // ... other plugins
            .use(layouts(layoutsOptions))

            // Add search index generation
            .use(
              search({
                ignore: [
                  '**/search.md',
                  '**/search-index.json'
                ]
              })
            )

            // ... remaining plugins
        }
        ```

        **Configuration explained:**
        - `ignore` - Excludes the search page itself and the generated index to prevent recursion
        - The plugin uses defaults for everything else, which is perfect for most use cases

        ### What the Plugin Does

        During the build, the plugin:
        1. Scans all HTML pages in your site
        2. Extracts titles, content, excerpts, and headings
        3. Creates a search index at `build/search-index.json`
        4. Generates metadata about the index (entry counts, average content length, etc.)

        ## Step 3: Download the Search Component

        Next, download the search partial component from the component library.

        ### Download the Component Package

        Visit the [search reference page](https://nunjucks-components.com/references/partials/search) and click the download button at the bottom of the page. This downloads a ZIP file containing:
        - `search.njk` - The Nunjucks template macro
        - `search.css` - Component styles
        - `search.js` - Client-side search implementation
        - `manifest.json` - Component configuration
        - `search.yaml` - Configuration examples
        - `README.md` - Component documentation
        - `install.sh` - Automated installation script
        - `modules/helpers/load-fuse.js` - Dynamic Fuse.js loader

        ### Install Using the Automated Script

        **Prerequisite:** Ensure you have a `nunjucks-components.config.json` file in your project root:

        ```json
        {
          "componentsBasePath": "lib/layouts/components",
          "sectionsDir": "sections",
          "partialsDir": "_partials"
        }
        ```

        After downloading, move the zip file to your project root directory, then:

        ```bash
        # Navigate to your project root
        cd /path/to/your/project

        # Extract the component package
        unzip search.zip

        # Navigate into the extracted directory and run the installation script
        cd search
        ./install.sh
        ```

        The installation script will:
        1. Verify `nunjucks-components.config.json` exists
        2. Read component paths from your configuration
        3. Check for existing installations and compare versions
        4. **Automatically download and install any missing dependencies**
        5. Copy component files to your partials directory
        6. Report success

        **Note:** The search partial has no dependencies, but later when you install `search-only`, the install script will automatically download and install the `search` partial if it's not already present.

        ## Step 4: Update the Header Component

        Now we'll add the search toggle button and overlay form to your header.

        ### Update header.njk

        Open `lib/layouts/components/sections/header/header.njk`. Currently it looks something like this:

        ```liquid
        {% from "components/_partials/branding/branding.njk" import branding %}
        {% from "components/_partials/navigation/navigation.njk" import navigation %}

        <header>
            {% set link = '/' %}
            {% set img = { src: '/assets/images/metalsmith2025-logo-bug.png', alt: 'Metalsmith Starter' } %}

            {{ branding( link, img ) }}

            {{ navigation( mainMenu, urlPath )}}
        </header>
        ```

        **Note:** The `mainMenu` and `urlPath` variables are provided by the `metalsmith-menu-plus` plugin.

        Add the search toggle button and overlay form:

        ```liquid
        {% from "components/_partials/branding/branding.njk" import branding %}
        {% from "components/_partials/navigation/navigation.njk" import navigation %}

        <header>
            {% set link = '/' %}
            {% set img = { src: '/assets/images/metalsmith2025-logo-bug.png', alt: 'Metalsmith Starter' } %}

            {{ branding( link, img ) }}

            {{ navigation( mainMenu, urlPath )}}

            <div class="misc">
              <button type="button" class="search-icon-toggle" aria-label="Toggle search" aria-expanded="false">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </div>
        </header>

        <div class="header-search-overlay">
          <form class="header-search-form" action="/search/" method="get" role="search">
            <input
              type="search"
              name="q"
              id="header-search-input"
              class="header-search-input"
              placeholder="Search..."
              autocomplete="off"
              aria-label="Search the site"
            />
            <button type="submit" class="none" aria-label="Submit search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </form>
        </div>
        ```

        **Key elements:**
        - `search-icon-toggle` - The button that opens the search overlay
        - `header-search-overlay` - The overlay container (hidden by default)
        - `header-search-form` - The form that submits to `/search/`
        - `header-search-input` - The search input field
        - Both buttons use inline SVG for the search icon (magnifying glass)

        ## Step 5: Add Header Search Styles

        The header search requires specific styles for the overlay and form.

        ### Update header.css

        Open `lib/layouts/components/sections/header/header.css` and add these styles at the end:

        ```css
        /* Hide search icon on the search page itself */
        .search-page header .misc .search-icon-toggle {
          display: none;
        }

        /* Header search overlay - positioned below header */
        .header-search-overlay {
          position: fixed;
          /* Matches fluid header height */
          top: clamp(3.25rem, 3.25rem + 1.75vw, 5rem);
          left: 0;
          right: 0;
          z-index: 90;
          background: rgb(255 255 255 / 60%);
          backdrop-filter: blur(var(--space-xs, 0.3125rem));
          padding: var(--space-s) var(--gutter);

          /* Hidden by default */
          opacity: 0;
          visibility: hidden;
          transform: translateY(-1rem);
          transition:
            opacity 0.3s ease,
            transform 0.3s ease,
            visibility 0s 0.3s;

          &.active {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
            transition:
              opacity 0.3s ease,
              transform 0.3s ease;
          }

          .header-search-form {
            display: flex;
            align-items: center;
            gap: 0;
            max-width: 40rem;
            margin: 0 auto;
            border: 1px solid var(--color-border, #ddd);
            border-radius: var(--space-3xs, 0.25rem);
            overflow: hidden;
            background: var(--background-color-light, #fff);

            .header-search-input {
              flex: 1;
              padding: var(--space-2xs-xs, 0.5rem);
              border: none;
              font-size: clamp(0.875rem, 0.8rem + 0.3vw, 1rem);
              background: transparent;
              color: var(--color-text);

              &:focus {
                outline: none;
              }

              &::placeholder {
                color: var(--color-text-muted, #999);
              }
            }

            button[type='submit'] {
              padding: var(--space-2xs, 0.75rem);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: background 0.2s ease;

              &:hover {
                background: var(--background-color-link-hover, #f5f5f5);
              }

              svg {
                stroke: var(--color-link-navigation);
                stroke-width: 2px;
                width: 1.5rem;
                height: 1.5rem;
              }
            }
          }
        }
        ```

        Also update the `.misc` styles to include the search toggle button:

        ```css
        .misc {
          /* Cluster pattern for misc items */
          display: flex;
          align-items: center;
          gap: var(--space-s);

          /* Reset button styles for header buttons */
          button.search-icon-toggle,
          button[type='submit'] {
            background: transparent;
            box-shadow: none;
            padding: 0;
            border-radius: 0;
            backdrop-filter: none;

            &:hover {
              transform: none;
              background: transparent;
            }

            &:focus,
            &:focus-visible {
              outline: 2px solid var(--color-link-navigation);
              outline-offset: 2px;
              box-shadow: none;
            }
          }

          .search-icon-toggle {
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: var(--space-m-l);
            height: var(--space-m-l);
            transition: opacity 0.3s ease;

            svg {
              stroke: var(--color-link-navigation);
              stroke-width: 1px;
            }

            &.search-active {
              opacity: 0;
              pointer-events: none;
            }
          }
        }
        ```

        **Key features:**
        - Fixed positioning below the header
        - Smooth slide-down animation when opened
        - Glassmorphism effect with backdrop blur
        - Centered, max-width form for readability
        - Responsive fluid sizing
        - Search icon hidden on the search page itself

        ## Step 6: Add Header Search JavaScript

        Now we need to add the interactive behavior for the search overlay.

        ### Create header.js

        Create a new file at `lib/layouts/components/sections/header/header.js`:

        ```javascript
        /**
         * Header Component
         * Handles header search functionality
         */

        /**
         * Initialize header functionality when DOM loads
         */
        document.addEventListener('DOMContentLoaded', () => {
          initHeaderSearch();
        });

        /**
         * Initialize header search form
         * Handles search overlay toggle, form submission, and keyboard shortcuts
         */
        function initHeaderSearch() {
          const searchToggle = document.querySelector('.search-icon-toggle');
          const searchOverlay = document.querySelector('.header-search-overlay');
          const searchForm = document.querySelector('.header-search-form');
          const searchInput = document.querySelector('#header-search-input');

          if (!searchToggle || !searchOverlay || !searchForm || !searchInput) {
            return;
          }

          // Toggle search overlay visibility
          searchToggle.addEventListener('click', () => {
            const isActive = searchOverlay.classList.contains('active');

            if (isActive) {
              closeSearch();
            } else {
              openSearch();
            }
          });

          // Open search overlay
          function openSearch() {
            searchOverlay.classList.add('active');
            searchToggle.classList.add('search-active');
            searchToggle.setAttribute('aria-expanded', 'true');

            // Focus input after animation completes
            setTimeout(() => {
              searchInput.focus();
            }, 300);
          }

          // Close search overlay
          function closeSearch() {
            searchOverlay.classList.remove('active');
            searchToggle.classList.remove('search-active');
            searchToggle.setAttribute('aria-expanded', 'false');
            searchInput.value = '';
          }

          // Close search when clicking outside
          document.addEventListener('click', (e) => {
            const isClickInsideOverlay = searchOverlay.contains(e.target);
            const isClickOnToggle = searchToggle.contains(e.target);

            if (!isClickInsideOverlay && !isClickOnToggle && searchOverlay.classList.contains('active')) {
              closeSearch();
            }
          });

          // Close search on Escape key
          document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
              closeSearch();
            }
          });

          // Handle form submission
          searchForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const query = searchInput.value.trim();

            if (query.length === 0) {
              // Focus input if empty
              searchInput.focus();
              return;
            }

            // Redirect to search page with query parameter
            const searchURL = `/search/?q=${encodeURIComponent(query)}`;
            window.location.href = searchURL;
          });

          // Handle keyboard shortcut (Cmd/Ctrl + K) to open search
          document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
              e.preventDefault();
              if (!searchOverlay.classList.contains('active')) {
                openSearch();
              }
            }
          });
        }
        ```

        **Key functionality:**
        - Opens overlay when clicking the search icon
        - Closes overlay when clicking outside, pressing Escape, or submitting
        - Keyboard shortcut (Cmd/Ctrl + K) opens search
        - Auto-focuses the input when overlay opens
        - Redirects to `/search/?q=query` on form submission
        - Proper ARIA attributes for accessibility

        ### Update header manifest.json

        Open `lib/layouts/components/sections/header/manifest.json` and add the JavaScript file to the scripts array:

        ```json
        {
          "name": "header",
          "type": "section",
          "styles": ["header.css"],
          "scripts": ["header.js"],
          "requires": ["branding", "navigation"]
        }
        ```

        This tells the bundler to include `header.js` when the header component is used.

        ## Step 7: Create the Search Results Page

        Now we need to create a dedicated page for displaying search results.

        ### Create search.md

        Create a new file at `src/search.md`:

        ```yaml
        ---
        layout: pages/sections.njk
        bodyClasses: 'search-page'
        hasHero: false

        seo:
          title: Search - Your Site Name
          description: 'Search the site for content, documentation, and guides.'
          socialImage: ''
          canonicalURL: ''
          keywords: 'search, find content'

        sections:
          - sectionType: hero
            containerTag: section
            classes: 'first-section'
            id: ''
            isDisabled: false
            isFullScreen: false
            isReverse: false
            containerFields:
              inContainer: false
              isAnimated: true
              noMargin:
                top: true
                bottom: true
              noPadding:
                top: false
                bottom: false
              background:
                isDark: false
                color: ''
                image: ''
                imageScreen: 'none'
            text:
              leadIn: ''
              title: Search Results
              titleTag: 'h1'
              subTitle: 'Search across all site content.'
            ctas:
              - url: ''
                label: ''
                isButton: false
                buttonStyle: 'primary'
            image:
              src: ''
              alt: ''
              caption: ''

          - sectionType: search-only
            containerTag: section
            classes: 'search-page-section'
            id: ''
            isDisabled: false
            isReverse: false
            containerFields:
              inContainer: true
              isAnimated: false
              noMargin:
                top: true
                bottom: false
              noPadding:
                top: false
                bottom: false
              background:
                color: ''
                image: ''
                imageScreen: 'none'
            title: ''
            subtitle: ''
            placeholder: 'Search the entire site...'
            settings:
              maxResults: 50
              minCharacters: 2
              enableHighlighting: true
              searchType: 'site'
        ---
        ```

        **Configuration explained:**
        - `bodyClasses: 'search-page'` - Allows CSS to hide the header search icon on this page
        - `sectionType: search-only` - Uses the search section component
        - `placeholder` - Text shown in the search input
        - `maxResults: 50` - Maximum number of results to display
        - `minCharacters: 2` - Minimum characters before searching begins
        - `enableHighlighting: true` - Highlights matched terms in results
        - `searchType: 'site'` - Searches across all site content

        ## Step 8: Download the search-only Section Component

        The search results page requires the `search-only` section component.

        ### Download the Component Package

        Visit the [search-only reference page](https://nunjucks-components.com/references/sections/search-only) and click the download button. This downloads a ZIP file containing:
        - `search-only.njk` - Section template
        - `search-only.css` - Section-specific styles
        - `manifest.json` - Component configuration
        - `search-only.yml` - Configuration examples
        - `README.md` - Documentation
        - `install.sh` - Installation script

        ### Install Using the Automated Script

        Ensure you have `nunjucks-components.config.json` in your project root (see Step 3 above), then:

        ```bash
        # Extract the component package
        unzip search-only.zip

        # Navigate into the extracted directory and run the installation script
        cd search-only
        ./install.sh
        ```

        The script will copy files to your sections directory as configured.

        **Automatic Dependency Resolution:** The `search-only` section depends on the `search` partial. When you run `./install.sh`, it will automatically check if the search partial is installed. If not, it downloads and installs it for you. You don't need to manually install dependencies.

        ## Step 9: Add Search Result Highlighting

        When users click a search result, they're taken to the target page with a `?highlight=term` URL parameter. To highlight the search term on the destination page, you need to add highlight functionality to your project's main JavaScript file.

        ### Cross-Boundary Highlighting

        The highlighting implementation supports phrases that span inline element boundaries. For example, if your content has `Use <strong>markdown formatting</strong>`, searching for "Use markdown formatting" will correctly highlight across the `<strong>` tag, producing `<mark>Use </mark><strong><mark>markdown formatting</mark></strong>` - multiple marks that visually appear as one continuous highlight.

        ### Update main.js

        Add the following code to your `lib/assets/main.js` (or equivalent main JavaScript entry point):

        ```javascript
        /**
         * Page Highlight Utility
         * Highlights search terms on pages based on URL query parameters
         */
        function initHighlights() {
          const urlParams = new URLSearchParams(window.location.search);
          const highlightTerm = urlParams.get('highlight');

          if (highlightTerm && highlightTerm.trim().length >= 2) {
            highlightPageContent(highlightTerm.trim());

            // If no hash in URL, find and scroll to closest heading
            if (!window.location.hash) {
              scrollToClosestHeading(highlightTerm.trim());
            }

            showClearButton();
          }
        }

        /**
         * Find and scroll to the closest heading above the first highlight
         */
        function scrollToClosestHeading(_searchTerm) {
          setTimeout(() => {
            const firstHighlight = document.querySelector('mark[data-highlight]');
            if (!firstHighlight) return;

            let currentElement = firstHighlight;
            let closestHeading = null;

            while (currentElement && !closestHeading) {
              let sibling = currentElement.previousElementSibling;
              while (sibling) {
                if (/^H[1-6]$/.test(sibling.tagName) && sibling.id) {
                  closestHeading = sibling;
                  break;
                }
                const headingInSibling = sibling.querySelector('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
                if (headingInSibling) {
                  const headings = sibling.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
                  closestHeading = headings[headings.length - 1];
                  break;
                }
                sibling = sibling.previousElementSibling;
              }
              if (!closestHeading) {
                currentElement = currentElement.parentElement;
                if (currentElement && /^H[1-6]$/.test(currentElement.tagName) && currentElement.id) {
                  closestHeading = currentElement;
                }
              }
            }

            if (closestHeading) {
              closestHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
              history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${closestHeading.id}`);
            }
          }, 100);
        }

        /**
         * Escape special regex characters in a string
         */
        function escapeRegex(string) {
          return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        /**
         * Check if a text node should be skipped during highlighting
         */
        function shouldSkipTextNode(node) {
          const parentTag = node.parentElement.tagName.toLowerCase();
          if (['script', 'style', 'mark'].includes(parentTag)) {
            return true;
          }
          // Skip interactive components that break when DOM is modified
          if (node.parentElement.closest('.js-hero-slider, .js-slider, .js-carousel')) {
            return true;
          }
          return false;
        }

        /**
         * Get all text nodes within an element
         */
        function getTextNodes(element) {
          const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function(node) {
                if (shouldSkipTextNode(node)) {
                  return NodeFilter.FILTER_REJECT;
                }
                if (node.textContent.length > 0) {
                  return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_SKIP;
              }
            }
          );

          const textNodes = [];
          let node;
          while (node = walker.nextNode()) {
            textNodes.push(node);
          }
          return textNodes;
        }

        /**
         * Get the block-level ancestor of a node
         * Used to group text nodes that should be searched together
         */
        function getBlockAncestor(node) {
          const blockTags = [
            'P', 'DIV', 'LI', 'TD', 'TH', 'DD', 'DT',
            'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
            'ARTICLE', 'SECTION', 'ASIDE', 'HEADER', 'FOOTER', 'MAIN',
            'BLOCKQUOTE', 'FIGCAPTION', 'FIGURE', 'ADDRESS', 'PRE'
          ];

          let current = node.parentElement;
          while (current && current !== document.body) {
            if (blockTags.includes(current.tagName)) {
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
        function buildPositionMap(textNodes) {
          let combinedText = '';
          const nodeMap = [];

          textNodes.forEach(node => {
            const start = combinedText.length;
            combinedText += node.textContent;
            const end = combinedText.length;
            nodeMap.push({ node, start, end });
          });

          return { combinedText, nodeMap };
        }

        /**
         * Find all matches of a search term in text
         */
        function findMatches(text, searchTerm) {
          const regex = new RegExp(escapeRegex(searchTerm), 'gi');
          const matches = [];
          let match;

          while ((match = regex.exec(text)) !== null) {
            matches.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }

          return matches;
        }

        /**
         * Highlight a portion of a text node by wrapping it in a mark element
         */
        function highlightTextNodePortion(textNode, highlightStart, highlightEnd) {
          const text = textNode.textContent;

          const before = text.substring(0, highlightStart);
          const highlight = text.substring(highlightStart, highlightEnd);
          const after = text.substring(highlightEnd);

          const fragment = document.createDocumentFragment();

          if (before) {
            fragment.appendChild(document.createTextNode(before));
          }

          const mark = document.createElement('mark');
          mark.setAttribute('data-highlight', '');
          mark.textContent = highlight;
          fragment.appendChild(mark);

          if (after) {
            fragment.appendChild(document.createTextNode(after));
          }

          textNode.parentNode.replaceChild(fragment, textNode);
        }

        /**
         * Highlight search term within a group of text nodes
         * Handles phrases that span multiple text nodes (across inline elements)
         */
        function highlightInTextNodeGroup(textNodes, searchTerm) {
          if (textNodes.length === 0) {
            return;
          }

          const { combinedText, nodeMap } = buildPositionMap(textNodes);
          const matches = findMatches(combinedText, searchTerm);

          if (matches.length === 0) {
            return;
          }

          // Process matches in reverse order to preserve node positions
          matches.reverse().forEach(match => {
            // Find which text nodes are involved in this match
            const involvedNodes = nodeMap.filter(n =>
              n.start < match.end && n.end > match.start
            );

            // Process involved nodes in reverse order
            involvedNodes.reverse().forEach(({ node, start: nodeStart }) => {
              const highlightStart = Math.max(0, match.start - nodeStart);
              const highlightEnd = Math.min(node.textContent.length, match.end - nodeStart);

              if (highlightEnd > highlightStart) {
                highlightTextNodePortion(node, highlightStart, highlightEnd);
              }
            });
          });
        }

        /**
         * Highlight all instances of search term on the page
         * Supports highlighting phrases that span inline element boundaries
         */
        function highlightPageContent(searchTerm) {
          const allTextNodes = getTextNodes(document.body);

          // Group text nodes by their block-level ancestor
          // This ensures we only match phrases within the same paragraph/block
          const groups = new Map();

          allTextNodes.forEach(node => {
            const blockAncestor = getBlockAncestor(node);
            if (!groups.has(blockAncestor)) {
              groups.set(blockAncestor, []);
            }
            groups.get(blockAncestor).push(node);
          });

          // Process each group
          groups.forEach(textNodes => {
            highlightInTextNodeGroup(textNodes, searchTerm);
          });
        }

        /**
         * Show the clear highlights button
         */
        function showClearButton() {
          if (document.getElementById('clear-highlights-btn')) return;

          const button = document.createElement('button');
          button.id = 'clear-highlights-btn';
          button.className = 'clear-highlights button primary';
          button.innerHTML = 'Clear highlights';
          button.setAttribute('aria-label', 'Clear highlighted search terms');
          button.addEventListener('click', clearHighlights);
          document.body.appendChild(button);
        }

        /**
         * Clear all highlights and reload page without query parameter
         */
        function clearHighlights() {
          window.location = window.location.pathname;
        }

        // Call initHighlights() in your initialization function
        // For example, in your DOMContentLoaded handler:
        document.addEventListener('DOMContentLoaded', () => {
          initHighlights();
          // ... other initialization
        });

        // Add keyboard shortcut to clear highlights with Escape key
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && document.getElementById('clear-highlights-btn')) {
            clearHighlights();
          }
        });
        ```

        ### Add CSS for the Clear Button

        Add these styles to your main CSS file (or a global stylesheet):

        ```css
        /* Clear highlights button */
        .clear-highlights {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 1000;
        }

        /* Highlighted search terms */
        mark[data-highlight] {
          background-color: #ffeb3b;
          padding: 0.1em 0.2em;
          border-radius: 2px;
        }
        ```

        ### Why This Is Separate

        The highlight functionality lives in your main JavaScript file rather than in the search component because it needs to run on **every page** in your site. When a user clicks a search result, they navigate to a content page (like a blog post) that may not have any search component on it. The main.js file is loaded globally, ensuring highlights work regardless of which page the user lands on.

        ## Step 10: Build and Test

        Now let's test the complete search system.

        ### Start Development Server

        ```bash
        npm start
        ```

        This builds the site and starts the development server at `http://localhost:3000`.

        During the build, you should see:
        - The metalsmith-search plugin generating the search index
        - The bundler detecting both `search` and `search-only` components
        - CSS and JavaScript being bundled for both components

        ### Testing Checklist

        Test the following functionality:

        **Header Search Form:**
        1. **Visual Check** - The search icon appears in the header
        2. **Open Overlay** - Click the search icon, the overlay slides down smoothly, the input is auto-focused
        3. **Keyboard Shortcut** - Press Cmd/Ctrl + K, the overlay opens
        4. **Close Overlay** - Press Escape or click outside, the overlay closes
        5. **Submit Search** - Type "test" and press Enter, you should be redirected to `/search/?q=test`

        **Search Results Page:**
        1. **Page Loads** - Visit `/search/`, the page loads with a search input
        2. **URL Parameter** - Visit `/search/?q=test`, the search executes automatically with "test"
        3. **Search Works** - Type in the search input, results appear as you type
        4. **Highlighting** - Matched terms are highlighted in results
        5. **No Results** - Search for nonsense text, see "no results" message

        **Result Highlighting (on destination pages):**
        1. **Click a Result** - Click any search result to navigate to the target page
        2. **Terms Highlighted** - The search term should be highlighted in yellow on the page
        3. **Auto-Scroll** - The page should scroll to the section containing the first highlight
        4. **Clear Button** - A "Clear highlights" button should appear at the bottom-right
        5. **Escape Key** - Press Escape to clear highlights and remove the URL parameter

        **Browser DevTools Check:**
        1. Open Console and verify no JavaScript errors
        2. Check Network tab for `/search-index.json` loading successfully
        3. Verify Fuse.js loads from CDN (only on search page)
        4. Inspect the search index structure in the Response tab

        ## Step 11: Troubleshooting

        If something isn't working, here are common issues and solutions:

        ### Search Icon Doesn't Appear

        - Verify `header.js` was created and added to manifest.json
        - Check that the search icon button was added to `header.njk`
        - Clear your browser cache and hard refresh
        - Restart the development server

        ### Overlay Doesn't Open

        - Open browser Console and check for JavaScript errors
        - Verify the class names match exactly: `search-icon-toggle`, `header-search-overlay`
        - Check that `header.js` is loading in the Network tab
        - Ensure the button has the correct click event listener

        ### Search Index Not Generated

        - Verify `metalsmith-search` is installed: `npm list metalsmith-search`
        - Check that the plugin is configured in `metalsmith.js`
        - Ensure the plugin is placed after the layouts plugin
        - Look for error messages during the build
        - Check if `build/search-index.json` exists after building

        ### Search Page Shows No Results

        - Verify the search index exists at `/search-index.json`
        - Open the search index in your browser to confirm it has entries
        - Check browser Console for Fuse.js loading errors
        - Verify the search component JavaScript is loading
        - Ensure the query parameter is being read correctly

        ### Fuse.js Doesn't Load

        - Check browser Console for CDN errors
        - Verify your internet connection (Fuse.js loads from CDN)
        - Try a different browser to rule out extensions blocking CDN
        - Check the CDN URL in `modules/helpers/load-fuse.js`

        ### Highlights Don't Appear on Destination Pages

        - Verify you added the highlight code to your main.js file
        - Check that `initHighlights()` is being called on page load
        - Confirm the URL has `?highlight=term` parameter after clicking a result
        - Check browser Console for JavaScript errors
        - Verify the CSS for `mark[data-highlight]` is present

        ### Clear Button Doesn't Appear

        - Check that `showClearButton()` is being called in `initHighlights()`
        - Verify the CSS for `.clear-highlights` is included
        - Check that the button isn't hidden behind other elements (z-index issue)

        ### Keyboard Shortcut Doesn't Work

        - Verify the keyboard event listener is in `header.js`
        - Try both Cmd (Mac) and Ctrl (Windows/Linux) keys
        - Ensure you're pressing the lowercase 'k' key
        - Check that another extension isn't capturing the same shortcut

        ## Understanding What Happened

        Let's review the key concepts you just implemented:

        ### Build-Time Index Generation

        The `metalsmith-search` plugin runs during the build process and creates a comprehensive search index. This happens once at build time, not on every page load, making searches fast and efficient.

        ### Header-Based Search Entry Point

        Rather than putting a search form on every page, you created a lightweight search icon in the header that opens an overlay. This provides quick access to search without cluttering your pages.

        ### Dedicated Search Results Page

        The actual search functionality lives on a dedicated page, keeping the header simple and the search feature powerful. The URL parameters make search results shareable.

        ### Two-Layer Search Algorithm

        The search uses Fuse.js for fuzzy matching (handles typos) and then applies strict filtering to eliminate false positives. This provides both flexibility and accuracy.

        ### Component-Based Architecture

        You used three components working together: the header component (with search form), the search partial (search UI and logic), and the search-only section (page wrapper). Each component is self-contained and reusable.

        ## Next Steps

        Now that you have working search functionality, consider these enhancements:

        ### Customize Search Weighting

        Adjust which fields are more important in search results by modifying the Fuse.js configuration in `search.js`. You can give higher weight to titles versus content.

        ### Add Search Analytics

        Track what users search for by adding analytics events when searches are performed. This helps you understand what content users are looking for.

        ### Enhance the Search Index

        Configure the metalsmith-search plugin to include additional metadata like categories, tags, or dates in the search index for more refined searching.

        ### Add Search Filters

        Create category or content-type filters on the search results page to help users narrow down results.

        ### Improve Mobile Experience

        Consider a full-screen search overlay on mobile devices for better usability on small screens.

        ## Summary

        Congratulations! You've successfully added a complete search system to your Metalsmith site. Here's what you accomplished:

        1. Installed and configured the metalsmith-search plugin
        2. Added a search toggle button to the header
        3. Created a search overlay form with animations
        4. Implemented search form JavaScript with keyboard shortcuts
        5. Created a dedicated search results page
        6. Installed the search and search-only components from the library
        7. Added search result highlighting to your main.js
        8. Tested the complete search workflow

        ### Key Takeaways

        - **Build-time indexing** - Search index generated once during build, not on every request
        - **Progressive enhancement** - Form works even if JavaScript fails, redirecting to search page
        - **Keyboard accessibility** - Cmd/Ctrl + K provides quick access
        - **URL parameters** - Shareable search results via query strings
        - **Component composition** - Multiple components working together seamlessly
        - **Fuzzy matching** - Fuse.js handles typos and approximate matches
        - **Result highlighting** - Search terms highlighted on destination pages for easy scanning
        - **Cross-boundary matching** - Highlights phrases even when they span inline elements like `<strong>` or `<em>`
        - **Automatic dependencies** - Install scripts handle component dependencies automatically

        ### Related Resources

        - [Search Component Documentation](/references/partials/search)
        - [Search-Only Section Documentation](/references/sections/search-only)
        - [metalsmith-search Plugin](https://www.npmjs.com/package/metalsmith-search)
        - [Fuse.js Documentation](https://fusejs.io/)
        - [Metalsmith2025 Starter Repository](https://github.com/wernerglinka/metalsmith2025-structured-content-starter)
        - [Nunjucks Components Library](https://github.com/wernerglinka/nunjucks-components)

        Happy searching!

  - sectionType: collection-links
    containerTag: section
    classes: ''
    id: ''
    isDisabled: false
    isReverse: false
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: false
      noPadding:
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
---
