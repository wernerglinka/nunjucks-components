---
layout: pages/sections-with-sidebar.njk
bodyClasses: 'sections-page'
hasHero: true
title: Blog Author

navigation:
  navLabel: 'Blog Author'
  navIndex: 3

card:
  title: 'Blog Author'
  description: 'Author profile section with portrait, bio, and social links, looked up from the site-wide author data file.'
  image: '/assets/images/sample8.jpg'
  tags: ['author', 'profile', 'bio', 'blog', 'social-links', 'portrait']

seo:
  title: Blog Author Component - Author Profile Section for Metalsmith
  description: 'Author profile section that displays portrait, profession, bio, and social links from a central author data file. Ideal for blog post bylines on Metalsmith static sites.'
  socialImage: '/assets/images/metalsmith2025-starter-social.png'
  canonicalURL: ''
  keywords: 'metalsmith blog author, author profile component, author bio section, blog byline, author social links'

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
      title: 'Blog Author'
      titleTag: 'h1'
      subTitle: ''
      prose: |-
        An author profile section that looks up an author by name in the site-wide `lib/data/author.json` data file and renders the portrait, name, profession, social links, and bio. Typically placed at the end of a blog post to introduce the author.

        Because the section only stores the author's name, author details are maintained in one place and every page that references the author stays up to date automatically.

  - sectionType: blog-author
    containerTag: section
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
        color: 'var(--color-background-light)'
        image: ''
        imageScreen: 'none' # light, dark, none
    name: 'Albert Einstein'
    logoWidth: 30

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
        ```yaml
        - sectionType: blog-author
          containerTag: section
          # more settings

          name: 'Albert Einstein' # must match a name in lib/data/author.json
          logoWidth: 30           # width of the social icons in pixels
          isReverse: false        # swap profile and bio columns
        ```

        ### Configuration Options

        | Property | Type | Required | Description |
        |----------|------|----------|-------------|
        | `name` | string | Yes | Author name, matched against the `name` field in `lib/data/author.json` |
        | `logoWidth` | number | No | Width of the social link icons in pixels |
        | `isReverse` | boolean | No | Reverses the profile/bio layout when `true` |

        ### Author Data

        The section renders nothing if the name does not match an author record. Author records live in `lib/data/author.json`:

        ```json
        {
          "name": "Albert Einstein",
          "profession": "Theoretical Physicist",
          "bio": "Albert Einstein was a German-born theoretical physicist...",
          "portrait": "/assets/images/authors/einstein.jpg",
          "social": [
            {
              "platform": "Wikipedia",
              "url": "https://en.wikipedia.org/wiki/Albert_Einstein",
              "icon": "wikipedia"
            }
          ]
        }
        ```

        `portrait`, `profession`, `bio`, and `social` are all optional; the section renders only what is present.

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    componentDownload: 'blog-author'
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
      title: 'Download Blog Author Section'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete blog-author component package including template, styles, manifest, examples, and installation script.'
    ctas:
      - url: '/downloads/sections/blog-author.zip'
        label: 'Download Blog Author Section'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
