/**
 * Page Transitions Module
 *
 * Implements smooth page transitions using SWUP.
 * Uses the PageTransitions registry initialized in main.js (the entry point)
 * to ensure it exists before any component scripts try to register.
 *
 * Components inside the SWUP container (#swup / main) should register their
 * init functions to be called after each page transition. Components
 * outside the container (header, footer) don't need to register.
 *
 * Plugins:
 * - HeadPlugin: Updates <head> tags during transitions
 * - ScrollPlugin: Handles scroll position and smooth scrolling
 * - PreloadPlugin: Prefetches pages on link hover for instant navigation
 *
 * @see https://swup.js.org/
 */

import Swup from 'swup';
import SwupHeadPlugin from '@swup/head-plugin';
import SwupScrollPlugin from '@swup/scroll-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';

/**
 * Get registries from the global PageTransitions object
 * These are initialized in main.js (entry point) to ensure they exist first
 */
const componentRegistry = window.PageTransitions?._componentRegistry || new Map();
const cleanupRegistry = window.PageTransitions?._cleanupRegistry || new Map();

/**
 * Initialize all registered components
 * Called after each page transition
 */
function initAllComponents() {
  componentRegistry.forEach((initFn, name) => {
    try {
      initFn();
    } catch (error) {
      console.error(`Error initializing component "${name}":`, error);
    }
  });
}

/**
 * Run all registered cleanup functions
 * Called before content is replaced during page transition
 */
function cleanupAllComponents() {
  cleanupRegistry.forEach((cleanupFn, name) => {
    try {
      cleanupFn();
    } catch (error) {
      console.error(`Error cleaning up component "${name}":`, error);
    }
  });
}

/**
 * Bring the page-specific body classes in line with the incoming page.
 * <body> sits outside the SWUP container, so classes a page sets through
 * `bodyClasses` (for example `search-page`) would otherwise stay from the
 * page the visitor first loaded. Layouts publish those classes in
 * `data-page-classes`; classes scripts add at runtime (theme, scroll state)
 * are not listed there and are left alone.
 * @param {Document} incoming - The document of the page being shown
 */
function syncBodyClasses(incoming) {
  const listed = (body) => (body?.dataset.pageClasses || '').split(/\s+/).filter(Boolean);
  const next = listed(incoming?.body);
  document.body.classList.remove(...listed(document.body));
  document.body.classList.add(...next);
  document.body.dataset.pageClasses = next.join(' ');
}

/**
 * Check if a page has the sidebar layout
 * @param {Document} doc - The document to check
 * @returns {boolean}
 */
function hasSidebarLayout(doc) {
  return doc.body.classList.contains('with-sidebar');
}

/**
 * Update sidebar active state based on current URL
 * Called after page transitions to sync the sidebar with the new page
 */
function updateSidebarActiveState() {
  const sidebar = document.querySelector('.references.sidebar');
  if (!sidebar) {
    return;
  }

  // Normalize path by removing trailing slash for comparison
  const normalizePath = (path) => path.replace(/\/$/, '') || '/';
  const currentPath = normalizePath(window.location.pathname);

  // Remove active class from all sidebar items
  sidebar.querySelectorAll('li.active').forEach((li) => {
    li.classList.remove('active');
  });

  // Find and activate the matching link
  sidebar.querySelectorAll('a').forEach((link) => {
    const rawHref = link.getAttribute('href');
    if (!rawHref) {
      return;
    }
    const href = normalizePath(rawHref);
    if (href === currentPath) {
      link.closest('li')?.classList.add('active');
    }
  });
}

/**
 * Initialize SWUP page transitions
 */
function initSwup() {
  const swup = new Swup({
    containers: ['#swup'],
    animationSelector: '[class*="transition-"]',
    // Ignore links inside [data-no-swup] (SWUP's default rule, which a custom
    // ignoreVisit replaces), download links and other non-HTML resources
    ignoreVisit: (url, { el } = {}) => {
      if (el?.closest('[data-no-swup]')) {
        return true;
      }
      const path = url.pathname || url;
      return /\.(zip|pdf|png|jpg|jpeg|gif|svg|webp|ico|mp3|mp4|webm)$/i.test(path);
    },
    plugins: [
      new SwupHeadPlugin({
        persistAssets: true,
        awaitAssets: true
      }),
      new SwupScrollPlugin({
        doScrollingRightAway: false,
        animateScroll: {
          betweenPages: true,
          samePageWithHash: true,
          samePage: true
        },
        offset: 0
      }),
      new SwupPreloadPlugin({
        preloadHoveredLinks: true,
        preloadVisibleLinks: false,
        preloadInitialPage: true
      })
    ]
  });

  // Detect layout changes and force full page reload
  swup.hooks.on('page:view', (visit) => {
    const currentHasSidebar = hasSidebarLayout(document);
    const newHasSidebar = hasSidebarLayout(visit.to.document);

    if (currentHasSidebar !== newHasSidebar) {
      // Layout changed - force full page reload
      window.location.href = visit.to.url;
    }
  });

  // Run cleanup while the outgoing content is still in the document.
  // hooks.on() runs after SWUP has replaced the content, when the elements
  // the cleanup functions look for are already gone; hooks.before() runs first.
  swup.hooks.before('content:replace', () => {
    cleanupAllComponents();
  });

  // Once the content is replaced, give <body> the incoming page's classes
  swup.hooks.on('content:replace', (visit) => {
    syncBodyClasses(visit.to.document);
  });

  // Re-initialize components after new page content is loaded and transition completes
  swup.hooks.on('visit:end', () => {
    initAllComponents();
    updateSidebarActiveState();
  });

  // Store swup instance on window for debugging
  window.swup = swup;

  return swup;
}

// Initialize SWUP when DOM is ready
// PageTransitions registry is already defined in main.js (entry point)
document.addEventListener('DOMContentLoaded', initSwup);
