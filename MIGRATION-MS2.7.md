# Metalsmith 2.7.0 Migration Plan

## Overview

Migrate nunjucks-components from Metalsmith 2.6.3 to 2.7.0, replacing `metalsmith-static-files` plugin with the native `statik` method.

## Key Changes in Metalsmith 2.7.0

- **`statik` method**: Pass-through file copying without loading into memory
- **Static files must be in source directory** to use `statik`
- **Node.js >= 16.0.0** required (project already uses >= 18.0.0)
- **`clean(true)` behavior**: Deletion now occurs before reading files

## Strategy

Move static assets (images, audio, icons, lotties) from `lib/assets/` to `src/assets/`, while keeping CSS/JS bundler entry points (`main.css`, `main.js`, `styles/`) in `lib/assets/` since they are bundler inputs, not static pass-through files.

---

## Phase 1: Directory Restructuring

### Move to `src/assets/`:
```
lib/assets/images/      → src/assets/images/
lib/assets/audio/       → src/assets/audio/
lib/assets/icons/       → src/assets/icons/
lib/assets/lotties/     → src/assets/lotties/
lib/assets/awards/      → src/assets/awards/
lib/assets/wg-logo.svg  → src/assets/wg-logo.svg
```

### Keep in `lib/assets/`:
```
lib/assets/main.css     (bundler entry point)
lib/assets/main.js      (bundler entry point)
lib/assets/styles/      (CSS imports for PostCSS)
```

---

## Phase 2: Update metalsmith.js

### 2.1 Remove metalsmith-static-files import
```javascript
// DELETE this line:
import assets from 'metalsmith-static-files';
```

### 2.2 Add statik configuration after destination
```javascript
.destination('./build')
.statik(['assets'])  // ADD: static files in src/assets/ copied without processing
```

### 2.3 Remove assets plugin usage
```javascript
// DELETE this block (around line 302-308):
.use(
  assets({
    source: 'lib/assets/',
    destination: 'assets/',
    ignore: ['main.css', 'main.js', 'styles/']
  })
)
```

### 2.4 Update watch patterns
```javascript
// CHANGE from:
.watch(isProduction ? false : [
  'src/**/*',
  'lib/layouts/**/*',
  'lib/assets/**/*',
  'lib/data/**/*',
  '!lib/layouts/components/sections/maps/modules/helpers/icon-loader.js'
])

// TO:
.watch(isProduction ? false : [
  'src/**/*',
  'lib/layouts/**/*',
  'lib/assets/main.css',
  'lib/assets/main.js',
  'lib/assets/styles/**/*',
  'lib/data/**/*',
  '!lib/layouts/components/sections/maps/modules/helpers/icon-loader.js'
])
```

---

## Phase 3: Update package.json

### 3.1 Update Metalsmith version
```json
"metalsmith": "^2.7.0"
```

### 3.2 Remove metalsmith-static-files dependency
```json
// DELETE:
"metalsmith-static-files": "^2.0.0"
```

---

## Phase 4: Update test/build-integration.test.js

### 4.1 Remove metalsmith-static-files import
```javascript
// DELETE:
import assets from 'metalsmith-static-files';
```

### 4.2 Update Asset Handling test
```javascript
// CHANGE the "should copy static assets" test to use statik:
it('should copy static assets', (done) => {
  const metalsmith = Metalsmith(projectRoot)
    .clean(false)
    .source('./src')
    .destination(testBuildDir)
    .statik(['assets'])  // Use new statik method
    .use(drafts(false));

  metalsmith.build((err) => {
    assert.ok(!err, `Build should complete without errors: ${err ? err.message : ''}`);

    // Check that assets were copied
    assert.ok(existsSync(join(testBuildDir, 'assets')), 'Assets directory should be created');
    assert.ok(existsSync(join(testBuildDir, 'assets/images')), 'Images directory should be copied');
    // Note: main.css is now handled by bundler, not static copy

    done();
  });
});
```

---

## Phase 5: Update Documentation

### 5.1 Update CLAUDE.md
Change directory structure references:
```markdown
// FROM:
- `lib/assets/` - Images, main CSS/JS entry points, and global styles

// TO:
- `src/assets/` - Static images, audio, icons, lotties (pass-through copy)
- `lib/assets/` - CSS/JS entry points and styles (bundler inputs)
```

### 5.2 Update Build Output section
```markdown
// FROM:
- `lib/assets/` - Images, main CSS/JS entry points, and global styles
  - `main.css` - Main CSS entry point
  - `main.js` - Main JavaScript entry point
  - `styles/` - Design tokens and base styles

// TO:
- `src/assets/` - Static images, audio, icons, lotties (copied to build/assets/)
- `lib/assets/` - CSS/JS entry points (bundler inputs, not static files)
  - `main.css` - Main CSS entry point (processed by bundler)
  - `main.js` - Main JavaScript entry point (processed by bundler)
  - `styles/` - Design tokens and base styles (imported by bundler)
```

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `metalsmith.js` | Remove `metalsmith-static-files` import, add `statik(['assets'])`, remove `assets()` plugin, update watch patterns |
| `package.json` | Update Metalsmith to ^2.7.0, remove `metalsmith-static-files` |
| `test/build-integration.test.js` | Remove `metalsmith-static-files` import, update Asset Handling test |
| `CLAUDE.md` | Update directory structure documentation |
| `lib/plugins/component-package-generator.js` | Add `addGeneratedFilesToMetalsmith()` to preserve downloads during clean phase |

---

## Verification Steps

### Step 1: Run npm install
```bash
npm install
```

### Step 2: Run tests
```bash
npm test
```

### Step 3: Run development build
```bash
npm start
```

### Step 4: Verify in browser (http://localhost:3000)
- [ ] Images load correctly
- [ ] Favicon and icons display
- [ ] Audio/lottie files work
- [ ] CSS/JS bundling works
- [ ] Page transitions work

### Step 5: Run production build
```bash
npm run build
```

### Step 6: Verify build output
```bash
ls -la build/assets/
ls -la build/assets/images/
ls -la build/assets/main.css  # Should exist (from bundler)
```

### Step 7: Verify download packages are generated
```bash
ls -la build/downloads/
# Should contain component .zip packages
ls -la build/downloads/sections/
ls -la build/downloads/partials/
# Check for bundle file
ls -la build/downloads/*-bundle.zip
```

The `component-package-generator` plugin runs in production mode and should create:
- Individual component packages in `build/downloads/sections/` and `build/downloads/partials/`
- A complete bundle file
- Checksum files for verification

---

## Additional Fix: Component Package Generator

The `component-package-generator` plugin required modification due to a breaking change in Metalsmith 2.7.0. The plugin wrote files directly to disk during the plugin phase, but Metalsmith 2.7.0 now executes `clean(true)` AFTER plugins run but BEFORE the write phase.

### The Issue

In Metalsmith 2.7.0, the build order changed:
1. `process()` - plugins run (componentPackageGenerator writes files to disk)
2. `rm(dest)` - clean deletes everything in destination (INCLUDING downloads!)
3. statik files are copied
4. `write(files)` - only files in the `files` object are written

### The Fix

Added `addGeneratedFilesToMetalsmith()` function that reads all generated files from the downloads directory and adds them to the Metalsmith `files` object. This ensures they survive the clean phase and get written during the normal write phase.

**File modified:** `lib/plugins/component-package-generator.js`

---

## Potential Issues and Mitigations

### Issue 1: Component bundler path resolution
The bundler references `lib/assets/main.css` and `lib/assets/main.js`. These paths remain unchanged since bundler inputs stay in `lib/assets/`.

### Issue 2: PostCSS import paths
The `postcss-import` plugin uses path `['lib/assets', 'lib/assets/styles']`. This remains unchanged.

### Issue 3: Watch mode patterns
Watch patterns are explicitly updated to cover the new structure.

### Issue 4: Clean build behavior
Metalsmith 2.7.0 changes execution order for `clean(true)`. This should not affect the migration since source and destination are different directories.

---

## Rollback Plan

If migration fails:
1. Revert package.json changes
2. Run `npm install` to restore `metalsmith-static-files`
3. Revert file moves with `git checkout .`
4. Revert `metalsmith.js` changes

---

## What We Learned

### 1. Release notes can be misleading

The Metalsmith 2.7.0 changelog stated that `clean(true)` behavior changed so that "deletion occurs before reading files." This implied the clean happens at the start of the build. However, the actual implementation shows that clean happens AFTER plugins run but BEFORE the write phase. This subtle but critical difference caused the component-package-generator to fail silently.

### 2. Plugins that write directly to disk need updating

Any plugin that writes files directly to the destination directory during the plugin phase will have those files deleted before Metalsmith's write phase in 2.7.0. The fix is to add generated files to the Metalsmith `files` object so they survive the clean and get written during the normal write phase.

### 3. The `statik` method requires files in the source directory

Unlike `metalsmith-static-files` which could copy from any directory, the native `statik` method only works with files inside the source directory. This required restructuring the project to move static assets from `lib/assets/` to `src/assets/`.

### 4. Separate concerns: static files vs bundler inputs

The migration clarified an important architectural distinction:
- **Static files** (`src/assets/`): Images, audio, icons, lotties - copied as-is via `statik`
- **Bundler inputs** (`lib/assets/`): CSS/JS entry points and styles - processed by `metalsmith-bundled-components`

This separation makes the build process more explicit and maintainable.

### 5. Debug logging is essential for understanding build order

Adding console.log statements at key points in the component-package-generator revealed that files were being created successfully but then deleted. Without this debugging, the silent failure would have been much harder to diagnose.

### 6. Always verify the actual behavior, not just the documentation

The fix required reading the Metalsmith 2.7.0 source code to understand the actual build order. The GitHub release notes and changelog provided useful context but didn't fully explain the implications for plugins that write directly to disk.
