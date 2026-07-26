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
 *    the same component, not in the token vocabulary, not by another
 *    component, not by a vendor stylesheet) is dropped at computed-value
 *    time and silently does not apply on any site. With an inline fallback
 *    it renders but cannot be retuned, which is reported as a warning.
 * D. Schema default drift — where a manifest declares the same path in both
 *    `fields` (editor schema) and `validation.properties` (build contract)
 *    with a `default`, the two defaults must agree, or authors see one
 *    default and the build enforces another.
 *
 * Advisory posture: errors exit 1, warnings exit 0. Run with --strict to
 * fail on warnings too. Run with --vocab <dir> to lint against a different
 * token vocabulary (e.g. the starter's lib/assets/styles) instead of this
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
const vocabDir = vocabIndex !== -1 ? args[vocabIndex + 1] : path.join(ROOT, 'lib/assets/styles');

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

/** Read every .css file under a directory (recursively). */
const readCssDir = (dir) => {
  let css = '';
  if (!fs.existsSync(dir)) {
    return css;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      css += readCssDir(full);
    } else if (entry.name.endsWith('.css')) {
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
    components.push({ name: entry.name, dir, manifest, cssFiles });
  }
}

// Build the "defined" universe.
const vocabulary = collectDefinitions(readCssDir(vocabDir));
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
const anyComponentDefined = new Set();
for (const defs of componentDefined.values()) {
  for (const def of defs) {
    anyComponentDefined.add(def);
  }
}

// Run checks per component.
for (const component of components) {
  const { name, cssFiles, manifest } = component;
  const ownDefs = componentDefined.get(name);

  for (const file of cssFiles) {
    const rel = path.relative(ROOT, file);
    const css = fs.readFileSync(file, 'utf8');

    // A. Layer safety: first significant token must not be @import/@charset.
    const head = stripComments(css).trimStart();
    if (/^@(import|charset)\b/.test(head)) {
      errors.push(`${rel}: starts with @${head.match(/^@(\w+)/)[1]} — will be emitted unwrapped and lose cascade-layer precedence`);
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
        ownDefs.has(use.name) ||
        vocabulary.has(use.name) ||
        vendorDefined.has(use.name) ||
        anyComponentDefined.has(use.name) ||
        TEMPLATE_SET[name]?.has(use.name);
      if (known) {
        continue;
      }
      if (use.hasFallback) {
        warnings.push(`${rel}:${use.line}: var(${use.name}, …) — token defined nowhere; the fallback is the only value there is`);
      } else {
        errors.push(`${rel}:${use.line}: var(${use.name}) — token defined nowhere; declaration is dropped at computed-value time`);
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
