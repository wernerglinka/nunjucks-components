/**
 * Hero Slider Component
 * Manages multiple slides with navigation, autoplay, and transitions
 */

/**
 * Play or pause a YouTube or Vimeo background video. Both players take
 * commands as messages to their frame; YouTube needs `enablejsapi=1` in the
 * frame's address for that, which the template sets.
 * @param {HTMLIFrameElement} iframe - The player's frame
 * @param {boolean} play - True to play, false to pause
 */
const controlEmbeddedVideo = (iframe, play) => {
  let origin;
  try {
    origin = new URL(iframe.src).origin;
  } catch {
    return;
  }
  const message = origin.includes('vimeo')
    ? { method: play ? 'play' : 'pause' }
    : { event: 'command', func: play ? 'playVideo' : 'pauseVideo', args: [] };
  iframe.contentWindow?.postMessage(JSON.stringify(message), origin);
};

/**
 * Play or pause a slide's background video, whichever kind it is
 * @param {HTMLElement|undefined} slide - The slide
 * @param {boolean} play - True to play, false to pause
 * @param {boolean} [rewind=false] - Start a file-based video from the beginning next time
 */
const controlBackgroundVideo = (slide, play, rewind = false) => {
  const media = slide?.querySelector('.background-video video, .background-video iframe');
  if (!media) {
    return;
  }
  if (media.tagName === 'IFRAME') {
    controlEmbeddedVideo(media, play);
  } else if (play) {
    media.play().catch((err) => {
      console.warn('Video autoplay prevented:', err);
    });
  } else {
    media.pause();
    if (rewind) {
      media.currentTime = 0;
    }
  }
};

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
      // True while the pointer is over the slider or the keyboard is inside it
      isHeld: false,
      hasVideo: element.querySelector('.background-video') !== null,
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
      // Every slide change comes through here, so the hold has to be checked
      // here too: picking a slide with the mouse must not restart the timer
      // under the pointer
      clearInterval(slider.autoPlayId);
      if (slider.autoplay && !slider.isPaused && !slider.isHeld) {
        slider.autoPlayId = setInterval(autoplaySlider, slider.autoPlayDelay);
      }
    };

    /**
     * Hold autoplay while the visitor is pointing at or working inside the
     * slider, and let it go on when they leave
     * @param {boolean} held - Whether the slider is being pointed at or has focus
     */
    const setHeld = (held) => {
      slider.isHeld = held;
      slider.element.classList.toggle('is-paused', held && !slider.isPaused);
      setAutoplay();
    };

    /**
     * Only the selected slide can be reached. The others are still in the
     * document, moved out of view, and their links would otherwise take focus.
     */
    const syncSlideAccess = () => {
      slider.slides.forEach((slide, index) => {
        slide.inert = index !== slider.newSlideIndex;
      });
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
        // Without autoplay the button is there for the background video alone
        const subject = slider.autoplay ? 'slideshow' : 'background video';
        slider.pauseButton.setAttribute('aria-label', `${slider.isPaused ? 'Play' : 'Pause'} ${subject}`);
      }
    };

    /**
     * Toggles pause/resume state. The pause stays in effect while the visitor
     * moves between slides, until they resume it.
     */
    const togglePause = () => {
      slider.isPaused = !slider.isPaused;

      setAutoplay();
      syncPauseState();

      // A looping background video is motion too: pause and resume it with the slideshow
      controlBackgroundVideo(slider.slides[slider.newSlideIndex], !slider.isPaused);

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
      syncSlideAccess();

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
      // Stop the video in the slide being left
      if (slider.oldSlideIndex !== slider.newSlideIndex) {
        controlBackgroundVideo(slider.slides[slider.oldSlideIndex], false, true);
      }

      // Start the video in the new slide, unless the slideshow is paused: a
      // looping background video is motion the visitor asked to stop
      controlBackgroundVideo(slider.slides[slider.newSlideIndex], !slider.isPaused);
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

      syncSlideAccess();

      // Reduced motion: start paused. The visitor can still press play.
      if ((slider.autoplay || slider.hasVideo) && prefersReducedMotion) {
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

      // Autoplay holds while the pointer is over the slider or the keyboard is
      // inside it, so content does not move away from someone reading or
      // operating it. Focus counts only when it is keyboard focus
      // (:focus-visible): a tab picked with the mouse keeps focus afterwards,
      // and that must not stop the slideshow for good.
      if (slider.autoplay) {
        let hovered = false;
        const sync = () => setHeld(hovered || slider.element.querySelector(':focus-visible') !== null);

        slider.element.addEventListener('mouseenter', () => {
          hovered = true;
          sync();
        });
        slider.element.addEventListener('mouseleave', () => {
          hovered = false;
          sync();
        });
        slider.element.addEventListener('focusin', sync);
        // The element losing focus still matches until the event is over
        slider.element.addEventListener('focusout', () => setTimeout(sync, 0));

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
