/**
 * Theme switcher
 *
 * The theme is the `dark-theme` class on the body. The stylesheet derives
 * `color-scheme` from that class, so native UI follows without extra work here.
 */

const STORAGE_KEY = 'theme';

/**
 * Apply a theme to the page and reflect it on the toggle
 * @param {boolean} isDark - Whether the dark theme is active
 * @param {HTMLElement|null} toggle - The theme toggle button
 */
const applyTheme = (isDark, toggle) => {
  document.body.classList.toggle('dark-theme', isDark);
  toggle?.setAttribute('aria-pressed', String(isDark));
};

/**
 * Store the theme so it is preserved for the next page load
 * @param {boolean} isDark - Whether the dark theme is active
 */
const storeTheme = (isDark) => {
  try {
    localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
  } catch {
    // Storage can be blocked; the theme still applies to this page
  }
};

const initThemeSwitcher = () => {
  const toggle = document.querySelector('.js-theme-toggle');
  if (!toggle) {
    return;
  }

  toggle.setAttribute('aria-pressed', String(document.body.classList.contains('dark-theme')));

  toggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark-theme');
    applyTheme(isDark, toggle);
    storeTheme(isDark);
  });

  // Follow a theme change made in another tab
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      applyTheme(event.newValue === 'dark', toggle);
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeSwitcher);
} else {
  initThemeSwitcher();
}
