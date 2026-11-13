/**
 * Artwork Section
 * Opens a larger version of the artwork image in a modal dialog.
 */

import { closeModalDialog, createModalDialog } from '../../_partials/overlay/modules/modal-dialog.js';

// The one artwork dialog, created on first use and reused afterwards
let artworkDialog = null;

/**
 * Get the shared artwork dialog, creating it on first use.
 * @returns {{ dialog: HTMLDialogElement, content: HTMLElement }}
 */
const getArtworkDialog = () => {
  if (artworkDialog?.isConnected) {
    return { dialog: artworkDialog, content: artworkDialog.querySelector('.modal-dialog-content') };
  }

  const { dialog, content } = createModalDialog({
    className: 'artwork-dialog',
    label: 'Enlarged artwork',
    closeLabel: 'Close enlarged artwork'
  });

  // Every way of closing ends in the close event
  dialog.addEventListener('close', () => content.replaceChildren());

  artworkDialog = dialog;

  return { dialog, content };
};

/**
 * Open the artwork modal
 * @param {HTMLElement} trigger - The clicked zoom button
 */
const openModal = (trigger) => {
  const thumbnail = trigger.querySelector('img');
  if (!thumbnail) {
    return;
  }

  const { dialog, content } = getArtworkDialog();
  if (dialog.open) {
    return;
  }

  const image = document.createElement('img');
  image.src = thumbnail.currentSrc || thumbnail.src;
  image.alt = thumbnail.alt;

  dialog.setAttribute('aria-label', thumbnail.alt || 'Enlarged artwork');
  content.replaceChildren(image);

  // Focus the trigger so the dialog returns focus to it when it closes
  trigger.focus();
  dialog.showModal();
};

/**
 * Initialize component
 */
const init = () => {
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

/**
 * Close an open modal before page transitions
 */
const cleanup = () => closeModalDialog(artworkDialog, { immediate: true });

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('artwork', init);
  window.PageTransitions.registerCleanup('artwork', cleanup);
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
