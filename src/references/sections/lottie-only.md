---
layout: pages/sections-with-sidebar.njk
bodyClasses: 'sections-page'
hasHero: true
title: Lottie Only

navigation:
  navLabel: 'Lottie Only'
  navIndex: 5

card:
  title: 'Lottie Only'
  description: 'Full-width Lottie animation section for displaying standalone JSON animations with autoplay and loop control.'
  image: '/assets/images/sample20.jpg'
  tags: ['lottie', 'animation', 'media', 'json', 'motion', 'standalone']

seo:
  title: Lottie Only Component - Standalone Animation Section for Metalsmith
  description: 'Display a standalone Lottie JSON animation as a full section with configurable speed, autoplay, and loop settings for Metalsmith static sites.'
  socialImage: '/assets/images/metalsmith2025-starter-social.png'
  canonicalURL: ''
  keywords: 'metalsmith lottie section, lottie animation component, json animation, lottie player, standalone animation, motion graphics'

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
      title: 'Lottie Only'
      titleTag: 'h1'
      subTitle: ''
      prose: |-
        A media section that renders a standalone [Lottie](https://airbnb.io/lottie/) JSON animation. The section wraps the [lottie partial](/references/partials/lottie/), which loads the Lottie player web component and plays the animation with configurable speed, autoplay, and loop settings.

  - sectionType: lottie-only
    containerTag: section
    classes: ''
    id: ''
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
        imageScreen: 'none' # light, dark, none
    lottie:
      src: '/assets/lotties/example4.json'
      speed: 1
      control:
        autoplay: true
        loop: true

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
        - sectionType: lottie-only
          containerTag: section
          # more settings

          lottie:
            src: '/assets/lotties/example4.json' # URL of the Lottie JSON file
            speed: 1 # playback speed multiplier
            control:
              autoplay: true # start playing when loaded
              loop: true # repeat the animation
        ```

        ### Configuration Options

        | Property | Type | Required | Description |
        |----------|------|----------|-------------|
        | `lottie.src` | string | Yes | URL of the Lottie JSON animation file |
        | `lottie.speed` | number | No | Playback speed multiplier (default `1`) |
        | `lottie.control.autoplay` | boolean | No | Starts the animation automatically when `true` |
        | `lottie.control.loop` | boolean | No | Repeats the animation when `true` |

        ### Notes

        - The Lottie player library is loaded from CDN by the lottie partial when the section renders
        - The animation renders with a transparent background so section backgrounds show through
        - For a Lottie animation combined with text and CTAs, use the [multi-media section](/references/sections/multi-media/) with `mediaType: lottie`

  - sectionType: banner
    containerTag: aside
    classes: 'download-banner'
    id: ''
    isDisabled: false
    isReverse: false
    componentDownload: 'lottie-only'
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
      title: 'Download Lottie Only Section'
      titleTag: 'h3'
      subTitle: ''
      prose: 'Get the complete lottie-only component package including template, manifest, examples, and installation script.'
    ctas:
      - url: '/downloads/sections/lottie-only.zip'
        label: 'Download Lottie Only Section'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''
---
