/**
 * Toggle optional shell features (language switcher, theme switcher, ...) on or off.
 *
 * Optional chrome lives in `lib/layouts/pages/parts/` and `lib/assets/styles/` but is
 * inert until wired in. Wiring a feature means adding three tagged lines: a macro import
 * and a call in the header, an `@import` in `main.css`, and an `import` in `main.js`.
 * Each line is inserted after a fixed anchor and tagged with `feature:<name>` so it can be
 * found and removed again. Enabling is idempotent; disabling removes every tagged line.
 *
 * Usage:
 *   node scripts/toggle-feature.mjs status
 *   node scripts/toggle-feature.mjs enable language-switcher [more...]
 *   node scripts/toggle-feature.mjs disable dark-light-theme-switcher [more...]
 *
 * The feature registry is `scripts/features.json`. Adding a feature there makes it
 * toggleable without changing this script.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '..');

/** Files the toggler edits, relative to the repo root. */
const targetFiles = {
  header: 'lib/layouts/pages/parts/header.njk',
  css: 'lib/assets/main.css',
  js: 'lib/assets/main.js'
};

/**
 * Escape a string for safe use inside a regular expression.
 * @param {string} value - Raw string that may contain regex metacharacters
 * @returns {string} Escaped string
 */
const escapeForRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Build the regex that matches a feature tag without matching longer feature names.
 * @param {string} featureName - Feature key, e.g. "language-switcher"
 * @returns {RegExp} Regex matching `feature:<name>` at a name boundary
 */
const featureTagRegExp = (featureName) => new RegExp(`feature:${escapeForRegExp(featureName)}(?![\\w-])`);

/**
 * Describe the tagged lines a feature contributes to each file.
 * @param {string} featureName - Feature key
 * @param {object} feature - Feature definition from the registry
 * @returns {Array<{file: string, anchor: string, line: string}>} Edit descriptors
 */
const featureEdits = (featureName, feature) => [
  {
    file: 'header',
    anchor: '{# feature-imports #}',
    line: `{% from "${feature.template}" import ${feature.macro} %} {# feature:${featureName} #}`
  },
  {
    file: 'header',
    anchor: '{# feature-slot:misc #}',
    line: `${feature.call} {# feature:${featureName} #}`
  },
  {
    file: 'css',
    anchor: '/* feature-styles */',
    line: `@import url('${feature.css}'); /* feature:${featureName} */`
  },
  {
    file: 'js',
    anchor: '// feature-scripts',
    line: `import '${feature.js}'; // feature:${featureName}`
  }
];

/**
 * Insert a line immediately after the anchor line, matching the anchor's indentation.
 * Returns the content unchanged (and inserted: false) if the exact line already exists
 * or the anchor cannot be found.
 * @param {string} content - File content
 * @param {string} anchor - Anchor substring to insert after
 * @param {string} line - Line to insert (without indentation)
 * @returns {{content: string, inserted: boolean, missingAnchor: boolean}} Result
 */
const insertAfterAnchor = (content, anchor, line) => {
  const lines = content.split('\n');

  if (lines.some((existing) => existing.trim() === line.trim())) {
    return { content, inserted: false, missingAnchor: false };
  }

  const anchorIndex = lines.findIndex((existing) => existing.includes(anchor));
  if (anchorIndex === -1) {
    return { content, inserted: false, missingAnchor: true };
  }

  const indentation = lines[anchorIndex].match(/^\s*/)[0];
  const updated = [...lines.slice(0, anchorIndex + 1), `${indentation}${line}`, ...lines.slice(anchorIndex + 1)];
  return { content: updated.join('\n'), inserted: true, missingAnchor: false };
};

/**
 * Remove every line carrying the given feature tag.
 * @param {string} content - File content
 * @param {string} featureName - Feature key
 * @returns {{content: string, removed: number}} Result with removed line count
 */
const removeTaggedLines = (content, featureName) => {
  const tag = featureTagRegExp(featureName);
  const lines = content.split('\n');
  const kept = lines.filter((existing) => !tag.test(existing));
  return { content: kept.join('\n'), removed: lines.length - kept.length };
};

/**
 * Read a target file from disk.
 * @param {string} key - Key in `targetFiles`
 * @returns {string} File content
 */
const readTarget = (key) => fs.readFileSync(path.join(repoRoot, targetFiles[key]), 'utf8');

/**
 * Write a target file to disk only when its content changed.
 * @param {string} key - Key in `targetFiles`
 * @param {string} before - Original content
 * @param {string} after - New content
 * @returns {boolean} Whether the file was written
 */
const writeTargetIfChanged = (key, before, after) => {
  if (before === after) {
    return false;
  }
  fs.writeFileSync(path.join(repoRoot, targetFiles[key]), after);
  return true;
};

/**
 * Load the feature registry.
 * @returns {Object<string, object>} Registry keyed by feature name
 */
const loadRegistry = () => JSON.parse(fs.readFileSync(path.join(scriptDirectory, 'features.json'), 'utf8'));

/**
 * Enable a single feature by inserting its tagged lines.
 * @param {string} featureName - Feature key
 * @param {object} feature - Feature definition
 * @returns {string[]} Human-readable log of actions taken
 */
const enableFeature = (featureName, feature) => {
  const log = [];
  const edits = featureEdits(featureName, feature);
  const byFile = new Map();

  edits.forEach((edit) => {
    const current = byFile.get(edit.file) ?? readTarget(edit.file);
    const result = insertAfterAnchor(current, edit.anchor, edit.line);
    if (result.missingAnchor) {
      log.push(`  ! anchor "${edit.anchor}" not found in ${targetFiles[edit.file]}`);
      return;
    }
    byFile.set(edit.file, result.content);
    log.push(result.inserted ? `  + ${targetFiles[edit.file]}` : `  = ${targetFiles[edit.file]} (already present)`);
  });

  byFile.forEach((after, file) => writeTargetIfChanged(file, readTarget(file), after));
  return log;
};

/**
 * Disable a single feature by removing its tagged lines from every target file.
 * @param {string} featureName - Feature key
 * @returns {string[]} Human-readable log of actions taken
 */
const disableFeature = (featureName) => {
  const log = [];
  Object.keys(targetFiles).forEach((file) => {
    const before = readTarget(file);
    const { content, removed } = removeTaggedLines(before, featureName);
    if (writeTargetIfChanged(file, before, content)) {
      log.push(`  - ${targetFiles[file]} (${removed} line${removed === 1 ? '' : 's'})`);
    }
  });
  return log.length ? log : ['  = nothing to remove'];
};

/**
 * Report which features are currently wired into the header.
 * @param {Object<string, object>} registry - Feature registry
 * @returns {string[]} Status lines
 */
const featureStatus = (registry) => {
  const header = readTarget('header');
  return Object.entries(registry).map(([name, feature]) => {
    const enabled = featureTagRegExp(name).test(header);
    return `  [${enabled ? 'x' : ' '}] ${name} — ${feature.label}`;
  });
};

/**
 * Entry point. Parses argv and dispatches to the chosen command.
 * @returns {void}
 */
const main = () => {
  const [command, ...featureNames] = process.argv.slice(2);
  const registry = loadRegistry();

  if (command === 'status' || !command) {
    /* eslint-disable-next-line no-console */
    console.log(['Shell features:', ...featureStatus(registry)].join('\n'));
    return;
  }

  if (command !== 'enable' && command !== 'disable') {
    throw new Error(`Unknown command "${command}". Use: status | enable <feature...> | disable <feature...>`);
  }

  if (featureNames.length === 0) {
    throw new Error(`"${command}" needs at least one feature name. Known: ${Object.keys(registry).join(', ')}`);
  }

  featureNames.forEach((featureName) => {
    const feature = registry[featureName];
    if (!feature) {
      throw new Error(`Unknown feature "${featureName}". Known: ${Object.keys(registry).join(', ')}`);
    }
    const log = command === 'enable' ? enableFeature(featureName, feature) : disableFeature(featureName);
    /* eslint-disable-next-line no-console */
    console.log([`${command} ${featureName}:`, ...log].join('\n'));
  });
};

main();
