/**
 * @fileoverview Manifest schema helpers shared by the schema-consistency tests.
 *
 * A section component declares its data shape several times over (template,
 * `validation` block, `fields` block, example `.yml`). These helpers load and
 * normalise those representations so the test files can assert they agree.
 *
 * Both halves of the composition are the library's own code, not copies:
 *   - The `validation` block validator is reused via ./validator.js.
 *   - The `fields` block resolver is the bundler's `schema-emitter`, the exact
 *     module that emits `build/assets/components-schema.json` for the downstream
 *     editor. We call its `resolveFields` so the tests compose `$use`/`$extends`
 *     identically to the shipped artifact, then layer test-only helpers on top
 *     (materialise defaults, walk paths). Imported by file path because the
 *     plugin's package `exports` only publishes its plugin entry.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { resolveFields as canonicalResolveFields } from '../../../node_modules/metalsmith-bundled-components/src/utils/schema-emitter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Project root (three levels up from test/schema-consistency/lib). */
export const projectRoot = join(__dirname, '..', '..', '..');

const COMPONENTS_DIR = join(projectRoot, 'lib/layouts/components');
const SECTIONS_DIR = join(COMPONENTS_DIR, 'sections');
const PARTIALS_DIR = join(COMPONENTS_DIR, '_partials');

/**
 * Top-level keys that every section instance carries for structural/build
 * reasons rather than as authorable content. They are produced by the build
 * pipeline or page scaffolding, not by the form schema, so the fields block is
 * not expected to declare them.
 * @type {Set<string>}
 */
export const STRUCTURAL_KEYS = new Set(['sectionType', 'containerTag', 'classes', 'id']);

/**
 * Keys an example instance may carry that are injected by the build pipeline or
 * a runtime plugin rather than authored through the form schema. The example
 * key coverage check (drift #6 guard) treats these as covered. Keyed by
 * section name; values are dotted-path prefixes (a prefix covers itself and any
 * descendant). Keep this list short and justified: every entry is a documented
 * escape hatch, not a place to hide real drift.
 * @type {Object<string, string[]>}
 */
export const RUNTIME_KEY_ALLOWLIST = {
  // metalsmith-sectioned-blog-pagination fills pagingParams at build time; the
  // example declares the empty shape with a "filled by the plugin" comment.
  'collection-list': ['pagingParams', 'hasPagingParams']
};

/**
 * Sections that render from site-level data (collections, author records,
 * external feeds) and therefore produce little or no output when rendered with
 * only their own defaults. The render test asserts these merely render without
 * throwing, and skips the "no empty-value tokens" scan that would otherwise
 * false-positive on their intentionally-empty output.
 * @type {Set<string>}
 */
export const DATA_DRIVEN_SECTIONS = new Set([
  'blog-author',
  'collection-list',
  'collection-links',
  'related-posts',
  'logos-list',
  'maps'
]);

/**
 * A field "leaf" is any fields node that carries a `widget` property. Anything
 * else that is a plain object is a "group" (a nested set of fields).
 * @param {*} node
 * @returns {boolean}
 */
export function isLeaf(node) {
  return Boolean(node) && typeof node === 'object' && !Array.isArray(node) && typeof node.widget === 'string';
}

/**
 * @param {*} node
 * @returns {boolean} Whether node is a plain (non-array) object.
 */
function isPlainObject(node) {
  return Boolean(node) && typeof node === 'object' && !Array.isArray(node);
}

/**
 * Load and parse a component manifest by directory path.
 * @param {string} dir - Absolute path to the component directory.
 * @returns {object} Parsed manifest.json.
 */
export function readManifest(dir) {
  return JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
}

/**
 * List every section that ships a manifest.json, as `{ name, dir, manifest }`.
 * Abstract helpers (commons) and structural-only components are included; the
 * test files decide which to skip.
 * @returns {Array<{name: string, dir: string, manifest: object}>}
 */
export function listSections() {
  return readdirSync(SECTIONS_DIR)
    .filter((name) => existsSync(join(SECTIONS_DIR, name, 'manifest.json')))
    .map((name) => ({ name, dir: join(SECTIONS_DIR, name), manifest: readManifest(join(SECTIONS_DIR, name)) }));
}

/**
 * Build a Map of every component (partials and sections) keyed by name, the
 * shape the bundler's `resolveFields` expects. Each entry is the parsed
 * manifest; `$use`/`$extends` reference these by name to pull in their `fields`.
 * @returns {Map<string, object>}
 */
function buildComponentMap() {
  const map = new Map();
  for (const base of [PARTIALS_DIR, SECTIONS_DIR]) {
    for (const name of readdirSync(base)) {
      const manifestPath = join(base, name, 'manifest.json');
      if (existsSync(manifestPath)) {
        map.set(name, JSON.parse(readFileSync(manifestPath, 'utf8')));
      }
    }
  }
  return map;
}

/** Lazily-built, reused across resolutions within a test run. */
let componentMapCache = null;
function componentMap() {
  if (!componentMapCache) {
    componentMapCache = buildComponentMap();
  }
  return componentMapCache;
}

/**
 * Resolve a manifest's top-level `fields` block using the bundler's own
 * schema-emitter (`resolveFields`). The result is identical to the per-section
 * tree in `build/assets/components-schema.json`, so the tests check the very
 * thing the downstream editor consumes rather than a reimplementation.
 * @param {object} manifest
 * @returns {object} Resolved field tree (empty object if no fields).
 */
export function resolveManifestFields(manifest) {
  if (!isPlainObject(manifest.fields)) {
    return {};
  }
  return canonicalResolveFields(manifest.fields, componentMap());
}

/**
 * Load the example instance shipped alongside a component (`<name>.yml`). The
 * file is a YAML list with a single section object (the demo-site snippet).
 * @param {string} dir - Component directory.
 * @param {string} name - Component name.
 * @returns {object|null} The section object, or null if there is no example.
 */
export function loadExample(dir, name) {
  const ymlPath = join(dir, `${name}.yml`);
  if (!existsSync(ymlPath)) {
    return null;
  }
  const doc = yaml.load(readFileSync(ymlPath, 'utf8'));
  return Array.isArray(doc) ? doc[0] : doc;
}

/**
 * Flatten an instance object to the set of dotted paths it sets. Object nodes
 * contribute their own path and recurse; arrays terminate a path (their element
 * shape is not enumerated).
 * @param {object} obj
 * @param {string} [prefix]
 * @param {Set<string>} [out]
 * @returns {Set<string>} Dotted paths present in the instance.
 */
export function flattenInstanceKeys(obj, prefix = '', out = new Set()) {
  if (!isPlainObject(obj)) {
    return out;
  }
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    out.add(path);
    if (isPlainObject(value)) {
      flattenInstanceKeys(value, path, out);
    }
  }
  return out;
}

/**
 * Whether an instance key is on the runtime/build allowlist for a section.
 * @param {string} sectionName
 * @param {string} dottedKey
 * @returns {boolean}
 */
export function isRuntimeKey(sectionName, dottedKey) {
  const prefixes = RUNTIME_KEY_ALLOWLIST[sectionName] || [];
  return prefixes.some((p) => dottedKey === p || dottedKey.startsWith(`${p}.`));
}

/**
 * Walk a resolved field tree to a dotted path and classify what is there.
 * Used to compare a validation property path against the form schema.
 *
 * @param {object} tree - Resolved field tree.
 * @param {string} dottedPath - e.g. "artworkProperties.dimensions".
 * @returns {{kind: 'leaf'|'group'|'leaf-too-shallow'|'absent', node: *}}
 *   - `leaf`: path ends on a widget leaf.
 *   - `group`: path ends on a nested group (object expected here).
 *   - `leaf-too-shallow`: a widget leaf was found before the path was consumed,
 *     i.e. the form treats as a single field something the validation drills
 *     into (the artwork-dimensions class of drift).
 *   - `absent`: nothing at that path.
 */
export function lookupPath(tree, dottedPath) {
  const segments = dottedPath.split('.');
  let node = tree;
  for (let i = 0; i < segments.length; i++) {
    if (isLeaf(node)) {
      return { kind: 'leaf-too-shallow', node };
    }
    if (!isPlainObject(node) || !(segments[i] in node)) {
      return { kind: 'absent', node: undefined };
    }
    node = node[segments[i]];
  }
  if (isLeaf(node)) {
    return { kind: 'leaf', node };
  }
  if (isPlainObject(node)) {
    return { kind: 'group', node };
  }
  return { kind: 'absent', node };
}

/**
 * Materialise a defaults object from a resolved field tree: the data a fresh
 * authoring form would emit before the user types anything. Leaves contribute
 * their declared `default`; groups recurse; array widgets contribute `[]`.
 *
 * @param {object} tree - Resolved field tree.
 * @returns {object} Nested defaults object.
 */
export function materializeDefaults(tree) {
  const out = {};
  for (const [key, value] of Object.entries(tree)) {
    if (isLeaf(value)) {
      out[key] = leafDefault(value);
    } else if (isPlainObject(value)) {
      out[key] = materializeDefaults(value);
    }
  }
  return out;
}

/**
 * Pick the default value a single leaf would emit.
 * @param {object} leaf
 * @returns {*}
 */
function leafDefault(leaf) {
  if (leaf.widget === 'array') {
    return Array.isArray(leaf.default) ? leaf.default : [];
  }
  if (leaf.widget === 'multiselect') {
    return Array.isArray(leaf.default) ? leaf.default : [];
  }
  if ('default' in leaf) {
    return leaf.default;
  }
  if (leaf.widget === 'checkbox') {
    return false;
  }
  return '';
}

/**
 * Collect every authorable dotted path a resolved field tree exposes. Group
 * nodes contribute their own path AND their descendants' paths, so a validation
 * path that lands on a group (object) is still considered covered. Array/leaf
 * nodes terminate a path (their internal item shape is not flattened here).
 *
 * @param {object} tree - Resolved field tree.
 * @param {string} [prefix]
 * @returns {Set<string>} Dotted paths.
 */
export function collectFieldPaths(tree, prefix = '') {
  const paths = new Set();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    paths.add(path);
    if (!isLeaf(value) && isPlainObject(value)) {
      for (const child of collectFieldPaths(value, path)) {
        paths.add(child);
      }
    }
  }
  return paths;
}

const DATA_DIR = join(projectRoot, 'lib/data');
const METALSMITH_CONFIG = join(projectRoot, 'metalsmith.js');

/**
 * Whether a leaf carries the dynamic-options `source` convention: a `select`
 * or `multiselect` whose valid values come from the site's build-time data
 * rather than a static `enum`. The value is `{ data, valueKey?, labelKey? }`
 * or `{ collections: true }`.
 *
 * Distinct from a field literally NAMED "source" (e.g. accordion's
 * `faqs.source` text input) - that is a widget leaf, not a `source` property.
 * @param {*} node
 * @returns {boolean}
 */
export function isSourceLeaf(node) {
  return isLeaf(node) && isPlainObject(node.source) && ('data' in node.source || 'collections' in node.source);
}

/**
 * Visit every leaf in a resolved field tree, depth-first. `insideArray` is true
 * for leaves under an array widget's `items`.
 * @param {object} tree
 * @param {(path: string, leaf: object, insideArray: boolean) => void} visit
 * @param {string} [prefix]
 * @param {boolean} [insideArray]
 */
export function walkLeaves(tree, visit, prefix = '', insideArray = false) {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isLeaf(value)) {
      visit(path, value, insideArray);
      if (isPlainObject(value.items)) {
        walkLeaves(value.items, visit, `${path}[]`, true);
      }
    } else if (isPlainObject(value)) {
      walkLeaves(value, visit, path, insideArray);
    }
  }
}

/**
 * Load the parsed contents of a `lib/data/<name>.json` namespace - the same
 * file the build loads into `metadata.data.<name>`. Returns undefined when the
 * namespace does not exist.
 * @param {string} name
 * @returns {*} Parsed JSON, or undefined.
 */
export function loadDataNamespace(name) {
  const file = join(DATA_DIR, `${name}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined;
}

/**
 * Extract the collection names configured in the build by reading the
 * `collections({ ... })` call in metalsmith.js. This is the source of truth a
 * `source: { collections: true }` picker resolves against. Parsed by walking
 * brace depth so nested option objects (pattern/sort) are not mistaken for
 * collection names.
 * @returns {string[]}
 */
export function collectionNames() {
  const src = readFileSync(METALSMITH_CONFIG, 'utf8');
  const callIdx = src.indexOf('collections(');
  if (callIdx === -1) {
    return [];
  }
  const open = src.indexOf('{', callIdx);
  if (open === -1) {
    return [];
  }
  let depth = 0;
  let end = -1;
  for (let j = open; j < src.length; j++) {
    if (src[j] === '{') {
      depth++;
    } else if (src[j] === '}') {
      depth--;
      if (depth === 0) {
        end = j;
        break;
      }
    }
  }
  if (end === -1) {
    return [];
  }
  const body = src.slice(open + 1, end);
  const names = [];
  let d = 0;
  let j = 0;
  while (j < body.length) {
    const c = body[j];
    if (c === '{' || c === '[' || c === '(') {
      d++;
    } else if (c === '}' || c === ']' || c === ')') {
      d--;
    } else if (d === 0 && /[A-Za-z_$]/.test(c)) {
      let k = j;
      while (k < body.length && /[\w$]/.test(body[k])) {
        k++;
      }
      const ident = body.slice(j, k);
      let m = k;
      while (m < body.length && /\s/.test(body[m])) {
        m++;
      }
      if (body[m] === ':') {
        names.push(ident);
      }
      j = k;
      continue;
    }
    j++;
  }
  return [...new Set(names)];
}
