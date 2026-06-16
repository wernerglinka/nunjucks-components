/**
 * @fileoverview Invariant F: dynamic-options `source` fields are well-formed and
 * actually resolvable.
 *
 * Some `select`/`multiselect` fields can't use a static `enum` because their
 * valid values are the SITE's data, known only at build time (which author,
 * which collection). Those declare a `source` instead, which the bundler passes
 * into components-schema.json verbatim and a downstream editor resolves at
 * runtime against a site-data artifact. Two forms exist:
 *
 *   { "widget": "select", "source": { "data": "author", "valueKey": "name" } }
 *   { "widget": "select", "source": { "collections": true } }
 *
 * (`source` here is a PROPERTY of a select leaf; not to be confused with a field
 * literally named "source", e.g. accordion's `faqs.source` text input.)
 *
 * This suite holds the convention to the same standard as the static checks:
 *   1. A select/multiselect is well-formed with EXACTLY ONE of `enum` or
 *      `source` - never both (a source-backed picker with a stale static enum),
 *      never neither (no way to populate options).
 *   2. The `source` shape is valid: a `data` namespace string with optional
 *      `valueKey`/`labelKey`, OR `collections: true`; exactly one of the two.
 *   3. The source resolves against the library's real build inputs (the oracle):
 *      a `data` namespace is a `lib/data/<name>.json` array whose entries all
 *      carry the value/label key; `collections: true` needs the build's
 *      collections() config to define at least one collection.
 *   4. A non-empty default is an actual option the source yields, and the
 *      matching `validation` entry stays open (`type: string`) rather than
 *      re-introducing a static enum.
 *
 * Template alignment is unchanged: the template still reads the stored value the
 * same way (blog-author matches `section.name` against `data.author`; collection
 * sections read `collections[section.collectionName]`). Only the fields/
 * validation expectations shift, which is what this file encodes.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  listSections,
  resolveManifestFields,
  walkLeaves,
  isSourceLeaf,
  loadDataNamespace,
  collectionNames
} from './lib/manifest-schema.js';

const sectionsWithFields = listSections().filter((s) => s.manifest.fields);

/** The build's configured collection names, resolved once. */
const COLLECTIONS = collectionNames();

/**
 * Resolve the set of values a source would yield, for default-membership checks.
 * @param {object} source
 * @returns {string[]} Resolved option values (empty if unresolvable).
 */
function resolveSourceValues(source) {
  if (source.collections === true) {
    return COLLECTIONS;
  }
  const data = loadDataNamespace(source.data);
  if (!Array.isArray(data)) {
    return [];
  }
  const valueKey = source.valueKey || 'name';
  return data.map((entry) => entry?.[valueKey]).filter((v) => typeof v === 'string');
}

test('F1: every select/multiselect has exactly one of enum or source', async (t) => {
  for (const section of sectionsWithFields) {
    await t.test(section.name, () => {
      const tree = resolveManifestFields(section.manifest);
      const problems = [];
      walkLeaves(tree, (path, leaf) => {
        if (leaf.widget !== 'select' && leaf.widget !== 'multiselect') {
          return;
        }
        const hasEnum = Array.isArray(leaf.enum);
        const hasSource = isSourceLeaf(leaf);
        if (hasEnum && hasSource) {
          problems.push(`${path}: ${leaf.widget} declares BOTH a static enum and a source (remove the enum)`);
        } else if (!hasEnum && !hasSource) {
          problems.push(`${path}: ${leaf.widget} has neither enum nor source (no way to populate options)`);
        }
      });
      assert.deepEqual(problems, [], `${section.name}:\n  ${problems.join('\n  ')}`);
    });
  }
});

test('F2: source shape is valid', async (t) => {
  for (const section of sectionsWithFields) {
    const tree = resolveManifestFields(section.manifest);
    const sources = [];
    walkLeaves(tree, (path, leaf) => {
      if (isSourceLeaf(leaf)) {
        sources.push({ path, source: leaf.source });
      }
    });
    if (sources.length === 0) {
      continue;
    }
    await t.test(section.name, () => {
      for (const { path, source } of sources) {
        const hasData = 'data' in source;
        const hasCollections = 'collections' in source;
        assert.ok(hasData !== hasCollections, `${path}: source must have exactly one of "data" or "collections"`);
        if (hasData) {
          assert.equal(typeof source.data, 'string', `${path}: source.data must be a namespace string`);
          assert.ok(source.data.length > 0, `${path}: source.data must be non-empty`);
          if ('valueKey' in source) {
            assert.equal(typeof source.valueKey, 'string', `${path}: source.valueKey must be a string`);
          }
          if ('labelKey' in source) {
            assert.equal(typeof source.labelKey, 'string', `${path}: source.labelKey must be a string`);
          }
        } else {
          assert.equal(source.collections, true, `${path}: source.collections must be the literal true`);
        }
      }
    });
  }
});

test('F3: source resolves against the real data/collections oracle', async (t) => {
  for (const section of sectionsWithFields) {
    const tree = resolveManifestFields(section.manifest);
    const sources = [];
    walkLeaves(tree, (path, leaf) => {
      if (isSourceLeaf(leaf)) {
        sources.push({ path, source: leaf.source });
      }
    });
    if (sources.length === 0) {
      continue;
    }
    await t.test(section.name, () => {
      for (const { path, source } of sources) {
        if (source.collections === true) {
          assert.ok(
            COLLECTIONS.length > 0,
            `${path}: source.collections is true but the build configures no collections`
          );
          continue;
        }
        const data = loadDataNamespace(source.data);
        assert.notEqual(data, undefined, `${path}: no lib/data/${source.data}.json for source.data "${source.data}"`);
        assert.ok(Array.isArray(data), `${path}: data namespace "${source.data}" must be an array to back a picker`);
        const valueKey = source.valueKey || 'name';
        const labelKey = source.labelKey || valueKey;
        data.forEach((entry, i) => {
          assert.ok(
            entry && typeof entry === 'object' && valueKey in entry,
            `${path}: ${source.data}[${i}] is missing valueKey "${valueKey}"`
          );
          assert.ok(entry && labelKey in entry, `${path}: ${source.data}[${i}] is missing labelKey "${labelKey}"`);
        });
      }
    });
  }
});

test('F4: source-backed default is a real option and validation stays open', async (t) => {
  for (const section of sectionsWithFields) {
    const tree = resolveManifestFields(section.manifest);
    const validationProps = section.manifest.validation?.properties || {};
    const sources = [];
    walkLeaves(tree, (path, leaf) => {
      if (isSourceLeaf(leaf)) {
        sources.push({ path, leaf });
      }
    });
    if (sources.length === 0) {
      continue;
    }
    await t.test(section.name, () => {
      for (const { path, leaf } of sources) {
        // Default, when set, must be an option the source actually yields.
        const values = resolveSourceValues(leaf.source);
        const defaults = Array.isArray(leaf.default) ? leaf.default : leaf.default ? [leaf.default] : [];
        for (const value of defaults) {
          assert.ok(
            values.includes(value),
            `${path}: default "${value}" is not among the source's resolved options [${values.join(', ')}]`
          );
        }
        // Validation must not re-introduce a static enum for a dynamic field.
        const rule = validationProps[path];
        if (rule) {
          assert.ok(
            !rule.enum && !rule.items?.enum,
            `${path}: validation declares a static enum for a source-backed field (should be open type:string)`
          );
        }
      }
    });
  }
});
