#!/usr/bin/env node

/**
 * Canon-side component lint.
 *
 * Guards the contracts that fail silently at build time:
 *
 * A. Layer safety — a component stylesheet that begins with @import or
 *    @charset is emitted unwrapped by metalsmith-bundled-components and
 *    silently loses cascade-layer precedence in every consuming site.
 * B. Property prefix — a custom property defined in a component stylesheet
 *    must be prefixed with the component's own name
 *    (`--<component>-<property>`). The prefix is what makes the design API
 *    auditable. `--threshold` is the shared switcher-layout convention from
 *    commons and is exempt everywhere; vendor-interface properties (values
 *    a third-party stylesheet consumes) are exempt per component below.
 * C. Undefined tokens — `var(--x)` where `--x` is defined nowhere (not in
 *    the same component, not in the token vocabulary, not by a component in
 *    the consumer's transitive `requires` closure, not by a vendor
 *    stylesheet) is dropped at computed-value time and silently does not
 *    apply on any site. With an inline fallback it renders but cannot be
 *    retuned, which is reported as a warning. Definitions from unrelated
 *    components do not count: a site can install the consumer without them.
 * D. Schema default drift — where a manifest declares the same path in both
 *    `fields` (editor schema) and `validation.properties` (build contract)
 *    with a `default`, the two defaults must agree, or authors see one
 *    default and the build enforces another.
 * E. Placeholder links — a link with `href="#"` (or the icon partial called
 *    with `url: "#"`), or an `<a role="button">`, is a button in disguise.
 *    It scrolls the page to the top when clicked (SWUP treats it as a
 *    same-page visit even when the click handler prevents the default) and
 *    nests an interactive element when placed inside a real button.
 * F. Styling dependencies — some components style a bare element for the
 *    whole page (button styles every `<button>`). A component that emits
 *    that element must have the styling component in its `requires` closure:
 *    the closure decides cascade-layer order, so without it the component's
 *    own resets can lose to the global look, and a site can install the
 *    component without the styles it was designed against.
 * G. Focus indicators — `outline: none` needs a comment on the same line
 *    saying where the focus ring lives instead, and an outline must be set
 *    on `:focus-visible`, never on plain `:focus`, where it also appears on
 *    mouse clicks.
 *
 * E and G also cover the page shell (lib/layouts/pages, lib/shell/styles),
 * reported under the name "shell". They are skipped with --vocab, which
 * lints against another site's vocabulary rather than this site's shell.
 *
 * Advisory posture: errors exit 1, warnings exit 0. Run with --strict to
 * fail on warnings too. Run with --vocab <dir> to lint against a different
 * token vocabulary (e.g. the starter's lib/shell/styles) instead of this
 * repository's.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const COMPONENT_ROOTS = [
  'lib/layouts/components/_partials',
  'lib/layouts/components/sections'
];

/** Custom properties exempt from the prefix rule in every component. */
const GLOBAL_PREFIX_EXEMPT = new Set([
  '--threshold', // shared switcher-layout convention, declared by commons, set per section
  '--flow-space' // vertical-rhythm idiom: text consumes it, a container scopes its own value; the shared name is the mechanism
]);

/**
 * Per-component prefix exemptions: properties a third-party stylesheet
 * consumes, so the component has no choice about their names.
 */
const VENDOR_INTERFACE = {
  // podcast themes the Shikwasa player through the player's own properties
  podcast: /^--(color|shadow|background)-/
};

/**
 * Properties a component's own template sets as an inline style per
 * instance. They are component parameters, not vocabulary, and a CSS-only
 * scan cannot see the definition.
 */
const TEMPLATE_SET = {
  'logos-list': new Set(['--single-list-width'])
};

/** Vendor stylesheets whose property definitions count as "defined". */
/** Shell sources covered by the placeholder-link and focus checks. */
const SHELL_TEMPLATE_ROOT = 'lib/layouts/pages';
const SHELL_STYLE_ROOT = 'lib/shell/styles';

/** Generated or vendored files inside component directories; never linted. */
const SKIP_SOURCE = /(\.min\.js|icon-loader\.js)$/;

const VENDOR_CSS = [
  'node_modules/shikwasa/dist/style.css',
  'node_modules/leaflet/dist/leaflet.css',
  'node_modules/leaflet.markercluster/dist/MarkerCluster.css',
  'node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css',
  'node_modules/ol/ol.css'
];

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const vocabIndex = args.indexOf('--vocab');
const vocabDir = vocabIndex !== -1 ? args[vocabIndex + 1] : path.join(ROOT, 'lib/shell/styles');

/** Strip CSS comments so definitions inside them are not counted. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Collect every `--name:` definition in a CSS string. */
const collectDefinitions = (css) => {
  const defs = new Set();
  // The lookahead keeps selectors like `.event--all-day::before` from
  // reading as a `--all-day:` declaration.
  for (const match of stripComments(css).matchAll(/(--[a-z0-9-]+)\s*:(?!:)/gi) ?? []) {
    defs.add(match[1]);
  }
  return defs;
};

/** Collect every var(--name[, fallback]) consumption in a CSS string. */
const collectConsumptions = (css) => {
  const uses = [];
  const stripped = stripComments(css);
  const lines = stripped.split('\n');
  lines.forEach((line, i) => {
    for (const match of line.matchAll(/var\(\s*(--[a-z0-9-]+)\s*(,)?/gi)) {
      uses.push({ name: match[1], hasFallback: Boolean(match[2]), line: i + 1 });
    }
  });
  return uses;
};

/**
 * The vocabulary is exactly `_design-tokens.css` plus `_css-patterns.css`
 * (COMPONENT-PACKAGE-SPEC.md, "The Design Token Contract"). Other
 * stylesheets in the same directory are site shell, not vocabulary, and
 * must not widen what components may consume.
 */
const VOCAB_FILES = ['_design-tokens.css', '_css-patterns.css'];

/** Read the vocabulary stylesheets from a directory. */
const readVocab = (dir) => {
  let css = '';
  for (const name of VOCAB_FILES) {
    const full = path.join(dir, name);
    if (fs.existsSync(full)) {
      css += `\n${fs.readFileSync(full, 'utf8')}`;
    }
  }
  return css;
};

/** Walk a fields tree, yielding [dottedPath, leaf] for every leaf with a default. */
const walkFields = (node, prefix = '') => {
  const leaves = [];
  if (!node || typeof node !== 'object' || Array.isArray(node)) {
    return leaves;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$') || !value || typeof value !== 'object') {
      continue;
    }
    const dotted = prefix ? `${prefix}.${key}` : key;
    if (typeof value.widget === 'string') {
      if ('default' in value) {
        leaves.push([dotted, value]);
      }
      if (value.widget === 'array' && value.items) {
        leaves.push(...walkFields(value.items, dotted));
      }
    } else {
      leaves.push(...walkFields(value, dotted));
    }
  }
  return leaves;
};

/**
 * List files under a directory, recursively, with one of the given extensions.
 * @param {string} dir - Absolute directory
 * @param {string[]} extensions - e.g. ['.njk', '.js']
 * @returns {string[]} Absolute file paths
 */
const listFiles = (dir, extensions) => {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(full, extensions);
    }
    return extensions.includes(path.extname(entry.name)) && !SKIP_SOURCE.test(entry.name) ? [full] : [];
  });
};

/** 1-based line number of a character offset. */
const lineAt = (text, offset) => text.slice(0, offset).split('\n').length;

/** Blank out comments but keep every newline, so offsets and lines survive. */
const blankComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));

/**
 * Split a stylesheet into its rule blocks, nested ones included.
 * @param {string} css - Stylesheet source
 * @returns {Array<{selector: string, depth: number, declarations: Array<{property: string, value: string, line: number}>}>}
 */
const parseBlocks = (css) => {
  const text = blankComments(css);
  const blocks = [];
  const stack = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '{') {
      const block = { selector: text.slice(start, i).trim(), depth: stack.length, declarations: [] };
      blocks.push(block);
      stack.push(block);
      start = i + 1;
    } else if (char === ';' || char === '}') {
      const chunk = text.slice(start, i);
      const colon = chunk.indexOf(':');
      if (colon !== -1 && stack.length > 0) {
        const lead = chunk.length - chunk.trimStart().length;
        stack.at(-1).declarations.push({
          property: chunk.slice(0, colon).trim().toLowerCase(),
          value: chunk.slice(colon + 1).trim(),
          line: lineAt(text, start + lead)
        });
      }
      if (char === '}') {
        stack.pop();
      }
      start = i + 1;
    }
  }
  return blocks;
};

/** Split a selector list on its top-level commas. */
const selectorParts = (selector) => selector.split(/,(?![^()]*\))/).map((part) => part.trim());

const PLACEHOLDER_LINK = /href\s*=\s*(["'])#\1|\burl:\s*(["'])#\2|<a\b[^>]*\brole\s*=\s*(["'])button\3/g;

/**
 * E. Placeholder links in a template or script.
 * @param {string} source - File contents
 * @returns {Array<{line: number, match: string}>}
 */
const findPlaceholderLinks = (source) =>
  [...source.matchAll(PLACEHOLDER_LINK)].map((match) => ({
    line: lineAt(source, match.index),
    match: match[0].replace(/\s+/g, ' ').slice(0, 40)
  }));

/**
 * G. Focus-indicator problems in a stylesheet.
 * @param {string} css - Stylesheet source
 * @returns {Array<{line: number, message: string}>}
 */
const findFocusProblems = (css) => {
  const rawLines = css.split('\n');
  const problems = [];
  for (const block of parseBlocks(css)) {
    const outlines = block.declarations.filter((d) => d.property === 'outline' || d.property === 'outline-style');
    for (const declaration of outlines) {
      const removes = /^(none|0)\b/.test(declaration.value);
      if (removes && !rawLines[declaration.line - 1].includes('/*')) {
        problems.push({
          line: declaration.line,
          message: 'outline removed — add a comment on this line saying where the focus ring is shown instead, or restore it'
        });
      }
      const onPlainFocus = selectorParts(block.selector).some((part) => /:focus(?!-visible|-within)/.test(part));
      if (!removes && onPlainFocus) {
        problems.push({
          line: declaration.line,
          message: `outline set on :focus ("${block.selector.replace(/\s+/g, ' ')}") — use :focus-visible so it does not appear on mouse clicks`
        });
      }
    }
  }
  return problems;
};

/**
 * F. Elements a stylesheet styles for the whole page: top-level rules whose
 * selector is a bare element name.
 * @param {string} css - Stylesheet source
 * @returns {Set<string>} Element names
 */
const collectGlobalElements = (css) => {
  const elements = new Set();
  for (const block of parseBlocks(css)) {
    if (block.depth === 0 && !block.selector.startsWith('@')) {
      for (const part of selectorParts(block.selector)) {
        if (/^[a-z][a-z0-9]*$/.test(part)) {
          elements.add(part);
        }
      }
    }
  }
  return elements;
};

/**
 * F. Elements a template or script emits.
 * @param {string} source - File contents
 * @returns {Set<string>} Element names
 */
const collectEmittedElements = (source) =>
  new Set([
    ...[...source.matchAll(/<([a-z][a-z0-9]*)\b/g)].map((match) => match[1]),
    ...[...source.matchAll(/createElement\(\s*["']([a-z][a-z0-9]*)["']/g)].map((match) => match[1])
  ]);

// ---------------------------------------------------------------------------

const errors = [];
const warnings = [];

// Gather components: [{ name, dir, manifest, cssFiles }]
const components = [];
for (const rootRel of COMPONENT_ROOTS) {
  const rootAbs = path.join(ROOT, rootRel);
  for (const entry of fs.readdirSync(rootAbs, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const dir = path.join(rootAbs, entry.name);
    const manifestPath = path.join(dir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      continue;
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const cssFiles = (manifest.styles ?? [])
      .map((file) => path.join(dir, file))
      .filter((file) => fs.existsSync(file));
    const sourceFiles = listFiles(dir, ['.njk', '.js']);
    components.push({ name: entry.name, dir, manifest, cssFiles, sourceFiles });
  }
}

// Build the "defined" universe.
const vocabulary = collectDefinitions(readVocab(vocabDir));
const vendorDefined = new Set();
for (const rel of VENDOR_CSS) {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) {
    for (const def of collectDefinitions(fs.readFileSync(full, 'utf8'))) {
      vendorDefined.add(def);
    }
  }
}
const componentDefined = new Map(); // name -> Set of properties it defines
for (const component of components) {
  const defs = new Set();
  for (const file of component.cssFiles) {
    for (const def of collectDefinitions(fs.readFileSync(file, 'utf8'))) {
      defs.add(def);
    }
  }
  componentDefined.set(component.name, defs);
}
/**
 * Transitive `requires` closure of a component (including itself), per each
 * manifest's `requires` array. A visited set makes cycles terminate.
 */
const requiresOf = new Map(components.map((c) => [c.name, c.manifest.requires ?? []]));
const closureOf = (start) => {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length > 0) {
    for (const dep of requiresOf.get(queue.pop()) ?? []) {
      if (!seen.has(dep)) {
        seen.add(dep);
        queue.push(dep);
      }
    }
  }
  return seen;
};

// F. Which component styles which bare element for the whole page.
const elementOwners = new Map(); // element -> Set of component names
for (const component of components) {
  for (const file of component.cssFiles) {
    for (const element of collectGlobalElements(fs.readFileSync(file, 'utf8'))) {
      elementOwners.set(element, (elementOwners.get(element) ?? new Set()).add(component.name));
    }
  }
}

// Run checks per component.
for (const component of components) {
  const { name, cssFiles, sourceFiles, manifest } = component;
  const closure = closureOf(name);

  // E. Placeholder links, and F. styling dependencies.
  const emitted = new Set();
  for (const file of sourceFiles) {
    const rel = path.relative(ROOT, file);
    const source = fs.readFileSync(file, 'utf8');
    for (const found of findPlaceholderLinks(source)) {
      errors.push(`${rel}:${found.line}: placeholder link (${found.match}) — use a <button type="button">; a link to "#" scrolls the page to the top`);
    }
    for (const element of collectEmittedElements(source)) {
      emitted.add(element);
    }
  }
  for (const element of emitted) {
    for (const owner of elementOwners.get(element) ?? []) {
      if (!closure.has(owner)) {
        errors.push(
          `${name}/manifest.json: emits <${element}>, which "${owner}" styles for the whole page, but "${owner}" is not in its requires closure — layer order between the two is undefined`
        );
      }
    }
  }

  // Definitions visible to this component: its own plus those of every
  // component in its requires closure. Anything a site must co-install.
  const reachableDefs = new Set();
  for (const dep of closureOf(name)) {
    for (const def of componentDefined.get(dep) ?? []) {
      reachableDefs.add(def);
    }
  }

  for (const file of cssFiles) {
    const rel = path.relative(ROOT, file);
    const css = fs.readFileSync(file, 'utf8');

    // A. Layer safety: first significant token must not be @import/@charset.
    const head = stripComments(css).trimStart();
    if (/^@(import|charset)\b/.test(head)) {
      errors.push(`${rel}: starts with @${head.match(/^@(\w+)/)[1]} — will be emitted unwrapped and lose cascade-layer precedence`);
    }

    // G. Focus indicators.
    for (const problem of findFocusProblems(css)) {
      errors.push(`${rel}:${problem.line}: ${problem.message}`);
    }

    // B. Property prefix.
    for (const def of collectDefinitions(css)) {
      if (def.startsWith(`--${name}-`)) {
        continue;
      }
      if (GLOBAL_PREFIX_EXEMPT.has(def)) {
        continue;
      }
      if (VENDOR_INTERFACE[name]?.test(def)) {
        continue;
      }
      warnings.push(`${rel}: defines ${def} — component properties should be prefixed --${name}-`);
    }

    // C. Undefined tokens.
    for (const use of collectConsumptions(css)) {
      const known =
        reachableDefs.has(use.name) ||
        vocabulary.has(use.name) ||
        vendorDefined.has(use.name) ||
        TEMPLATE_SET[name]?.has(use.name);
      if (known) {
        continue;
      }
      if (use.hasFallback) {
        warnings.push(`${rel}:${use.line}: var(${use.name}, …) — token not defined by this component, its requires closure, or the vocabulary; the fallback is the only value there is`);
      } else {
        errors.push(`${rel}:${use.line}: var(${use.name}) — token not defined by this component, its requires closure, or the vocabulary; declaration is dropped at computed-value time`);
      }
    }
  }

  // D. Schema default drift.
  const validationProps = manifest.validation?.properties;
  if (validationProps && manifest.fields) {
    for (const [dotted, leaf] of walkFields(manifest.fields)) {
      const rule = validationProps[dotted];
      if (rule && 'default' in rule && JSON.stringify(rule.default) !== JSON.stringify(leaf.default)) {
        errors.push(
          `${name}/manifest.json: fields default for "${dotted}" is ${JSON.stringify(leaf.default)} but validation default is ${JSON.stringify(rule.default)}`
        );
      }
    }
  }
}

// E and G for the page shell. Skipped when linting against another vocabulary.
if (vocabIndex === -1) {
  for (const file of listFiles(path.join(ROOT, SHELL_TEMPLATE_ROOT), ['.njk', '.js'])) {
    const rel = path.relative(ROOT, file);
    for (const found of findPlaceholderLinks(fs.readFileSync(file, 'utf8'))) {
      errors.push(`${rel}:${found.line}: placeholder link (${found.match}) — use a <button type="button">; a link to "#" scrolls the page to the top`);
    }
  }
  for (const file of listFiles(path.join(ROOT, SHELL_STYLE_ROOT), ['.css'])) {
    const rel = path.relative(ROOT, file);
    for (const problem of findFocusProblems(fs.readFileSync(file, 'utf8'))) {
      errors.push(`${rel}:${problem.line}: ${problem.message}`);
    }
  }
}

// ---------------------------------------------------------------------------

if (errors.length > 0) {
  console.log(`\n${errors.length} error(s):\n`);
  for (const message of errors) {
    console.log(`  ✖ ${message}`);
  }
}
if (warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s):\n`);
  for (const message of warnings) {
    console.log(`  ! ${message}`);
  }
}
if (errors.length === 0 && warnings.length === 0) {
  console.log('component lint: clean');
}
console.log(`\ncomponent lint: ${components.length} components, ${errors.length} errors, ${warnings.length} warnings${strict ? ' (strict)' : ''}`);

process.exit(errors.length > 0 || (strict && warnings.length > 0) ? 1 : 0);
