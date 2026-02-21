/**
 * Content hashing utilities for component package generator
 * @module component-package-generator/hash
 */

import fs from 'fs/promises';
import crypto from 'crypto';

/**
 * Generate SHA256 content hash for component
 * @param {Object} files - Component files object
 * @returns {string} Truncated SHA256 hash (16 characters)
 */
export function generateContentHash(files) {
  const hash = crypto.createHash('sha256');

  // Hash template (required)
  hash.update(files.template);

  // Hash optional files if present
  if (files.styles) {
    hash.update(files.styles);
  }
  if (files.scripts) {
    hash.update(files.scripts);
  }

  // Hash modules if present (now an array of {path, content})
  if (files.modules && files.modules.length > 0) {
    files.modules.forEach((file) => hash.update(file.content));
  }

  return hash.digest('hex').substring(0, 16);
}

/**
 * Generate SHA256 checksum for file
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} SHA256 checksum
 */
export async function generateFileChecksum(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex');
}
