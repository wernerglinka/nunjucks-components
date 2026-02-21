/**
 * Example loading utilities for component package generator
 * @module component-package-generator/examples
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Load configuration examples for component
 * @param {string} name - Component name
 * @param {string} projectRoot - Project root directory
 * @param {string} examplesPath - Path to examples directory
 * @param {string} type - Component type
 * @returns {Promise<Object>} Object with raw and structured examples
 */
export async function loadExamples(name, projectRoot, examplesPath, type) {
  // Try dedicated examples file first (in component directory)
  const componentExamplesFile = path.join(
    projectRoot,
    'lib/layouts/components',
    type === 'section' ? 'sections' : '_partials',
    name,
    `${name}.yml`
  );
  try {
    // Read raw content for direct copy-paste in downloads
    const rawContent = await fs.readFile(componentExamplesFile, 'utf-8');
    const examples = yaml.load(rawContent);
    // Return both raw content and structured examples
    if (Array.isArray(examples) && examples[0]?.sectionType) {
      return {
        raw: rawContent,
        structured: examples.map((config, index) => ({
          name: `Example ${index + 1}`,
          description: 'Configuration from component',
          config
        }))
      };
    }
    return { raw: rawContent, structured: examples };
  } catch {
    // Try legacy examples path
    const examplesFile = path.join(projectRoot, examplesPath, `${name}.yaml`);
    try {
      const rawContent = await fs.readFile(examplesFile, 'utf-8');
      return { raw: rawContent, structured: yaml.load(rawContent) };
    } catch {
      // Fall back to extracting from documentation page
      const docPath =
        type === 'section'
          ? path.join(projectRoot, 'src', 'references', 'sections', `${name}.md`)
          : path.join(projectRoot, 'src', 'references', 'partials', `${name}.md`);

      try {
        const docContent = await fs.readFile(docPath, 'utf-8');
        const structured = extractExamplesFromDocs(docContent, name);
        return { raw: null, structured };
      } catch {
        // Generate minimal example if no examples found
        const structured = generateDefaultExample(name, type);
        return { raw: null, structured };
      }
    }
  }
}

/**
 * Extract examples from documentation page frontmatter
 * @param {string} docContent - Documentation page content
 * @param {string} componentName - Component name
 * @returns {Array} Array of example configurations
 */
export function extractExamplesFromDocs(docContent, componentName) {
  const examples = [];

  // Extract frontmatter
  const frontmatterMatch = docContent.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return [];
  }

  const frontmatter = yaml.load(frontmatterMatch[1]);

  // Extract sections that match component type
  if (frontmatter.sections) {
    frontmatter.sections.forEach((section, index) => {
      if (section.sectionType === componentName) {
        examples.push({
          name: `Example ${index + 1}`,
          description: `Configuration from documentation`,
          config: section
        });
      }
    });
  }

  return examples;
}

/**
 * Generate default example configuration
 * @param {string} name - Component name
 * @param {string} type - Component type
 * @returns {Array} Array with single default example
 */
export function generateDefaultExample(name, type) {
  return [
    {
      name: 'Basic Example',
      description: `Minimal ${name} configuration`,
      config:
        type === 'section'
          ? {
              sectionType: name,
              text: {
                title: 'Example Title',
                prose: 'Example content'
              }
            }
          : {}
    }
  ];
}
