---
layout: pages/sections-with-sidebar.njk
bodyClasses: ''

seo:
  title: Disclosure Partial - Nunjucks Components
  description: 'JS-free collapsed disclosure blocks built on native details/summary elements'
  socialImage: '/assets/images/metalsmith2025-starter-social.png'

card:
  title: 'Disclosure'
  description: 'Collapsed details/summary blocks for policies and fine print'
  pattern: 'simple-gray5'
  tags: ['disclosure', 'details', 'summary', 'collapse', 'accordion', 'boilerplate']

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
      title: 'Disclosure'
      titleTag: 'h1'
      prose: |
        The Disclosure partial renders a list of collapsed blocks with the native `details`/`summary` elements: accessible, keyboard-operable, and JS-free. Each block's body is markdown. It is the lightweight primitive for folding secondary content, such as policies or fine print, into another section's text column.

        It is named for the spec term: `details` and `summary` together form a "disclosure widget". For a standalone FAQ-style page section with animated one-open-at-a-time behavior, use the accordion section instead; the two complement each other.

        The expand/collapse animates in browsers that support `::details-content` with `interpolate-size`. Everywhere else the blocks simply snap open, so the animation is a progressive enhancement.

        ### Manifest

        ```json
        {
          "name": "disclosure",
          "type": "partial",
          "styles": ["disclosure.css"],
          "scripts": [],
          "requires": []
        }
        ```

        ### Configuration

        ```yaml
        disclosures:
          - title: 'Accessibility'
            prose: 'The studio is wheelchair accessible. Contact us about other accommodations.'
          - title: 'Cancellation policy'
            prose: 'Full refund up to 7 days before the first session.'
        ```

        ### Configuration Options

        | Property | Type | Required | Default | Description |
        |----------|------|----------|---------|-------------|
        | `title` | string | Yes | - | The always-visible summary line |
        | `prose` | string | Yes | - | Markdown body shown when the block is expanded |

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
      prose: 'Below, the disclosure partial is used through the multi-media section: an optional `disclosures` array renders beneath the text column''s prose and CTAs. A typical use is a registration embed beside class information, with organization boilerplate folded away underneath:'

  - sectionType: multi-media
    containerTag: section
    classes: 'has-demo-background'
    isDisabled: false
    isReverse: false
    mediaType: image
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
    image:
      src: '/assets/images/sample7.jpg'
      alt: 'Craft workshop table'
      caption: ''
    text:
      leadIn: ''
      title: 'What to expect'
      titleTag: 'h3'
      subTitle: ''
      prose: |
        A hands-on workshop for all skill levels. Materials are provided, and you will take your finished piece home at the end of the session.
    disclosures:
      - title: 'Accessibility'
        prose: 'The studio is wheelchair accessible. Contact us ahead of time about other accommodations, we are happy to help.'
      - title: 'Cancellation policy'
        prose: 'Full refund up to 7 days before the first session. Within 7 days, we offer credit toward a future class.'
      - title: 'What to bring'
        prose: 'Just yourself. Closed-toe shoes are recommended for shop classes.'

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
        - Purely declarative: no JavaScript is loaded for this partial
        - The browser's find-in-page can search inside closed blocks in browsers that support `hidden="until-found"` semantics for `details`
        - Use it for secondary content; primary content should not be hidden behind a click
        - For a standalone section with animated exclusive-open behavior, use the accordion section

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    componentDownload: 'disclosure'
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
      title: 'Download Disclosure Partial'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete disclosure component package including template, styles, manifest, examples, and installation script.'
    ctas:
      - url: '/downloads/partials/disclosure.zip'
        label: 'Download Disclosure Partial'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
