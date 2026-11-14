/**
 * @fileoverview Shared setup for the browser tests: which engines to run,
 * how to launch them, and how to watch a page for problems.
 */

import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';

const ENGINE_TYPES = { chromium, firefox, webkit };

export const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const buildRoot = join(projectRoot, 'build');
export const hasBuild = existsSync(join(buildRoot, 'index.html'));

/** Engines to run. Override with BROWSERS=chromium,webkit */
export const ENGINES = (process.env.BROWSERS || 'chromium,firefox,webkit')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

/**
 * Launch an engine. An engine that cannot start on this machine is reported
 * as a skip reason instead of failing every test that needs it.
 * @param {string} name - chromium, firefox or webkit
 * @returns {Promise<{browser?: import('playwright').Browser, skip?: string}>}
 */
export const launch = async (name) => {
  const engine = ENGINE_TYPES[name];
  if (!engine) {
    return { skip: `unknown engine "${name}"` };
  }
  try {
    return { browser: await engine.launch() };
  } catch (error) {
    const lines = String(error.message).split('\n');
    // The last line the browser wrote to stderr is the actual cause
    const reason = lines.findLast((line) => /\[err\]|Executable doesn't exist/.test(line));
    return { skip: `${name} did not launch: ${(reason || lines[0]).replace(/^.*\[err\]\s*/, '').trim()}` };
  }
};

/**
 * Every page of the built site, as URL paths.
 * @returns {string[]}
 */
export const listPages = () => {
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(full);
      }
      return entry.name === 'index.html' ? [full] : [];
    });
  return walk(buildRoot)
    .map((file) => `/${relative(buildRoot, file).replace(/index\.html$/, '')}`)
    .sort();
};

/**
 * Console noise that is not a defect of this site. Each entry says why.
 * @type {{pattern: RegExp, reason: string}[]}
 */
const ALLOWED_MESSAGES = [
  {
    pattern: /Failed to load resource/,
    reason: 'duplicates the response check below, which judges same-origin requests only'
  },
  {
    pattern: /Failed to fetch calendar .* HTTP 403/,
    reason: 'the Google Calendar API key is restricted to the production domain'
  },
  {
    pattern: /Permissions policy violation/,
    reason: 'logged by embedded third-party video players about their own frames'
  },
  {
    pattern: /player\.vimeo\.com/,
    reason: 'cross-origin frame access attempted by the embedded Vimeo player'
  }
];

/**
 * Collect the problems a page reports while it is open: console errors,
 * uncaught exceptions, and failed or 4xx/5xx requests to the site itself.
 * Third-party requests are not judged; they depend on the network.
 * @param {import('playwright').Page} page - Page to watch
 * @param {string} origin - Origin of the site under test
 * @returns {string[]} Live list of problems
 */
export const watchPage = (page, origin) => {
  const problems = [];
  const allowed = (text) => ALLOWED_MESSAGES.some(({ pattern }) => pattern.test(text));
  const local = (url) => url.startsWith(origin);

  page.on('console', (message) => {
    if (message.type() === 'error' && !allowed(message.text())) {
      problems.push(`console error: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    if (!allowed(String(error.message))) {
      problems.push(`uncaught exception: ${error.message}`);
    }
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && local(response.url())) {
      problems.push(`HTTP ${response.status()}: ${response.url().replace(origin, '')}`);
    }
  });
  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText || '';
    // Aborted requests are navigations away or media the page cancelled itself
    if (local(request.url()) && !/abort|cancel/i.test(reason)) {
      problems.push(`request failed: ${request.url().replace(origin, '')} (${reason})`);
    }
  });
  return problems;
};

/**
 * Wait until a check returns true. Components animate and update state a
 * moment after the click, so outcomes are polled instead of read at once.
 * @param {() => Promise<boolean>} check - Resolves true once the outcome is reached
 * @param {string} message - What was expected, for the failure
 * @param {number} [timeout] - Milliseconds to keep trying
 * @returns {Promise<void>}
 */
export const eventually = async (check, message, timeout = 4000) => {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await check()) {
      return;
    }
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting: ${message}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};
