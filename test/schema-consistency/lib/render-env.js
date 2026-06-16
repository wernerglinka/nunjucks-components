/**
 * @fileoverview Nunjucks render environment for the render-based integration
 * test (invariant D). Mirrors how the real build configures the engine
 * (see metalsmith.js): a FileSystemLoader rooted at `lib/layouts` so component
 * `{% from %}`/`{% include %}` paths resolve, every custom filter registered,
 * and the same global `data` tree the build assembles from `lib/data/*.json`.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import nunjucks from 'nunjucks';
import * as filters from '../../../nunjucks-filters/index.js';
import { projectRoot } from './manifest-schema.js';

/**
 * Recursively load `lib/data/*.json` into a nested object, exactly as the build
 * does (`site.json` -> `data.site`, `maps/foo.json` -> `data.maps.foo`).
 * @param {string} dir
 * @returns {object}
 */
function loadData(dir) {
  const out = {};
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out[entry] = loadData(full);
    } else if (entry.endsWith('.json')) {
      out[entry.replace('.json', '')] = JSON.parse(readFileSync(full, 'utf8'));
    }
  }
  return out;
}

/**
 * Build a configured Nunjucks environment and the global `data` tree.
 * @returns {{env: import('nunjucks').Environment, data: object}}
 */
export function createRenderEnvironment() {
  const data = loadData(join(projectRoot, 'lib/data'));
  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(join(projectRoot, 'lib/layouts'), { noCache: true }),
    { autoescape: true, throwOnUndefined: false }
  );
  for (const [name, fn] of Object.entries(filters)) {
    if (typeof fn === 'function') {
      env.addFilter(name, fn);
    }
  }
  return { env, data };
}

/**
 * The per-render context. Section templates read `section` plus a handful of
 * page-level globals that the sections renderer supplies; we provide benign
 * stand-ins so a template never throws on a missing global.
 * @param {object} section - The section instance to render.
 * @param {object} data - Global data tree.
 * @returns {object}
 */
export function renderContext(section, data) {
  return {
    section,
    data,
    site: data.site,
    lang: 'en',
    collections: {},
    collection: {},
    urlPath: '/',
    crumbs: [],
    params: section
  };
}

/**
 * Tokens that signal a representation mismatch leaked into the output: a number
 * field fed a string (NaN), a group rendered where a scalar was expected
 * ([object Object]), or a path the template reads that nothing supplies
 * (undefined).
 * @type {string[]}
 */
export const BAD_TOKENS = ['NaN', '[object Object]', 'undefined'];

/**
 * @param {string} html
 * @returns {string[]} Which bad tokens appear in the rendered output.
 */
export function findBadTokens(html) {
  return BAD_TOKENS.filter((token) => html.includes(token));
}

/** Path (relative to the loader root) of a section's template. */
export function sectionTemplate(name) {
  return `components/sections/${name}/${name}.njk`;
}
