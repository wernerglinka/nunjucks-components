/**
 * Dynamic Script Loader Utility
 */

/** One promise per script URL, so maps that start together share one request */
const pending = new Map();

/**
 * Look up a global by a dotted path such as "L.markerClusterGroup"
 * @param {string} path - Global name, optionally with nested properties
 * @returns {*} The value, or undefined when any part is missing
 */
const resolveGlobal = (path) => path.split('.').reduce((value, key) => value?.[key], window);

/**
 * Load JavaScript library
 * @param {string} src - Script source URL
 * @param {string} globalCheck - Global to check if the library is loaded; may be a dotted path
 * @param {string} integrity - Integrity hash (optional)
 * @param {string} crossOrigin - CrossOrigin value (optional)
 * @returns {Promise} - Resolves when script is loaded
 */
export const loadScript = (src, globalCheck, integrity = '', crossOrigin = '') => {
  if (globalCheck && resolveGlobal(globalCheck)) {
    return Promise.resolve();
  }

  if (pending.has(src)) {
    return pending.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = src;
    if (integrity) {
      script.integrity = integrity;
    }
    if (crossOrigin) {
      script.crossOrigin = crossOrigin;
    }

    script.onload = () => resolve();
    script.onerror = () => {
      // Forget the failure and the dead element, so a later map can try again
      pending.delete(src);
      script.remove();
      reject(new Error(`Failed to load ${src}`));
    };

    document.head.appendChild(script);
  });

  pending.set(src, promise);
  return promise;
};
