---
layout: pages/sections-with-sidebar.njk
bodyClasses: ''

seo:
  title: Page Transitions Partial - Nunjucks Components
  description: 'SWUP-based page transitions partial for smooth navigation between pages'
  socialImage: '/assets/images/metalsmith2025-starter-social.png'

card:
  title: 'Page Transitions'
  description: 'Smooth page transitions powered by SWUP'
  pattern: 'simple-gray3'
  tags: ['page-transitions', 'swup', 'navigation', 'animation', 'spa']

sections:
  - sectionType: rich-text
    containerTag: section
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: true
        bottom: true
      background:
        isDark: false
    text:
      leadIn: 'Partial Component'
      title: 'Page Transitions'
      titleTag: 'h1'
      prose: |
        The Page Transitions partial enables smooth page transitions using [SWUP](https://swup.js.org/). It intercepts internal link clicks, fetches pages via AJAX, and swaps the content of the `#swup` container with a fade animation. The partial has no visual output of its own; its manifest loads the transition styles and scripts.

        This very site uses the partial: navigate to any other page and back to see the fade transition in action.

        ### Manifest

        ```json
        {
          "name": "page-transitions",
          "type": "partial",
          "styles": ["page-transitions.css"],
          "scripts": ["page-transitions.js"],
          "requires": []
        }
        ```

        ### Dependencies

        The partial requires npm packages that are not bundled with the component:

        ```bash
        npm install swup @swup/head-plugin @swup/scroll-plugin @swup/preload-plugin
        ```

  - sectionType: rich-text
    containerTag: section
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: false
        bottom: false
      background:
        isDark: false
    text:
      title: 'Usage'
      titleTag: 'h2'
      prose: |
        Unlike most partials, page-transitions is not configured through frontmatter. It is included once in the base layout:

        ```nunjucks
        {% include "components/_partials/page-transitions/page-transitions.njk" %}
        ```

        The layout needs a main element that serves as the SWUP container. Content inside it is replaced during transitions; content outside (header, footer) persists:

        ```html
        <main class="transition-fade" id="swup">
          <!-- Page content that gets swapped -->
        </main>
        ```

        Initialize the PageTransitions registry at the very top of the bundler entry point (`main.js`) so it exists before any component script runs:

        ```javascript
        if (!window.PageTransitions) {
          const componentRegistry = new Map();
          const cleanupRegistry = new Map();

          window.PageTransitions = {
            registerComponent: (name, initFn) => componentRegistry.set(name, initFn),
            registerCleanup: (name, cleanupFn) => cleanupRegistry.set(name, cleanupFn),
            _componentRegistry: componentRegistry,
            _cleanupRegistry: cleanupRegistry
          };
        }
        ```

        ### Component Registration

        Components with JavaScript register an init function so they re-initialize after each page swap, and optionally a cleanup function for intervals or observers:

        ```javascript
        if (window.PageTransitions) {
          window.PageTransitions.registerComponent('my-component', initMyComponent);
          window.PageTransitions.registerCleanup('my-component', cleanupMyComponent);
        }
        ```

        Components guard against duplicate setup by checking `element.dataset.initialized` before binding event listeners.

  - sectionType: rich-text
    containerTag: section
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      background:
        isDark: false
    text:
      title: 'Notes'
      titleTag: 'h3'
      prose: |
        - Sites with multiple layouts need a distinguishing class (e.g. `with-sidebar`) on the body; the partial detects layout changes and forces a full reload between different layouts
        - Non-HTML resources (`.zip`, `.pdf`, images) are excluded from transitions via SWUP's `ignoreVisit` option
        - Registration is conditional (`if (window.PageTransitions)`), so components keep working on sites without page transitions

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    componentDownload: 'page-transitions'
    containerFields:
      isAnimated: false
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
      title: 'Download Page Transitions Partial'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete page-transitions component package including styles, scripts, manifest, and installation script.'
    ctas:
      - url: '/downloads/partials/page-transitions.zip'
        label: 'Download Page Transitions Partial'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
