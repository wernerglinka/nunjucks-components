---
layout: pages/sections.njk
bodyClasses: 'sections-page'

card:
  title: 'Updating Installed Components'
  description: 'How to adopt a canon update for a component you have customized, and how to establish a baseline for components installed before install commits existed.'
  date: '2026-07-25'
  author:
    - Isaac Newton
  thumbnail: '/assets/images/sample11.jpg'
  tags: ['components', 'updates', 'git', 'installation', 'maintenance', 'tutorial']

seo:
  title: Updating Installed Components - Merge Canon Updates Safely
  description: 'Two recipes for updating installed Nunjucks components: reapply your customizations over a canon update with git, or establish a baseline for components installed before install commits.'
  socialImage: '/assets/images/sample11.jpg'
  canonicalURL: ''
  keywords: 'update components, component updates, git apply 3way, install commit, content hash, component baseline, canon update'

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
        image: '/assets/images/sample11.jpg'
        imageScreen: 'dark'
    text:
      leadIn: 'Component Maintenance Guide'
      title: Updating Installed Components
      titleTag: 'h1'
      subTitle: 'Adopt canon updates without losing your customizations'
      prose: 'Components you have not touched update with a plain reinstall. This guide covers the other two cases: a component you have edited, and a component installed before the installer recorded installs in git.'
    ctas:
      - url: '#how-updates-work'
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
    id: 'how-updates-work'
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
      title: How Updates Work
      titleTag: 'h2'
      subTitle: ''
      prose: |
        Components are distributed one way: from this library's catalog into your project, over HTTP. There is no lockfile, no verify command, and no registry client. What makes updates manageable anyway is git, and specifically the commit the starter's installer writes for every install:

        ```
        component: install hero@1.3.2 from nunjucks-components.com

        Component-Name: hero
        Component-Version: 1.3.2
        Content-Hash: a3f9c2e17b40d8e6
        ```

        That commit is the baseline. It records exactly which files arrived, and everything you changed afterward is one `git diff` away. The update recipes below are both built on it.

        Start by finding out where you stand:

        ```bash
        npm run components:status
        ```

        - **outdated** means canon moved and your copy did not. Reinstall the component by name and you are done: `node scripts/install-components.mjs hero`.
        - **modified** means you changed it and canon did not. This needs nothing.
        - **diverged** means both sides moved. That is the case the first recipe exists for.

        The content hash covers the template, stylesheet, script and any modules. It deliberately excludes `manifest.json`, so a manifest-only change on either side does not show up in the status report. `diff -ru` against a fresh download is how you see those.

        Before editing a component at all, consider whether an override can do the job instead; see [Customizing Components Without Editing Them](/blog/customizing-components-without-editing-them/). A component you never touch updates with a plain copy, forever.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'updating-customized'
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
      title: 'Recipe 1: Updating a Component You Have Customized'
      titleTag: 'h2'
      subTitle: ''
      prose: |
        Sometimes an override is not enough and you edit the component itself. That is allowed; the cost is that adopting a later canon version becomes a merge rather than a copy. Git already knows how to do that merge, and the install commit is what gives it something to merge against.

        Four steps. Say you have edited `hero` and want the current canon version.

        ### 1. Find the commit where it was installed

        ```bash
        git log --grep="Component-Name: hero" -1 --format=%H
        ```

        ### 2. Save what you changed since

        ```bash
        git diff <install-commit> HEAD -- lib/layouts/components/sections/hero > /tmp/hero.patch
        ```

        That patch is your fork: every edit you made on top of the version you installed, and nothing else.

        ### 3. Reinstall from canon

        ```bash
        git status --porcelain -- lib/layouts/components/sections/hero   # must be empty
        node scripts/install-components.mjs hero
        ```

        Naming the component explicitly reinstalls it even though it is already present. The canon files land, and a fresh install commit records the new version. Your edits are gone from the working tree at this point, which is fine, because step 2 has them.

        ### 4. Reapply your edits

        ```bash
        git apply --3way /tmp/hero.patch
        ```

        `--3way` merges rather than applying blindly, so edits to lines canon did not touch land silently and genuine collisions come back as ordinary conflict markers for you to resolve. Build, check the result, then commit the reapplied customization as its own commit so the next update has a clean baseline to diff from.

        If the patch applies cleanly and the component still looks right, you are done. If it conflicts, the conflict is the useful part: it is the exact place where canon changed something you had also changed.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'establishing-baseline'
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
      title: 'Recipe 2: Components Installed Before Install Commits Existed'
      titleTag: 'h2'
      subTitle: ''
      prose: |
        Components installed by hand, or by the per-component `install.sh` scripts, have no install commit to diff against. There is no baseline in your history, so make one from canon instead. This recipe matters for every site older than the installer.

        ```bash
        curl -sO https://nunjucks-components.com/downloads/partials/text.zip
        unzip -q text.zip -d /tmp/canon
        diff -ru /tmp/canon/text lib/layouts/components/_partials/text
        ```

        Read that diff in both directions. Lines only in your copy are your customizations. Lines only in canon are improvements you never received, which is the part that is easy to miss.

        Decide file by file: a manifest is usually safe to take wholesale, while CSS you have edited deserves a real merge. Commit the result with the same trailers the installer writes, so the next update has a baseline:

        ```
        component: update text@1.3.2 from nunjucks-components.com

        Component-Name: text
        Component-Version: 1.3.2
        Content-Hash: bdce80ff48392bc5
        ```

        `version` and `contentHash` come from the catalog at [/downloads/manifest.json](/downloads/manifest.json), where `version` is the library release and `contentHash` identifies this component's content. Once that commit exists, the component is a first-class citizen of `components:status`, and the next update follows Recipe 1.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'

  - sectionType: rich-text
    containerTag: article
    classes: ''
    id: 'verifying-updates'
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
      title: Verifying an Update
      titleTag: 'h2'
      subTitle: ''
      prose: |
        After either recipe, the verification is the same: build the site and look at the result.

        ```bash
        npm run build
        ```

        For a component whose update was meant to be invisible, the build is the artifact. Diff the output tree against a build from before the update; nothing should change unless the update was meant to change it.

        For CSS changes specifically, screenshots are how you convince yourself but not how you find out. Load the affected pages before and after, ask the browser for computed styles on a fixed set of elements, and compare those. Subtle regressions survive a side-by-side look and do not survive a computed-style diff.

        Finally, run `npm run components:status` once more. The component you just updated should report clean, and the trailer of its new install or update commit is the baseline the next update will diff against.
    ctas:
      - url: ''
        label: ''
        isButton: false
        buttonStyle: 'primary'
---
