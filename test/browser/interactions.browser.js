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
    } finally {
      await browser.close();
    }
  });
}
