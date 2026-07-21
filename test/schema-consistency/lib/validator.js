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
 * Imported through the package's `metalsmith-bundled-components/validation`
 * subpath export (added in 1.3.0).
 *
 * @author Werner Glinka <werner@glinka.co>
 */

export { validateSection, validateSections } from 'metalsmith-bundled-components/validation';
