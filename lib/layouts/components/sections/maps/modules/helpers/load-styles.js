/**
 * Dynamic Stylesheet Loader Utility
 */

/**
 * Check if a stylesheet is already loaded
 * @param {string} url - The URL of the stylesheet
 * @returns {boolean} - True if the stylesheet is loaded
 */
const isStylesheetLoaded = (url) => {
  // link.href is always absolute, so resolve the given URL before comparing.
  // Checking the link elements, not document.styleSheets, also finds a
  // stylesheet that was added a moment ago and has not finished loading.
  const absolute = new URL(url, document.baseURI).href;
  return Array.from(document.querySelectorAll('link[rel~="stylesheet"]')).some((link) => link.href === absolute);
};

/**
 * Load a stylesheet dynamically
 * @param {string} url - The URL of the stylesheet
 * @param {string} integrity - The integrity hash for the stylesheet (optional)
 * @param {string} crossOrigin - The crossOrigin attribute value (optional)
 */
export const loadStylesheet = (url, integrity = '', crossOrigin = '') => {
  if (!isStylesheetLoaded(url)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    if (integrity) {
      link.integrity = integrity;
    }
    if (crossOrigin) {
      link.crossOrigin = crossOrigin;
    }
    document.head.appendChild(link);
  }
};
