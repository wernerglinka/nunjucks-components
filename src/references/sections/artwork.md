---
layout: pages/sections-with-sidebar.njk
bodyClasses: 'sections-page'
title: Artwork

navigation:
  navLabel: 'Artwork'
  navIndex: 3

card:
  title: 'Artwork'
  description: 'Displays a single artwork with its image, optional title/subtitle header, and a structured property list. Clicking the image opens a larger version in a modal overlay.'
  image: '/assets/images/sample6.jpg'
  tags: ['artwork', 'image', 'gallery', 'properties', 'bilingual', 'catalog', 'modal', 'lightbox']

seo:
  title: Artwork Section Component - Artwork Display for Metalsmith
  description: 'Display a single artwork with its image, optional title/subtitle header, and a structured property list including type, year, materials, dimensions, and availability status. The image opens a larger version in a modal overlay.'
  socialImage: '/assets/images/sample.jpg'
  canonicalURL: ''
  keywords: 'nunjucks artwork section, metalsmith, eleventy, artwork display, art catalog, artwork properties, bilingual component'

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
      title: 'Artwork Section'
      titleTag: 'h1'
      subTitle: ''
      prose: |-
        Displays a single artwork with its image, an optional title/subtitle header, and a structured property list (type, year, materials, dimensions, status). Designed for art catalog pages. Clicking the image opens a larger version in a modal overlay. The component supports bilingual output — when the page-level `lang` variable is `de`, labels switch to German and inch dimensions are automatically converted to centimetres.

  - sectionType: artwork
    containerTag: section
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
      title: 'Object 2026.03.005'
      titleTag: 'h2'
      subTitle: 'Assemblage'
    image:
      src: '/assets/images/sample6.jpg'
      alt: 'Example artwork image'
      caption: ''
    artworkProperties:
      type: 'Assemblage'
      year: 2026
      materials: 'Wire mesh, wood panel, ash, urethane, shredded paper'
      status: 'available'
      dimensions:
        width: 9
        height: 24
        depth: 1
        unit: 'in'

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
        - sectionType: artwork
          containerTag: section
          text:                         # optional — omit to suppress the header
            leadIn: ''
            title: 'Object 2026.03.005'
            titleTag: 'h2'
            subTitle: 'Assemblage'
          image:                        # required
            src: '/assets/images/artwork.jpg'
            alt: 'Description for accessibility'
            caption: ''
          artworkProperties:            # optional — omit to suppress the property list
            type: 'Assemblage'
            year: 2026
            materials: 'Wire mesh, wood panel, ash, urethane, shredded paper'
            status: 'available'         # only 'available' renders the status row
            dimensions:
              width: 9
              height: 24
              depth: 1                  # optional
              unit: 'in'
        ```

        ### Configuration Options

        #### Image (required)

        | Property | Type | Required | Description |
        |----------|------|----------|-------------|
        | `image.src` | string | Yes | Path to the artwork image |
        | `image.alt` | string | Yes | Alternative text for accessibility |
        | `image.caption` | string | No | Optional caption displayed below the image |

        #### Image Modal

        The artwork image is rendered as a button. Clicking it opens the image at full size in a modal overlay, adopted from the video component's modal implementation. The modal closes via the close control, a click on the backdrop, or the Escape key, and works with SWUP page transitions. No configuration is required — the modal always uses the image defined in `image.src`, so provide a source large enough to look good at up to 80% of the viewport.

        #### Text Header (optional)

        | Property | Type | Required | Description |
        |----------|------|----------|-------------|
        | `text.title` | string | No | Artwork title |
        | `text.titleTag` | string | No | HTML tag for the title (`h1`–`h6`) |
        | `text.subTitle` | string | No | Subtitle or medium label |

        #### Artwork Properties (optional)

        | Property | Type | Description |
        |----------|------|-------------|
        | `artworkProperties.type` | string | Medium or artwork type |
        | `artworkProperties.year` | number | Year of creation |
        | `artworkProperties.materials` | string | Materials used |
        | `artworkProperties.dimensions` | object | `width`, `height`, `depth` (numbers), `unit` (string) |
        | `artworkProperties.status` | string | Only `available` renders the status row; other values omit it |

        #### Bilingual Behaviour

        When the page-level `lang` variable is `de`, property labels switch to German and inch dimensions are multiplied by 2.54 and displayed in centimetres. In a standard Metalsmith build where `lang` is not set, English labels are always used.

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    isAnimated: false
    componentDownload: 'artwork'
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
      title: 'Download Artwork Section'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete artwork component package including template, styles, manifest, examples, and installation script.'
    ctas:
      - url: '/downloads/sections/artwork.zip'
        label: 'Download Artwork Section'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
