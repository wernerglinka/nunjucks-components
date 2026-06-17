---
layout: pages/sections-with-sidebar.njk
bodyClasses: 'sections-page'
hasHero: true
title: Code
date: 2024-09-06

navigation:
  navLabel: 'Code'
  navIndex: 3

card:
  title: 'Code'
  description: 'Syntax-highlighted code blocks with a language label, filename, and copy-to-clipboard, highlighted at build time by Shiki.'
  image: '/assets/images/sample17.jpg'
  tags: ['code', 'syntax-highlighting', 'shiki', 'code-block', 'copy-paste', 'programming', 'snippets']

seo:
  title: Code Component - Syntax Highlighted Code Blocks for Metalsmith
  description: 'Display syntax-highlighted code snippets with a language label, filename, and copy-to-clipboard. Highlighted at build time by Shiki. Perfect for documentation, tutorials, and technical content.'
  socialImage: '/assets/images/sample.jpg'
  canonicalURL: ''
  keywords: 'nunjucks code component, metalsmith, eleventy, syntax highlighting, shiki, code snippets, copy to clipboard, programming documentation, code display'

sections:
  - sectionType: rich-text
    containerTag: article
    id: ''
    isDisabled: false
    isAnimated: true
    containerFields:
      inContainer: false
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: true
        bottom: true
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Code Component'
      titleTag: 'h1'
      subTitle: ''
      prose: |-
        A specialized component for displaying syntax-highlighted code blocks with a language label, optional filename, and copy-to-clipboard. Code is highlighted at build time by [Shiki](https://shiki.style/) inside the `mdToHTML` markdown filter, which inlines token colors so no theme stylesheet is needed.

  - sectionType: code
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
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    code:
      filename: 'example.js'
      showCopy: true
      content: |-
        ```javascript
        /**
         * Example JavaScript function with JSDoc comments
         * @param {string} name - The name to greet
         * @returns {string} Greeting message
         */
        function greet(name) {
          return `Hello, ${name}!`;
        }

        // Usage example
        const message = greet('World');
        console.log(message); // Output: Hello, World!

        // ES6 arrow function version
        const greetArrow = (name) => `Hello, ${name}!`;
        ```

  - sectionType: code
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
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    code:
      filename: 'styles.css'
      showCopy: true
      content: |
        ```css
        /* Modern CSS Grid Layout */
        .container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          padding: 2rem;
        }

        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          transition: transform 0.2s ease;
        }

        .card:hover {
          transform: translateY(-4px);
        }

        /* Dark theme support */
        @media (prefers-color-scheme: dark) {
          .card {
            background: #1a1a1a;
            color: white;
          }
        }
        ```

  - sectionType: code
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
        top: false
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    code:
      filename: 'example.md'
      showCopy: true
      content: |
        ````yaml
        ---
        layout: pages/sections-with-sidebar.njk
        title: 'My Page Title'
        sections:
          - sectionType: hero
            text:
              title: 'Welcome'
              prose: 'This is a hero section'
          - sectionType: code
            code:
              filename: 'main.js'
              content: |
                ```js
                console.log('Hello from Metalsmith!');
                ```
        ---
        ````

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: ''
    isDisabled: false
    isAnimated: true
    containerFields:
      inContainer: false
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
    text:
      leadIn: ''
      title: 'Configuration'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        ````yaml
        - sectionType: code
          containerTag: section
          containerFields:
            inContainer: true
            isAnimated: true
          code:
            filename: "app.js"   # Optional filename shown in the header
            showCopy: true       # Show the copy button (default: true)
            content: |           # A fenced markdown code block
              ```js
              function example() {
                console.log('Hello, World!');
              }
              ```
        ````

        ### Configuration Options

        #### Code Properties

        | Property | Type | Required | Description |
        |----------|------|----------|-------------|
        | `content` | string | Yes | A fenced markdown code block; the fence info string sets the language (e.g. js, css, yaml) |
        | `filename` | string | No | Optional filename shown in the header |
        | `showCopy` | boolean | No | Show/hide the copy button (default: true) |

        ### Notes

        Highlighting is done at build time by Shiki inside the `mdToHTML` filter.
        Shiki inlines every token color as a style attribute, so no theme
        stylesheet is loaded and there is no per-section theme — the theme is
        configured once in the markdown filter.

        #### Supported Languages

        The bundled Shiki grammars include JavaScript, TypeScript, CSS, HTML,
        Bash, JSON, YAML and Markdown. For Nunjucks templates use `njk` or
        `nunjucks` as the fence language — it is aliased to the `jinja-html`
        grammar.

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    isAnimated: false
    componentDownload: 'code'
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
      title: 'Download Code Section'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete code component package including template, styles, manifest, examples, and installation script.'
    ctas:
      - url: '/downloads/sections/code.zip'
        label: 'Download Code Section'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
