/**
 * Hero Slider Component
 * Manages multiple slides with navigation, autoplay, and transitions
 */

const initHeroSlider = () => {
  /**
   * Creates a new hero slider instance
   * @param {HTMLElement} element - The slider element
   * @param {Object} options - Configuration options
   * @returns {Object} The slider instance
   */
  function createHeroSlider(element, options = {}) {
    const defaultOptions = {
      autoPlayDelay: 5000,
      transitionDuration: 500
    };

    const settings = { ...defaultOptions, ...options };

    const slider = {
      element,
      navigation: element.querySelector('.js-nav'),
      slides: Array.from(element.querySelectorAll('.js-slide')),
      autoplay: element.classList.contains('is-autoplay'),
      autoPlayDelay: settings.autoPlayDelay,
      newSlideIndex: 0,
      oldSlideIndex: 0,
      autoPlayId: null,
      isPaused: false,
      pauseButton: element.querySelector('.js-autoplay-toggle')
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!slider.navigation || slider.slides.length === 0) {
      console.warn('Hero slider missing required elements');
      return null;
    }

    slider.navigationItems = Array.from(slider.navigation.querySelectorAll('li'));
    slider.slidesNumber = slider.slides.length;

    /**
     * Sets up autoplay functionality
     */
    const setAutoplay = () => {
      if (slider.autoplay && !slider.isPaused) {
        clearInterval(slider.autoPlayId);
        slider.autoPlayId = setInterval(autoplaySlider, slider.autoPlayDelay);
      }
    };

    /**
     * Reflects the pause state in the UI: the wrapper class, the indicator on
     * the selected tab, and the pause button. The button's label names the
     * action it performs, so it carries no aria-pressed.
     */
    const syncPauseState = () => {
      slider.element.classList.toggle('is-manually-paused', slider.isPaused);

      slider.navigationItems.forEach((item, index) => {
        item.classList.toggle('is-paused-indicator', slider.isPaused && index === slider.newSlideIndex);
      });

      if (slider.pauseButton) {
        slider.pauseButton.classList.toggle('is-paused', slider.isPaused);
        slider.pauseButton.setAttribute('aria-label', slider.isPaused ? 'Play slideshow' : 'Pause slideshow');
      }
    };

    /**
     * Toggles pause/resume state. The pause stays in effect while the visitor
     * moves between slides, until they resume it.
     */
    const togglePause = () => {
      slider.isPaused = !slider.isPaused;

      if (slider.isPaused) {
        clearInterval(slider.autoPlayId);
      } else if (slider.autoplay) {
        setAutoplay();
      }

      syncPauseState();

      // A looping background video is motion too: pause and resume it with the slideshow
      const video = slider.slides[slider.newSlideIndex].querySelector('.background-video video');
      if (video && slider.isPaused) {
        video.pause();
      } else if (video) {
        video.play().catch(() => {});
      }

      return slider.isPaused;
    };

    /**
     * Advances to the next slide automatically
     */
    const autoplaySlider = () => {
      slider.oldSlideIndex = slider.newSlideIndex;
      slider.newSlideIndex = slider.newSlideIndex < slider.slidesNumber - 1 ? slider.newSlideIndex + 1 : 0;
      updateSlider();
    };

    /**
     * Updates the slider to show the new slide
     */
    const updateSlider = () => {
      renderNewSlide();
      updateSliderNavigation();
      setAutoplay();
      handleBackgroundVideo();
    };

    /**
     * Renders the new slide with transition effects
     */
    const renderNewSlide = () => {
      const oldSlide = slider.slides[slider.oldSlideIndex];
      const newSlide = slider.slides[slider.newSlideIndex];

      oldSlide.classList.remove('is-selected');
      oldSlide.classList.add('is-moving');

      newSlide.classList.add('is-selected');

      // Clean up after transition
      const handleTransitionEnd = () => {
        oldSlide.removeEventListener('transitionend', handleTransitionEnd);
        oldSlide.classList.remove('is-moving');
      };

      oldSlide.addEventListener('transitionend', handleTransitionEnd);
    };

    /**
     * Updates navigation to reflect current slide
     */
    const updateSliderNavigation = () => {
      slider.navigationItems[slider.oldSlideIndex]?.classList.remove('is-selected');
      slider.navigationItems[slider.newSlideIndex]?.classList.add('is-selected');
      syncPauseState();
    };

    /**
     * Handles background video playback for slides
     */
    const handleBackgroundVideo = () => {
      // Stop video in old slide
      const oldSlide = slider.slides[slider.oldSlideIndex];
      if (oldSlide) {
        const oldVideo = oldSlide.querySelector('.background-video video, .background-video iframe');
        if (oldVideo) {
          if (oldVideo.tagName === 'VIDEO') {
            oldVideo.pause();
            oldVideo.currentTime = 0;
          } else if (oldVideo.tagName === 'IFRAME') {
            // For YouTube/Vimeo iframes, we'll trigger a custom event
            const backgroundVideoEl = oldSlide.querySelector('.js-background-video');
            if (backgroundVideoEl) {
              backgroundVideoEl.dispatchEvent(new CustomEvent('pauseVideo'));
            }
          }
        }
      }

      // Start video in new slide, unless the slideshow is paused: a looping
      // background video is motion the visitor asked to stop
      const newSlide = slider.slides[slider.newSlideIndex];
      if (newSlide && slider.isPaused) {
        newSlide.querySelector('.background-video video')?.pause();
      } else if (newSlide) {
        const newVideo = newSlide.querySelector('.background-video video, .background-video iframe');
        if (newVideo) {
          if (newVideo.tagName === 'VIDEO') {
            // For HTML5 video
            newVideo.play().catch((err) => {
              console.warn('Video autoplay prevented:', err);
            });
          } else if (newVideo.tagName === 'IFRAME') {
            // For YouTube/Vimeo iframes, trigger autoplay
            const backgroundVideoEl = newSlide.querySelector('.js-background-video');
            if (backgroundVideoEl && backgroundVideoEl.dataset.autoplay === 'true') {
              backgroundVideoEl.dispatchEvent(new CustomEvent('playVideo'));
            }
          }
        }
      }
    };

    /**
     * Handles navigation click events
     */
    const handleNavigationClick = (event) => {
      // Ignore clicks on the nav container itself
      if (event.target.matches('nav') || event.target.matches('ul')) {
        return;
      }

      event.preventDefault();

      // The tabs are "#slide-N" links with no matching element. Keep the click
      // from reaching the page-transition library's document-level link
      // handler, which would treat it as a same-page anchor and, finding no
      // target, scroll the page to the top.
      event.stopPropagation();

      const clickedLink = event.target.closest('a');
      if (!clickedLink) {
        return;
      }

      const parentListItem = clickedLink.closest('li');
      if (!parentListItem) {
        return;
      }

      // Check if already selected - if so, ignore single click
      if (parentListItem.classList.contains('is-selected')) {
        return;
      }

      // Update indices and transition
      slider.oldSlideIndex = slider.newSlideIndex;
      slider.newSlideIndex = slider.navigationItems.indexOf(parentListItem);

      if (slider.newSlideIndex !== -1) {
        updateSlider();
      }
    };

    /**
     * Handles navigation double-click events for pause/resume
     */
    const handleNavigationDoubleClick = (event) => {
      event.preventDefault();

      const clickedLink = event.target.closest('a');
      if (!clickedLink) {
        return;
      }

      const parentListItem = clickedLink.closest('li');
      if (!parentListItem) {
        return;
      }

      // Only allow pause/resume on the currently selected slide
      if (parentListItem.classList.contains('is-selected')) {
        togglePause();
      }
    };

    /**
     * Initializes the slider
     */
    const init = () => {
      // Set up navigation
      slider.navigation.addEventListener('click', handleNavigationClick);
      slider.navigation.addEventListener('dblclick', handleNavigationDoubleClick);
      slider.pauseButton?.addEventListener('click', togglePause);

      // Reduced motion: start paused. The visitor can still press play.
      if (slider.autoplay && prefersReducedMotion) {
        slider.isPaused = true;
        syncPauseState();

        // Background videos carry autoplay in their markup; switch it off
        slider.element.querySelectorAll('.background-video video').forEach((video) => {
          video.removeAttribute('autoplay');
          video.pause();
        });
        slider.element.querySelectorAll('.background-video iframe').forEach((iframe) => {
          iframe.src = iframe.src.replace('autoplay=1', 'autoplay=0');
        });
      }

      // Set up autoplay hover behavior - simple like PHP version
      if (slider.autoplay) {
        slider.element.addEventListener('mouseenter', () => {
          if (!slider.isPaused) {
            clearInterval(slider.autoPlayId);
            slider.element.classList.add('is-paused');
          }
        });

        slider.element.addEventListener('mouseleave', () => {
          if (!slider.isPaused) {
            slider.element.classList.remove('is-paused');
            setAutoplay();
          }
        });

        setAutoplay();
      }

      // Start any videos in the first slide
      handleBackgroundVideo();
    };

    /**
     * Destroys the slider instance
     */
    const destroy = () => {
      clearInterval(slider.autoPlayId);
      slider.navigation.removeEventListener('click', handleNavigationClick);
      slider.pauseButton?.removeEventListener('click', togglePause);
      slider.element.classList.remove('is-paused');
    };

    // Initialize and return public API
    init();

    return {
      element: slider.element,
      goToSlide: (index) => {
        if (index >= 0 && index < slider.slidesNumber) {
          slider.oldSlideIndex = slider.newSlideIndex;
          slider.newSlideIndex = index;
          updateSlider();
        }
      },
      nextSlide: () => autoplaySlider(),
      destroy
    };
  }

  /**
   * Initializes all hero sliders on the page
   */
  const initAllSliders = () => {
    const heroSliders = document.querySelectorAll('.js-hero-slider');
    const instances = [];

    heroSliders.forEach((slider) => {
      // Skip if already initialized
      if (slider.dataset.initialized) {
        return;
      }
      slider.dataset.initialized = 'true';

      // The delay comes from the section's autoPlayDelay; ignore anything
      // that is not a positive number and keep the default
      const autoPlayDelay = Number(slider.dataset.autoplayDelay);
      const instance = createHeroSlider(slider, autoPlayDelay > 0 ? { autoPlayDelay } : {});
      if (instance) {
        instances.push(instance);
        // Store instance for cleanup
        slider._sliderInstance = instance;
      }
    });

    return instances;
  };

  /**
   * Cleanup all hero sliders
   */
  const cleanupAllSliders = () => {
    const heroSliders = document.querySelectorAll('.js-hero-slider[data-initialized]');
    heroSliders.forEach((slider) => {
      if (slider._sliderInstance?.destroy) {
        slider._sliderInstance.destroy();
      }
    });
  };

  // Register with page transitions for SWUP support
  if (window.PageTransitions) {
    window.PageTransitions.registerComponent('hero-slider', initAllSliders);
    window.PageTransitions.registerCleanup('hero-slider', cleanupAllSliders);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllSliders);
  } else {
    initAllSliders();
  }
};

// Auto-initialize
initHeroSlider();
