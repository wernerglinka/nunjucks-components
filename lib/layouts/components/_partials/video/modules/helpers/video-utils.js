/**
 * Video Component Utilities
 */

// The one modal dialog, created on first use and reused afterwards
let videoDialog = null;

/**
 * Fade the dialog out, then close it.
 * A closed dialog leaves the top layer at once, so the fade has to run while
 * it is still open: [data-closing] switches the CSS to the closed look, and
 * close() follows once that transition has finished. Done this way the fade
 * works in every browser, without relying on `overlay` or discrete `display`
 * transitions.
 * @param {HTMLDialogElement} dialog
 */
const fadeOutAndClose = async (dialog) => {
  if (!dialog.open || dialog.hasAttribute('data-closing')) {
    return;
  }
  dialog.setAttribute('data-closing', '');

  // subtree: true includes the ::backdrop transition; the timeout is a safety net
  const animations = dialog.getAnimations({ subtree: true });
  await Promise.race([
    Promise.allSettled(animations.map((animation) => animation.finished)),
    new Promise((resolve) => setTimeout(resolve, 1000))
  ]);

  if (dialog.open) {
    dialog.close();
  }
};

/**
 * Light-dismiss fallback for browsers without <dialog closedby>.
 * Tests the pointer position rather than event.target, and requires both the
 * press and the release outside, so a drag that ends on the backdrop does not
 * dismiss.
 * @param {HTMLDialogElement} dialog
 */
const addLightDismissFallback = (dialog) => {
  if ('closedBy' in HTMLDialogElement.prototype) {
    return;
  }

  const isOutside = (event) => {
    const rect = dialog.getBoundingClientRect();
    return (
      event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
    );
  };

  let pressedOutside = false;
  dialog.addEventListener('pointerdown', (event) => {
    pressedOutside = isOutside(event);
  });
  dialog.addEventListener('pointerup', (event) => {
    if (pressedOutside && isOutside(event)) {
      fadeOutAndClose(dialog);
    }
  });
};

/**
 * Get the shared video dialog, creating it on first use.
 * A native modal <dialog> provides the top layer, the inert page, focus
 * containment, Escape/back-gesture dismissal and focus return, so none of
 * that is implemented here.
 * @returns {{ dialog: HTMLDialogElement, container: HTMLElement }}
 */
export const getVideoDialog = () => {
  if (videoDialog?.isConnected) {
    return { dialog: videoDialog, container: videoDialog.querySelector('.video-container') };
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'video-dialog';
  dialog.setAttribute('aria-label', 'Video player');
  dialog.setAttribute('closedby', 'any');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'close';
  closeButton.autofocus = true;
  closeButton.setAttribute('aria-label', 'Close video');
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', () => fadeOutAndClose(dialog));

  const container = document.createElement('div');
  container.className = 'video-container';

  // Escape, the back gesture and a native backdrop click arrive as a cancel
  // event; route them through the fade instead of closing instantly.
  dialog.addEventListener('cancel', (event) => {
    if (event.cancelable) {
      event.preventDefault();
      fadeOutAndClose(dialog);
    }
  });

  // Single teardown path: the close button, Escape, the back gesture, a
  // backdrop click and closeModal() all end up here.
  dialog.addEventListener('close', () => {
    dialog.removeAttribute('data-closing');
    // A detached <video> keeps playing audio, so pause before removing
    container.querySelectorAll('video').forEach((video) => {
      video.pause();
    });
    container.replaceChildren();
  });

  addLightDismissFallback(dialog);

  dialog.append(closeButton, container);
  document.body.appendChild(dialog);
  videoDialog = dialog;

  return { dialog, container };
};

/**
 * Close the video modal if it is open
 * @param {Object} [options]
 * @param {boolean} [options.immediate=false] - Skip the fade, e.g. before a page transition
 */
export const closeModal = ({ immediate = false } = {}) => {
  if (!videoDialog?.open) {
    return;
  }
  if (immediate) {
    videoDialog.close();
  } else {
    fadeOutAndClose(videoDialog);
  }
};

/**
 * Stop active player
 */
export const stopActivePlayer = (activePlayer) => {
  if (!activePlayer?.stop) {
    return;
  }

  try {
    activePlayer.stop();
  } catch (error) {
    console.warn('Error stopping player:', error);
  }
};

/**
 * Handle modal video clicks
 * @param {HTMLButtonElement} trigger - The button that opens the modal
 * @param {Object} providers - Provider factory map
 */
export const handleModalClick = async (trigger, providers) => {
  const videoId = trigger.dataset.videoid;
  const provider = trigger.dataset.videosrc || 'youtube';
  const cloudName = trigger.dataset.cloudname;
  const startTime = trigger.dataset.starttime;
  const endTime = trigger.dataset.endtime;

  const providerFn = providers[provider]?.modal;
  if (!providerFn) {
    console.warn(`Unsupported provider: ${provider}`);
    return;
  }

  // Close any playing in-situ videos before opening modal
  document.dispatchEvent(new CustomEvent('modal-opening'));

  const { dialog, container } = getVideoDialog();

  const targetId = `${provider}-target`;
  const target = document.createElement('div');
  target.id = targetId;
  container.replaceChildren(target);

  // Safari does not focus a button on click; focus it so the dialog
  // returns focus to the trigger when it closes.
  trigger.focus();
  dialog.showModal();

  try {
    const options = { startTime, endTime };
    provider === 'cloudinary'
      ? await providerFn(videoId, targetId, cloudName)
      : await providerFn(videoId, targetId, options);

    // The dialog may have been closed while the provider API was loading
    if (!dialog.open) {
      container.replaceChildren();
    }
  } catch (error) {
    console.error('Error creating player:', error);
    closeModal({ immediate: true });
  }
};
