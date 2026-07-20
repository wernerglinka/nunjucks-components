---
layout: pages/sections-with-sidebar.njk
bodyClasses: 'sections-page'
hasHero: true
title: Commons

navigation:
  navLabel: 'Commons'
  navIndex: 3

card:
  title: 'Commons'
  description: 'The abstract base component that provides the section wrapper system: container, spacing, background, and animation options shared by every section.'
  image: '/assets/images/sample12.jpg'
  tags: ['commons', 'base', 'wrapper', 'container', 'spacing', 'background', 'foundation']

seo:
  title: Commons Component - Section Wrapper Foundation for Metalsmith
  description: 'The commons component provides the foundational section wrapper system shared by all section components: container constraints, margins, padding, backgrounds, and scroll animations.'
  socialImage: '/assets/images/metalsmith2025-starter-social.png'
  canonicalURL: ''
  keywords: 'metalsmith commons component, section wrapper, containerFields, base styles, section spacing, background system, component foundation'

sections:
  - sectionType: rich-text
    containerTag: article
    id: ''
    isDisabled: false
    containerFields:
      isAnimated: true
      inContainer: false
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: true
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: ''
      title: 'Commons'
      titleTag: 'h1'
      subTitle: ''
      prose: |-
        Commons is the abstract base component behind every section in this library. It is never used as a `sectionType` of its own; instead every section manifest lists `commons` in its `requires` array and extends its fields (`"$extends": ["commons"]`), inheriting the universal section wrapper system:

        - **Container**: constrain a section to the content max width with `inContainer`
        - **Spacing**: remove default margins and padding per edge with `noMargin` / `noPadding`
        - **Background**: color, image, light/dark overlay screens, and dark-theme text
        - **Animation**: fade sections in on scroll with `isAnimated`

        Because every section shares this wrapper, all sections have consistent, predictable spacing and background behavior, configured through the same `containerFields` object.

  - sectionType: rich-text
    containerTag: aside
    classes: ''
    id: 'commons-demo'
    isDisabled: false
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
        color: 'var(--color-background-light)'
        image: ''
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: 'Live Example'
      title: 'The Wrapper System in Action'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        This very section demonstrates commons at work: it is a plain rich-text section whose `containerFields` set `inContainer: true`, a background color, and `isAnimated: true`. The wrapper (`.section-wrapper`) applied around this content, its spacing, and the background you see are all provided by the commons component, not by rich-text.

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: ''
    isDisabled: false
    containerFields:
      isAnimated: true
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
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: ''
      title: 'Configuration'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        Every section supports the common properties. They are configured on the section entry itself and through the `containerFields` object:

        ```yaml
        - sectionType: any-section
          containerTag: section # section, article, aside, or div
          classes: ''
          id: ''
          isDisabled: false
          containerFields:
            inContainer: true # constrain to container max width
            isAnimated: true # fade in on scroll
            noMargin:
              top: false
              bottom: false
            noPadding:
              top: false
              bottom: false
            background:
              isDark: false # use light text on dark background
              color: 'var(--color-background-light)'
              image: '/assets/images/sample12.jpg'
              imageScreen: 'none' # light, dark, none
        ```

        ### Configuration Options

        #### Section Properties

        | Property | Type | Required | Description |
        |----------|------|----------|-------------|
        | `containerTag` | string | No | HTML tag for the section wrapper: `section`, `article`, `aside`, or `div` |
        | `classes` | string | No | Additional CSS classes for the wrapper |
        | `id` | string | No | Section ID, usable as an anchor target |
        | `isDisabled` | boolean | No | Excludes the section from the build when `true` |

        #### Container Fields

        | Property | Type | Required | Description |
        |----------|------|----------|-------------|
        | `inContainer` | boolean | No | Adds `.in-container` to constrain the section to the max content width |
        | `isAnimated` | boolean | No | Adds `.is-animated` for the fade-in-on-scroll effect |
        | `noMargin.top` / `noMargin.bottom` | boolean | No | Remove the default section margins per edge |
        | `noPadding.top` / `noPadding.bottom` | boolean | No | Remove the default section padding per edge |
        | `background.color` | string | No | Background color (any CSS color, design tokens recommended) |
        | `background.image` | string | No | Background image URL, positioned behind the content |
        | `background.imageScreen` | string | No | Overlay on the background image: `light`, `dark`, or `none` |
        | `background.isDark` | boolean | No | Adds `.is-dark` so text renders in the light color scheme |

        ### Notes

        - Commons is marked `abstract` in its manifest: it contributes styles and fields but is not rendered as a section of its own
        - The commons CSS also provides the responsive content layout (the Every Layout switcher pattern), the `.prose` measure, and utility classes like `.sr-only`
        - Individual sections can override the layout threshold and gaps via the `--threshold` and `--content-gap` custom properties in their own CSS

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    componentDownload: 'commons'
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
      title: 'Download Commons Section'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete commons component package including styles, manifest, and installation script.'
    ctas:
      - url: '/downloads/sections/commons.zip'
        label: 'Download Commons Section'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
