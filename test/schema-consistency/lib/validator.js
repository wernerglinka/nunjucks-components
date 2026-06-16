/**
 * @fileoverview Re-export of the library's section validator.
 *
 * The build pipeline validates every page's sections against each component's
 * `validation` block using `validateSection` from `metalsmith-bundled-components`
 * (see metalsmith.js -> componentDependencyBundler, which surfaces
 * "Section Validation Errors" at build time). The schema-consistency tests
 * reuse that exact code so a `.yml` example that passes here is guaranteed to
 * pass the real build, and vice versa. We deliberately do NOT reimplement the
 * validation rules.
 *
 * Note on the import path: the plugin's package.json `exports` field only
 * publishes the plugin entry, so the validator is imported by direct file path
 * into node_modules. This is still the library's own code (not a copy), so the
 * tests and the build validate identically.
 *
 * @author Werner Glinka <werner@glinka.co>
 */

export {
  validateSection,
  validateSections
} from '../../../node_modules/metalsmith-bundled-components/src/utils/validation.js';
