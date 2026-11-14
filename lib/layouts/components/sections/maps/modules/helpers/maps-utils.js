/**
 * Mapping Component Utilities
 */

import { getIcon, createMarkerIcon } from './icon-loader.js';

/**
 * Create default SVG marker with specified size using same shape as custom icon markers
 * @param {Object} options - Styling options for the marker
 * @returns {string} SVG string for the default marker
 */
const createDefaultMarker = (options = {}) => {
  const { markerColor = '#ff3333', markerStroke = '#ffffff', markerStrokeWidth = 1, size = 48 } = options;

  const height = size * 1.33;

  return `<svg width="${size}" height="${height}" viewBox="0 0 ${size} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Marker background (map pin shape) - same shape as custom icon markers -->
  <path d="M${size / 2} ${height - 2} C${size / 2} ${height - 2} ${size * 0.15} ${size * 0.6} ${size * 0.15} ${size * 0.4} C${size * 0.15} ${size * 0.18} ${size * 0.3} 2 ${size / 2} 2 C${size * 0.7} 2 ${size * 0.85} ${size * 0.18} ${size * 0.85} ${size * 0.4} C${size * 0.85} ${size * 0.6} ${size / 2} ${height - 2} ${size / 2} ${height - 2} Z" 
        fill="${markerColor}" 
        stroke="${markerStroke}" 
        stroke-width="${markerStrokeWidth}"/>
  <!-- Default dot in center where icon would be -->
  <circle cx="${size / 2}" cy="${size * 0.4}" r="${size * 0.1}" fill="${markerStroke}" />
</svg>`;
};

/**
 * Default SVG marker (fallback when no icon is specified) - maintained for compatibility
 */
export const svgMarker = createDefaultMarker({ size: 24 });

/**
 * Create marker SVG with custom icon or default marker
 * @param {string|null} iconName - Name of the icon from the registry
 * @param {Object} options - Styling options for the marker
 * @returns {string} SVG string for the marker
 */
export const createMarkerSvg = (iconName, options = {}) => {
  // If no icon name provided, return size-aware default marker
  if (!iconName) {
    return createDefaultMarker(options);
  }

  // Get icon content from registry
  const iconContent = getIcon(iconName);

  // If icon not found, return size-aware default marker
  if (!iconContent) {
    console.warn(`Icon "${iconName}" not found in registry, falling back to default marker`);
    return createDefaultMarker(options);
  }

  // Create custom marker with icon
  return createMarkerIcon(iconContent, options);
};

/**
 * Validate map container data
 * @param {HTMLElement} mapContainer - Map container element
 * @returns {Object|null} Validated map data or null if invalid
 */
export const validateMapData = (mapContainer) => {
  const mapId = mapContainer.querySelector('div')?.getAttribute('id');
  const latitude = parseFloat(mapContainer.dataset.latitude);
  const longitude = parseFloat(mapContainer.dataset.longitude);
  const zoom = parseInt(mapContainer.dataset.zoom, 10) || 10;
  const markers = JSON.parse(mapContainer.dataset.markers || '[]');
  const clustering = JSON.parse(mapContainer.dataset.clustering || '{}');

  if (!mapId || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    console.warn('Map missing required data attributes');
    return null;
  }

  return { mapId, latitude, longitude, zoom, markers, clustering };
};

/**
 * Replace a map's loading message with an error, so a map that cannot start
 * does not keep saying it is loading
 * @param {HTMLElement} mapContainer - Map container element
 */
export const showMapError = (mapContainer) => {
  const message = document.createElement('p');
  message.className = 'map-error';
  message.setAttribute('role', 'alert');
  message.textContent = 'The map could not be loaded.';

  const loading = mapContainer.querySelector('.map-loading');
  if (loading) {
    loading.replaceWith(message);
  } else {
    (mapContainer.querySelector('div') || mapContainer).append(message);
  }
};

/**
 * Create every map a provider is responsible for. Each map is created on its
 * own: one that fails shows an error and leaves the others running.
 * @param {string} selector - Selector for the provider's map containers
 * @param {(container: HTMLElement) => Promise<Object|null>} createMap - Creates one map
 * @returns {Promise<Object[]>} The instances that were created
 */
export const createMaps = async (selector, createMap) => {
  // Maps already running on the page keep their instance
  const containers = Array.from(document.querySelectorAll(selector)).filter((container) => !container.dataset.started);

  const results = await Promise.all(
    containers.map(async (container) => {
      container.dataset.started = 'true';
      try {
        const instance = await createMap(container);
        if (!instance) {
          showMapError(container);
          return null;
        }
        // Starting again after cleanup needs the marker gone
        const { cleanup } = instance;
        return {
          ...instance,
          cleanup: () => {
            cleanup?.();
            delete container.dataset.started;
          }
        };
      } catch (error) {
        console.error('Failed to create map:', error);
        showMapError(container);
        return null;
      }
    })
  );

  return results.filter((instance) => instance !== null);
};

/**
 * Check that a link is a web address, so a marker cannot carry a script URL
 * @param {string} link - Link from the marker data
 * @returns {boolean} True for http(s) and relative links
 */
const isWebLink = (link) => {
  try {
    return ['http:', 'https:'].includes(new URL(link, window.location.href).protocol);
  } catch {
    return false;
  }
};

/**
 * Create popup content. Built as DOM nodes so marker text is always shown as
 * text and never parsed as markup.
 * @param {Object} content - Content object with title, body, and optional link
 * @returns {HTMLDivElement} Element holding the popup content
 */
export const createPopupContent = (content) => {
  const wrapper = document.createElement('div');

  const title = document.createElement('h4');
  title.textContent = content.title ?? '';

  const body = document.createElement('p');
  body.textContent = content.body ?? '';

  wrapper.append(title, body);

  if (content.link && isWebLink(content.link)) {
    const link = document.createElement('a');
    link.href = content.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Read more';
    wrapper.append(link);
  }

  return wrapper;
};
