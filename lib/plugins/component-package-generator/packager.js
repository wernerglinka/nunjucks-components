/**
 * Package and bundle creation utilities
 * @module component-package-generator/packager
 */

import { createWriteStream } from 'fs';
import path from 'path';
import archiver from 'archiver';
import yaml from 'js-yaml';
import { generateFileChecksum } from './hash.js';
import { formatBytes } from './utils.js';
import { generateReadme, generatePackageJson, generateBundleReadme } from './readme-generator.js';
import { generateInstallScript, generateBundleInstallScript } from './install-script-generator.js';

/**
 * Create individual component ZIP package
 * @param {Object} component - Component metadata
 * @param {string} outputPath - Output directory path
 * @param {boolean} generateChecksum - Whether to generate SHA256 checksum
 * @returns {Promise<Object>} Package metadata (name, size, checksum, etc.)
 */
export async function createComponentPackage(component, outputPath, generateChecksum) {
  const { name, version, type } = component;
  const packageName = `${name}.zip`;
  const packagePath = path.join(outputPath, packageName);

  return new Promise((resolve, reject) => {
    const output = createWriteStream(packagePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    let packageSize = 0;

    output.on('close', async () => {
      packageSize = archive.pointer();
      const formattedSize = formatBytes(packageSize);

      let checksum = null;
      if (generateChecksum) {
        checksum = await generateFileChecksum(packagePath);
      }

      resolve({
        name,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        version,
        contentHash: component.contentHash,
        type,
        downloadUrl: `/${path.join('downloads', type === 'section' ? 'sections' : 'partials', packageName)}`,
        size: formattedSize,
        sizeBytes: packageSize,
        checksum: checksum ? `sha256:${checksum}` : null,
        hasStyles: !!component.files.styles,
        hasScripts: !!component.files.scripts,
        hasModules: !!component.files.modules,
        requires: component.requires
      });
    });

    archive.on('error', reject);
    output.on('error', reject);

    archive.pipe(output);

    // Add component files
    archive.append(component.files.template, { name: `${name}/${name}.njk` });

    if (component.files.styles) {
      archive.append(component.files.styles, { name: `${name}/${name}.css` });
    }

    if (component.files.scripts) {
      archive.append(component.files.scripts, { name: `${name}/${name}.js` });
    }

    // Add modules if present (preserves entire directory structure)
    if (component.files.modules && component.files.modules.length > 0) {
      component.files.modules.forEach((file) => {
        archive.append(file.content, {
          name: `${name}/modules/${file.path}`
        });
      });
    }

    // Add manifest
    archive.append(JSON.stringify(component.manifest, null, 2), {
      name: `${name}/manifest.json`
    });

    // Add examples if available - use raw content for direct copy-paste
    const examples = component.examples;
    if (examples.raw) {
      archive.append(examples.raw, { name: `${name}/examples.yaml` });
    } else if (examples.structured && examples.structured.length > 0) {
      archive.append(yaml.dump(examples.structured), { name: `${name}/examples.yaml` });
    } else if (Array.isArray(examples) && examples.length > 0) {
      // Legacy format
      archive.append(yaml.dump(examples), { name: `${name}/examples.yaml` });
    }

    // Add README - use custom if exists, otherwise generate
    const readme = component.files.readme || generateReadme(component);
    archive.append(readme, { name: `${name}/README.md` });

    const packageJson = generatePackageJson(component);
    archive.append(JSON.stringify(packageJson, null, 2), { name: `${name}/package.json` });

    const installScript = generateInstallScript(component);
    archive.append(installScript, { name: `${name}/install.sh`, mode: 0o755 });

    archive.finalize();
  });
}

/**
 * Create complete component bundle ZIP
 * @param {Object} components - Object with sections and partials arrays
 * @param {string} outputPath - Output directory path
 * @param {string} version - Project version
 * @param {boolean} generateChecksum - Whether to generate SHA256 checksum
 * @returns {Promise<Object>} Bundle metadata
 */
export async function createBundle(components, outputPath, version, generateChecksum) {
  const bundleName = `nunjucks-components.zip`;
  const bundlePath = path.join(outputPath, bundleName);

  return new Promise((resolve, reject) => {
    const output = createWriteStream(bundlePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    let bundleSize = 0;

    output.on('close', async () => {
      bundleSize = archive.pointer();
      const formattedSize = formatBytes(bundleSize);

      let checksum = null;
      if (generateChecksum) {
        checksum = await generateFileChecksum(bundlePath);
      }

      resolve({
        version,
        downloadUrl: `/downloads/${bundleName}`,
        size: formattedSize,
        sizeBytes: bundleSize,
        checksum: checksum ? `sha256:${checksum}` : null
      });
    });

    archive.on('error', reject);
    output.on('error', reject);

    archive.pipe(output);

    const bundleDir = `nunjucks-components`;

    // Add all sections
    components.sections.forEach((section) => {
      addComponentToArchive(archive, section, `${bundleDir}/sections/${section.name}`);
    });

    // Add all partials
    components.partials.forEach((partial) => {
      addComponentToArchive(archive, partial, `${bundleDir}/partials/${partial.name}`);
    });

    // Add bundle README
    const bundleReadme = generateBundleReadme(version, components);
    archive.append(bundleReadme, { name: `${bundleDir}/README.md` });

    // Add bundle install script
    const bundleInstallScript = generateBundleInstallScript(components);
    archive.append(bundleInstallScript, { name: `${bundleDir}/install-all.sh`, mode: 0o755 });

    archive.finalize();
  });
}

/**
 * Add a component to an archive
 * @param {Object} archive - Archiver instance
 * @param {Object} component - Component metadata
 * @param {string} componentDir - Directory path in archive
 */
function addComponentToArchive(archive, component, componentDir) {
  archive.append(component.files.template, { name: `${componentDir}/${component.name}.njk` });

  if (component.files.styles) {
    archive.append(component.files.styles, { name: `${componentDir}/${component.name}.css` });
  }

  if (component.files.scripts) {
    archive.append(component.files.scripts, { name: `${componentDir}/${component.name}.js` });
  }

  // Add modules if present (preserves entire directory structure)
  if (component.files.modules && component.files.modules.length > 0) {
    component.files.modules.forEach((file) => {
      archive.append(file.content, {
        name: `${componentDir}/modules/${file.path}`
      });
    });
  }

  archive.append(JSON.stringify(component.manifest, null, 2), {
    name: `${componentDir}/manifest.json`
  });

  // Add examples - use raw content for direct copy-paste
  const examples = component.examples;
  if (examples.raw) {
    archive.append(examples.raw, { name: `${componentDir}/examples.yaml` });
  } else if (examples.structured && examples.structured.length > 0) {
    archive.append(yaml.dump(examples.structured), { name: `${componentDir}/examples.yaml` });
  } else if (Array.isArray(examples) && examples.length > 0) {
    archive.append(yaml.dump(examples), { name: `${componentDir}/examples.yaml` });
  }

  const readme = component.files.readme || generateReadme(component);
  archive.append(readme, { name: `${componentDir}/README.md` });

  const packageJson = generatePackageJson(component);
  archive.append(JSON.stringify(packageJson, null, 2), {
    name: `${componentDir}/package.json`
  });

  const installScript = generateInstallScript(component);
  archive.append(installScript, { name: `${componentDir}/install.sh`, mode: 0o755 });
}
