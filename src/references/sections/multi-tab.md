---
layout: pages/sections-with-sidebar.njk
bodyClasses: 'sections-page'
title: Multi-Tab

navigation:
  navLabel: 'Multi-Tab'
  navIndex: 3

card:
  title: 'Multi-Tab'
  description: 'A tabbed interface wrapper where each pane can be any section type, declared explicitly in frontmatter.'
  image: '/assets/images/sample8.jpg'
  tags: ['tabs', 'tabbed', 'navigation', 'interface', 'wrapper', 'panes']

seo:
  title: Multi-Tab Section Component - Tabbed Interface for Metalsmith
  description: 'A dynamic tabbed interface where each pane can be any section type. Supports keyboard navigation, URL hash routing, and SWUP page transitions.'
  socialImage: '/assets/images/sample.jpg'
  canonicalURL: ''
  keywords: 'nunjucks tabs section, metalsmith, eleventy, tabbed interface, tab component, keyboard navigation, accessible tabs, ARIA tabs'

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
      title: 'Multi-Tab Section'
      titleTag: 'h1'
      subTitle: ''
      prose: |-
        A dynamic tabbed interface where each pane can be any section type. Tabs and panes are declared entirely in frontmatter. The component supports keyboard navigation (arrow keys, Home, End), URL hash routing so browser back/forward restores the active tab, and SWUP page transition compatibility.

        Unlike the `tabs` component which always renders image-grid panes sourced from a data directory, `multi-tab` accepts any `sectionType` per pane and takes its data directly from frontmatter.

  - sectionType: multi-tab
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
    text:
      title: 'Example Tabs'
      titleTag: 'h2'
    defaultTab: 'text'
    tabs:
      - key: 'text'
        label: 'Text'
        pane:
          sectionType: rich-text
          text:
            title: 'Text Pane'
            titleTag: 'h3'
            prose: |-
              This is the **Text** pane, rendered by the `rich-text` component. Each pane is a standard section definition — the same YAML you would write as a top-level section on any page.

              Switch tabs with the buttons above, or use ArrowLeft/ArrowRight keys when a tab button has focus.
      - key: 'image'
        label: 'Image'
        pane:
          sectionType: image-only
          image:
            src: '/assets/images/sample12.jpg'
            alt: 'Sample image in a tab pane'
            caption: 'This image is rendered by the image-only component inside a tab pane.'
      - key: 'audio'
        label: 'Audio'
        pane:
          sectionType: audio-only
          audio:
            ogg: '/assets/audio/shattered-reflections.ogg'
            mpeg: '/assets/audio/shattered-reflections.mp3'
            bgImage: '/assets/images/sample9.jpg'
            alt: 'Audio player background'

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
      subTitle: ''
      prose: |-
        ### Configuration

        ```yaml
        - sectionType: multi-tab
          containerTag: section
          text:
            title: 'Example Tabs'
            titleTag: 'h2'
          defaultTab: 'text'
          tabs:
            - key: 'text'
              label: 'Text'
              pane:
                sectionType: rich-text
                text:
                  title: 'Text Pane'
                  prose: 'Content for the text pane.'
            - key: 'image'
              label: 'Image'
              pane:
                sectionType: image-only
                image:
                  src: '/assets/images/sample12.jpg'
                  alt: 'Sample image in a tab pane'
                  caption: 'Optional caption.'
            - key: 'audio'
              label: 'Audio'
              pane:
                sectionType: audio-only
                audio:
                  ogg: '/assets/audio/shattered-reflections.ogg'
                  mpeg: '/assets/audio/shattered-reflections.mp3'
                  bgImage: '/assets/images/sample9.jpg'
                  alt: 'Audio player background'
        ```

        ### Configuration Options

        #### Tab List

        | Property | Type | Required | Description |
        |----------|------|----------|-------------|
        | `tabs` | array | Yes | Array of tab definitions |
        | `tabs[].key` | string | Yes | Unique identifier for ARIA ids and default-tab matching |
        | `tabs[].label` | string | No | Display label; defaults to `key` if omitted |
        | `tabs[].pane` | object | Yes | Any valid section definition (`sectionType` + its properties) |

        #### Default Tab Resolution

        | Priority | Condition |
        |----------|-----------|
        | 1 | `defaultTab` is set and matches a tab key |
        | 2 | Current year string (e.g. `"2026"`) matches a tab key |
        | 3 | First tab in the array |

        #### Keyboard Navigation

        | Key | Action |
        |-----|--------|
        | ArrowRight | Next tab (wraps) |
        | ArrowLeft | Previous tab (wraps) |
        | Home | First tab |
        | End | Last tab |

        #### Bundler Note

        The `manifest.json` only declares `requires: ["text", "commons"]` for the wrapper itself. Pane component dependencies (CSS/JS for each `tab.pane.sectionType`) are auto-discovered by the bundler because each pane's `sectionType` appears directly in frontmatter.

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    isAnimated: false
    componentDownload: 'multi-tab'
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
      title: 'Download Multi-Tab Section'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete multi-tab component package including template, styles, script, manifest, examples, and installation script.'
    ctas:
      - url: '/downloads/sections/multi-tab.zip'
        label: 'Download Multi-Tab Section'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
