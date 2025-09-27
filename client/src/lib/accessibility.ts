/**
 * Comprehensive Accessibility Foundation
 *
 * WCAG AAA compliant utilities for the Cathcr orange glass UI system.
 * Ensures all components are accessible to users with disabilities.
 */

// ARIA utilities
export const aria = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'cathcr'): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Create proper ARIA attributes for form controls
  formControl: (props: {
    id?: string;
    label?: string;
    description?: string;
    error?: string;
    required?: boolean;
  }) => {
    const id = props.id || aria.generateId('control');
    const labelId = `${id}-label`;
    const descriptionId = props.description ? `${id}-description` : undefined;
    const errorId = props.error ? `${id}-error` : undefined;

    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ');

    return {
      'aria-labelledby': labelId,
      'aria-describedby': describedBy || undefined,
      'aria-invalid': !!props.error,
      'aria-required': props.required,
      ids: {
        control: id,
        label: labelId,
        description: descriptionId,
        error: errorId,
      }
    };
  },

  // Modal/Dialog ARIA attributes
  dialog: (props: {
    title?: string;
    description?: string;
    role?: 'dialog' | 'alertdialog';
  }) => ({
    role: props.role || 'dialog',
    'aria-modal': true,
    'aria-labelledby': props.title ? aria.generateId('dialog-title') : undefined,
    'aria-describedby': props.description ? aria.generateId('dialog-description') : undefined,
  }),

  // Button states for UI feedback
  button: (props: {
    pressed?: boolean;
    expanded?: boolean;
    disabled?: boolean;
    loading?: boolean;
  }) => ({
    'aria-pressed': props.pressed,
    'aria-expanded': props.expanded,
    'aria-disabled': props.disabled,
    'aria-busy': props.loading,
  }),

  // Live region for dynamic content announcements
  liveRegion: (politeness: 'polite' | 'assertive' | 'off' = 'polite') => ({
    'aria-live': politeness,
    'aria-atomic': true,
    role: politeness === 'assertive' ? 'alert' : 'status',
  }),
};

// Focus management utilities
export const focus = {
  // Get all focusable elements within a container
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter((element) => {
        const el = element as HTMLElement;
        return el.offsetParent !== null && !el.hasAttribute('aria-hidden');
      }) as HTMLElement[];
  },

  // Focus trap for modals and overlays
  trapFocus: (container: HTMLElement) => {
    const focusableElements = focus.getFocusableElements(container);
    if (focusableElements.length === 0) return () => {};

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element initially
    firstElement?.focus();

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab (backwards)
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab (forwards)
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  // Restore focus to previously focused element
  createFocusRestorer: () => {
    const previousElement = document.activeElement as HTMLElement;

    return () => {
      if (previousElement && typeof previousElement.focus === 'function') {
        // Use RAF to ensure focus happens after other DOM changes
        requestAnimationFrame(() => {
          previousElement.focus();
        });
      }
    };
  },

  // Focus with visual indicator (for keyboard navigation)
  focusWithIndicator: (element: HTMLElement, options?: FocusOptions) => {
    element.focus(options);
    element.setAttribute('data-focus-visible', 'true');

    // Remove indicator after a short delay or on blur
    const removeIndicator = () => {
      element.removeAttribute('data-focus-visible');
      element.removeEventListener('blur', removeIndicator);
    };

    element.addEventListener('blur', removeIndicator);
  },
};

// Screen reader announcements
export const announce = {
  // Create announcement element if it doesn't exist
  ensureAnnouncementRegion: (): HTMLElement => {
    const existingRegion = document.getElementById('cathcr-announcements');
    if (existingRegion) return existingRegion;

    const region = document.createElement('div');
    region.id = 'cathcr-announcements';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.cssText = `
      position: absolute !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      overflow: hidden !important;
    `;

    document.body.appendChild(region);
    return region;
  },

  // Announce message to screen readers
  message: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = announce.ensureAnnouncementRegion();
    region.setAttribute('aria-live', priority);

    // Clear previous announcement
    region.textContent = '';

    // Announce new message after a brief delay (ensures it's read)
    setTimeout(() => {
      region.textContent = message;
    }, 100);

    // Clear the message after it's likely been read
    setTimeout(() => {
      if (region.textContent === message) {
        region.textContent = '';
      }
    }, 5000);
  },

  // Announce status changes (for loading states, success, errors)
  status: (status: 'loading' | 'success' | 'error', details?: string) => {
    const messages = {
      loading: `Loading${details ? `: ${details}` : '...'}`,
      success: `Success${details ? `: ${details}` : '!'}`,
      error: `Error${details ? `: ${details}` : '. Please try again.'}`
    };

    const priority = status === 'error' ? 'assertive' : 'polite';
    announce.message(messages[status], priority);
  },

  // Announce navigation changes
  navigation: (destination: string) => {
    announce.message(`Navigated to ${destination}`, 'polite');
  },
};

// Color contrast utilities for WCAG compliance
export const contrast = {
  // Convert hex to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // Calculate relative luminance
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1: string, color2: string): number => {
    const rgb1 = contrast.hexToRgb(color1);
    const rgb2 = contrast.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = contrast.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = contrast.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Validate WCAG compliance
  validateWCAG: (foreground: string, background: string, level: 'AA' | 'AAA' = 'AAA') => {
    const ratio = contrast.getContrastRatio(foreground, background);
    const requirements = {
      AA: 4.5,
      AAA: 7.0
    };

    return {
      ratio,
      passes: ratio >= requirements[level],
      required: requirements[level],
      level
    };
  },

  // Our orange color system WCAG validation
  validateOrangeSystem: () => {
    const orangeColors = {
      primary: '#FFA500',
      secondary: '#FFAB40',
      accent: '#FF8C00',
      tertiary: '#FFCC80',
      bright: '#FF7F00',
      neon: '#FF6F00',
      glow: '#FFB347',
    };

    const backgrounds = ['#000000', '#1a1a1a', '#333333'];
    const results: Record<string, any> = {};

    Object.entries(orangeColors).forEach(([name, color]) => {
      results[name] = backgrounds.map(bg => ({
        background: bg,
        ...contrast.validateWCAG(color, bg, 'AAA')
      }));
    });

    return results;
  },
};

// Keyboard navigation utilities
export const keyboard = {
  // Common keyboard event handlers
  createKeyHandler: (handlers: Record<string, () => void>) => {
    return (event: KeyboardEvent) => {
      const handler = handlers[event.key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    };
  },

  // Arrow navigation for grids and lists
  createArrowNavigation: (props: {
    container: HTMLElement;
    orientation?: 'horizontal' | 'vertical' | 'grid';
    wrap?: boolean;
    columns?: number;
  }) => {
    const { container, orientation = 'vertical', wrap = true, columns = 1 } = props;

    return (event: KeyboardEvent) => {
      const focusableElements = focus.getFocusableElements(container);
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'grid') {
            nextIndex = orientation === 'grid'
              ? currentIndex - columns
              : currentIndex - 1;
          }
          break;
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'grid') {
            nextIndex = orientation === 'grid'
              ? currentIndex + columns
              : currentIndex + 1;
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'grid') {
            nextIndex = currentIndex - 1;
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'grid') {
            nextIndex = currentIndex + 1;
          }
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = focusableElements.length - 1;
          break;
        default:
          return;
      }

      // Handle wrapping
      if (wrap) {
        if (nextIndex < 0) nextIndex = focusableElements.length - 1;
        if (nextIndex >= focusableElements.length) nextIndex = 0;
      } else {
        if (nextIndex < 0) nextIndex = 0;
        if (nextIndex >= focusableElements.length) nextIndex = focusableElements.length - 1;
      }

      if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        event.preventDefault();
        focus.focusWithIndicator(focusableElements[nextIndex]);
      }
    };
  },

  // Skip link functionality
  createSkipLink: (targetId: string, text: string = 'Skip to main content') => {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      opacity: 0;
      transform: translateY(-100%);
      transition: all 0.2s ease;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.opacity = '1';
      skipLink.style.transform = 'translateY(0)';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.opacity = '0';
      skipLink.style.transform = 'translateY(-100%)';
    });

    return skipLink;
  },
};

// Reduced motion utilities
export const motion = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Create media query listener for reduced motion changes
  onReducedMotionChange: (callback: (prefersReduced: boolean) => void) => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = (event: MediaQueryListEvent) => {
      callback(event.matches);
    };

    mediaQuery.addEventListener('change', handler);

    // Call immediately with current value
    callback(mediaQuery.matches);

    // Return cleanup function
    return () => mediaQuery.removeEventListener('change', handler);
  },

  // Get animation duration based on user preference
  getDuration: (normalDuration: number, reducedDuration: number = 0): number => {
    return motion.prefersReducedMotion() ? reducedDuration : normalDuration;
  },
};

export default {
  aria,
  focus,
  announce,
  contrast,
  keyboard,
  motion,
};