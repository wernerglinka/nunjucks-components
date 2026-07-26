---
layout: pages/sections.njk
bodyClasses: 'sections-page'

card:
  title: 'The Design Token Contract'
  description: 'Why components may only consume tokens the vocabulary defines, when a knob belongs to the component instead, and the two audit tools that hold both sides to the agreement.'
  date: '2026-07-25'
  author:
    - Niels Bohr
  thumbnail: '/assets/images/sample19.jpg'
  tags: ['components', 'css', 'design-tokens', 'component-properties', 'architecture', 'maintenance']

seo:
  title: The Design Token Contract - Tokens, Component Properties, and Audits
  description: 'The agreement between component canon and consuming sites: components consume only vocabulary tokens, single-component knobs become prefixed component properties, and lint tooling audits both sides.'
  socialImage: '/assets/images/sample19.jpg'
  canonicalURL: ''
  keywords: 'design tokens, css custom properties, component properties, token vocabulary, tokens check, component lint, undefined tokens'

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
        image: '/assets/images/sample19.jpg'
        imageScreen: 'dark'
    text:
      leadIn: 'Component Architecture Guide'
      title: The Design Token Contract
      titleTag: 'h1'
      subTitle: 'What components may consume, what they must own, and how both sides get audited'
      prose: 'Every component in this library styles itself with CSS custom properties. Which properties it is allowed to reference, and who must define them, is a contract between the component canon and every site that installs from it. This post spells the contract out and introduces the tools that enforce it.'
    ctas:
      - url: '#the-contract'
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
    id: 'the-contract'
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
      title: The Contract
      titleTag: 'h2'
      subTitle: ''
      prose: |
        Components do not carry their own colors, spacing, or type scale. They consume global design tokens: `--color-primary`, `--space-m`, `--font-s` and their relatives, defined once in your site's `_design-tokens.css`. That single file is the vocabulary, and it is how thirty installed components end up looking like one site instead of thirty.

        The vocabulary is also a promise, and the promise runs in both directions. The moment a canon component consumes a token, every consuming site must define that token, and must keep defining it for as long as the component is installed anywhere. So:

        - Canon never references a token the vocabulary has not shipped.
        - The vocabulary never renames or drops a token canon consumes.

        Neither side can see the other's working tree, which is why the contract needs to be auditable rather than remembered. Both halves of the tooling are covered at the end of this post.

        The cost of the promise is what shapes the rest of the contract. Adding a token to the vocabulary is easy; removing one is a breaking change for every site that ever installed a component consuming it. That asymmetry is why the vocabulary should stay small, and it is why the next section exists.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'component-properties'
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
      title: Component Properties Are Not Tokens
      titleTag: 'h2'
      subTitle: ''
      prose: |
        Not every adjustable value deserves a place in the vocabulary. The decision rule is about who cares: a knob that several components share describes the design system and belongs in the vocabulary; a knob that exactly one component cares about describes that component, and putting it in the vocabulary would make every site guarantee it forever for one consumer's benefit.

        A single-component knob becomes a component property instead: a custom property in the component's own `--<component>-` namespace, declared by the component on its root, with the default right there in the declaration.

        ```css
        .iframe-frame {
          --iframe-height: 50rem;
        }

        .iframe-frame iframe {
          block-size: var(--iframe-height);
        }
        ```

        The component defines it, so no site owes it anything. The name carries the owner, so a stylesheet full of custom properties still reads unambiguously. And retuning it is two lines in `lib/overrides/iframe/iframe.css`, which survives every future reinstall untouched. The override mechanics, and how component properties form each component's design API, are the subject of [Customizing Components Without Editing Them](/blog/customizing-components-without-editing-them/).

        Where a component property represents a design-system value, its default resolves to the corresponding token rather than repeating the literal, so the component picks up your site's design system while remaining individually tunable:

        ```css
        .logos-list {
          --logos-list-animation-speed: 15s;
          --logos-list-logo-padding: var(--space-s);
        }
        ```

        The prefix rule is not a style preference. An unprefixed property like `--animation-speed` squats on a name any other component, or your site, might also want, and the collision resolves by cascade accident rather than by anyone's intent.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'undefined-tokens'
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
      title: What an Undefined Token Does
      titleTag: 'h2'
      subTitle: ''
      prose: |
        The failure mode the contract exists to prevent is quiet. A declaration like

        ```css
        font-size: var(--font-size-s, 0.875rem);
        ```

        where `--font-size-s` is defined nowhere does not break anything. It renders through the fallback, every time, on every site. That is worse than breaking: the page looks styled, so nothing prompts a fix, but the value is frozen. Retuning the token does nothing because there is no token. The dark theme cannot reach it. The fluid type scale does not apply to it. It is a hard-coded value wearing a token's clothes.

        This is how components written against a vocabulary that never existed behave. A component that references `--font-size-s` where the vocabulary spells it `--font-s`, or `--text-color` where the vocabulary says `--color-text`, is not wrong-looking, just permanently deaf to the design system. The fix belongs in canon, and it is a mapping: replace each foreign reference with the real token it means, either directly or through a prefixed component property whose default resolves to it. The tempting fix, adding the foreign names to your site's vocabulary so the references resolve, is the wrong one. It works immediately and costs forever: the vocabulary then carries two naming schemes for the same concepts, and every future site inherits both.

        Auditing for undefined tokens finds adjacent decay too. This library's audit turned up a component property that was defined and documented but consumed nowhere; the knob had quietly stopped doing anything across a refactor, and nothing visible ever hinted at it. Dead wiring and fallback-only wiring are the same disease: styling that looks intentional and answers to no one.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'auditing'
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
      title: Auditing the Contract
      titleTag: 'h2'
      subTitle: ''
      prose: |
        Each side of the contract has its own audit.

        In the library, `npm run lint:components` lints every component against the vocabulary: token references that nothing defines, component properties missing their owner's prefix, stylesheets that would escape the cascade layer order, and manifest defaults that drifted from validation. A bare reference to a missing token is an error, because it renders unstyled. A reference with a fallback is a warning, because it renders and lies about it, which you now know is the more patient problem.

        In a consuming site, the starter ships the mirror image as `npm run tokens:check`. It audits your installed components against your vocabulary and reports in the same shape:

        ```
        token contract: 31 installed components, 108 vocabulary tokens, 0 errors, 3 warnings
        ```

        A clean report means every token your components consume is one your vocabulary actually defines, which is the contract, verified. When warnings do appear, read them before acting on them. A warning naming a component's own file usually means canon has already fixed it and your copy predates the fix; `npm run components:status` will show the component as outdated, and a reinstall clears the warning. A warning naming a token you renamed or removed from your vocabulary means the break is on your side, and the token needs to come back.

        Run `tokens:check` after installing a component, after updating one, and after any change to `_design-tokens.css`. It is fast, and it is the difference between a design system you can retune from one file and a slow accumulation of values that merely look adjustable.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'
---
