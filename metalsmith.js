/**
 * Metalsmith Build Configuration
 *
 * This file configures how Metalsmith builds your site. Each section is documented
 * to help beginners understand what's happening at each step.
 */

// These are built-in Node.js modules needed for file paths and operations
import { fileURLToPath } from 'node:url'; // Converts file:// URLs to file paths
import path, { dirname } from 'node:path'; // Handles file paths across different OS
import * as fs from 'node:fs'; // File system operations (read/write files)

// The main Metalsmith library and plugins that transform your content
import Metalsmith from 'metalsmith'; // The core static site generator
import drafts from '@metalsmith/drafts'; // Excludes draft content from builds
import generateMapsIcons from './lib/plugins/generate-maps-icons.js'; // Generates maps icon registry
import componentPackageGenerator from './lib/plugins/component-package-generator/index.js'; // Generates downloadable component packages
import collections from '@metalsmith/collections';
import paginatePages from 'metalsmith-sectioned-blog-pagination';
import search from 'metalsmith-search'; // Adds search functionality
import permalinks from '@metalsmith/permalinks'; // Creates clean URLs
import menus from 'metalsmith-menu-plus'; // Generates navigation menus
import layouts from '@metalsmith/layouts'; // Applies templates to content
import safeLinks from 'metalsmith-safe-links';

import componentDependencyBundler from 'metalsmith-bundled-components';

import assets from 'metalsmith-static-files'; // Copies static assets to build
import optimizeImages from 'metalsmith-optimize-images'; // Optimizes images for web
import htmlMinifier from 'metalsmith-optimize-html'; // Minifies HTML in production

import seo from 'metalsmith-seo'; // Adds SEO metadata to pages

import postcssImport from 'postcss-import'; // Processes @import statements
import autoprefixer from 'autoprefixer'; // Adds browser prefixes to CSS
import cssnano from 'cssnano'; // Minifies CSS
import stylelint from 'stylelint'; // CSS linting
import { performance } from 'node:perf_hooks'; // Measures build performance
import browserSync from 'browser-sync'; // Live-reload development server

// These variables help determine the current directory and file paths
const thisFile = fileURLToPath(import.meta.url); // Gets the actual file path of this script
const thisDirectory = dirname(thisFile); // Gets the directory containing this script
const mainFile = process.argv[1]; // Gets the file that was executed by Node.js

/**
 * ESM (ECMAScript Modules) doesn't support importing JSON directly
 * So we read the package.json file manually to get dependency information
 * @type {Object}
 */
const dependencies = JSON.parse(fs.readFileSync(path.join(thisDirectory, 'package.json'))).dependencies;

/**
 * TEMPLATE ENGINE SETUP
 * Import custom Nunjucks filters that extend the template engine
 * These filters provide additional functionality like date formatting,
 * string manipulation, and more.
 */
import * as nunjucksFilters from './nunjucks-filters/index.js';

/**
 * Configuration options for the Nunjucks template engine
 * @type {Object}
 */
const engineOptions = {
  path: ['lib/layouts'], // Where to find template files
  filters: nunjucksFilters // Custom filters for templates
};

/**
 * ENVIRONMENT SETUP
 * Determine if we're in production mode based on NODE_ENV environment variable
 * @type {boolean}
 */
const isProduction = process.env.NODE_ENV !== 'development';

/**
 * Base path for serving the site in a subdirectory
 * e.g., https://example.com/subdirectory/
 * or https://wernerglinka.github.io/metalsmith2025-structured-content-starter/
 */
const basePath = process.env.BASE_PATH || '';

// Variable to hold the development server instance
let devServer = null;

/**
 * Create a new Metalsmith instance
 * This is the core object that will build our site
 * @type {Metalsmith}
 */
const metalsmith = Metalsmith(thisDirectory);

// Pass DEBUG environment variable if it exists
if (process.env.DEBUG) {
  metalsmith.env('DEBUG', process.env.DEBUG);
}

/**
 * Configure the basic Metalsmith settings
 * These determine how Metalsmith will process our files
 */
metalsmith
  // Clean the destination directory before building
  .clean(true)
  // Ignore macOS system files
  .ignore(['**/.DS_Store'])
  .watch(
    isProduction
      ? false
      : [
          'src/**/*',
          'lib/layouts/**/*',
          'lib/assets/**/*',
          'lib/data/**/*',
          '!lib/layouts/components/sections/maps/modules/helpers/icon-loader.js' // Exclude generated file to prevent rebuild loops
        ]
  )
  // Pass NODE_ENV to plugins
  .env('NODE_ENV', process.env.NODE_ENV)
  // Where to find source files
  .source('./src')
  // Where to output the built site
  .destination('./build')
  .metadata({
    msVersion: dependencies.metalsmith,
    nodeVersion: process.version
  })

  /**
   * Load external data files into metadata
   * This runs on each build, so changes to data files are picked up during watch mode
   * Each JSON file in lib/data becomes a key under metadata.data (e.g., site.json -> data.site)
   * Subdirectories are processed recursively
   */
  .use((files, metalsmith, done) => {
    const dataDir = path.join(metalsmith.directory(), 'lib', 'data');

    const processDirectory = (dirPath) => {
      const dirFiles = fs.readdirSync(dirPath);
      const result = {};

      dirFiles.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          result[file] = processDirectory(filePath);
        } else if (file.endsWith('.json')) {
          const fileName = file.replace('.json', '');
          const fileContents = fs.readFileSync(filePath, 'utf8');
          try {
            result[fileName] = JSON.parse(fileContents);
          } catch (error) {
            // A malformed data file (e.g. a half-saved edit in watch mode)
            // should fail this build, not crash the process
            throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
          }
        }
      });

      return result;
    };

    metalsmith.metadata().data = processDirectory(dataDir);
    done();
  })

  // Exclude draft content in production mode
  .use(drafts(!isProduction))

  // Generate mapping icon registry from used icons
  .use(generateMapsIcons())

  /**
   * Create a collection of blog posts
   * Learn more: https://github.com/metalsmith/collections
   */
  .use(
    collections({
      blog: {
        pattern: 'blog/*.md',
        sort: 'card.date:desc'
      },
      sections: {
        pattern: 'references/sections/*.md',
        sort: 'seo.title:asc'
      },
      partials: {
        pattern: 'references/partials/*.md',
        sort: 'seo.title:asc'
      }
    })
  )

  /**
   * Create metadata for blog pagination as pages are built
   * with individual page components so we can't use the
   * pagination plugin to do this.
   * Learn more: https://github.com/wernerglinka/metalsmith-sectioned-blog-pagination
   */
  .use(
    paginatePages({
      pagesPerPage: 6,
      blogDirectory: 'blog/'
    })
  )

  /**
   * We are not using any markdown contents, only frontmatter
   * to define structured pages. Markdown content of section
   * properties will be done with a Nunjucks filter
   * Learn more: https://github.com/metalsmith/permalinks
   */
  .use(
    permalinks({
      match: '**/*.md'
    })
  )

  /**
   * Generate navigation menus
   * Learn more: https://github.com/wernerglinka/metalsmith-menu-plus
   */
  .use(
    menus({
      metadataKey: 'mainMenu', // Where to store menu data
      usePermalinks: true, // Use clean URLs in menu
      navExcludePatterns: ['404.html', 'robots.txt', 'search-index.json', 'assets/**.*'] // Files to exclude from menu
    })
  )

  /**
   * Apply templates to content
   * Learn more: https://github.com/metalsmith/layouts
   */
  .use(
    layouts({
      directory: 'lib/layouts', // Where to find templates
      transform: 'nunjucks', // Template engine to use
      pattern: ['**/*.html'], // Files to apply templates to
      engineOptions // Options for the template engine
    })
  )

  /**
   * Add search functionality
   * Learn more: https://github.com/wernerglinka/metalsmith-search
   */
  .use(
    search({
      // Only the site-level search page itself is excluded; the search
      // component reference pages under references/ should be indexed.
      // This plugin runs after permalinks, so file keys are directory-style.
      ignore: ['search/index.html', '**/search-index.json']
    })
  )

  /**
   * Process all links so external links have
   * target="_blank" and rel="noopener noreferrer"
   * attributes and internal links are relative
   * This plugin also supports a basePath option which is necessary
   * when deploying a site to a subdirectory. In this case 'basePath'
   * is set above from the BASE_PATH environment variable.
   * Learn more: https://github.com/wernerglinka/metalsmith-safe-links
   */
  .use(
    safeLinks({
      hostnames: ['localhost', 'nunjucks-components.com', 'wernerglinka.github.io'],
      basePath: basePath
    })
  )

  /**
   * Bundle main entries and component dependencies using esbuild
   * Learn more: https://github.com/wernerglinka/metalsmith-bundled-components
   */
  .use(
    componentDependencyBundler({
      basePath: 'lib/layouts/components/_partials',
      sectionsPath: 'lib/layouts/components/sections',
      mainCSSEntry: 'lib/assets/main.css',
      mainJSEntry: 'lib/assets/main.js',
      cssDest: 'assets/main.css',
      jsDest: 'assets/main.js',
      minifyOutput: isProduction,
      schema: {
        // Emit the composed editor schema for the admin to consume
        enabled: true
      },
      /**
       * Cascade layers. Each component's CSS is wrapped in
       * @layer components.<name>, and lib/overrides/<name>/<name>.css in
       * @layer site.<name>, so an override wins over the component it
       * overrides without needing a more specific selector. The order is
       * the whole cascade of the site, lowest first. Anything left
       * unlayered would beat all of it, which is why every import and
       * rule in lib/assets/main.css names its layer, and why the
       * self-hosted vendor stylesheets (Shikwasa, Leaflet, OpenLayers)
       * are wrapped in the `vendor` layer when they are copied.
       */
      layers: {
        enabled: true,
        /**
         * `vendor` sits between `base` and `components`: third-party
         * widget CSS (Leaflet, OpenLayers, Shikwasa) must beat the
         * generic element styles in `base` (a, svg, headings), while
         * components that deliberately restyle a vendor widget
         * (podcast's player theme) must beat the vendor defaults.
         */
        order: ['tokens', 'base', 'vendor', 'components', 'site']
      },
      postcss: {
        enabled: true,
        plugins: [
          stylelint(), // CSS linting - run first to catch syntax errors
          postcssImport({
            path: ['lib/assets', 'lib/assets/styles']
          }),
          autoprefixer(),
          cssnano({ preset: 'default' })
        ],
        options: {
          // Additional PostCSS options if needed
        }
      }
    })
  )

  /**
   * Copy static assets to the build directory
   * Learn more: https://github.com/wernerglinka/metalsmith-static-files
   */
  .use(
    assets({
      source: 'lib/assets/', // Where to find assets
      destination: 'assets/', // Where to copy assets
      ignore: ['main.css', 'main.js', 'styles/'] // Exclude files handled by bundled-components
    })
  )

  /**
   * Self-host third-party runtime libraries under /assets/vendor/. Components
   * lazy-load these files (lottie partial, maps providers) instead of pulling
   * them from a CDN, so the versions are managed through npm.
   */
  .use((files, metalsmithInstance, done) => {
    const vendorFiles = {
      'assets/vendor/lottie-player.js': '@lottiefiles/lottie-player/dist/lottie-player.js',
      'assets/vendor/leaflet/leaflet.js': 'leaflet/dist/leaflet.js',
      'assets/vendor/leaflet/leaflet.css': 'leaflet/dist/leaflet.css',
      'assets/vendor/leaflet/leaflet.markercluster.js': 'leaflet.markercluster/dist/leaflet.markercluster.js',
      'assets/vendor/leaflet/MarkerCluster.css': 'leaflet.markercluster/dist/MarkerCluster.css',
      'assets/vendor/leaflet/MarkerCluster.Default.css': 'leaflet.markercluster/dist/MarkerCluster.Default.css',
      'assets/vendor/ol/ol.js': 'ol/dist/ol.js',
      'assets/vendor/ol/ol.css': 'ol/ol.css',
      'assets/vendor/shikwasa/shikwasa.min.js': 'shikwasa/dist/shikwasa.min.js',
      'assets/vendor/shikwasa/style.css': 'shikwasa/dist/style.css'
    };

    // leaflet.css references its images/ directory with relative paths, so it
    // must travel alongside the stylesheet
    for (const image of fs.readdirSync(metalsmithInstance.path('node_modules/leaflet/dist/images'))) {
      vendorFiles[`assets/vendor/leaflet/images/${image}`] = `leaflet/dist/images/${image}`;
    }

    // Self-hosted web fonts from @fontsource packages (replaces Google Fonts).
    // The per-weight CSS files are concatenated into one stylesheet; their
    // url(./files/...) references resolve against the shared files/ directory,
    // and unicode-range keeps browsers fetching only the subsets a page uses.
    const fontCss = [];
    for (const family of ['montserrat', 'open-sans']) {
      for (const weight of [300, 500]) {
        fontCss.push(
          fs.readFileSync(metalsmithInstance.path(`node_modules/@fontsource/${family}/${weight}.css`), 'utf8')
        );
      }
      const fontFilesDir = metalsmithInstance.path(`node_modules/@fontsource/${family}/files`);
      for (const fontFile of fs.readdirSync(fontFilesDir)) {
        if (/-(300|500)-normal\.(woff2?|ttf)$/.test(fontFile)) {
          vendorFiles[`assets/vendor/fonts/files/${fontFile}`] = `@fontsource/${family}/files/${fontFile}`;
        }
      }
    }
    files['assets/vendor/fonts/fonts.css'] = { contents: Buffer.from(fontCss.join('\n')) };

    for (const [destination, source] of Object.entries(vendorFiles)) {
      let contents = fs.readFileSync(metalsmithInstance.path(`node_modules/${source}`));
      // Vendor stylesheets are injected at runtime as plain <link> elements,
      // and unlayered CSS beats every cascade layer. Wrapping them in the
      // `vendor` layer (declared lowest in the bundle's @layer order) keeps
      // component CSS able to override vendor defaults, as it did before
      // layers. None of these files start with @charset or @import, which
      // would be invalid inside a layer block.
      if (destination.endsWith('.css')) {
        contents = Buffer.from(`@layer vendor {\n${contents.toString()}\n}\n`);
      }
      files[destination] = { contents };
    }
    done();
  });

// These plugins only run in production mode to optimize the site
if (isProduction) {
  metalsmith
    /**
     * Generate downloadable component packages
     * Learn more: See COMPONENT-PACKAGE-SPEC.md
     */
    .use(
      componentPackageGenerator({
        componentsPath: 'lib/layouts/components',
        examplesPath: 'lib/layouts/components/examples',
        outputPath: 'downloads',
        generateBundle: true,
        generateChecksums: true
      })
    )
    /**
     * Optimize images for faster loading
     * Learn more: https://github.com/wernerglinka/metalsmith-optimize-images
     */
    .use(
      optimizeImages({
        // Enable progressive loading
        isProgressive: false
      })
    )
    /**
     * Intelligent metadata generation, social media tags, and structured data including Open Graph tags,
     * Twitter Cards, JSON-LD structured data object, a sitemap and a robots.txt file
     * Learn more: https://github.com/wernerglinka/metalsmith-seo
     */
    .use(
      seo({
        metadataPath: 'data.site', // Object in metadata points to where to find site metadata
        omitIndex: true
      })
    )
    /**
     * Optimize HTML by Minify HTML to reduce file size
     * Learn more: https://github.com/wernerglinka/metalsmith-optimize-html
     */
    .use(htmlMinifier());
}

/**
 * BUILD EXECUTION
 * This section handles the actual build process and development server
 * It only runs when this file is executed directly (not when imported)
 */
if (mainFile === thisFile) {
  // Start timing the build for performance measurement
  let t1 = performance.now();

  // Execute the Metalsmith build
  metalsmith.build((err) => {
    // Handle any build errors. In watch mode a rebuild error (template typo,
    // malformed data file) is logged and the watcher keeps running; outside
    // watch mode it exits with a failure code.
    if (err) {
      console.error(err);
      if (metalsmith.watch()) {
        return;
      }
      process.exit(1);
    }

    // Log build success and time taken
    /* eslint-disable no-console */
    console.log(`Build success in ${((performance.now() - t1) / 1000).toFixed(1)}s`);

    // If watch mode is enabled, set up the development server
    if (metalsmith.watch()) {
      if (devServer) {
        t1 = performance.now();
        devServer.reload();
      } else {
        devServer = browserSync.create();

        const config = {
          host: 'localhost',
          port: 3000,
          injectChanges: false,
          reloadThrottle: 0
        };

        if (basePath) {
          // Serve with subdirectory simulation
          config.server = {
            baseDir: './build',
            routes: {
              [`/${basePath}`]: './build'
            }
          };
          config.startPath = `/${basePath}/`;
        } else {
          // Normal serving
          config.server = './build';
        }

        devServer.init(config);
      }
    }
  });
}

// Export the Metalsmith instance for use in other files
export default metalsmith;
