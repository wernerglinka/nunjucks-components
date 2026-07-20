/**
 * Artwork Section
 * Opens a larger version of the artwork image in a modal overlay.
 * Adapted from the video component's modal implementation.
 */

let globalListenersInitialized = false;

// Modal focus management state
let lastFocusedElement = null;
let activeTrapHandler = null;

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
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', alt || 'Enlarged artwork');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'close';
  closeButton.setAttribute('aria-label', 'Close enlarged artwork');
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

  // Remove the focus trap for this modal
  if (activeTrapHandler) {
    document.removeEventListener('keydown', activeTrapHandler);
    activeTrapHandler = null;
  }

  // Restore focus to the element that opened the modal
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
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

  // Remember the trigger so focus can be restored on close
  lastFocusedElement = trigger;

  // The close button is the only focusable element in the modal, so the
  // focus trap simply keeps Tab from leaving it
  const handleTrap = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      closeButton.focus();
    }
  };
  activeTrapHandler = handleTrap;
  document.addEventListener('keydown', handleTrap);

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

  // Move focus into the modal; must happen after the fadein class makes the
  // overlay displayable, since a display:none element cannot receive focus
  closeButton.focus();
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
