/**
 * Team Grid Dialog Handler
 *
 * Each member's extended bio is a native <dialog> in the markup, opened as a
 * modal. The browser provides focus containment, the inert page, Escape and
 * focus return; the overlay partial's helper adds backdrop dismissal and the
 * fade out.
 */

import { closeModalDialog, enhanceModalDialog } from '../../_partials/overlay/modules/modal-dialog.js';

/**
 * Initialize dialog functionality for team grid
 */
function initTeamGrid() {
  const triggers = document.querySelectorAll('.text-link[data-dialog-target]');

  triggers.forEach((trigger) => {
    // Skip if already initialized
    if (trigger.dataset.initialized) {
      return;
    }
    trigger.dataset.initialized = 'true';

    const dialog = document.getElementById(trigger.dataset.dialogTarget);
    if (!dialog) {
      return;
    }

    enhanceModalDialog(dialog);

    trigger.addEventListener('click', () => {
      // Focus the trigger so the dialog returns focus to it when it closes
      trigger.focus();
      dialog.showModal();
    });

    dialog.querySelector('.dialog-close')?.addEventListener('click', () => closeModalDialog(dialog));
  });
}

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('team-grid', initTeamGrid);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTeamGrid);
} else {
  initTeamGrid();
}
