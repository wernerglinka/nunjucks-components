---
layout: pages/sections-with-sidebar.njk
bodyClasses: 'sections-page'
title: Hero Banner

navigation:
  navLabel: 'Hero'
  navIndex: 3

card:
  title: 'Hero'
  description: 'Hero section with background images, text overlays, and CTAs.'
  thumbnail: '/assets/images/sample8.jpg'
  tags: ['hero', 'banner', 'header', 'landing-page', 'fullscreen', 'cta']

seo:
  title: Hero Section Component - Full Screen & Standard Heroes for Metalsmith
  description: 'Create impactful hero sections with background images, text overlays, and CTAs. Includes full-screen hero options with scroll targeting for Metalsmith sites.'
  socialImage: '/assets/images/metalsmith2025-starter-social.png'
  canonicalURL: ''
  keywords: 'nunjucks hero section, metalsmith, eleventy, full screen hero, hero component, landing page hero, hero with background image, page header, hero overlay'

sections:
  - sectionType: hero
    containerTag: section
    classes: 'first-section'
    id: ''
    description: "This is a full screen hero section with a background image and text overlay. The proporty 'isFullScreen' is set to true, which turn a standard hero section into full screen."
    isDisabled: false
    isReverse: false
    isFullScreen: true
    targetId: 'first-section'
    date: ''
    author: ''
    containerFields:
      isAnimated: true
      inContainer: false
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        isDark: false
        color: ''
        image: '/assets/images/sample13.jpg'
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: 'Nunjucks Components Library'
      title: Hero
      titleTag: 'h1'
      subTitle:
      prose: Examples of hero sections including a full page layout. Click the down arrow at the bottom of the screen to scroll down.
    ctas:
      - url: '/'
        label: 'go home'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'first-section'
    isDisabled: false
    containerFields:
      isAnimated: true
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
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: ''
      title: 'Configuration'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        Note the section property `isFullScreen: true`. The section property `targetId: 'first-section'` point to the following section,

        ```yaml
        ---
        # page settings

        sections:
          - sectionType: hero
            containerTag: section
            classes: 'first-section'
            id: ''
            description: "This is a full screen hero section with a background image and text overlay. The proporty 'isFullScreen' is set to true, which turn a standard hero section into full screen."
            isDisabled: false
            isReverse: false
            isAnimated: true
            isFullScreen: true
            targetId: 'first-section'
            date: ''
            author: ''
            containerFields:
              inContainer: false
              noMargin:
                top: true
                bottom: true
              noPadding:
                top: false
                bottom: false
              background:
                isDark: false
                color: ''
                image: '/assets/images/sample13.jpg'
                imageScreen: 'none' # light, dark, none
            text:
              leadIn: 'Nunjucks Components Library'
              title: Hero
              titleTag: 'h1'
              subTitle:
              prose: Examples of hero sections including full page. Click the down arrow at the bottom of the screen to scroll down. That requires 'targetId' to be set to the id of the next section, in this case 'first-section' and the id of the next section is set to 'first-section'. Also, notice the up-arrow in the bottom right screen corner, when scrolling starts, to return to the top of the page.
            ctas:
              - url: '/'
                label: 'go home'
                isButton: true
                buttonStyle: 'primary'
            image:
              src: ''
              alt: ''
              caption: ''

        # other sections
        ---
        ```

    ctas:
      - url: ''
        label: ''
        isButton: true
        buttonStyle: 'primary'

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
        bottom: true
      noPadding:
        top: false
        bottom: true
      background:
        color: ''
        image: ''
        imageScreen: 'none' # light, dark, none
    text:
      leadIn: ''
      title: Default Hero
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        In this case `isFullScreen` is set to `false`. Examples of a default hero can be seen on the [home page](/), [Section Anatomy](/section-anatomy/) and [From YAML to HTML](/yaml-to-html/)

    ctas:
      - url: ''
        label: ''
        isButton: true
        buttonStyle: 'primary'

  - sectionType: hero
    containerTag: section
    classes: ''
    id: 'hero2'
    description: 'This is a regular hero section with a background image and text overlay.'
    isDisabled: false
    isReverse: false
    isFullScreen: false
    targetId: ''
    date: ''
    author: ''
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
        isDark: true
        color: ''
        image: '/assets/images/sample10.jpg'
        imageScreen: 'dark' # light, dark, none
    text:
      leadIn: 'Nunjucks Components Library'
      title: Hero
      titleTag: 'h1'
      subTitle: 'Default Hero'
      prose: This hero sports a dark screen and white text color. All other properties are same as above.
    ctas:
      - url: '/'
        label: 'go home'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''

  - sectionType: rich-text
    containerTag: article
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
        ```yaml
        - sectionType: hero
          containerTag: section
          classes: 'first-section'
          isFullScreen: false
          targetId: 'first-section'
          containerFields:
            inContainer: false
            background:
              isDark: false
              image: '/assets/images/sample13.jpg'
              imageScreen: 'none'
          text:
            leadIn: 'Nunjucks Components Library'
            title: Hero
            titleTag: 'h1'
            prose: Examples of hero sections including full page. Click the down arrow at the bottom to scroll down.
          ctas:
            - url: '/'
              label: 'go home'
              isButton: true
              buttonStyle: 'primary'
        ```

        ### Configuration Options

        #### Hero Layout

        | Property | Type | Required | Description |
        |----------|------|----------|-------------|
        | `isFullScreen` | boolean | No | Enable full-screen hero section (default: false) |
        | `targetId` | string | No | ID of section to scroll to when down arrow is clicked |
        | `isReverse` | boolean | No | Reverse the layout order |


        #### Content

        | Property | Type | Required | Description |
        |----------|------|----------|-------------|
        | `text` | object | Yes | Text content with leadIn, title, titleTag, subTitle, and prose |
        | `ctas` | array | No | Call-to-action buttons |
        | `image` | object | No | Optional hero image with src, alt, and caption |

        **Note:** The `targetId` should be set to the `id` of the section to scroll to when the down arrow in the full-screen hero is clicked. Notice the up-arrow in the bottom right screen corner when scrolling starts, to return to the top of the page.

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'styling'
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
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: Styling
      titleTag: 'h2'
      subTitle: ''
      prose: |
        The hero's adjustable values are component-scoped custom properties, declared on the component root with fallbacks into the global design tokens. Override the properties from `lib/overrides/hero/hero.css`, not the rules that consume them; properties survive upstream restructuring, rules do not.

        | Property | Default | Controls |
        |----------|---------|----------|
        | `--hero-text-width` | responsive clamp | Width of the glass text panel |
        | `--hero-text-padding` | `var(--space-s-l)` | Padding inside the text panel |
        | `--hero-text-background` | `var(--glass-background)` | Text panel background |
        | `--hero-text-radius` | `var(--space-2xs-xs)` | Text panel corner radius |

        ```css
        /* lib/overrides/hero/hero.css */
        .hero {
          --hero-text-width: calc(100% - clamp(0px, calc((100vw - 600px) * 3), 50%));
          --hero-text-background: var(--color-brand);
        }
        ```
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    componentDownload: 'hero'
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
      title: 'Download Hero Section'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete hero component package including template, styles, manifest, examples, and installation script.'
    ctas:
      - url: '/downloads/sections/hero.zip'
        label: 'Download Hero Section'
        isButton: true
        buttonStyle: 'primary'
---
