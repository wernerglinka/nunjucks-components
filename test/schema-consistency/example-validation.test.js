/**
 * @fileoverview Invariant A + drift-#6 guard: example instances agree with the
 * contract they are authored against.
 *
 * A. Every `<name>.yml` example validates clean against its own `validation`
 *    block, using the library's own validator (see ./lib/validator.js). This is
 *    the cheapest, highest-signal check: it reuses production code, so anything
 *    that passes here passes the real build. It catches stale examples whose
 *    values drift from the declared types/enums/consts — e.g. a `sectionType`
 *    that no longer matches the component (the `maps`/"mapping" class of bug).
 *
 * A2 (drift #6). Every non-structural key an example sets is part of the
 *    component's contract: it is authorable through the resolved `fields`
 *    block, or declared in `validation`, or a documented build/runtime key
 *    (RUNTIME_KEY_ALLOWLIST). This catches the accordion `expandFirst`-vs-
 *    `expandIndex` class: an example key the template never reads, which
 *    validates fine (validation ignores unknown keys) yet silently does
 *    nothing. It is the static complement to the render test: the render test
 *    proves defaults render; this proves the example authors nothing off-contract.
 *
 * Tradeoff: A is a pure static check with zero false positives, so it is a hard
 * gate. A2 needs the small RUNTIME_KEY_ALLOWLIST escape hatch because some keys
 * are legitimately injected by build plugins (pagination params); that list is
 * the only judgement call, and it is kept short and documented.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateSection } from './lib/validator.js';
import {
  listSections,
  loadExample,
  resolveManifestFields,
  collectFieldPaths,
  flattenInstanceKeys,
  isRuntimeKey,
  STRUCTURAL_KEYS
} from './lib/manifest-schema.js';

/** Sections that ship an example instance. */
const withExamples = listSections()
  .map( ( s ) => ( { ...s, example: loadExample( s.dir, s.name ) } ) )
  .filter( ( s ) => s.example );

/**
 * True when `key` (or an ancestor of it) is present in `paths`. A field/group
 * path covers its own descendants, so "text" covers "text.title".
 * @param {string} key
 * @param {Set<string>} paths
 * @returns {boolean}
 */
function pathOrAncestorIn( key, paths ) {
  const segments = key.split( '.' );
  for ( let i = 1; i <= segments.length; i++ ) {
    if ( paths.has( segments.slice( 0, i ).join( '.' ) ) ) {
      return true;
    }
  }
  return false;
}

test( 'A: every example .yml validates against its own validation block', async ( t ) => {
  for ( const section of withExamples ) {
    if ( !section.manifest.validation ) {
      continue;
    }
    await t.test( section.name, () => {
      const result = validateSection( section.example, section.manifest.validation, section.name );
      assert.ok( result.valid, result.error );
    } );
  }
} );

test( 'A2: every example key is authorable via fields, declared in validation, or an allowed runtime key', async ( t ) => {
  for ( const section of withExamples ) {
    await t.test( section.name, () => {
      const fieldPaths = collectFieldPaths( resolveManifestFields( section.manifest ) );
      const validationPaths = new Set( Object.keys( section.manifest.validation?.properties || {} ) );

      const offContract = [];
      for ( const key of flattenInstanceKeys( section.example ) ) {
        if ( STRUCTURAL_KEYS.has( key.split( '.' )[ 0 ] ) ) {
          continue;
        }
        if ( isRuntimeKey( section.name, key ) ) {
          continue;
        }
        if ( pathOrAncestorIn( key, fieldPaths ) || pathOrAncestorIn( key, validationPaths ) ) {
          continue;
        }
        offContract.push( key );
      }

      assert.deepEqual(
        offContract,
        [],
        `${section.name}.yml sets keys that no fields/validation entry covers (stale example or missing field): ${offContract.join( ', ' )}`
      );
    } );
  }
} );
