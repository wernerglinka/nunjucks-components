/**
 * @fileoverview Invariant B: the `fields` (authoring form) block and the
 * `validation` block describe the same shape with compatible widgets.
 *
 * For every constrained validation property, the matching fields node must use
 * a widget that can actually produce a value the validation will accept:
 *   - `type: number`            -> `widget: number`
 *   - `enum` (string)           -> `widget: select` (or multiselect)
 *   - `type: array` + items.enum -> `widget: multiselect`
 *   - `type: array` (of objects) -> `widget: array`
 *   - `type: object`            -> a field GROUP, never a single leaf
 *   - `type: boolean`           -> `widget: checkbox`
 *   - `type: string` (free)     -> any text-like leaf
 *
 * This is the check that catches the structural drifts the project fixed by
 * hand: artwork's `dimensions` declared `object` but offered as one text field
 * (leaf-where-group), numeric fields offered as text, social-shares platforms
 * offered as objects instead of a multiselect, and `code.theme` offered as text
 * instead of a select.
 *
 * Tradeoff / scoping decisions:
 *   - This is a hard, fully-static gate: comparing two declarations needs no
 *     rendering and has no false positives.
 *   - We assert compatibility only where a fields node EXISTS for the path. A
 *     validation path with no fields node is a coverage gap, not a type
 *     conflict; it is reported as a non-failing diagnostic so gaps stay visible
 *     without turning every data-only validation rule into a failure.
 *   - Structural paths (sectionType/containerTag/id/classes) and pure `const`
 *     rules are skipped: they are not authored through the form.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { listSections, resolveManifestFields, lookupPath, isLeaf, STRUCTURAL_KEYS } from './lib/manifest-schema.js';

/** Widgets that can hold a free-form string value. */
const TEXT_WIDGETS = new Set( [ 'text', 'textarea', 'markdown', 'image', 'url', 'select', 'radio' ] );

/**
 * The widget (or 'group') a validation rule demands.
 * @param {object} rule
 * @returns {string}
 */
function expectedWidget( rule ) {
  if ( rule.type === 'array' && rule.items?.enum ) {
    return 'multiselect';
  }
  if ( rule.type === 'array' ) {
    return 'array';
  }
  if ( rule.enum ) {
    return 'select';
  }
  if ( rule.type === 'number' ) {
    return 'number';
  }
  if ( rule.type === 'object' ) {
    return 'group';
  }
  if ( rule.type === 'boolean' ) {
    return 'checkbox';
  }
  return 'text-like';
}

/**
 * Check one validation property against the resolved fields tree.
 * @returns {{path: string, message: string}|null} A violation, or null.
 */
function checkProperty( tree, path, rule ) {
  const { kind, node } = lookupPath( tree, path );
  if ( kind === 'absent' ) {
    return null; // coverage gap, not a type conflict (reported separately)
  }
  const want = expectedWidget( rule );

  if ( want === 'group' ) {
    if ( kind !== 'group' ) {
      const got = isLeaf( node ) ? `leaf (widget: ${node.widget})` : kind;
      return { path, message: `validation says object, but fields offers a ${got} (should be a field group)` };
    }
    return null;
  }

  if ( kind !== 'leaf' ) {
    return { path, message: `validation wants widget "${want}", but fields has a ${kind} here` };
  }

  const widget = node.widget;
  switch ( want ) {
    case 'multiselect':
      return widget === 'multiselect' ? null : { path, message: `array+enum should be a multiselect, got "${widget}"` };
    case 'array':
      return widget === 'array' ? null : { path, message: `array should be an array widget, got "${widget}"` };
    case 'select':
      return widget === 'select' || widget === 'multiselect' ? null : { path, message: `enum should be a select, got "${widget}"` };
    case 'number':
      return widget === 'number' ? null : { path, message: `number should use widget "number", got "${widget}"` };
    case 'checkbox':
      return widget === 'checkbox' || widget === 'toggle' ? null : { path, message: `boolean should be a checkbox, got "${widget}"` };
    default: // text-like
      return TEXT_WIDGETS.has( widget ) || widget === 'number' || widget === 'checkbox'
        ? null
        : { path, message: `string should use a text-like widget, got "${widget}"` };
  }
}

const sections = listSections().filter( ( s ) => s.manifest.validation?.properties && s.manifest.fields );

test( 'B: fields widgets are compatible with the validation block', async ( t ) => {
  for ( const section of sections ) {
    await t.test( section.name, () => {
      const tree = resolveManifestFields( section.manifest );
      const violations = [];
      for ( const [ path, rule ] of Object.entries( section.manifest.validation.properties ) ) {
        if ( STRUCTURAL_KEYS.has( path.split( '.' )[ 0 ] ) ) {
          continue;
        }
        if ( rule.const !== undefined && !rule.type && !rule.enum ) {
          continue;
        }
        const violation = checkProperty( tree, path, rule );
        if ( violation ) {
          violations.push( `${violation.path}: ${violation.message}` );
        }
      }
      assert.deepEqual( violations, [], `${section.name} fields/validation widget mismatches:\n  ${violations.join( '\n  ' )}` );
    } );
  }
} );
