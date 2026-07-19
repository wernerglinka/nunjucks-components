/**
 * Artwork Section
 * Opens a larger version of the artwork image in a modal overlay.
 * Adapted from the video component's modal implementation.
 */

let globalListenersInitialized = false;

/**
 * Create artwork overlay using modern DOM APIs
 * @param {string} src - Image source
 * @param {string} alt - Image alt text
 * @returns {{overlay: HTMLElement, closeButton: HTMLElement}}
 */
const createArtworkOverlay = (src, alt) => {
  const overlay = document.createElement('div');
  overlay.id = 'artwork-overlay';
  overlay.className = 'js-artwork-overlay';

  const closeButton = document.createElement('span');
  closeButton.className = 'close';
  closeButton.textContent = '[Close]';

  const wrapper = document.createElement('div');
  wrapper.className = 'artwork-wrapper';

  const image = document.createElement('img');
  image.src = src;
  image.alt = alt;

  wrapper.appendChild(image);
  overlay.appendChild(closeButton);
  overlay.appendChild(wrapper);
  document.body.appendChild(overlay);

  return { overlay, closeButton };
};

/**
 * Close artwork modal with fade out animation
 */
const closeModal = () => {
  const overlay = document.getElementById('artwork-overlay');
  if (!overlay) {
    return;
  }

  const handleAnimationEnd = () => {
    overlay.removeEventListener('animationend', handleAnimationEnd);
    overlay.remove();
    document.body.classList.remove('modal-active');
  };

  overlay.addEventListener('animationend', handleAnimationEnd);
  overlay.classList.remove('is-open');
  overlay.classList.add('fadeout');
};

/**
 * Open artwork modal with fade in animation
 * @param {HTMLElement} trigger - The clicked zoom button
 */
const openModal = (trigger) => {
  const thumbnail = trigger.querySelector('img');
  if (!thumbnail) {
    return;
  }

  const { overlay, closeButton } = createArtworkOverlay(thumbnail.currentSrc || thumbnail.src, thumbnail.alt);

  closeButton.onclick = closeModal;

  // Clicking the backdrop (anything but the image itself) closes the modal
  overlay.addEventListener('click', (e) => {
    if (e.target.tagName !== 'IMG') {
      closeModal();
    }
  });

  const handleFadeInEnd = () => {
    overlay.removeEventListener('animationend', handleFadeInEnd);
    overlay.classList.remove('fadein');
    overlay.classList.add('is-open');
  };

  overlay.addEventListener('animationend', handleFadeInEnd);
  overlay.classList.add('fadein');
  document.body.classList.add('modal-active');
};

/**
 * Initialize global event listeners (only once)
 */
const initGlobalListeners = () => {
  if (globalListenersInitialized) {
    return;
  }
  globalListenersInitialized = true;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
};

/**
 * Initialize component
 */
const init = () => {
  initGlobalListeners();

  document.querySelectorAll('.js-artwork-zoom').forEach((trigger) => {
    // Skip if already initialized
    if (trigger.dataset.initialized) {
      return;
    }
    trigger.dataset.initialized = 'true';

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(trigger);
    });

    // The trigger is a link with role="button"; without an href it does not
    // activate on Enter or Space natively, so handle both keys here
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(trigger);
      }
    });
  });
};

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('artwork', init);
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
