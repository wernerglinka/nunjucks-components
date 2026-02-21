/**
 * Install script generation utilities
 * @module component-package-generator/install-script-generator
 */

/**
 * Generate installation script for component
 * @param {Object} component - Component metadata
 * @returns {string} Bash installation script
 */
export function generateInstallScript(component) {
  const { name, version, contentHash, type, requires } = component;

  let script = `#!/bin/bash\n\n`;
  script += `# Installation script for ${name} v${version}\n`;
  script += `# Content Hash: ${contentHash}\n\n`;

  script += `set -e\n\n`;

  // Base URL for downloading components
  script += `# Base URL for component downloads\n`;
  script += `DOWNLOAD_BASE_URL="https://nunjucks-components.com/downloads"\n\n`;

  script += `echo "🔧 Installing ${name} v${version}..."\n\n`;

  // Detect project and set project root
  script += `# Detect project directory and component source\n`;
  script += `COMPONENT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"\n\n`;
  script += `# Function to find project root by looking for config file\n`;
  script += `find_project_root() {\n`;
  script += `  local dir="$1"\n`;
  script += `  [ -f "$dir/nunjucks-components.config.json" ]\n`;
  script += `}\n\n`;
  script += `# Check if PROJECT_ROOT was set by bundle installer\n`;
  script += `if [ -n "$PROJECT_ROOT" ]; then\n`;
  script += `  # Called from bundle installer, PROJECT_ROOT already set\n`;
  script += `  cd "$PROJECT_ROOT"\n`;
  script += `# Check if we're in a component package directory (has x-nunjucks-component marker)\n`;
  script += `elif [ -f "package.json" ] && grep -q "\\"x-nunjucks-component\\"" package.json; then\n`;
  script += `  # In a component directory, look up for project root\n`;
  script += `  if find_project_root ".."; then\n`;
  script += `    PROJECT_ROOT="$(cd .. && pwd)"\n`;
  script += `    cd "$PROJECT_ROOT"\n`;
  script += `  elif find_project_root "../.."; then\n`;
  script += `    # Two levels up (e.g., bundle/partials/component/)\n`;
  script += `    PROJECT_ROOT="$(cd ../.. && pwd)"\n`;
  script += `    cd "$PROJECT_ROOT"\n`;
  script += `  else\n`;
  script += `    echo "❌ Error: nunjucks-components.config.json not found"\n`;
  script += `    echo "Please create this config file in your project root before installing components."\n`;
  script += `    echo ""\n`;
  script += `    echo "Example nunjucks-components.config.json:"\n`;
  script += `    echo '{\n  "componentsBasePath": "lib/layouts/components",\n  "sectionsDir": "sections",\n  "partialsDir": "_partials"\n}'\n`;
  script += `    exit 1\n`;
  script += `  fi\n`;
  script += `elif find_project_root "."; then\n`;
  script += `  # Already in project root\n`;
  script += `  PROJECT_ROOT="$(pwd)"\n`;
  script += `else\n`;
  script += `  echo "❌ Error: nunjucks-components.config.json not found"\n`;
  script += `  echo "Please create this config file in your project root before installing components."\n`;
  script += `  echo ""\n`;
  script += `  echo "Example nunjucks-components.config.json:"\n`;
  script += `  echo '{\n  "componentsBasePath": "lib/layouts/components",\n  "sectionsDir": "sections",\n  "partialsDir": "_partials"\n}'\n`;
  script += `  exit 1\n`;
  script += `fi\n\n`;

  // Load configuration
  script += `# Load component paths from config\n`;
  script += `COMPONENTS_BASE=$(node -p "require('./nunjucks-components.config.json').componentsBasePath")\n`;
  script += `SECTIONS_DIR=$(node -p "require('./nunjucks-components.config.json').sectionsDir")\n`;
  script += `PARTIALS_DIR=$(node -p "require('./nunjucks-components.config.json').partialsDir")\n\n`;

  // Initialize tracking for installed dependencies (prevents circular loops)
  script += `# Track installed dependencies to prevent circular loops\n`;
  script += `if [ -z "$INSTALLED_DEPS" ]; then\n`;
  script += `  export INSTALLED_DEPS=""\n`;
  script += `fi\n\n`;

  // Function to download and install a dependency
  script += generateDependencyInstallFunction();

  // Create target directory
  script += `# Create target directory\n`;
  script += `if [ "${type}" = "section" ]; then\n`;
  script += `  TARGET_DIR="$COMPONENTS_BASE/$SECTIONS_DIR/${name}"\n`;
  script += `else\n`;
  script += `  TARGET_DIR="$COMPONENTS_BASE/$PARTIALS_DIR/${name}"\n`;
  script += `fi\n`;
  script += `mkdir -p "$TARGET_DIR"\n\n`;

  // Check for existing installation
  script += `# Check for existing installation\n`;
  script += `if [ -f "$TARGET_DIR/manifest.json" ]; then\n`;
  script += `  EXISTING_HASH=$(grep -o '"contentHash": "[^"]*"' "$TARGET_DIR/manifest.json" | cut -d'"' -f4)\n`;
  script += `  if [ "$EXISTING_HASH" = "${contentHash}" ]; then\n`;
  script += `    echo "✓ ${name} v${version} already installed (no changes)"\n`;
  script += `    exit 0\n`;
  script += `  else\n`;
  script += `    echo "📦 Upgrading ${name} (content changed)"\n`;
  script += `  fi\n`;
  script += `fi\n\n`;

  // Check and auto-install dependencies
  if (requires.length > 0) {
    script += generateDependencyChecks(requires);
  }

  // Copy files
  script += `# Copy files\n`;
  script += `echo "Copying files..."\n`;
  script += `cp "$COMPONENT_DIR/${name}.njk" "$TARGET_DIR/"\n`;
  if (component.files.styles) {
    script += `cp "$COMPONENT_DIR/${name}.css" "$TARGET_DIR/"\n`;
  }
  if (component.files.scripts) {
    script += `cp "$COMPONENT_DIR/${name}.js" "$TARGET_DIR/"\n`;
  }
  script += `cp "$COMPONENT_DIR/manifest.json" "$TARGET_DIR/"\n`;
  script += `if [ -f "$COMPONENT_DIR/README.md" ]; then\n`;
  script += `  cp "$COMPONENT_DIR/README.md" "$TARGET_DIR/"\n`;
  script += `fi\n`;

  // Copy modules if present (entire directory recursively)
  if (component.files.modules && component.files.modules.length > 0) {
    script += `\n# Copy modules directory\n`;
    script += `if [ -d "$COMPONENT_DIR/modules" ]; then\n`;
    script += `  cp -r "$COMPONENT_DIR/modules" "$TARGET_DIR/"\n`;
    script += `fi\n`;
  }

  script += `\n`;
  script += `echo ""\n`;
  script += `echo "✓ Installation complete"\n`;
  script += `echo ""\n`;
  script += `echo "Files installed to: $TARGET_DIR"\n`;

  // Report auto-installed dependencies
  if (requires.length > 0) {
    script += `if [ -n "$AUTO_INSTALLED_DEPS" ]; then\n`;
    script += `  echo "Dependencies installed:$AUTO_INSTALLED_DEPS"\n`;
    script += `fi\n`;
  }

  script += `echo ""\n`;

  // Add cleanup logic for individual component installations
  script += generateCleanupLogic();

  script += `echo ""\n`;
  script += `echo "See README.md for usage instructions"\n`;

  return script;
}

/**
 * Generate the dependency install function for bash scripts
 * @returns {string} Bash function code
 */
function generateDependencyInstallFunction() {
  let script = `# Function to download and install a dependency\n`;
  script += `install_dependency() {\n`;
  script += `  local dep_name="$1"\n`;
  script += `  local dep_type="$2"  # "partial" or "section"\n`;
  script += `  \n`;
  script += `  # Check if already processed in this session (circular dependency protection)\n`;
  script += `  if [[ "$INSTALLED_DEPS" == *":$dep_name:"* ]]; then\n`;
  script += `    return 0\n`;
  script += `  fi\n`;
  script += `  \n`;
  script += `  # Mark as being processed\n`;
  script += `  export INSTALLED_DEPS="$INSTALLED_DEPS:$dep_name:"\n`;
  script += `  \n`;
  script += `  local dep_dir\n`;
  script += `  local download_url\n`;
  script += `  \n`;
  script += `  if [ "$dep_type" = "section" ]; then\n`;
  script += `    dep_dir="$COMPONENTS_BASE/$SECTIONS_DIR/$dep_name"\n`;
  script += `    download_url="$DOWNLOAD_BASE_URL/sections/$dep_name.zip"\n`;
  script += `  else\n`;
  script += `    dep_dir="$COMPONENTS_BASE/$PARTIALS_DIR/$dep_name"\n`;
  script += `    download_url="$DOWNLOAD_BASE_URL/partials/$dep_name.zip"\n`;
  script += `  fi\n`;
  script += `  \n`;
  script += `  # Check if already installed\n`;
  script += `  if [ -f "$dep_dir/manifest.json" ]; then\n`;
  script += `    echo "  ✓ $dep_name (already installed)"\n`;
  script += `    return 0\n`;
  script += `  fi\n`;
  script += `  \n`;
  script += `  echo "  ↓ Installing $dep_name..."\n`;
  script += `  \n`;
  script += `  # Create temp directory for download\n`;
  script += `  local temp_dir=$(mktemp -d)\n`;
  script += `  local zip_file="$temp_dir/$dep_name.zip"\n`;
  script += `  \n`;
  script += `  # Download the component\n`;
  script += `  if ! curl -sL -f "$download_url" -o "$zip_file" 2>/dev/null; then\n`;
  script += `    echo "    ⚠ Failed to download $dep_name from $download_url"\n`;
  script += `    rm -rf "$temp_dir"\n`;
  script += `    return 1\n`;
  script += `  fi\n`;
  script += `  \n`;
  script += `  # Extract and install\n`;
  script += `  if ! unzip -q "$zip_file" -d "$temp_dir" 2>/dev/null; then\n`;
  script += `    echo "    ⚠ Failed to extract $dep_name"\n`;
  script += `    rm -rf "$temp_dir"\n`;
  script += `    return 1\n`;
  script += `  fi\n`;
  script += `  \n`;
  script += `  # Run the dependency's install script (handles nested dependencies)\n`;
  script += `  local extracted_dir="$temp_dir/$dep_name"\n`;
  script += `  if [ -f "$extracted_dir/install.sh" ]; then\n`;
  script += `    chmod +x "$extracted_dir/install.sh"\n`;
  script += `    # Run with AUTO_INSTALL to skip prompts\n`;
  script += `    (cd "$extracted_dir" && AUTO_INSTALL=1 ./install.sh) || {\n`;
  script += `      echo "    ⚠ Failed to install $dep_name"\n`;
  script += `      rm -rf "$temp_dir"\n`;
  script += `      return 1\n`;
  script += `    }\n`;
  script += `  fi\n`;
  script += `  \n`;
  script += `  # Cleanup\n`;
  script += `  rm -rf "$temp_dir"\n`;
  script += `  \n`;
  script += `  # Track that this was auto-installed\n`;
  script += `  AUTO_INSTALLED_DEPS="$AUTO_INSTALLED_DEPS $dep_name"\n`;
  script += `  \n`;
  script += `  return 0\n`;
  script += `}\n\n`;
  return script;
}

/**
 * Generate dependency check code for bash scripts
 * @param {Array} requires - Array of required dependency names
 * @returns {string} Bash code for checking dependencies
 */
function generateDependencyChecks(requires) {
  let script = `# Check and auto-install dependencies\n`;
  script += `echo "Checking dependencies..."\n`;
  script += `AUTO_INSTALLED_DEPS=""\n`;
  script += `FAILED_DEPS=""\n\n`;

  requires.forEach((dep) => {
    script += `# Check for ${dep}\n`;
    script += `if [ ! -f "$COMPONENTS_BASE/$PARTIALS_DIR/${dep}/manifest.json" ] && [ ! -f "$COMPONENTS_BASE/$SECTIONS_DIR/${dep}/manifest.json" ]; then\n`;
    script += `  # Try to auto-install (most dependencies are partials)\n`;
    script += `  if ! install_dependency "${dep}" "partial"; then\n`;
    script += `    # Try as section if partial fails\n`;
    script += `    if ! install_dependency "${dep}" "section"; then\n`;
    script += `      FAILED_DEPS="$FAILED_DEPS ${dep}"\n`;
    script += `    fi\n`;
    script += `  fi\n`;
    script += `else\n`;
    script += `  echo "  ✓ ${dep} (already installed)"\n`;
    script += `fi\n`;
  });

  script += `\n`;
  script += `# Check if any dependencies failed\n`;
  script += `if [ -n "$FAILED_DEPS" ]; then\n`;
  script += `  echo ""\n`;
  script += `  echo "⚠ Warning: Could not install some dependencies:$FAILED_DEPS"\n`;
  script += `  echo ""\n`;
  script += `  echo "You may need to download them manually from:"\n`;
  script += `  echo "  https://nunjucks-components.com/downloads/"\n`;
  script += `  echo ""\n`;
  script += `  # Skip interactive prompt if called from bundle installer or auto-install mode\n`;
  script += `  if [ -n "$BUNDLE_INSTALL" ] || [ -n "$AUTO_INSTALL" ]; then\n`;
  script += `    echo "  (Auto-continuing)"\n`;
  script += `    echo ""\n`;
  script += `  else\n`;
  script += `    read -p "Continue installation anyway? (y/n) " -n 1 -r\n`;
  script += `    echo\n`;
  script += `    if [[ ! $REPLY =~ ^[Yy]$ ]]; then\n`;
  script += `      exit 1\n`;
  script += `    fi\n`;
  script += `  fi\n`;
  script += `fi\n\n`;

  return script;
}

/**
 * Generate cleanup logic for individual component installations
 * @returns {string} Bash code for cleanup
 */
function generateCleanupLogic() {
  let script = `# Cleanup extracted component directory if not called from bundle or auto-install\n`;
  script += `if [ -z "$BUNDLE_INSTALL" ] && [ -z "$AUTO_INSTALL" ] && [ -f "$COMPONENT_DIR/package.json" ] && grep -q "\\"x-nunjucks-component\\"" "$COMPONENT_DIR/package.json" 2>/dev/null; then\n`;
  script += `  # Check if component directory is in project root (not in a bundle structure)\n`;
  script += `  COMPONENT_BASENAME="$(basename "$COMPONENT_DIR")"\n`;
  script += `  if [ "$COMPONENT_DIR" = "$PROJECT_ROOT/$COMPONENT_BASENAME" ]; then\n`;
  script += `    echo ""\n`;
  script += `    read -p "Remove extracted component directory $COMPONENT_BASENAME? (y/n) " -n 1 -r\n`;
  script += `    echo\n`;
  script += `    if [[ $REPLY =~ ^[Yy]$ ]]; then\n`;
  script += `      rm -rf "$COMPONENT_DIR"\n`;
  script += `      echo "✓ Cleaned up $COMPONENT_BASENAME"\n`;
  script += `    fi\n`;
  script += `  fi\n`;
  script += `fi\n\n`;
  return script;
}

/**
 * Generate installation script for complete bundle
 * @param {Object} components - Object with sections and partials arrays
 * @returns {string} Bundle installation script
 */
export function generateBundleInstallScript(components) {
  let script = `#!/bin/bash\n\n`;
  script += `# Nunjucks Components Bundle Installation Script\n\n`;

  script += `set -e\n\n`;

  script += `echo "🔧 Installing Nunjucks Components Bundle..."\n`;
  script += `echo ""\n\n`;

  // Determine project root and check for required config file
  script += `SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"\n\n`;
  script += `# Check for config file - in current directory or parent (if running from inside bundle)\n`;
  script += `if [ -f "nunjucks-components.config.json" ]; then\n`;
  script += `  PROJECT_ROOT="$(pwd)"\n`;
  script += `elif [ -f "../nunjucks-components.config.json" ]; then\n`;
  script += `  # Running from inside bundle directory, move up to project root\n`;
  script += `  cd ..\n`;
  script += `  PROJECT_ROOT="$(pwd)"\n`;
  script += `else\n`;
  script += `  echo "❌ Error: nunjucks-components.config.json not found"\n`;
  script += `  echo "Please create this config file in your project root before installing components."\n`;
  script += `  echo ""\n`;
  script += `  echo "Example nunjucks-components.config.json:"\n`;
  script += `  echo '{\n  "componentsBasePath": "lib/layouts/components",\n  "sectionsDir": "sections",\n  "partialsDir": "_partials"\n}'\n`;
  script += `  exit 1\n`;
  script += `fi\n\n`;
  script += `export PROJECT_ROOT\n`;
  script += `export BUNDLE_INSTALL=1\n\n`;

  // Load configuration
  script += `# Load component paths from config\n`;
  script += `COMPONENTS_BASE=$(node -p "require('./nunjucks-components.config.json').componentsBasePath")\n`;
  script += `SECTIONS_DIR=$(node -p "require('./nunjucks-components.config.json').sectionsDir")\n`;
  script += `PARTIALS_DIR=$(node -p "require('./nunjucks-components.config.json').partialsDir")\n\n`;

  // Installation mode selection
  script += generateModeSelection();

  // Install partials first (dependencies)
  script += `# Install partials (dependencies first)\n`;
  script += `echo "📦 Installing partials..."\n`;
  script += `echo ""\n\n`;

  script += `INSTALLED_COUNT=0\n`;
  script += `SKIPPED_COUNT=0\n`;
  script += `REQUIRED_DEPS=()\n\n`;

  // Build list of components to install and their dependencies
  script += `# Build list of components to install/update\n`;
  script += `COMPONENTS_TO_INSTALL=()\n\n`;

  components.partials.forEach((partial) => {
    script += `if [ -f "$SCRIPT_DIR/partials/${partial.name}/install.sh" ]; then\n`;
    script += `  if [ "$MODE" = "update" ] && [ ! -f "$COMPONENTS_BASE/$PARTIALS_DIR/${partial.name}/manifest.json" ]; then\n`;
    script += `    # Component not installed, skip in update mode\n`;
    script += `    true\n`;
    script += `  else\n`;
    script += `    COMPONENTS_TO_INSTALL+=("partial:${partial.name}")\n`;

    // Add dependencies if component has them
    if (partial.manifest && partial.manifest.requires && partial.manifest.requires.length > 0) {
      partial.manifest.requires.forEach((dep) => {
        script += `    REQUIRED_DEPS+=("${dep}")\n`;
      });
    }

    script += `  fi\n`;
    script += `fi\n\n`;
  });

  // Install required dependencies first
  script += generateDependencyInstallation();

  // Now install partials
  components.partials.forEach((partial) => {
    script += generateComponentInstallation(partial, 'partial', 'PARTIALS_DIR');
  });

  // Install sections
  script += `# Install sections\n`;
  script += `echo "📦 Installing sections..."\n`;
  script += `echo ""\n\n`;

  // Collect section dependencies
  components.sections.forEach((section) => {
    const hasDependencies = section.manifest && section.manifest.requires && section.manifest.requires.length > 0;

    if (hasDependencies) {
      script += `if [ -f "$SCRIPT_DIR/sections/${section.name}/install.sh" ]; then\n`;
      script += `  if [ "$MODE" = "update" ] && [ ! -f "$COMPONENTS_BASE/$SECTIONS_DIR/${section.name}/manifest.json" ]; then\n`;
      script += `    # Component not installed, skip in update mode\n`;
      script += `    true\n`;
      script += `  else\n`;

      section.manifest.requires.forEach((dep) => {
        script += `    # Install dependency if needed: ${dep}\n`;
        script += `    if [ ! -f "$COMPONENTS_BASE/$PARTIALS_DIR/${dep}/manifest.json" ] && [ -f "$SCRIPT_DIR/partials/${dep}/install.sh" ]; then\n`;
        script += `      echo "Installing required dependency: ${dep}"\n`;
        script += `      cd "$PROJECT_ROOT"\n`;
        script += `      (cd "$SCRIPT_DIR/partials/${dep}" && ./install.sh)\n`;
        script += `      INSTALLED_COUNT=$((INSTALLED_COUNT + 1))\n`;
        script += `      echo ""\n`;
        script += `    fi\n`;
      });

      script += `  fi\n`;
      script += `fi\n`;
    }
  });

  script += `\n`;

  // Now install sections
  components.sections.forEach((section) => {
    script += generateComponentInstallation(section, 'section', 'SECTIONS_DIR');
  });

  // Final output
  script += generateFinalOutput();

  return script;
}

/**
 * Generate mode selection code for bundle install
 * @returns {string} Bash code for mode selection
 */
function generateModeSelection() {
  let script = `# Check installation mode\n`;
  script += `MODE="all"\n`;
  script += `if [ "$1" = "--update-only" ] || [ "$1" = "-u" ]; then\n`;
  script += `  MODE="update"\n`;
  script += `  echo "📦 Update mode: Only updating existing components"\n`;
  script += `  echo ""\n`;
  script += `elif [ -d "$COMPONENTS_BASE" ]; then\n`;
  script += `  echo "Existing components directory found."\n`;
  script += `  echo ""\n`;
  script += `  echo "Choose installation mode:"\n`;
  script += `  echo "  1) Install all components (default)"\n`;
  script += `  echo "  2) Update existing components only"\n`;
  script += `  echo ""\n`;
  script += `  read -p "Select [1-2]: " -n 1 -r\n`;
  script += `  echo\n`;
  script += `  echo ""\n`;
  script += `  if [[ $REPLY == "2" ]]; then\n`;
  script += `    MODE="update"\n`;
  script += `    echo "📦 Update mode: Only updating existing components"\n`;
  script += `  else\n`;
  script += `    echo "📦 Full install mode: Installing all components"\n`;
  script += `  fi\n`;
  script += `  echo ""\n`;
  script += `fi\n\n`;
  return script;
}

/**
 * Generate dependency installation code
 * @returns {string} Bash code for dependency installation
 */
function generateDependencyInstallation() {
  let script = `# Install required dependencies\n`;
  script += `if [ \${#REQUIRED_DEPS[@]} -gt 0 ]; then\n`;
  script += `  UNIQUE_DEPS=($(printf "%s\\n" "\${REQUIRED_DEPS[@]}" | sort -u))\n`;
  script += `  for dep in "\${UNIQUE_DEPS[@]}"; do\n`;
  script += `    if [ -f "$SCRIPT_DIR/partials/$dep/install.sh" ]; then\n`;
  script += `      if [ ! -f "$COMPONENTS_BASE/$PARTIALS_DIR/$dep/manifest.json" ]; then\n`;
  script += `        echo "Installing required dependency: $dep"\n`;
  script += `        cd "$PROJECT_ROOT"\n`;
  script += `        (cd "$SCRIPT_DIR/partials/$dep" && ./install.sh)\n`;
  script += `        INSTALLED_COUNT=$((INSTALLED_COUNT + 1))\n`;
  script += `        echo ""\n`;
  script += `      fi\n`;
  script += `    fi\n`;
  script += `  done\n`;
  script += `fi\n\n`;
  return script;
}

/**
 * Generate component installation code
 * @param {Object} component - Component metadata
 * @param {string} type - Component type (partial or section)
 * @param {string} dirVar - Variable name for directory (PARTIALS_DIR or SECTIONS_DIR)
 * @returns {string} Bash code for component installation
 */
function generateComponentInstallation(component, type, dirVar) {
  const typeDir = type === 'partial' ? 'partials' : 'sections';
  let script = `if [ -f "$SCRIPT_DIR/${typeDir}/${component.name}/install.sh" ]; then\n`;
  script += `  if [ "$MODE" = "update" ] && [ ! -f "$COMPONENTS_BASE/$${dirVar}/${component.name}/manifest.json" ]; then\n`;
  script += `    echo "⊘ Skipping ${component.name} (not currently installed)"\n`;
  script += `    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))\n`;
  script += `  else\n`;
  script += `    echo "Installing ${component.name}..."\n`;
  script += `    cd "$PROJECT_ROOT"\n`;
  script += `    (cd "$SCRIPT_DIR/${typeDir}/${component.name}" && ./install.sh)\n`;
  script += `    INSTALLED_COUNT=$((INSTALLED_COUNT + 1))\n`;
  script += `    echo ""\n`;
  script += `  fi\n`;
  script += `fi\n\n`;
  return script;
}

/**
 * Generate final output and cleanup code
 * @returns {string} Bash code for final output
 */
function generateFinalOutput() {
  let script = `echo ""\n`;
  script += `echo "✓ Bundle installation complete"\n`;
  script += `echo ""\n`;
  script += `echo "Installed/Updated: $INSTALLED_COUNT components"\n`;
  script += `if [ "$MODE" = "update" ] && [ $SKIPPED_COUNT -gt 0 ]; then\n`;
  script += `  echo "Skipped: $SKIPPED_COUNT components (not previously installed)"\n`;
  script += `fi\n`;
  script += `echo ""\n`;
  script += `echo "See individual README files for usage instructions."\n`;

  // Add cleanup prompt for the bundle directory
  script += `\n# Cleanup: ask user if they want to remove the bundle directory\n`;
  script += `echo ""\n`;
  script += `read -p "Remove the nunjucks-components bundle directory? (y/n) " -n 1 -r\n`;
  script += `echo\n`;
  script += `if [[ $REPLY =~ ^[Yy]$ ]]; then\n`;
  script += `  rm -rf "$SCRIPT_DIR"\n`;
  script += `  echo "✓ Bundle directory removed"\n`;
  script += `else\n`;
  script += `  echo "Bundle directory kept at: $SCRIPT_DIR"\n`;
  script += `fi\n`;

  return script;
}
