/**
 * @fileoverview Invariant D: render-based template alignment.
 *
 * The ground truth for what data a component uses is its `.njk` template, but
 * statically parsing Nunjucks (macros, dynamic includes, partial imports) to
 * recover the set of `section.*` paths it reads is brittle. The pragmatic
 * oracle, endorsed by the task brief, is to RENDER the real template and watch
 * what comes out:
 *
 *   1. Materialise the defaults a fresh authoring form would emit from the
 *      resolved `fields`, render the template, and assert it does not throw.
 *   2. Render the shipped example instance the same way.
 *   3. Assert the output contains none of the empty-value tokens that signal a
 *      shape mismatch leaking through: "NaN" (a string fed to number maths),
 *      "[object Object]" (a group printed where a scalar was expected), or
 *      "undefined".
 *
 * Why both defaults and example: defaults exercise the form contract (the thing
 * the editor generates); the example exercises realistic authored values and
 * the template branches they unlock. Between them they catch the artwork
 * dimensions group, the stale pricing-table layout enum, and accordion-style
 * stale keys far more cheaply than a template parser would.
 *
 * Tradeoff / handling data-driven sections: components that render from
 * site-level data (collections, author records, external map/logo feeds) emit
 * little or nothing from their own defaults, and what they do emit can legitimately
 * contain an empty token (e.g. logos-list computes `count * width`, which is NaN
 * with no logos; maps reads `data.maps[id]`). For the DATA_DRIVEN_SECTIONS set we
 * therefore assert only that rendering does not throw, and skip the token scan to
 * avoid false positives. Every other section gets the full check.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  listSections, loadExample, resolveManifestFields, materializeDefaults, DATA_DRIVEN_SECTIONS
} from './lib/manifest-schema.js';
import {
  createRenderEnvironment, renderContext, findBadTokens, sectionTemplate
} from './lib/render-env.js';

const { env, data } = createRenderEnvironment();

/** Sections that have a template and at least defaults or an example to render. */
const sections = listSections().filter( ( s ) => s.manifest.fields || loadExample( s.dir, s.name ) );

/**
 * Render one section instance, returning `{ html }` or throwing through.
 * @param {string} name
 * @param {object} instance
 * @returns {string}
 */
function render( name, instance ) {
  return env.render( sectionTemplate( name ), renderContext( instance, data ) );
}

test( 'D: section templates render from materialised defaults', async ( t ) => {
  for ( const section of sections ) {
    if ( !section.manifest.fields ) {
      continue;
    }
    await t.test( section.name, () => {
      const instance = { sectionType: section.name, ...materializeDefaults( resolveManifestFields( section.manifest ) ) };
      let html;
      assert.doesNotThrow( () => { html = render( section.name, instance ); }, 'template threw while rendering defaults' );
      if ( !DATA_DRIVEN_SECTIONS.has( section.name ) ) {
        const bad = findBadTokens( html );
        assert.deepEqual( bad, [], `defaults render leaked ${bad.join( ', ' )}` );
      }
    } );
  }
} );

test( 'D: section templates render from their example instance', async ( t ) => {
  for ( const section of sections ) {
    const example = loadExample( section.dir, section.name );
    if ( !example ) {
      continue;
    }
    await t.test( section.name, () => {
      let html;
      assert.doesNotThrow( () => { html = render( section.name, example ); }, 'template threw while rendering example' );
      if ( !DATA_DRIVEN_SECTIONS.has( section.name ) ) {
        const bad = findBadTokens( html );
        assert.deepEqual( bad, [], `example render leaked ${bad.join( ', ' )}` );
      }
    } );
  }
} );
