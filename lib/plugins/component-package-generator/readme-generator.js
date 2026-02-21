/**
 * README and package.json generation utilities
 * @module component-package-generator/readme-generator
 */

import yaml from 'js-yaml';

/**
 * Generate README documentation for component
 * @param {Object} component - Component metadata
 * @returns {string} README content in Markdown format
 */
// eslint-disable-next-line complexity
export function generateReadme(component) {
  const { name, version, contentHash, type, requires, examples, manifest } = component;

  let readme = `# ${name.charAt(0).toUpperCase() + name.slice(1)} ${type === 'section' ? 'Section' : 'Partial'}\n\n`;
  readme += `**Version:** ${version}\n`;
  readme += `**Content Hash:** ${contentHash}\n\n`;

  // Description from manifest if available
  if (manifest.description) {
    readme += `${manifest.description}\n\n`;
  }

  // Dependencies section
  if (requires.length > 0) {
    readme += `## Dependencies\n\n`;
    readme += `This ${type} requires the following partials:\n\n`;
    requires.forEach((dep) => {
      readme += `- [${dep}](../partials/${dep}-v${version}.zip)\n`;
    });
    readme += `\n`;
    readme += `**Note:** Dependencies are not included in this package. Download them separately.\n\n`;
  }

  // Features section
  readme += `## Features\n\n`;
  if (component.files.styles) {
    readme += `- Includes custom styles\n`;
  }
  if (component.files.scripts) {
    readme += `- Includes interactive JavaScript\n`;
  }
  if (component.files.modules && component.files.modules.length > 0) {
    readme += `- Includes additional modules:\n`;
    component.files.modules.forEach((file) => {
      readme += `  - ${file.path}\n`;
    });
  }
  readme += `\n`;

  // Installation section
  readme += `## Installation\n\n`;
  readme += `### Automated Installation\n\n`;
  readme += `\`\`\`bash\n`;
  readme += `./install.sh\n`;
  readme += `\`\`\`\n\n`;
  readme += `**Prerequisite:** Create a \`nunjucks-components.config.json\` file in your project root:\n\n`;
  readme += `\`\`\`json\n`;
  readme += `{\n`;
  readme += `  "componentsBasePath": "lib/layouts/components",\n`;
  readme += `  "sectionsDir": "sections",\n`;
  readme += `  "partialsDir": "_partials"\n`;
  readme += `}\n`;
  readme += `\`\`\`\n\n`;
  readme += `The install script will:\n`;
  readme += `- Read paths from your config file\n`;
  readme += `- Check for existing versions\n`;
  readme += `- Verify and auto-install dependencies\n`;
  readme += `- Copy files to the correct locations\n\n`;

  readme += `### Manual Installation\n\n`;
  readme += `Copy the component files to your project:\n\n`;
  readme += `\`\`\`bash\n`;
  readme += `cp ${name}.njk your-project/lib/layouts/components/${type === 'section' ? 'sections' : '_partials'}/${name}/\n`;
  if (component.files.styles) {
    readme += `cp ${name}.css your-project/lib/layouts/components/${type === 'section' ? 'sections' : '_partials'}/${name}/\n`;
  }
  if (component.files.scripts) {
    readme += `cp ${name}.js your-project/lib/layouts/components/${type === 'section' ? 'sections' : '_partials'}/${name}/\n`;
  }
  readme += `cp manifest.json your-project/lib/layouts/components/${type === 'section' ? 'sections' : '_partials'}/${name}/\n`;
  readme += `\`\`\`\n\n`;

  // Usage section
  const structuredExamples = examples.structured || examples;
  if (type === 'section' && structuredExamples.length > 0) {
    readme += `## Usage\n\n`;
    readme += `Add the ${name} section to your page frontmatter:\n\n`;

    structuredExamples.forEach((example, index) => {
      if (index > 0) {
        readme += `\n---\n\n`;
      }
      readme += `### ${example.name}\n\n`;
      if (example.description) {
        readme += `${example.description}\n\n`;
      }
      readme += `\`\`\`yaml\n`;
      readme += `sections:\n`;
      readme += `  - ${yaml.dump(example.config).trim().split('\n').join('\n    ')}\n`;
      readme += `\`\`\`\n\n`;
    });
  }

  // More information
  readme += `## More Information\n\n`;
  readme += `For complete documentation and live examples, visit:\n`;
  readme += `https://nunjucks-components.netlify.app/${type === 'section' ? 'library' : 'references/partials'}/${name}/\n\n`;

  return readme;
}

/**
 * Generate package.json for component
 * @param {Object} component - Component metadata
 * @returns {Object} package.json object
 */
export function generatePackageJson(component) {
  const { name, version, contentHash, type, requires, manifest } = component;

  const packageJson = {
    name: `@nunjucks-components/${name}`,
    version,
    description: manifest.description || `Nunjucks ${name} ${type}`,
    keywords: ['nunjucks', 'metalsmith', 'eleventy', 'component', type, name],
    'x-nunjucks-component': true, // Unique marker for component packages
    contentHash,
    main: `${name}.njk`,
    files: [`${name}.njk`, 'manifest.json', 'README.md', 'install.sh']
  };

  // Add optional files
  if (component.files.styles) {
    packageJson.files.push(`${name}.css`);
  }
  if (component.files.scripts) {
    packageJson.files.push(`${name}.js`);
  }
  if (component.files.modules) {
    packageJson.files.push('modules/');
  }

  // Add peer dependencies for required partials
  if (requires.length > 0) {
    packageJson.peerDependencies = {};
    requires.forEach((dep) => {
      packageJson.peerDependencies[`@nunjucks-components/${dep}`] = `>=${version}`;
    });
  }

  return packageJson;
}

/**
 * Generate README for complete bundle
 * @param {string} version - Bundle version
 * @param {Object} components - Object with sections and partials arrays
 * @returns {string} Bundle README content
 */
export function generateBundleReadme(version, components) {
  let readme = `# Nunjucks Components Bundle v${version}\n\n`;
  readme += `Complete collection of Nunjucks components for building modern websites with static site generators.\n\n`;

  readme += `## Contents\n\n`;
  readme += `This bundle includes:\n\n`;
  readme += `- **${components.sections.length} Section Components:** ${components.sections.map((s) => s.name).join(', ')}\n`;
  readme += `- **${components.partials.length} Partial Components:** ${components.partials.map((p) => p.name).join(', ')}\n\n`;

  readme += `## Prerequisites\n\n`;
  readme += `Before installing components, create a \`nunjucks-components.config.json\` file in your project root:\n\n`;
  readme += `\`\`\`json\n`;
  readme += `{\n`;
  readme += `  "componentsBasePath": "lib/layouts/components",\n`;
  readme += `  "sectionsDir": "sections",\n`;
  readme += `  "partialsDir": "_partials"\n`;
  readme += `}\n`;
  readme += `\`\`\`\n\n`;
  readme += `Edit these values to match your project structure. This file is required for installation.\n\n`;

  readme += `## Installation\n\n`;
  readme += `### Installation Modes\n\n`;
  readme += `The bundle installer supports two modes:\n\n`;
  readme += `**1. Full Install (default)** - Installs all components:\n`;
  readme += `\`\`\`bash\n`;
  readme += `# From your project root:\n`;
  readme += `unzip nunjucks-components.zip\n`;
  readme += `./nunjucks-components/install-all.sh\n`;
  readme += `\`\`\`\n\n`;
  readme += `If you already have components installed, the script will prompt you to choose between:\n`;
  readme += `- Install all components (adds new ones, updates existing)\n`;
  readme += `- Update existing components only (skips new components)\n\n`;

  readme += `**2. Update Mode** - Only updates components you already have:\n`;
  readme += `\`\`\`bash\n`;
  readme += `./nunjucks-components/install-all.sh --update-only\n`;
  readme += `# or use the short form:\n`;
  readme += `./nunjucks-components/install-all.sh -u\n`;
  readme += `\`\`\`\n\n`;
  readme += `This is perfect for:\n`;
  readme += `- Updating a subset of components you're already using\n`;
  readme += `- Getting bug fixes and improvements without adding new components\n`;
  readme += `- Keeping your project lean with only the components you need\n\n`;

  readme += `### Selective Installation\n\n`;
  readme += `To install individual components from the bundle:\n\n`;
  readme += `\`\`\`bash\n`;
  readme += `# From your project root:\n`;
  readme += `./nunjucks-components/sections/hero/install.sh\n`;
  readme += `# or for partials:\n`;
  readme += `./nunjucks-components/partials/text/install.sh\n`;
  readme += `\`\`\`\n\n`;

  readme += `## Documentation\n\n`;
  readme += `For complete documentation and live examples, visit:\n`;
  readme += `https://nunjucks-components.netlify.app/\n\n`;

  readme += `## License\n\n`;
  readme += `MIT License\n`;

  return readme;
}
