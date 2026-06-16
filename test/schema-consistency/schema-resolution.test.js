/**
 * @fileoverview Invariant E: every manifest's `fields` block resolves and
 * materialises without error.
 *
 * The downstream authoring editor composes the form schema by expanding `$use`
 * (pull in a shared partial's fields) and `$extends` (merge `commons` and the
 * like). This test exercises that composition for every section: it resolves
 * the tree (so a dangling `$use`/`$extends` reference, a typo, or a cycle fails
 * loudly here rather than in the editor) and materialises a defaults object (so
 * a malformed leaf is caught too).
 *
 * Tradeoff: this is the cheapest possible smoke test and a hard gate. It does
 * not assert anything about the SHAPE of the result (that is B/C/D); it only
 * proves resolution terminates and produces an object.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { listSections, resolveManifestFields, materializeDefaults, projectRoot } from './lib/manifest-schema.js';

const sections = listSections().filter( ( s ) => s.manifest.fields );

test( 'E: every fields block resolves and materialises defaults', async ( t ) => {
  for ( const section of sections ) {
    await t.test( section.name, () => {
      const tree = resolveManifestFields( section.manifest );
      assert.equal( typeof tree, 'object', 'resolved fields should be an object' );
      const defaults = materializeDefaults( tree );
      assert.equal( typeof defaults, 'object', 'materialised defaults should be an object' );
    } );
  }
} );

/*
 * E2: the emitted artifact is the real contract the editor reads. When a build
 * is present, assert that build/assets/components-schema.json matches what we
 * resolve in-process from the manifests, so a broken emit (or a manifest the
 * build never re-bundled) is caught. Skipped when there is no build, keeping
 * `npm run test:schema` runnable on its own.
 */
const artifactPath = join( projectRoot, 'build/assets/components-schema.json' );
const emitted = existsSync( artifactPath ) ? JSON.parse( readFileSync( artifactPath, 'utf8' ) ) : null;

test(
  'E2: emitted components-schema.json matches in-process resolution',
  { skip: emitted ? false : 'no build artifact; run `npm run build` to check the emitted schema' },
  async ( t ) => {
    const authorable = sections.filter( ( s ) => s.manifest.abstract !== true );
    assert.deepEqual(
      Object.keys( emitted ).sort(),
      authorable.map( ( s ) => s.name ).sort(),
      'emitted schema section set differs from non-abstract fields-bearing sections'
    );
    for ( const section of authorable ) {
      await t.test( section.name, () => {
        assert.deepEqual(
          emitted[ section.name ].fields,
          resolveManifestFields( section.manifest ),
          `${section.name}: emitted schema differs from in-process resolution (stale build?)`
        );
      } );
    }
  }
);
