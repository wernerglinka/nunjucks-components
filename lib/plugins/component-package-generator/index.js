/**
 * Nunjucks Component Package Generator Plugin
 *
 * Generates downloadable ZIP packages for components during the build process.
 * Creates individual packages for sections and partials, plus a complete bundle.
 * Includes content-hash tracking for intelligent version management.
 *
 * @module component-package-generator
 */

import fs from 'fs/promises';
import path from 'path';
import { getProjectVersion, addGeneratedFilesToMetalsmith } from './utils.js';
import { scanComponents } from './scanner.js';
import { createComponentPackage, createBundle } from './packager.js';

/**
 * Default plugin options
 * @typedef {Object} PluginOptions
 * @property {string} componentsPath - Base path to components directory
 * @property {string} examplesPath - Path to examples directory
 * @property {string} outputPath - Output directory for packages
 * @property {boolean} generateBundle - Whether to generate complete bundle
 * @property {boolean} generateChecksums - Whether to generate SHA256 checksums
 */

/**
 * Metalsmith plugin factory
 * @param {PluginOptions} options - Plugin configuration options
 * @returns {Function} Metalsmith plugin function
 */
export default function componentPackageGenerator(options = {}) {
  const defaultOptions = {
    componentsPath: 'lib/layouts/components',
    examplesPath: 'lib/layouts/components/examples',
    outputPath: 'downloads',
    generateBundle: true,
    generateChecksums: true
  };

  const config = { ...defaultOptions, ...options };

  return async function (files, metalsmith, done) {
    try {
      const projectVersion = await getProjectVersion(metalsmith.directory());
      const outputDir = path.join(metalsmith.destination(), config.outputPath);

      // Create output directories
      await fs.mkdir(path.join(outputDir, 'sections'), { recursive: true });
      await fs.mkdir(path.join(outputDir, 'partials'), { recursive: true });

      // Scan and load components
      const sections = await scanComponents(
        path.join(metalsmith.directory(), config.componentsPath, 'sections'),
        'section',
        metalsmith.directory(),
        config.examplesPath,
        projectVersion
      );

      const partials = await scanComponents(
        path.join(metalsmith.directory(), config.componentsPath, '_partials'),
        'partial',
        metalsmith.directory(),
        config.examplesPath,
        projectVersion
      );

      // Generate individual packages in parallel
      const sectionPackages = await Promise.all(
        sections.map((section) =>
          createComponentPackage(section, path.join(outputDir, 'sections'), config.generateChecksums)
        )
      );

      const partialPackages = await Promise.all(
        partials.map((partial) =>
          createComponentPackage(partial, path.join(outputDir, 'partials'), config.generateChecksums)
        )
      );

      // Generate complete bundle if enabled
      let bundleMetadata = null;
      if (config.generateBundle) {
        bundleMetadata = await createBundle(
          { sections, partials },
          outputDir,
          projectVersion,
          config.generateChecksums
        );
      }

      // Generate manifest
      const manifest = generateManifest(
        { sections: sectionPackages, partials: partialPackages },
        bundleMetadata,
        config.outputPath
      );

      await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

      // Add metadata to Metalsmith for template use
      addMetadataToMetalsmith(manifest, metalsmith);

      // CRITICAL: Add generated files to Metalsmith files object
      // Metalsmith 2.7.0 cleans the destination AFTER plugins run but BEFORE write
      // So we must add our files to the files object to survive the clean
      await addGeneratedFilesToMetalsmith(files, outputDir, config.outputPath);

      done();
    } catch (error) {
      console.error('Error generating component packages:', error);
      done(error);
    }
  };
}

/**
 * Generate manifest with all package metadata
 * @param {Object} packages - Object with sections and partials package arrays
 * @param {Object} bundleMetadata - Bundle metadata object
 * @param {string} basePath - Base path for download URLs
 * @returns {Object} Complete manifest object
 */
function generateManifest(packages, bundleMetadata, basePath) {
  return {
    generated: new Date().toISOString(),
    version: bundleMetadata ? bundleMetadata.version : null,
    basePath,
    sections: packages.sections,
    partials: packages.partials,
    bundle: bundleMetadata
  };
}

/**
 * Add package metadata to Metalsmith metadata
 * @param {Object} manifest - Complete manifest object
 * @param {Object} metalsmith - Metalsmith instance
 */
function addMetadataToMetalsmith(manifest, metalsmith) {
  const metadata = metalsmith.metadata();

  metadata.componentPackages = {
    sections: manifest.sections,
    partials: manifest.partials,
    bundle: manifest.bundle
  };
}
