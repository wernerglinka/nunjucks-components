/**
 * Unified Mapping Component
 * Supports both Leaflet and OpenLayers providers with modular architecture
 */

import { initLeafletMaps } from './modules/providers/leaflet.js';
import { initOpenLayersMaps } from './modules/providers/openlayers.js';

/**
 * Provider factory
 */
const providers = {
  leaflet: initLeafletMaps,
  openlayers: initOpenLayersMaps
};

// Live map instances, kept so cleanup can destroy them on page transitions
let mapInstances = [];

/**
 * Initialize all maps based on provider
 */
const initAllMaps = async () => {
  const leafletMaps = document.querySelectorAll('.js-leaflet-map:not([data-initialized])');
  const openLayersMaps = document.querySelectorAll('.js-openlayers-map:not([data-initialized])');

  // Mark all as initialized
  leafletMaps.forEach((map) => {
    map.dataset.initialized = 'true';
  });
  openLayersMaps.forEach((map) => {
    map.dataset.initialized = 'true';
  });

  const promises = [];

  if (leafletMaps.length > 0) {
    promises.push(providers.leaflet());
  }

  if (openLayersMaps.length > 0) {
    promises.push(providers.openlayers());
  }

  try {
    const results = await Promise.all(promises);
    const allInstances = results.flat();
    mapInstances.push(...allInstances);
    return allInstances;
  } catch (error) {
    console.error('Failed to initialize maps components:', error);
    return [];
  }
};

/**
 * Destroy all map instances before page transitions. Leaflet and OpenLayers
 * attach their own DOM/window listeners and (for OpenLayers) a popup element
 * on document.body, so each provider returns a cleanup function.
 */
const cleanupAllMaps = () => {
  mapInstances.forEach((instance) => {
    try {
      instance.cleanup?.();
    } catch (error) {
      console.warn('Error cleaning up map instance:', error);
    }
  });
  mapInstances = [];
};

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('maps', initAllMaps);
  window.PageTransitions.registerCleanup('maps', cleanupAllMaps);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllMaps);
} else {
  initAllMaps();
}
