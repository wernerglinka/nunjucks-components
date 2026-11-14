/**
 * @fileoverview One scripted interaction per interactive component, in every
 * engine, plus the same interactions after a page transition. Each asserts the
 * visible outcome and that the page reported no errors along the way.
 *
 * Needs a build in build/ and network access. Run with `npm run test:browser`.
 */

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { buildRoot, ENGINES, eventually, hasBuild, launch, watchPage } from './lib/harness.js';
import { serve } from './lib/server.js';

let site;

before(async () => {
  if (hasBuild) {
    site = await serve(buildRoot);
  }
});

after(async () => {
  await site?.close();
});

/**
 * Open the "Open All" accordion and check every panel follows the button.
 * Shared by the direct visit and the page-transition scenario.
 * @param {import('playwright').Page} page - Page showing the accordion reference
 */
const toggleAllAccordionPanels = async (page) => {
  const toggle = page.locator('.js-accordion-toggle-all').first();
  const states = () =>
    toggle.evaluate((button) =>
      [...button.closest('.section-wrapper').querySelectorAll('.js-accordion-header')].map((header) =>
        header.getAttribute('aria-expanded')
      )
    );
  await toggle.click();
  await eventually(
    async () => (await states()).every((state) => state === 'true'),
    'every panel is open after one click'
  );
  await toggle.click();
  await eventually(
    async () => (await states()).every((state) => state === 'false'),
    'every panel is closed after a second click'
  );
};

/**
 * The interactions. Each gets a fresh page already on `path`.
 * @type {{name: string, path: string, run: (page: import('playwright').Page) => Promise<void>}[]}
 */
const INTERACTIONS = [
  {
    name: 'theme toggle switches the theme and reports its state',
    path: '/',
    run: async (page) => {
      const toggle = page.locator('.js-theme-toggle').first();
      const isDark = () => page.evaluate(() => document.body.classList.contains('dark-theme'));
      const before = await isDark();
      await toggle.click();
      assert.equal(await isDark(), !before, 'one click flips the theme');
      assert.equal(await toggle.getAttribute('aria-pressed'), String(!before));
      await toggle.click();
      assert.equal(await isDark(), before, 'a second click flips it back');
    }
  },
  {
    name: 'language switcher opens, and closes on Escape',
    path: '/',
    run: async (page) => {
      const toggle = page.locator('.js-language-toggle').first();
      const list = page.locator('.js-language-dropdown').first();
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      await list.waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => window.scrollY), 0, 'the page did not scroll');
    }
  },
  {
    name: 'accordion "Open All" opens and closes every panel',
    path: '/references/sections/accordion/',
    run: toggleAllAccordionPanels
  },
  {
    name: 'tabs show the selected panel and hide the others',
    path: '/references/sections/multi-tab/',
    run: async (page) => {
      await page.locator('#tab-image').click();
      assert.equal(await page.locator('#tab-image').getAttribute('aria-selected'), 'true');
      assert.equal(await page.locator('#tab-text').getAttribute('aria-selected'), 'false');
      assert.ok(await page.locator('#panel-image').isVisible(), 'the selected panel is shown');
      assert.ok(await page.locator('#panel-text').isHidden(), 'the previous panel is hidden');
    }
  },
  {
    name: 'slider pagination moves to the chosen slide',
    path: '/references/sections/slider/',
    run: async (page) => {
      const buttons = page.locator('.slider-pagination').first().locator('.slider-pagination-button');
      await buttons.nth(1).click();
      assert.equal(await buttons.nth(1).getAttribute('aria-current'), 'true');
      assert.equal(await buttons.nth(0).getAttribute('aria-current'), 'false');
    }
  },
  {
    name: 'team member dialog opens, closes on Escape and returns focus',
    path: '/references/sections/team-grid/',
    run: async (page) => {
      const trigger = page.locator('[data-dialog-target="member-1-dialog"]').first();
      const dialog = page.locator('#member-1-dialog');
      await trigger.click();
      assert.ok(await dialog.evaluate((element) => element.open), 'the dialog is open');
      await page.keyboard.press('Escape');
      await eventually(async () => !(await dialog.evaluate((element) => element.open)), 'Escape closes the dialog');
      assert.ok(
        await trigger.evaluate((element) => element === document.activeElement),
        'focus is back on the trigger'
      );
    }
  },
  {
    name: 'artwork zoom opens a dialog, closes on Escape and returns focus',
    path: '/references/sections/artwork/',
    run: async (page) => {
      const trigger = page.locator('.js-artwork-zoom').first();
      await trigger.click();
      await page.locator('dialog[open]').waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await eventually(async () => (await page.locator('dialog[open]').count()) === 0, 'Escape closes the dialog');
      assert.ok(
        await trigger.evaluate((element) => element === document.activeElement),
        'focus is back on the trigger'
      );
    }
  },
  {
    name: 'image comparison handle moves with the arrow keys',
    path: '/references/sections/image-compare/',
    run: async (page) => {
      const handle = page.locator('.comparison-handle').first();
      const before = Number(await handle.getAttribute('aria-valuenow'));
      await handle.focus();
      await page.keyboard.press('ArrowRight');
      assert.notEqual(Number(await handle.getAttribute('aria-valuenow')), before, 'the value changed');
    }
  },
  {
    name: 'search lists results while typing and clears them',
    path: '/references/partials/search/',
    run: async (page) => {
      const input = page.locator('.search-input').first();
      const results = page.locator('.search-results').first();
      await input.fill('hero');
      await results.locator(':scope > *').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.locator('.search-clear').first().click();
      assert.equal(await input.inputValue(), '', 'the clear button empties the field');
      assert.equal(await results.locator(':scope > *').count(), 0, 'and removes the results');
    }
  },
  {
    name: 'map popup opens from a marker, closes on Escape and from its close control',
    path: '/references/sections/maps/',
    run: async (page) => {
      const map = page.locator('.leaflet-container').first();
      await map.scrollIntoViewIfNeeded();
      const marker = map.locator('.leaflet-marker-icon').first();
      const popup = map.locator('.leaflet-popup');
      await marker.waitFor({ state: 'visible', timeout: 15000 });
      await marker.click();
      await popup.waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await popup.waitFor({ state: 'detached' });
      await marker.click();
      await popup.waitFor({ state: 'visible' });
      // Let the map finish panning to fit the popup. A click on a moving
      // target makes Playwright scroll the page to retry, which would look
      // like the bug this test guards against.
      await page.waitForTimeout(800);
      const scrollBefore = await page.evaluate(() => window.scrollY);
      await map.locator('.leaflet-popup-close-button').click();
      await popup.waitFor({ state: 'detached' });
      await page.waitForTimeout(600);
      assert.equal(await page.evaluate(() => window.scrollY), scrollBefore, 'closing did not scroll the page');
      assert.equal(await page.evaluate(() => window.location.hash), '', 'closing did not change the URL');
    }
  },
  {
    name: 'a query in the URL runs however long the search index takes',
    path: '/',
    run: async (page) => {
      await page.route('**/search-index.json', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.continue();
      });
      await page.goto(new URL('/search/?q=hero', page.url()).href, { waitUntil: 'load' });
      const input = page.locator('.search-input').first();
      await page.locator('.search-results').first().locator(':scope > .search-result').first().waitFor({
        state: 'visible',
        timeout: 10000
      });
      assert.equal(await input.inputValue(), 'hero', 'the query from the URL is in the field');
    }
  },
  {
    name: 'search accepts a query as short as its stated minimum',
    path: '/search/',
    run: async (page) => {
      const input = page.locator('.search-input').first();
      const minimum = await input.evaluate((field) =>
        Number(field.closest('.search-container').dataset.minCharacters || 2)
      );
      assert.equal(minimum, 2, 'the search page asks for two characters');
      await input.fill('js');
      await page.locator('.search-results').first().locator(':scope > .search-result').first().waitFor({
        state: 'visible',
        timeout: 10000
      });
    }
  },
  {
    name: 'search lists every page that contains the query, and only those',
    path: '/search/',
    run: async (page) => {
      const query = 'leaflet';
      const index = await page.evaluate(() => fetch('/search-index.json').then((response) => response.json()));
      const contains = (text) => typeof text === 'string' && text.toLowerCase().includes(query);
      const expected = index.entries
        .filter(
          (entry) =>
            [entry.title, entry.content, entry.excerpt].some(contains) ||
            (entry.headings || []).some((heading) => contains(heading.title))
        )
        .map((entry) => entry.url);
      assert.ok(expected.length > 1, 'the query is found on several pages');

      // Site chrome is kept out of the index. With the sidebar indexed, every
      // reference page contained every component name.
      const naming = index.entries.filter((entry) => entry.content.toLowerCase().includes('accordion')).length;
      assert.ok(naming < index.entries.length / 4, `"accordion" is on ${naming} of ${index.entries.length} pages`);

      await page.locator('.search-input').first().fill(query);
      const results = page.locator('.search-results').first().locator(':scope > .search-result');
      await results.first().waitFor({ state: 'visible', timeout: 10000 });
      const shown = await results.evaluateAll((elements) =>
        elements.map((element) => ({
          url: new URL(element.querySelector('a').href).pathname.replace(/\/$/, ''),
          text: element.textContent.toLowerCase()
        }))
      );
      assert.deepEqual(shown.map((result) => result.url).sort(), [...expected].sort(), 'the results are those pages');

      // A result whose match is in the page body shows the passage around it
      for (const result of shown) {
        const entry = index.entries.find((candidate) => candidate.url === result.url);
        if (contains(entry.content)) {
          assert.ok(result.text.includes(query), `${result.url} shows the query in context`);
        }
      }
    }
  },
  {
    name: 'tabs work when a tab key holds a dot, a space and a slash',
    path: '/references/sections/multi-tab/',
    run: async (page) => {
      const component = page.locator('.tabs-component').first();
      // No page uses such a key, so give the second tab one after the fact
      await component.evaluate((container) => {
        const tab = container.querySelectorAll('.tabs-button')[1];
        const panel = container.querySelector(`#${CSS.escape(tab.getAttribute('aria-controls'))}`);
        tab.id = 'tab-v1.2 a/b';
        panel.id = 'panel-v1.2 a/b';
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('aria-labelledby', tab.id);
      });
      const tab = component.locator('.tabs-button').nth(1);
      await tab.click();
      assert.equal(await tab.getAttribute('aria-selected'), 'true', 'the tab is selected');
      const visible = await component.evaluate((container) =>
        [...container.querySelectorAll('.tabs-panel')].filter((panel) => !panel.hidden).map((panel) => panel.id)
      );
      assert.deepEqual(visible, ['panel-v1.2 a/b'], 'only its panel is shown');
      // The key travels through the URL percent-encoded and has to come back
      await component.locator('.tabs-button').first().click();
      await page.goBack();
      await eventually(async () => (await tab.getAttribute('aria-selected')) === 'true', 'Back restores the tab');
    }
  },
  {
    name: 'hero slider advances after its own autoPlayDelay',
    path: '/',
    run: async (page) => {
      // A controlled clock applies to the whole context, so use a separate one
      const context = await page
        .context()
        .browser()
        .newContext({ viewport: { width: 1280, height: 900 } });
      try {
        const own = await context.newPage();
        await own.clock.install();
        await own.goto(new URL('/references/sections/hero-slider/', page.url()).href, { waitUntil: 'load' });
        const slider = own.locator('.js-hero-slider.is-autoplay').first();
        const delay = Number(await slider.getAttribute('data-autoplay-delay'));
        assert.ok(delay > 5000, 'the first example sets a delay longer than the default of 5 seconds');
        const selected = () =>
          slider.evaluate((element) =>
            [...element.querySelectorAll('.js-slide')].findIndex((slide) => slide.classList.contains('is-selected'))
          );
        // Stop the clock, then pick a slide by hand and move the pointer off
        // the slider (hovering pauses it): that restarts the delay at a known
        // moment, whatever time the page took to load
        await own.clock.pauseAt(new Date(Date.now() + 60000));
        await slider.locator('.js-nav li a').nth(1).click();
        await own.mouse.move(0, 0);
        await eventually(async () => (await selected()) === 1, 'the chosen slide is shown');
        await own.clock.runFor(delay - 300);
        assert.equal(await selected(), 1, 'the slide stays until the delay has passed');
        await own.clock.runFor(600);
        assert.notEqual(await selected(), 1, 'and changes once it has');
      } finally {
        await context.close();
      }
    }
  },
  {
    name: 'podcast player shows markup in an episode title as text',
    path: '/',
    run: async (page) => {
      const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Test feed</title>
<item><title>&lt;img src=x onerror="window.__feedScriptRan = true"&gt; Tom &amp; Jerry</title>
<enclosure url="/assets/audio/shattered-reflections.mp3" type="audio/mpeg" length="1"/></item>
</channel></rss>`;
      const local = new URL(page.url()).origin;
      await page.route(
        (url) => url.origin !== local && /rss|feeds?\.|allorigins/.test(url.href),
        (route) =>
          route.fulfill({
            status: 200,
            contentType: 'application/rss+xml',
            headers: { 'access-control-allow-origin': '*' },
            body: feed
          })
      );
      await page.goto(new URL('/references/sections/podcast/', page.url()).href, { waitUntil: 'load' });
      const title = page.locator('.shk-title').first();
      await title.waitFor({ state: 'attached', timeout: 15000 });
      await eventually(async () => (await title.textContent()).includes('Tom & Jerry'), 'the player shows the title');
      assert.match(await title.textContent(), /<img src=x/, 'the markup is shown as text');
      assert.equal(await title.locator('img').count(), 0, 'and no element was created from it');
      assert.equal(await page.evaluate(() => window.__feedScriptRan), undefined, 'so its script did not run');
    }
  }
];

for (const engine of ENGINES) {
  test(`${engine}: component interactions`, {
    skip: !hasBuild && 'no build/ directory, run a build first'
  }, async (t) => {
    const { browser, skip } = await launch(engine);
    if (skip) {
      t.skip(skip);
      return;
    }
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    try {
      for (const { name, path, run } of INTERACTIONS) {
        await t.test(name, async () => {
          const page = await context.newPage();
          const problems = watchPage(page, site.origin);
          try {
            await page.goto(site.origin + path, { waitUntil: 'load' });
            await run(page);
            assert.deepEqual(problems, [], 'the page reported no errors');
          } finally {
            await page.close();
          }
        });
      }

      await t.test('components still work after a page transition', async () => {
        const page = await context.newPage();
        const problems = watchPage(page, site.origin);
        try {
          await page.goto(`${site.origin}/references/sections/`, { waitUntil: 'load' });
          // A value on window survives a transition and is lost on a full reload
          await page.evaluate(() => {
            window.__sameDocument = true;
          });
          await page.locator('a[href^="/references/sections/accordion"]').first().click();
          await page.waitForURL(/\/references\/sections\/accordion\/?$/);
          await page.locator('.js-accordion-toggle-all').first().waitFor({ state: 'visible' });
          assert.ok(
            await page.evaluate(() => window.__sameDocument === true),
            'the visit was a transition, not a reload'
          );
          // A listener attached twice would toggle twice and leave the panels unchanged
          await toggleAllAccordionPanels(page);

          const isDark = () => page.evaluate(() => document.body.classList.contains('dark-theme'));
          const before = await isDark();
          await page.locator('.js-theme-toggle').first().click();
          assert.equal(await isDark(), !before, 'the theme toggle fires exactly once after a transition');
          assert.deepEqual(problems, [], 'the pages reported no errors');
        } finally {
          await page.close();
        }
      });

      await t.test('cleanup runs while the outgoing page is still in the document', async () => {
        const page = await context.newPage();
        const problems = watchPage(page, site.origin);
        try {
          await page.goto(`${site.origin}/references/sections/`, { waitUntil: 'load' });
          await page.evaluate(() => {
            const outgoing = document.querySelector('#swup').firstElementChild;
            window.PageTransitions.registerCleanup('test-probe', () => {
              window.__cleanupSawOutgoingPage = outgoing.isConnected;
            });
          });
          await page.locator('a[href^="/references/sections/accordion"]').first().click();
          await page.waitForURL(/\/references\/sections\/accordion\/?$/);
          await page.locator('.js-accordion-toggle-all').first().waitFor({ state: 'visible' });
          assert.equal(
            await page.evaluate(() => window.__cleanupSawOutgoingPage),
            true,
            'a cleanup function can still find the elements of the page being left'
          );
          assert.deepEqual(problems, [], 'the pages reported no errors');
        } finally {
          await page.close();
        }
      });

      await t.test('body classes follow the page through a transition', async () => {
        const page = await context.newPage();
        const problems = watchPage(page, site.origin);
        try {
          await page.goto(`${site.origin}/search/`, { waitUntil: 'load' });
          const toggle = page.locator('header .search-icon-toggle');
          assert.equal(await toggle.isVisible(), false, 'the search page hides the header search icon');
          await page.evaluate(() => {
            window.__sameDocument = true;
          });
          const themeBefore = await page.evaluate(() => document.body.classList.contains('dark-theme'));
          await page.locator('a[href="/blog/"]').first().click();
          await page.waitForURL(/\/blog\/?$/);
          await eventually(
            () => page.evaluate(() => !document.body.classList.contains('search-page')),
            'the search page class is gone on the next page'
          );
          assert.ok(await page.evaluate(() => window.__sameDocument === true), 'the visit was a transition');
          assert.equal(await toggle.isVisible(), true, 'and the header search icon is back');
          assert.equal(
            await page.evaluate(() => document.body.classList.contains('dark-theme')),
            themeBefore,
            'classes set by scripts are left alone'
          );
          assert.deepEqual(problems, [], 'the pages reported no errors');
        } finally {
          await page.close();
        }
      });
    } finally {
      await browser.close();
    }
  });
}
