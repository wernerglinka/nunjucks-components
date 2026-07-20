---
layout: pages/sections-with-sidebar.njk
bodyClasses: 'sections-page'
hasHero: true
title: Social Shares

navigation:
  navLabel: 'Social Shares'
  navIndex: 4

card:
  title: 'Social Shares'
  description: 'Render a row of share buttons that post the current page to Bluesky, LinkedIn, Facebook, X/Twitter, email, or any custom network.'
  thumbnail: '/assets/images/sample10.jpg'
  tags: ['social', 'share', 'bluesky', 'linkedin', 'facebook', 'twitter', 'x', 'email', 'share buttons']

seo:
  title: Social Shares Component - Share Buttons for Metalsmith
  description: 'Render social share buttons for the current page. Supports Bluesky, LinkedIn, Facebook, X/Twitter, email, and arbitrary custom networks.'
  socialImage: '/assets/images/metalsmith2025-starter-social.png'
  canonicalURL: ''
  keywords: 'metalsmith social shares, share buttons, bluesky share, linkedin share, facebook share, twitter share, x share, email share'

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
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Social Shares'
      titleTag: 'h1'
      subTitle: ''
      prose: 'A section that renders a row of share buttons for the current page. Built-in support for Bluesky, LinkedIn, Facebook, X (Twitter), and email, with an extension point for adding any other network.'

  - sectionType: social-shares
    containerTag: aside
    classes: ''
    id: 'socialSharesDefault'
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
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Share This Page'
      titleTag: 'h3'
      subTitle: ''
      prose: 'All built-in platforms enabled, URL and domain resolved automatically from the current page.'
    share:
      title: 'Nunjucks Components Library'
      comment: 'A comprehensive collection of reusable Nunjucks section and partial components for building Metalsmith sites with structured content in frontmatter.'

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
        top: true
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Curated Platform Subset'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        Pick only the networks you care about by providing a `platforms` array.

        The `title` is the page/article title (used by LinkedIn as the shared article title and by the mail client as the subject). The `comment` is the page excerpt — a sentence or two describing the content that becomes the pre-filled post body on Bluesky / Facebook / Twitter and the email body.

        ```yaml
        - sectionType: social-shares
          share:
            title: 'Nunjucks Components Library'
            comment: 'A comprehensive collection of reusable Nunjucks components for building Metalsmith sites with structured content.'
            platforms:
              - bluesky
              - linkedin
              - mail
        ```

  - sectionType: social-shares
    containerTag: aside
    classes: ''
    id: 'socialSharesSubset'
    isDisabled: false
    hasCenteredContent: true
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
      title: 'Share This Page'
      titleTag: 'h3'
      subTitle: ''
      prose: ''
    share:
      title: 'Nunjucks Components Library'
      comment: 'A comprehensive collection of reusable Nunjucks components for building Metalsmith sites with structured content.'
      platforms:
        - bluesky
        - linkedin
        - mail

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
        top: true
        bottom: false
      background:
        color: ''
        image: ''
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Adding Platforms We Do Not Ship'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        The built-in platform list covers the most common sharing targets: Bluesky, LinkedIn, Facebook, Twitter, and email. Any other network — Reddit, WhatsApp, Telegram, Pinterest, Mastodon, Threads, Xing, etc. — can be added through the `share.custom` array.

        A custom entry needs four fields:

        | Field   | Description |
        |---------|-------------|
        | `name`  | CSS class slug applied to the `<li>` (useful for hover colors) |
        | `icon`  | Name of an SVG file (without extension) under `lib/layouts/icons/` |
        | `label` | `aria-label` for the link |
        | `url`   | Share URL template. The placeholders `{url}`, `{title}`, and `{comment}` are replaced with the URL-encoded values before the link is rendered |

        ### Step 1 — Add the icon

        Drop an SVG markup file into `lib/layouts/icons/` using the platform name as the filename, e.g. `reddit.njk`. Keep the viewBox tight and omit `width`/`height` so the component CSS can size the icon consistently. Any `fill`/`stroke` on the SVG is overridden by the section styles.

        ### Step 2 — Declare the custom platform

        ```yaml
        - sectionType: social-shares
          share:
            title: 'Nunjucks Components Library'
            comment: 'A comprehensive collection of reusable Nunjucks components for building Metalsmith sites.'
            platforms:
              - bluesky
              - linkedin
            custom:
              - name: reddit
                icon: reddit
                label: 'Share on Reddit'
                url: 'https://www.reddit.com/submit?url={url}&title={title}'
              - name: whatsapp
                icon: whatsapp
                label: 'Share on WhatsApp'
                url: 'https://api.whatsapp.com/send?text={comment}%20{url}'
              - name: telegram
                icon: telegram
                label: 'Share on Telegram'
                url: 'https://t.me/share/url?url={url}&text={comment}'
              - name: pinterest
                icon: pinterest
                label: 'Share on Pinterest'
                url: 'https://pinterest.com/pin/create/button/?url={url}&description={comment}'
        ```

        ### Step 3 — (Optional) Add a hover color

        Custom items get a generic primary-color hover. To theme them to a brand color, extend the project stylesheet:

        ```css
        .social-shares-list li.reddit a:hover svg,
        .social-shares-list li.reddit a:hover svg * {
          fill: #ff4500;
          stroke: #ff4500;
        }
        ```

  - sectionType: rich-text
    containerTag: section
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
        imageScreen: 'none'
    text:
      leadIn: ''
      title: 'Configuration'
      titleTag: 'h2'
      subTitle: ''
      prose: |-
        ```yaml
        - sectionType: social-shares
          containerTag: aside

          text:
            leadIn: ''
            title: 'Share This Page'
            titleTag: 'h2'
            subTitle: ''
            prose: ''

          share:
            title: 'Nunjucks Components Library'          # article / subject title
            comment: 'Page excerpt or description that pre-fills the share post body.'
            platforms:
              - bluesky
              - linkedin
              - facebook
              - twitter
              - mail
            custom: []
        ```

        ### Notes

        - The shared URL is always the current page, built as `data.site.url + urlPath`.
        - Titles, comments, and the final URL are URL-encoded automatically.
        - `share.title` is the article / subject line. `share.comment` is the page excerpt — a sentence or two that becomes the pre-filled post body on Bluesky / Facebook / Twitter and the email body. Different platforms consume them differently:

          | Platform | Endpoint field | Uses |
          |----------|----------------|------|
          | Bluesky  | `text` (post body)         | `comment` + page URL |
          | LinkedIn | `url` + `title`            | page URL + `title` |
          | Facebook | `u` + `quote`              | page URL + `comment` |
          | Twitter  | `url` + `text`          | page URL + `comment` |
          | Mail     | `subject` + `body`         | `title` + `comment` + page URL |
        - The `mail` platform uses a `mailto:` link, so it opens the user's default email client.
        - Built-in hover colors match each platform's brand. Custom items use the theme's primary color unless you add a rule.

        #### Layout Settings

        | Property             | Type    | Required | Description                                |
        |----------------------|---------|----------|--------------------------------------------|
        | `hasCenteredContent` | boolean | No       | Centers the optional text block            |

        #### Content

        | Property | Type   | Required | Description                                    |
        |----------|--------|----------|------------------------------------------------|
        | `text`   | object | No       | Optional `text` partial (leadIn/title/etc.)    |

        #### Share Configuration

        | Property          | Type     | Required | Description |
        |-------------------|----------|----------|-------------|
        | `share.title`     | string   | No       | Article / subject title (used by LinkedIn and mail) |
        | `share.comment`   | string   | No       | Page excerpt — becomes the pre-filled post body on Bluesky / Facebook / Twitter and the email body |
        | `share.platforms` | array    | No       | Subset of `bluesky`, `linkedin`, `facebook`, `twitter`, `mail` |
        | `share.custom`    | array    | No       | Arbitrary extra networks — see "Adding Platforms We Do Not Ship" |

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    componentDownload: 'social-shares'
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
      title: 'Download Social Shares Section'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete social-shares component package including template, styles, manifest, examples, and installation script.'
    ctas:
      - url: '/downloads/sections/social-shares.zip'
        label: 'Download Social Shares Section'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
