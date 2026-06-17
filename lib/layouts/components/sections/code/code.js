/**
 * Code section JavaScript
 *
 * Copy-to-clipboard only. Syntax highlighting is done at build time by Shiki
 * (the mdToHTML filter), which inlines token colors, so there is no
 * client-side theme loading.
 */

/**
 * Copies text to clipboard using the modern Clipboard API with fallback
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return fallbackCopyToClipboard(text);
  } catch (error) {
    console.warn('Copy failed:', error);
    return fallbackCopyToClipboard(text);
  }
}

/**
 * Fallback copy method for older browsers
 * @param {string} text - Text to copy
 * @returns {boolean} Success status
 */
function fallbackCopyToClipboard(text) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const result = document.execCommand('copy');
    document.body.removeChild(textArea);
    return result;
  } catch (error) {
    console.warn('Fallback copy failed:', error);
    return false;
  }
}

/**
 * Shows copy feedback on button
 * @param {HTMLElement} button - Copy button element
 */
function showCopyFeedback(button) {
  const originalClass = button.className;
  button.classList.add('copied');

  setTimeout(() => {
    button.className = originalClass;
  }, 2000);
}

/**
 * Wires up the copy button in each code section. The code to copy lives in the
 * `<code>` element of the `.code-block` that mdToHTML emitted.
 */
function initCodeBlocks() {
  const sections = document.querySelectorAll('.code-section');

  sections.forEach((section) => {
    if (section.dataset.initialized) {
      return;
    }
    section.dataset.initialized = 'true';

    const copyButton = section.querySelector('.copy-button');
    const codeElement = section.querySelector('.code-block code');

    if (copyButton && codeElement) {
      copyButton.addEventListener('click', async () => {
        const success = await copyToClipboard(codeElement.textContent);
        if (success) {
          showCopyFeedback(copyButton);
        } else {
          console.warn('Failed to copy code to clipboard');
        }
      });
    }
  });
}

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('code', initCodeBlocks);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCodeBlocks);
} else {
  initCodeBlocks();
}
