/**
 * @fileoverview Invariant C: enum fields are internally and cross-consistent.
 *
 *   1. A select's `default` is a member of its own `enum`, and every entry in a
 *      multiselect's `default` array is a member of its `enum`. A form that
 *      defaults to a value it does not offer emits data the component rejects.
 *   2. Where both `fields` and `validation` constrain the same path to an enum,
 *      the two enums are equal (as sets). This catches the pricing-table class
 *      of drift: the form offered `grid|columns` while the template and
 *      validation used `cards|comparison`, so authored values never matched.
 *
 * Tradeoff: pure static comparison, hard gate, no false positives. Array-item
 * enums (e.g. a CTA's `buttonStyle`) are checked for default membership but not
 * compared to the section validation block, because the section's validation
 * addresses array items through `items.properties`, not the dotted path used
 * for top-level fields; comparing those is the job of the owning partial.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { listSections, resolveManifestFields, isLeaf } from './lib/manifest-schema.js';

/**
 * Visit every leaf in a resolved field tree.
 * @param {object} tree
 * @param {(path: string, leaf: object, insideArray: boolean) => void} visit
 * @param {string} [prefix]
 * @param {boolean} [insideArray]
 */
function walkLeaves( tree, visit, prefix = '', insideArray = false ) {
  for ( const [ key, value ] of Object.entries( tree ) ) {
    const path = prefix ? `${prefix}.${key}` : key;
    if ( isLeaf( value ) ) {
      visit( path, value, insideArray );
      if ( value.items && typeof value.items === 'object' ) {
        walkLeaves( value.items, visit, `${path}[]`, true );
      }
    } else if ( value && typeof value === 'object' ) {
      walkLeaves( value, visit, path, insideArray );
    }
  }
}

const asSet = ( arr ) => JSON.stringify( [ ...arr ].sort() );

const sections = listSections().filter( ( s ) => s.manifest.fields );

test( 'C1: select/multiselect defaults are members of their enum', async ( t ) => {
  for ( const section of sections ) {
    await t.test( section.name, () => {
      const tree = resolveManifestFields( section.manifest );
      const problems = [];
      walkLeaves( tree, ( path, leaf ) => {
        if ( !Array.isArray( leaf.enum ) ) {
          return;
        }
        if ( leaf.widget === 'select' && 'default' in leaf && leaf.default !== '' && !leaf.enum.includes( leaf.default ) ) {
          problems.push( `${path}: default "${leaf.default}" not in enum [${leaf.enum.join( ', ' )}]` );
        }
        if ( leaf.widget === 'multiselect' && Array.isArray( leaf.default ) ) {
          for ( const member of leaf.default ) {
            if ( !leaf.enum.includes( member ) ) {
              problems.push( `${path}: default member "${member}" not in enum [${leaf.enum.join( ', ' )}]` );
            }
          }
        }
      } );
      assert.deepEqual( problems, [], `${section.name} enum default problems:\n  ${problems.join( '\n  ' )}` );
    } );
  }
} );

test( 'C2: fields enum equals validation enum for the same path', async ( t ) => {
  for ( const section of sections ) {
    if ( !section.manifest.validation?.properties ) {
      continue;
    }
    await t.test( section.name, () => {
      const tree = resolveManifestFields( section.manifest );
      const props = section.manifest.validation.properties;
      const mismatches = [];
      walkLeaves( tree, ( path, leaf, insideArray ) => {
        if ( insideArray || !Array.isArray( leaf.enum ) ) {
          return;
        }
        const rule = props[ path ];
        const validationEnum = rule?.enum || rule?.items?.enum;
        if ( validationEnum && asSet( validationEnum ) !== asSet( leaf.enum ) ) {
          mismatches.push( `${path}: fields [${leaf.enum.join( ', ' )}] != validation [${validationEnum.join( ', ' )}]` );
        }
      } );
      assert.deepEqual( mismatches, [], `${section.name} enum mismatches:\n  ${mismatches.join( '\n  ' )}` );
    } );
  }
} );
