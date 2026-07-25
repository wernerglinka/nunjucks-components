---
layout: pages/sections.njk
bodyClasses: 'sections-page'

card:
  title: 'Customizing Components Without Editing Them'
  description: 'Override component styles from your own site layer instead of editing canon files. Cascade layers, the overrides directory, and the component design API.'
  date: '2026-07-25'
  author:
    - Marie Curie
  thumbnail: '/assets/images/sample13.jpg'
  tags: ['components', 'css', 'cascade-layers', 'customization', 'overrides', 'tutorial']

seo:
  title: Customizing Components Without Editing Them - CSS Overrides Guide
  description: 'How to restyle Nunjucks components without touching their files: the lib/overrides directory, cascade layer order, why an override always wins, and the component design API.'
  socialImage: '/assets/images/sample13.jpg'
  canonicalURL: ''
  keywords: 'component customization, css cascade layers, site overrides, component design API, custom properties, override components'

sections:
  - sectionType: hero
    containerTag: section
    classes: 'first-section'
    id: ''
    isDisabled: false
    isFullScreen: false
    isReverse: true
    containerFields:
      inContainer: false
      isAnimated: true
      noMargin:
        top: true
        bottom: true
      noPadding:
        top: false
        bottom: false
      background:
        isDark: true
        color: ''
        image: '/assets/images/sample13.jpg'
        imageScreen: 'dark'
    text:
      leadIn: 'Component Customization Guide'
      title: Customizing Components Without Editing Them
      titleTag: 'h1'
      subTitle: 'Your look, canon files untouched'
      prose: 'Editing a component in place is the default habit and the reason updates hurt. This guide shows the alternative: a site override that beats the canon component on cascade layer alone, while the component directory stays byte-identical to the library and every future update stays a copy instead of a merge.'
    ctas:
      - url: '#why-not-edit'
        label: 'Get Started'
        isButton: true
        buttonStyle: 'primary'
    image:
      src: ''
      alt: ''
      caption: ''

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'why-not-edit'
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
      title: Why Not Just Edit the Component?
      titleTag: 'h2'
      subTitle: ''
      prose: |
        Every file under `lib/layouts/components/` arrives from this library and is overwritten on reinstall. Nothing stops you from editing one, and sometimes that is the right call. But the moment you do, `npm run components:status` reports the component as `modified`, and adopting any future canon update becomes a [merge instead of a copy](/blog/updating-installed-components/).

        A site that wants a component to look different has two bad options: edit the canon file, which makes the next update a merge, or out-specify it from site CSS, which turns styling into a specificity contest. Cascade layers remove the contest.

        ### The Layer Order

        With layers enabled in `metalsmith-bundled-components` (version 1.4.0 or later; the Metalsmith2025 starter ships with it on), the bundled CSS declares its layer order up front, and every piece of CSS lands in a named layer:

        ```css
        @layer tokens, base, components, site;

        @layer components.hero {
          .hero { ... }        /* canon component CSS, untouched on disk */
        }

        @layer site.hero {
          .hero { --hero-gap: var(--space-l); }   /* your override */
        }
        ```

        In the cascade, a later layer beats an earlier one regardless of specificity. Anything in `site` beats anything in `components`, whatever its selector and wherever it sits in the file. A one-class override wins over a canon rule with three, so overrides stay small, and there is no `!important` and no `.page .section .hero .text` arms race.

        One rule comes with this model, and it is not optional: **unlayered CSS beats every cascade layer**. Your site's own stylesheets must be assigned to layers too, below `components`, or one bare `@import` will outrank the entire component catalog. In the starter, every import in `lib/assets/main.css` names its layer for exactly this reason.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'writing-an-override'
    isDisabled: false
    containerFields:
      inContainer: false
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
        imageScreen: 'none'
    text:
      leadIn: ''
      title: Writing an Override
      titleTag: 'h2'
      subTitle: ''
      prose: |
        Overrides live at `lib/overrides/<name>/<name>.css`, mirroring how components themselves are laid out:

        ```css
        /* lib/overrides/hero/hero.css */
        .hero {
          --hero-gap: var(--space-l);
          --hero-background: var(--color-brand);
        }
        ```

        The bundler picks an override up only for components the build actually uses, and wraps it in `@layer site.<name>` automatically. A site that overrides nothing ships nothing extra, and an override for an unused component costs nothing.

        Site-wide decisions that are not about one component, such as typography or a palette change, do not belong in a component override. They go in your site's own styles, in the `site` layer, where the starter provides `_theme-customization.css` for exactly this.

        ### Prefer Properties over Rules

        Prefer setting a component's custom properties over redeclaring its rules. The properties are the component's design API and survive upstream restructuring; the rules are its implementation and do not.

        An override that redeclares a rule duplicates canon structure:

        ```css
        /* Fragile: copies the selector and breaks when canon restructures */
        .hero .text {
          width: calc(100% - clamp(0px, calc((100vw - 600px) * 3), 50%));
        }
        ```

        An override that sets a property states only the decision:

        ```css
        /* Robust: two lines, survives canon refactors */
        .hero {
          --hero-text-width: calc(100% - clamp(0px, calc((100vw - 600px) * 3), 50%));
        }
        ```

        If the value you want to change is not exposed as a property yet, redeclaring the rule still works, because the layer guarantees you win. It is just more coupled to canon's internals than it needs to be, and worth revisiting when the component gains the property.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'design-api'
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
      title: The Component Design API
      titleTag: 'h2'
      subTitle: ''
      prose: |
        A component's adjustable values are defined as component-scoped custom properties on its root, with fallbacks into the global design tokens, and the component consumes only its own properties below:

        ```css
        .hero {
          --hero-gap: var(--space-m);
          --hero-text-width: calc(100% - clamp(0px, calc((100vw - 600px) * 2), 40%));
          --hero-background: var(--color-background);
        }

        .hero .text {
          width: var(--hero-text-width);
        }
        ```

        Naming is `--<component>-<property>`, always prefixed with the component's own name. The prefix is what keeps one component's knobs from colliding with another's, and what makes the set auditable.

        Two vocabularies meet here. The global design tokens (`--space-m`, `--color-background` and friends) are defined by your site and describe its design system; the component properties are defined by the component and describe what it lets you adjust. A component property's fallback names a global token, which is how a component picks up your site's design system by default while remaining individually tunable.

        Each component's CSS file documents its properties in the header comment, which is the closest thing the component has to a public interface. Components in this library are migrating to this convention by demand: the ones sites actually customize come first. A component that has not been migrated yet consumes global tokens directly, and overriding it means redeclaring rules for now.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'when-to-fork'
    isDisabled: false
    containerFields:
      inContainer: false
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
        imageScreen: 'none'
    text:
      leadIn: ''
      title: When an Override Is Not Enough
      titleTag: 'h2'
      subTitle: ''
      prose: |
        Overrides cover styling. They do not cover markup: if a component's template does not render the element you need, or renders one you cannot have, no amount of CSS fixes that.

        At that point, editing the component is the honest move. Do it deliberately: commit your edits as their own commit so they are attributable, expect `components:status` to report the component as `modified` from then on, and use the [update recipe](/blog/updating-installed-components/) when you later want a canon update merged with your fork.

        The decision tree is short. A styling change goes in `lib/overrides/`, costs nothing at update time, and is always safe. A markup change is a fork, costs a merge at update time, and is sometimes worth it. The mistake is only making the second choice out of habit when the first one would have done.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'
---
