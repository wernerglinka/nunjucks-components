/**
 * @fileoverview Smoke test: every built page loads in every engine without
 * console errors, uncaught exceptions, or broken same-origin requests.
 *
 * Needs a build in build/ and network access (pages load libraries and
 * media from CDNs). Run with `npm run test:browser`.
 */

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { buildRoot, ENGINES, hasBuild, launch, listPages, watchPage } from './lib/harness.js';
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

for (const engine of ENGINES) {
  test(`${engine}: every page loads cleanly`, {
    skip: !hasBuild && 'no build/ directory, run a build first'
  }, async (t) => {
    const { browser, skip } = await launch(engine);
    if (skip) {
      t.skip(skip);
      return;
    }
    const context = await browser.newContext();
    const findings = [];
    try {
      for (const path of listPages()) {
        const page = await context.newPage();
        const problems = watchPage(page, site.origin);
        try {
          await page.goto(site.origin + path, { waitUntil: 'load', timeout: 30000 });
          // Let component scripts initialise and report
          await page.waitForTimeout(400);
        } catch (error) {
          problems.push(`did not load: ${error.message.split('\n')[0]}`);
        }
        findings.push(...problems.map((problem) => `${path} ${problem}`));
        await page.close();
      }
    } finally {
      await browser.close();
    }
    assert.deepEqual(findings, [], `${findings.length} problem(s) across the site`);
  });
}
