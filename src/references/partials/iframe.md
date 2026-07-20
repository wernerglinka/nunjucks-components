---
layout: pages/sections-with-sidebar.njk
bodyClasses: ''

seo:
  title: Iframe Partial - Nunjucks Components
  description: 'Responsive iframe partial for embedding third-party pages and forms'
  socialImage: '/assets/images/metalsmith2025-starter-social.png'

card:
  title: 'Iframe'
  description: 'Responsive wrapper for embedded third-party frames'
  pattern: 'simple-gray3'
  tags: ['iframe', 'embed', 'third-party', 'forms', 'media']

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
      title: 'Iframe'
      titleTag: 'h1'
      prose: |
        The Iframe partial is a responsive wrapper for an embedded third-party frame, for example a registration or donation form. The iframe fills the available width and lazy-loads; the embedded page's own layout is responsive inside it.

        ### Manifest

        ```json
        {
          "name": "iframe",
          "type": "partial",
          "styles": ["iframe.css"],
          "scripts": [],
          "requires": []
        }
        ```

        ### Configuration

        ```yaml
        iframe:
          src: 'https://example.com/embed'
          title: 'Accessible frame title'
          allow: '' # optional permissions policy, e.g. 'payment'
        ```

        ### Configuration Options

        | Property | Type | Required | Default | Description |
        |----------|------|----------|---------|-------------|
        | `src` | string | Yes | - | The embed URL |
        | `title` | string | Yes | - | Accessible title for the frame |
        | `allow` | string | No | - | Optional permissions policy (e.g. `payment` for embedded payment forms) |

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
      title: 'Example'
      titleTag: 'h2'
      prose: 'Below, the iframe partial is used through the multi-media section with `mediaType: iframe`, embedding an external page next to a text column:'

  - sectionType: multi-media
    containerTag: section
    classes: 'has-demo-background'
    isDisabled: false
    isReverse: false
    mediaType: iframe
    containerFields:
      inContainer: true
      isAnimated: true
      noMargin:
        top: true
        bottom: false
      noPadding:
        top: false
        bottom: false
      background:
        color: 'var(--color-background-light)'
        isDark: false
    iframe:
      src: 'https://example.com/'
      title: 'Example.com embedded demo page'
      allow: ''
    text:
      leadIn: ''
      title: 'Embedded Frame'
      titleTag: 'h3'
      subTitle: ''
      prose: |
        The frame to the side embeds `https://example.com/` with an accessible title. The iframe lazy-loads, so it does not delay the initial page render.

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
        - The embedded site must allow framing; pages that send `X-Frame-Options` or a restrictive `frame-ancestors` policy will not display
        - Always provide a `title` so screen readers can announce the frame's purpose
        - Use the `allow` property to grant permissions the embedded page needs, such as `payment`
        - The partial is used by the multi-media and hero-slider sections via `mediaType: iframe`

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    componentDownload: 'iframe'
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
      title: 'Download Iframe Partial'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete iframe component package including template, styles, manifest, examples, and installation script.'
    ctas:
      - url: '/downloads/partials/iframe.zip'
        label: 'Download Iframe Partial'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
