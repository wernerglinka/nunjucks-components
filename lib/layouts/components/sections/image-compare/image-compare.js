/**
 * Image Compare Component
 * Manages before/after image comparison with draggable handle
 */

const initImageCompare = () => {
  /**
   * Creates a new image compare instance
   * @param {HTMLElement} element - The comparison container element
   * @param {Object} options - Configuration options
   * @returns {Object} The image compare instance
   */
  function createImageCompare(element, options = {}) {
    const defaultOptions = {
      startPosition: 50,
      labelBeforeText: 'Before',
      labelAfterText: 'After'
    };

    const settings = { ...defaultOptions, ...options };

    const compare = {
      element,
      handle: element.querySelector('.comparison-handle'),
      afterImage: element.querySelector('.after-image'),
      labelBefore: element.querySelector('.image-status.before'),
      labelAfter: element.querySelector('.image-status.after'),
      isDragging: false,
      isResizing: false
    };

    if (!compare.handle || !compare.afterImage) {
      console.warn('Image compare missing required elements');
      return null;
    }

    let intersectionObserver;
    let resizeObserver;

    /**
     * Updates label visibility based on handle position
     */
    const updateLabel = (label, afterImage, position) => {
      if (!label || !afterImage) {
        return;
      }

      if (position === 'left') {
        if (label.offsetLeft + label.offsetWidth < afterImage.offsetLeft + afterImage.offsetWidth) {
          label.classList.remove('is-hidden');
        } else {
          label.classList.add('is-hidden');
        }
      } else if (label.offsetLeft > afterImage.offsetLeft + afterImage.offsetWidth) {
        label.classList.remove('is-hidden');
      } else {
        label.classList.add('is-hidden');
      }
    };

    /**
     * Checks and updates label visibility
     */
    const checkLabels = () => {
      updateLabel(compare.labelAfter, compare.afterImage, 'left');
      updateLabel(compare.labelBefore, compare.afterImage, 'right');

      compare.isResizing = false;
    };

    /**
     * Reflects the current divider position in the handle's aria-valuenow
     */
    const updateAriaValue = () => {
      const containerWidth = element.offsetWidth;
      const percentage = containerWidth ? (compare.afterImage.offsetWidth / containerWidth) * 100 : 0;
      compare.handle.setAttribute('aria-valuenow', String(Math.round(percentage)));
    };

    // Metrics of the drag in progress, or null when not dragging
    let activeDrag = null;

    /**
     * Captures container and handle geometry at drag start
     * @param {number} clientX - Horizontal viewport coordinate of the pointer
     * @returns {Object} Drag boundaries and offsets
     */
    const getDragMetrics = (clientX) => {
      const containerLeft = element.getBoundingClientRect().left;
      const containerWidth = element.offsetWidth;
      const dragHandleWidth = compare.handle.offsetWidth;
      const dragHandleCenter = compare.handle.offsetLeft + dragHandleWidth / 2;

      return {
        containerLeft,
        dragHandleWidth,
        // Offset between the drag handle center and the pointer position
        cursorToDragHandleCenterOffset: dragHandleCenter - (clientX - containerLeft),
        minDragHandlePosition: -dragHandleWidth / 2,
        maxDragHandlePosition: containerWidth - dragHandleWidth / 2
      };
    };

    /**
     * Animates the dragged handle and updates image width
     * @param {number} clientX - Horizontal viewport coordinate of the pointer
     * @param {Object} metrics - Drag metrics from getDragMetrics
     */
    const animateDraggedHandle = (clientX, metrics) => {
      const {
        containerLeft,
        dragHandleWidth,
        cursorToDragHandleCenterOffset,
        minDragHandlePosition,
        maxDragHandlePosition
      } = metrics;

      const dragHandlePosition = clientX - containerLeft - dragHandleWidth / 2 + cursorToDragHandleCenterOffset;
      const clampedPosition = Math.max(minDragHandlePosition, Math.min(maxDragHandlePosition, dragHandlePosition));

      // Update the handle position and after image width
      compare.handle.style.left = `${clampedPosition}px`;
      compare.afterImage.style.width = `${clampedPosition + dragHandleWidth / 2}px`;

      updateLabel(compare.labelAfter, compare.afterImage, 'left');
      updateLabel(compare.labelBefore, compare.afterImage, 'right');
      updateAriaValue();

      compare.isDragging = false;
    };

    /**
     * Schedules a handle update for the given pointer position
     * @param {number} clientX - Horizontal viewport coordinate of the pointer
     */
    const handlePointerMove = (clientX) => {
      if (!activeDrag || compare.isDragging) {
        return;
      }

      const { metrics } = activeDrag;
      compare.isDragging = true;
      requestAnimationFrame(() => {
        animateDraggedHandle(clientX, metrics);
      });
    };

    /**
     * Handles mouse movement during a drag
     */
    const handleMouseMove = (e) => handlePointerMove(e.clientX);

    /**
     * Handles touch movement during a drag
     */
    const handleTouchMove = (e) => handlePointerMove(e.touches[0].clientX);

    /**
     * Ends a drag and removes all document-level listeners
     */
    const endDrag = () => {
      activeDrag = null;
      compare.handle.classList.remove('is-dragged');
      compare.afterImage.classList.remove('resizable');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', endDrag);
      document.removeEventListener('touchcancel', endDrag);
    };

    /**
     * Begins a drag at the given pointer position
     * @param {number} clientX - Horizontal viewport coordinate of the pointer
     */
    const beginDrag = (clientX) => {
      compare.handle.classList.add('is-dragged');
      compare.afterImage.classList.add('resizable');
      activeDrag = { metrics: getDragMetrics(clientX) };
    };

    /**
     * Handles mouse drag start
     */
    const handleDragStart = (e) => {
      e.preventDefault();
      beginDrag(e.clientX);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', endDrag);
    };

    /**
     * Handles touch drag start. Scrolling is suppressed via the handle's
     * touch-action: none style, so all touch listeners can stay passive.
     */
    const handleTouchStart = (e) => {
      beginDrag(e.touches[0].clientX);
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', endDrag);
      document.addEventListener('touchcancel', endDrag);
    };

    /**
     * Handles keyboard interaction on the slider handle
     */
    const handleKeyDown = (e) => {
      const step = e.shiftKey ? 10 : 2;
      const containerWidth = element.offsetWidth;
      const currentPercentage = containerWidth ? (compare.afterImage.offsetWidth / containerWidth) * 100 : 0;
      let nextPercentage;

      switch (e.key) {
        case 'ArrowLeft':
          nextPercentage = currentPercentage - step;
          break;
        case 'ArrowRight':
          nextPercentage = currentPercentage + step;
          break;
        case 'Home':
          nextPercentage = 0;
          break;
        case 'End':
          nextPercentage = 100;
          break;
        default:
          return;
      }

      e.preventDefault();
      setPosition(nextPercentage);
    };

    /**
     * Sets up intersection observer for animation on scroll
     */
    const setupIntersectionObserver = () => {
      intersectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            element.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      });

      intersectionObserver.observe(element);
    };

    /**
     * Sets up resize observer for responsive behavior
     */
    const setupResizeObserver = () => {
      resizeObserver = new ResizeObserver(() => {
        if (!compare.isResizing) {
          compare.isResizing = true;
          checkLabels();
        }
      });

      resizeObserver.observe(element);
    };

    /**
     * Sets the comparison position
     * @param {number} percentage - Position as percentage (0-100)
     */
    const setPosition = (percentage) => {
      const clampedPercentage = Math.max(0, Math.min(100, percentage));
      compare.afterImage.style.width = `${clampedPercentage}%`;

      const handlePosition = (clampedPercentage / 100) * element.offsetWidth - compare.handle.offsetWidth / 2;
      compare.handle.style.left = `${handlePosition}px`;

      compare.handle.setAttribute('aria-valuenow', String(Math.round(clampedPercentage)));
      checkLabels();
    };

    /**
     * Initializes the component
     */
    const init = () => {
      // Set up drag handling
      compare.handle.addEventListener('mousedown', handleDragStart);
      compare.handle.addEventListener('touchstart', handleTouchStart, { passive: true });

      // Keyboard support
      compare.handle.addEventListener('keydown', handleKeyDown);

      // Set up observers
      setupIntersectionObserver();
      setupResizeObserver();

      // Set initial position
      if (settings.startPosition !== 50) {
        setPosition(settings.startPosition);
      } else {
        compare.handle.setAttribute('aria-valuenow', '50');
      }
    };

    /**
     * Destroys the instance and cleans up
     */
    const destroy = () => {
      endDrag();
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      compare.handle.removeEventListener('mousedown', handleDragStart);
      compare.handle.removeEventListener('touchstart', handleTouchStart);
      compare.handle.removeEventListener('keydown', handleKeyDown);
    };

    // Initialize and return public API
    init();

    return {
      element: compare.element,
      setPosition,
      destroy
    };
  }

  /**
   * Initializes all image compare components on the page
   */
  const initAllComparisons = () => {
    const comparisons = document.querySelectorAll('.image-comparison-container');
    const instances = [];

    comparisons.forEach((container) => {
      // Skip if already initialized
      if (container.dataset.initialized) {
        return;
      }
      container.dataset.initialized = 'true';

      // Parse options from data attributes if available
      const options = {
        startPosition: parseInt(container.dataset.startPosition) || 50,
        labelBeforeText: container.dataset.labelBefore || 'Before',
        labelAfterText: container.dataset.labelAfter || 'After'
      };

      const instance = createImageCompare(container, options);
      if (instance) {
        instances.push(instance);
        // Store instance for cleanup
        container._compareInstance = instance;
      }
    });

    return instances;
  };

  /**
   * Cleanup all image compare components
   */
  const cleanupAllComparisons = () => {
    const comparisons = document.querySelectorAll('.image-comparison-container[data-initialized]');
    comparisons.forEach((container) => {
      if (container._compareInstance && container._compareInstance.destroy) {
        container._compareInstance.destroy();
      }
    });
  };

  // Register with page transitions for SWUP support
  if (window.PageTransitions) {
    window.PageTransitions.registerComponent('image-compare', initAllComparisons);
    window.PageTransitions.registerCleanup('image-compare', cleanupAllComparisons);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllComparisons);
  } else {
    initAllComparisons();
  }
};

// Auto-initialize
initImageCompare();
