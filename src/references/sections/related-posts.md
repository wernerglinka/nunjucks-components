---
layout: pages/sections-with-sidebar.njk
bodyClasses: 'sections-page'
hasHero: true
title: Related Posts

navigation:
  navLabel: 'Related Posts'
  navIndex: 3

card:
  title: 'Related Posts'
  description: 'Render a curated list of items from any collection as a simple text list or a grid of cards.'
  image: '/assets/images/sample17.jpg'
  tags: ['related', 'posts', 'collection', 'curated', 'links', 'list', 'cards']

seo:
  title: Related Posts Component - Curated Collection List for Metalsmith
  description: 'Render a curated list of items from any Metalsmith collection as a text list or card grid. Cross-collection slug resolution, no collectionName required.'
  socialImage: '/assets/images/sample.jpg'
  canonicalURL: ''
  keywords: 'metalsmith related posts, curated links, collection list, related content, blog related posts, related cards'

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
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: 'Section Component'
      title: 'Related Posts'
      titleTag: 'h1'
      subTitle: ''
      prose: |-
        A section that renders a curated list of items from any collection. It has two presentation modes: a compact text list (default) or a grid of cards (`hasCard: true`). Designed to sit at the end of a blog post, reference page, or any content item and point readers at a hand-picked set of further reading.

        ## How It Works

        The author lists the slugs of items to include in the `selections` array. The component iterates every registered collection (`blog`, `sections`, `partials`, etc.) and resolves each slug to the first matching item. Order is preserved as written — this is a curation component, not an automated "similar content" feed.

        If a slug does not match any item, it is silently skipped. If none of the selections resolve, the component renders nothing at all.

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
        top: true
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Text List (Default)'
      titleTag: 'h2'
      subTitle: ''
      prose: 'The default presentation — a dense, minimal `<ul>` with title, description, and link. Best for end-of-article "further reading" lists where density matters more than visual weight.'

  - sectionType: related-posts
    containerTag: aside
    classes: ''
    id: 'relatedPostsTextDemo'
    isDisabled: false
    containerFields:
      inContainer: true
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: true
        bottom: true
      background:
        color: 'var(--color-background-light)'
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Related Posts'
      titleTag: 'h3'
      subTitle: ''
      prose: ''
    selections:
      - building-pages-with-components
      - section-anatomy
      - how-component-bundling-works

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
        top: true
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Card Grid'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        Set `hasCard: true` to render the same selections as a grid of cards. Each card pulls its thumbnail, title, description, author, and date from the target item's `card` object. Best when the section stands on its own and benefits from visual anchoring — for example, a "You might also like" block on an index or landing page.

        ```yaml
        - sectionType: related-posts
          hasCard: true
          selections:
            - building-pages-with-components
            - section-anatomy
            - how-component-bundling-works
        ```

  - sectionType: related-posts
    containerTag: aside
    classes: ''
    id: 'relatedPostsCardDemo'
    isDisabled: false
    containerFields:
      inContainer: true
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: true
        bottom: true
      background:
        color: 'var(--color-background-light)'
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Related Posts'
      titleTag: 'h3'
      subTitle: ''
      prose: ''
    hasCard: true
    selections:
      - building-pages-with-components
      - section-anatomy
      - how-component-bundling-works

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
        top: true
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Mixed Collections'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        The component is not tied to any single collection. It resolves each slug against every registered collection, so an author can mix a blog post, a section reference, and a partial reference in one block without specifying which collection each slug belongs to. The first collection containing a match wins, so a slug is never rendered twice.

        Below is a single `related-posts` section pulling two blog slugs and one section-reference slug.

  - sectionType: related-posts
    containerTag: aside
    classes: ''
    id: 'relatedPostsMixedDemo'
    isDisabled: false
    containerFields:
      inContainer: true
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: true
        bottom: true
      background:
        color: 'var(--color-background-light)'
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Related Reading'
      titleTag: 'h3'
      subTitle: ''
      prose: ''
    selections:
      - building-pages-with-components
      - section-anatomy
      - hero

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
        top: true
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
        | Property          | Type    | Required | Description |
        |-------------------|---------|----------|-------------|
        | `sectionType`     | string  | Yes      | Must be `related-posts` |
        | `selections`      | array   | Yes      | Slugs (last permalink segment) of items to list, in display order |
        | `hasCard`         | boolean | No       | Render as cards instead of a text list. Defaults to `false` |
        | `text`            | object  | No       | Optional heading block — standard `text` partial props |
        | `isDisabled`      | boolean | No       | Hide the section entirely |
        | `containerFields` | object  | No       | Standard container configuration |

        ### Notes

        - Each entry in `selections` is the last segment of the target item's permalink. For a blog post at `src/blog/section-anatomy.md`, the slug is `section-anatomy`.
        - Items render in the order listed in `selections`, not in any collection's natural sort order.
        - Unmatched slugs are silently skipped; if none resolve, the section renders nothing.
        - In card mode, the thumbnail falls back from `card.thumbnail` (blog convention) to `card.image` (reference-page convention), so cards work uniformly across collections.

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    isAnimated: false
    componentDownload: 'related-posts'
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
      title: 'Download Related Posts Section'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete related-posts component package including template, styles, manifest, examples, and installation script.'
    ctas:
      - url: '/downloads/sections/related-posts.zip'
        label: 'Download Related Posts Section'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
