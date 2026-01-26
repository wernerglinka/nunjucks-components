---
layout: pages/sections-with-sidebar.njk
bodyClasses: 'sections-page'
hasHero: true
title: Collection Links

navigation:
  navLabel: 'Collection Links'
  navIndex: 3

card:
  title: 'Collection Links'
  description: 'Sequential navigation component for collection items, providing previous and next links between articles in a collection.'
  image: '/assets/images/sample16.jpg'
  tags: ['collection', 'navigation', 'pagination', 'links', 'posts']

seo:
  title: Collection Links Component - Collection Navigation for Metalsmith
  description: 'Navigation component that provides previous and next links between sequential collection items. Automatically integrates with Metalsmith collections for chronological article navigation.'
  socialImage: '/assets/images/sample.jpg'
  canonicalURL: ''
  keywords: 'metalsmith collection navigation, post navigation, previous next links, collection pagination, collection links, article navigation'

sections:
  - sectionType: text-only
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
      leadIn: 'Section Component'
      title: 'Collection Links'
      titleTag: 'h1'
      subTitle: ''
      prose: |-
        A navigation component that provides previous and next links between sequential collection items. This component automatically integrates with Metalsmith's collections plugin to display contextual navigation at the end of collection articles.

        ## How It Works

        Unlike most section components, collection-links doesn't use frontmatter configuration for its content. Instead, it reads `previous` and `next` variables that are automatically populated by Metalsmith's collections plugin when processing collection items.

        The component only renders when a page has previous or next items available, making it safe to include in any collection item template.

        ## Live Example

        To see this component in action, visit any blog post on this site. For example, check the bottom of the [Sample Blog Post](/blog/sample-blogpost/) to see the previous and next navigation links.

  - sectionType: text-only
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
        ## Usage

        Add the collection-links section to any collection item frontmatter:

        ```yaml
        - sectionType: collection-links
          containerTag: section
          classes: ""
          id: ""
          isDisabled: false
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
              color: ""
              image: ""
              imageScreen: "none"
        ```

        ## Collection Integration

        The component requires Metalsmith's collections plugin to be configured for collection items:

        ```javascript
        // In metalsmith.js
        .use(collections({
          blog: {
            pattern: 'blog/**/*.md',
            sortBy: 'card.date',
            reverse: true
          }
        }))
        ```

        The collections plugin automatically adds `previous` and `next` properties to each page in the collection, which the component uses to generate navigation links.

        ## Conditional Rendering

        The component handles edge cases automatically:

        - **First item in collection**: Only shows "Next" link
        - **Last item in collection**: Only shows "Previous" link
        - **Single item**: Component doesn't render at all
        - **Non-collection page**: Component doesn't render

  - sectionType: text-only
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
        ## Configuration Options

        | Property | Type | Required | Description |
        |----------|------|----------|-------------|
        | `sectionType` | string | Yes | Must be `collection-links` |
        | `isDisabled` | boolean | No | Set to `true` to hide the section |
        | `containerFields` | object | No | Standard container configuration |

        Note that the navigation content (item titles and URLs) is automatically populated from the collection data and cannot be configured in frontmatter.

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    isAnimated: false
    componentDownload: 'collection-links'
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
      title: 'Download Collection Links Section'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete collection-links component package including template, styles, manifest, and installation script.'
    ctas:
      - url: '/downloads/sections/collection-links.zip'
        label: 'Download Collection Links Section'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
