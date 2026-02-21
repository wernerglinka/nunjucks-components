/**
 * Component scanning and loading utilities
 * @module component-package-generator/scanner
 */

import fs from 'fs/promises';
import path from 'path';
import { generateContentHash } from './hash.js';
import { loadExamples } from './examples.js';

/**
 * Scan components directory and load component metadata
 * @param {string} componentsPath - Path to components directory
 * @param {string} type - Component type (section or partial)
 * @param {string} projectRoot - Project root directory
 * @param {string} examplesPath - Path to examples directory
 * @param {string} version - Project version
 * @returns {Promise<Array<Object>>} Array of component metadata objects
 */
export async function scanComponents(componentsPath, type, projectRoot, examplesPath, version) {
  const components = [];

  try {
    const entries = await fs.readdir(componentsPath, { withFileTypes: true });

    // Process all components in parallel
    const componentPromises = entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const componentPath = path.join(componentsPath, entry.name);
        const manifestPath = path.join(componentPath, 'manifest.json');

        // Check if manifest exists
        try {
          await fs.access(manifestPath);
        } catch {
          console.warn(`⚠ Skipping ${entry.name}: no manifest.json found`);
          return null;
        }

        // Load component data
        return loadComponentData(entry.name, componentPath, type, projectRoot, examplesPath, version);
      });

    const results = await Promise.all(componentPromises);
    components.push(...results.filter((component) => component !== null));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return components;
}

/**
 * Load component files and metadata
 * @param {string} name - Component name
 * @param {string} componentPath - Path to component directory
 * @param {string} type - Component type
 * @param {string} projectRoot - Project root directory
 * @param {string} examplesPath - Path to examples directory
 * @param {string} version - Project version
 * @returns {Promise<Object>} Component metadata object
 */
export async function loadComponentData(name, componentPath, type, projectRoot, examplesPath, version) {
  // Load manifest
  const manifestPath = path.join(componentPath, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

  // Load component files
  const files = {
    template: await fs.readFile(path.join(componentPath, `${name}.njk`), 'utf-8')
  };

  // Load optional files
  const cssPath = path.join(componentPath, `${name}.css`);
  try {
    files.styles = await fs.readFile(cssPath, 'utf-8');
  } catch {
    // CSS is optional
  }

  const jsPath = path.join(componentPath, `${name}.js`);
  try {
    files.scripts = await fs.readFile(jsPath, 'utf-8');
  } catch {
    // JS is optional
  }

  // Check for modules directory (for components with provider support)
  const modulesPath = path.join(componentPath, 'modules');
  try {
    await fs.access(modulesPath);
    files.modules = await loadModules(modulesPath);
  } catch {
    // Modules are optional
  }

  // Check for custom README.md
  const readmePath = path.join(componentPath, 'README.md');
  try {
    files.readme = await fs.readFile(readmePath, 'utf-8');
  } catch {
    // README is optional - will be generated if not present
  }

  // Generate content hash
  const contentHash = generateContentHash(files);

  // Load examples
  const examples = await loadExamples(name, projectRoot, examplesPath, type);

  // Extract dependencies
  const requires = Array.isArray(manifest.requires)
    ? manifest.requires
    : manifest.requires
      ? Object.keys(manifest.requires)
      : [];

  return {
    name,
    type,
    path: componentPath,
    version,
    contentHash,
    manifest,
    files,
    examples,
    requires
  };
}

/**
 * Load modules directory recursively for components
 * @param {string} modulesPath - Path to modules directory
 * @returns {Promise<Array>} Array of files with relative paths and content
 */
export async function loadModules(modulesPath) {
  const files = [];

  async function loadDir(dirPath, relativePath = '') {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          await loadDir(fullPath, relPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          const content = await fs.readFile(fullPath, 'utf-8');
          files.push({ path: relPath, content });
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  await loadDir(modulesPath);
  return files;
}
