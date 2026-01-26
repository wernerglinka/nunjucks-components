#!/bin/bash

# Installation Test Script for Nunjucks Components
# Tests both bundle and individual component installation in a mock project

# Don't use set -e as we want to handle errors ourselves

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/build"
TEST_DIR="$PROJECT_ROOT/.test-installation"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

# Print colored output
print_header() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""
}

print_test() {
  echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
  echo -e "${GREEN}  ✓ $1${NC}"
  ((TESTS_PASSED++))
}

print_error() {
  echo -e "${RED}  ✗ $1${NC}"
  ((TESTS_FAILED++))
}

print_info() {
  echo -e "  $1"
}

# Cleanup function
cleanup() {
  if [ -d "$TEST_DIR" ]; then
    rm -rf "$TEST_DIR"
  fi
}

# Check if build exists
check_build() {
  print_header "Checking Prerequisites"

  if [ ! -d "$BUILD_DIR/downloads" ]; then
    echo -e "${RED}Error: Build directory not found at $BUILD_DIR/downloads${NC}"
    echo "Run 'NODE_ENV=production npm run build' first"
    exit 1
  fi

  if [ ! -f "$BUILD_DIR/downloads/nunjucks-components.zip" ]; then
    echo -e "${RED}Error: Bundle not found at $BUILD_DIR/downloads/nunjucks-components.zip${NC}"
    echo "Run 'NODE_ENV=production npm run build' first"
    exit 1
  fi

  print_success "Build directory exists"
  print_success "Bundle ZIP exists"
}

# Create mock project structure
setup_mock_project() {
  print_header "Setting Up Mock Project"

  # Clean up any previous test
  cleanup

  # Create mock project directory
  mkdir -p "$TEST_DIR"
  cd "$TEST_DIR"

  # Create config file
  cat > nunjucks-components.config.json << 'EOF'
{
  "componentsBasePath": "lib/layouts/components",
  "sectionsDir": "sections",
  "partialsDir": "_partials"
}
EOF

  print_success "Created mock project directory"
  print_success "Created nunjucks-components.config.json"
}

# Test bundle installation
test_bundle_installation() {
  print_header "Testing Bundle Installation"

  cd "$TEST_DIR"

  # Copy and extract bundle
  print_test "Extracting bundle..."
  cp "$BUILD_DIR/downloads/nunjucks-components.zip" .
  unzip -q nunjucks-components.zip

  if [ -d "nunjucks-components" ]; then
    print_success "Bundle extracted successfully"
  else
    print_error "Bundle extraction failed"
    return 1
  fi

  # Check install script exists
  if [ -f "nunjucks-components/install-all.sh" ]; then
    print_success "install-all.sh exists"
  else
    print_error "install-all.sh not found"
    return 1
  fi

  # Run installation (non-interactive, auto-yes to prompts)
  print_test "Running bundle installation..."

  # We need to handle the interactive prompts
  # The script asks about install mode and cleanup
  # Use 'yes' to auto-respond, but we need to be careful

  # First, let's check if we can run with environment variables
  export PROJECT_ROOT="$TEST_DIR"
  export BUNDLE_INSTALL=1

  # Run the install script, piping 'a' for "all" and 'n' for "don't delete"
  echo -e "a\nn" | ./nunjucks-components/install-all.sh 2>&1 | tail -20

  INSTALL_EXIT_CODE=${PIPESTATUS[1]}

  if [ $INSTALL_EXIT_CODE -eq 0 ]; then
    print_success "Bundle installation completed"
  else
    print_error "Bundle installation failed with exit code $INSTALL_EXIT_CODE"
    return 1
  fi
}

# Verify installed components
verify_bundle_installation() {
  print_header "Verifying Bundle Installation"

  cd "$TEST_DIR"

  SECTIONS_DIR="lib/layouts/components/sections"
  PARTIALS_DIR="lib/layouts/components/_partials"

  # Check sections directory exists
  if [ -d "$SECTIONS_DIR" ]; then
    print_success "Sections directory created"
  else
    print_error "Sections directory not found"
    return 1
  fi

  # Check partials directory exists
  if [ -d "$PARTIALS_DIR" ]; then
    print_success "Partials directory created"
  else
    print_error "Partials directory not found"
    return 1
  fi

  # Count installed sections
  SECTION_COUNT=$(find "$SECTIONS_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
  print_info "Installed $SECTION_COUNT sections"

  # Count installed partials
  PARTIAL_COUNT=$(find "$PARTIALS_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
  print_info "Installed $PARTIAL_COUNT partials"

  # Verify specific components have expected files
  print_test "Verifying component file structure..."

  # Check hero section (common component)
  if [ -f "$SECTIONS_DIR/hero/hero.njk" ] && [ -f "$SECTIONS_DIR/hero/manifest.json" ]; then
    print_success "hero section has required files"
  else
    print_error "hero section missing required files"
  fi

  # Check text partial (common component)
  if [ -f "$PARTIALS_DIR/text/text.njk" ] && [ -f "$PARTIALS_DIR/text/manifest.json" ]; then
    print_success "text partial has required files"
  else
    print_error "text partial missing required files"
  fi

  # Check podcast section has modules (root-level modules)
  if [ -d "$SECTIONS_DIR/podcast/modules" ]; then
    if [ -f "$SECTIONS_DIR/podcast/modules/load-shikwasa.js" ] && [ -f "$SECTIONS_DIR/podcast/modules/rss-parser.js" ]; then
      print_success "podcast section has modules directory with files"
    else
      print_error "podcast section modules missing expected files"
    fi
  else
    print_error "podcast section missing modules directory"
  fi

  # Check calendar section has modules (nested structure)
  if [ -d "$SECTIONS_DIR/calendar/modules" ]; then
    if [ -d "$SECTIONS_DIR/calendar/modules/providers" ] && [ -d "$SECTIONS_DIR/calendar/modules/helpers" ]; then
      print_success "calendar section has modules with providers/helpers structure"
    else
      print_error "calendar section modules missing expected subdirectories"
    fi
  else
    print_error "calendar section missing modules directory"
  fi

  # Check search partial has modules (helpers subdirectory)
  if [ -d "$PARTIALS_DIR/search/modules" ]; then
    if [ -f "$PARTIALS_DIR/search/modules/helpers/load-fuse.js" ]; then
      print_success "search partial has modules/helpers directory"
    else
      print_error "search partial modules missing expected files"
    fi
  else
    print_error "search partial missing modules directory"
  fi
}

# Test individual component installation
test_individual_installation() {
  print_header "Testing Individual Component Installation"

  # Clear environment variables from bundle test
  unset PROJECT_ROOT
  unset BUNDLE_INSTALL

  # Create a completely separate mock project for individual test
  # Use a location outside the main test dir to avoid config file confusion
  INDIVIDUAL_TEST_DIR="/tmp/nunjucks-individual-test-$$"
  rm -rf "$INDIVIDUAL_TEST_DIR" 2>/dev/null || true
  mkdir -p "$INDIVIDUAL_TEST_DIR"
  cd "$INDIVIDUAL_TEST_DIR"

  # Create config file
  cat > nunjucks-components.config.json << 'EOF'
{
  "componentsBasePath": "lib/layouts/components",
  "sectionsDir": "sections",
  "partialsDir": "_partials"
}
EOF

  print_success "Created individual test directory"

  # Test installing a single section (hero)
  print_test "Installing hero section individually..."

  cp "$BUILD_DIR/downloads/sections/hero.zip" .
  unzip -q hero.zip

  if [ -d "hero" ]; then
    print_success "hero.zip extracted"
  else
    print_error "hero.zip extraction failed"
    rm -rf "$INDIVIDUAL_TEST_DIR"
    return 1
  fi

  # Run the individual install script
  cd hero

  # The script will ask about cleanup - respond 'n' to keep
  echo "n" | ./install.sh 2>&1 | tail -15

  INSTALL_EXIT_CODE=${PIPESTATUS[1]}

  cd "$INDIVIDUAL_TEST_DIR"

  if [ $INSTALL_EXIT_CODE -eq 0 ]; then
    print_success "Individual component installation completed"
  else
    print_error "Individual component installation failed"
    return 1
  fi

  # Verify installation
  if [ -f "lib/layouts/components/sections/hero/hero.njk" ]; then
    print_success "hero.njk installed correctly"
  else
    print_error "hero.njk not found in expected location"
  fi

  if [ -f "lib/layouts/components/sections/hero/manifest.json" ]; then
    print_success "manifest.json installed correctly"
  else
    print_error "manifest.json not found in expected location"
  fi

  # Cleanup individual test directory
  rm -rf "$INDIVIDUAL_TEST_DIR"
}

# Test missing config error
test_missing_config_error() {
  print_header "Testing Error Handling"

  # Clear any environment variables from previous tests
  unset PROJECT_ROOT
  unset BUNDLE_INSTALL

  # Create a directory without config - use /tmp to be completely isolated
  NO_CONFIG_DIR="/tmp/nunjucks-no-config-test-$$"
  rm -rf "$NO_CONFIG_DIR" 2>/dev/null || true
  mkdir -p "$NO_CONFIG_DIR"
  cd "$NO_CONFIG_DIR"

  print_test "Testing installation without config file..."

  cp "$BUILD_DIR/downloads/sections/hero.zip" .
  unzip -q hero.zip

  cd hero

  # This should fail because no config exists
  # Run in a subshell to isolate environment
  OUTPUT=$(env -u PROJECT_ROOT -u BUNDLE_INSTALL ./install.sh 2>&1 || true)

  if echo "$OUTPUT" | grep -q "nunjucks-components.config.json not found"; then
    print_success "Correctly reports missing config file"
  else
    print_error "Did not report missing config file"
    print_info "Output was: $OUTPUT"
  fi

  # Cleanup
  rm -rf "$NO_CONFIG_DIR"
  cd "$TEST_DIR"
}

# Print summary
print_summary() {
  print_header "Test Summary"

  TOTAL=$((TESTS_PASSED + TESTS_FAILED))

  echo -e "  Total tests: $TOTAL"
  echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"

  if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    echo -e "${RED}Some tests failed!${NC}"
    return 1
  else
    echo ""
    echo -e "${GREEN}All tests passed!${NC}"
    return 0
  fi
}

# Main execution
main() {
  echo ""
  echo -e "${BLUE}Nunjucks Components Installation Test${NC}"
  echo -e "${BLUE}======================================${NC}"

  # Trap to cleanup on exit
  trap cleanup EXIT

  check_build
  setup_mock_project
  test_bundle_installation
  verify_bundle_installation
  test_individual_installation
  test_missing_config_error

  print_summary
}

# Run main
main
