/**
 * @fileoverview Invariant G: the site's own page content stays on contract.
 *
 * A2 (example-validation.test.js) holds each component's example `.yml` to its
 * schema. The pages under `src/` are a second, much larger set of instances,
 * and nothing checked them: the slider reference page set `isTabs: true` for
 * years while the template read a different key, so the demo silently rendered
 * the wrong variant.
 *
 * This test applies the A2 rule to every section of every page: each
 * non-structural key a section sets must be authorable through the resolved
 * `fields`, declared in `validation`, or an allowed runtime key.
 *
 * Existing violations are recorded in `page-content-baseline.json` so the test
 * can gate new ones today. The baseline may only shrink: an entry that no
 * longer occurs fails the test until it is removed. Each entry is one of
 *   - a key the template reads but the schema never declared (fix the manifest),
 *   - a key nothing reads (remove it from the content).
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import * as yaml from 'js-yaml';

import {
  collectFieldPaths,
  flattenInstanceKeys,
  isRuntimeKey,
  listSections,
  projectRoot,
  resolveManifestFields,
  STRUCTURAL_KEYS
} from './lib/manifest-schema.js';

const baseline = JSON.parse(readFileSync(new URL('./page-content-baseline.json', import.meta.url), 'utf8'));

/**
 * List the markdown pages under a directory, recursively.
 * @param {string} dir - Absolute directory
 * @returns {string[]} Absolute file paths
 */
const listPages = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      return listPages(full);
    }
    return entry.name.endsWith('.md') ? [full] : [];
  });

/**
 * Read the sections array from a page's frontmatter.
 * @param {string} file - Absolute path of a markdown page
 * @returns {object[]} Section objects, empty when the page has none
 */
const readSections = (file) => {
  const match = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const frontmatter = match ? yaml.load(match[1]) : null;
  return Array.isArray(frontmatter?.sections) ? frontmatter.sections : [];
};

/**
 * True when `key` or one of its ancestors is in `paths`.
 * @param {string} key - Dotted path
 * @param {Set<string>} paths - Declared paths
 * @returns {boolean}
 */
const pathOrAncestorIn = (key, paths) => {
  const segments = key.split('.');
  return segments.some((_, index) => paths.has(segments.slice(0, index + 1).join('.')));
};

/** Declared paths per section type, resolved once. */
const contracts = new Map(
  listSections().map((section) => [
    section.name,
    {
      fieldPaths: collectFieldPaths(resolveManifestFields(section.manifest)),
      validationPaths: new Set(Object.keys(section.manifest.validation?.properties || {}))
    }
  ])
);

/** "sectionType: key" -> first page that sets it. */
const offContract = new Map();
const unknownTypes = new Map();

for (const file of listPages(join(projectRoot, 'src'))) {
  const page = relative(projectRoot, file);
  for (const section of readSections(file)) {
    const contract = contracts.get(section.sectionType);
    if (!contract) {
      unknownTypes.set(String(section.sectionType), page);
      continue;
    }
    for (const key of flattenInstanceKeys(section)) {
      if (STRUCTURAL_KEYS.has(key.split('.')[0]) || isRuntimeKey(section.sectionType, key)) {
        continue;
      }
      if (pathOrAncestorIn(key, contract.fieldPaths) || pathOrAncestorIn(key, contract.validationPaths)) {
        continue;
      }
      const id = `${section.sectionType}: ${key}`;
      if (!offContract.has(id)) {
        offContract.set(id, page);
      }
    }
  }
}

test('G: every section on a page names a component that exists', () => {
  assert.deepEqual([...unknownTypes], [], 'pages use sectionType values no component provides');
});

test('G: page content sets no key outside its component contract, beyond the baseline', () => {
  const fresh = [...offContract].filter(([id]) => !baseline.known.includes(id));
  assert.deepEqual(
    fresh.map(([id, page]) => `${id} (first seen in ${page})`),
    [],
    'page content sets keys that no fields/validation entry covers: declare them in the manifest or remove them from the page'
  );
});

test('G: the baseline lists only violations that still occur', () => {
  const stale = baseline.known.filter((id) => !offContract.has(id));
  assert.deepEqual(stale, [], 'these baseline entries are fixed; remove them from page-content-baseline.json');
});
