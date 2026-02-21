/**
 * Utility functions for component package generator
 * @module component-package-generator/utils
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Get project version from package.json
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string>} Project version
 */
export async function getProjectVersion(projectRoot) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted size string
 */
export function formatBytes(bytes) {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
}

/**
 * Add generated files to Metalsmith files object
 * This is necessary for Metalsmith 2.7.0+ where clean() runs AFTER plugins
 * but BEFORE write, which would delete files written directly to disk.
 * @param {Object} files - Metalsmith files object
 * @param {string} outputDir - Absolute path to output directory
 * @param {string} outputPath - Relative path for file keys
 */
export async function addGeneratedFilesToMetalsmith(files, outputDir, outputPath) {
  /**
   * Recursively read directory and add files to Metalsmith files object
   * @param {string} dirPath - Directory to read
   * @param {string} relativePath - Relative path for file keys
   */
  async function addFilesRecursively(dirPath, relativePath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          await addFilesRecursively(fullPath, relPath);
        } else if (entry.isFile()) {
          const contents = await fs.readFile(fullPath);
          const stats = await fs.stat(fullPath);

          // Add to Metalsmith files object with the path relative to destination
          files[`${outputPath}/${relPath}`] = {
            contents,
            mode: stats.mode.toString(8).slice(-4),
            stats
          };
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  await addFilesRecursively(outputDir, '');
}
