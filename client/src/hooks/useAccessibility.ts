import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { aria, focus, announce, keyboard, motion } from '@/lib/accessibility';

/**
 * React hooks for accessibility features
 *
 * These hooks make it easy to add WCAG AAA compliant accessibility
 * features to any component in the Cathcr UI system.
 */

// ARIA attributes hook for form controls
export function useARIAFormControl(props: {
  id?: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}) {
  const ariaProps = useMemo(() => aria.formControl(props), [
    props.id,
    props.label,
    props.description,
    props.error,
    props.required
  ]);

  return ariaProps;
}

// Focus management hook
export function useFocusManagement() {
  const restoreFocusRef = useRef<(() => void) | null>(null);

  const saveFocus = useCallback(() => {
    restoreFocusRef.current = focus.createFocusRestorer();
  }, []);

  const restoreFocus = useCallback(() => {
    if (restoreFocusRef.current) {
      restoreFocusRef.current();
      restoreFocusRef.current = null;
    }
  }, []);

  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElements = focus.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focus.focusWithIndicator(focusableElements[0]);
    }
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
  };
}

// Focus trap hook for modals and overlays
export function useFocusTrap(isActive: boolean = false) {
  const containerRef = useRef<HTMLElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      // Clean up existing trap
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      return;
    }

    // Set up focus trap
    cleanupRef.current = focus.trapFocus(containerRef.current);

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [isActive]);

  return containerRef;
}

// Screen reader announcements hook
export function useAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Import announce from accessibility lib and use it
    const { announce: announceUtil } = require('@/lib/accessibility');
    announceUtil.message(message, priority);
  }, []);

  const announceStatus = useCallback((status: 'loading' | 'success' | 'error', details?: string) => {
    const { announce: announceUtil } = require('@/lib/accessibility');
    announceUtil.status(status, details);
  }, []);

  const announceNavigation = useCallback((destination: string) => {
    const { announce: announceUtil } = require('@/lib/accessibility');
    announceUtil.navigation(destination);
  }, []);

  return {
    announce,
    announceStatus,
    announceNavigation,
  };
}

// Keyboard navigation hook
export function useKeyboardNavigation(props: {
  orientation?: 'horizontal' | 'vertical' | 'grid';
  wrap?: boolean;
  columns?: number;
  onEscape?: () => void;
  onEnter?: () => void;
  customHandlers?: Record<string, () => void>;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const { orientation, wrap, columns, onEscape, onEnter, customHandlers = {} } = props;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlers: Record<string, () => void> = {
      ...customHandlers,
    };

    if (onEscape) handlers.Escape = onEscape;
    if (onEnter) handlers.Enter = onEnter;

    const keyHandler = keyboard.createKeyHandler(handlers);
    const arrowHandler = keyboard.createArrowNavigation({
      container,
      orientation,
      wrap,
      columns
    });

    const combinedHandler = (event: KeyboardEvent) => {
      // Try arrow navigation first
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        arrowHandler(event);
      } else {
        keyHandler(event);
      }
    };

    container.addEventListener('keydown', combinedHandler);

    return () => {
      container.removeEventListener('keydown', combinedHandler);
    };
  }, [orientation, wrap, columns, onEscape, onEnter, customHandlers]);

  return containerRef;
}

// Reduced motion hook
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    motion.prefersReducedMotion()
  );

  useEffect(() => {
    return motion.onReducedMotionChange(setPrefersReducedMotion);
  }, []);

  const getDuration = useCallback((normal: number, reduced: number = 0) => {
    return prefersReducedMotion ? reduced : normal;
  }, [prefersReducedMotion]);

  return {
    prefersReducedMotion,
    getDuration,
  };
}

// Auto-generated IDs hook
export function useId(prefix?: string): string {
  const id = useMemo(() => aria.generateId(prefix), [prefix]);
  return id;
}

// Live region hook for dynamic content
export function useLiveRegion(politeness: 'polite' | 'assertive' | 'off' = 'polite') {
  const regionRef = useRef<HTMLElement>(null);
  const [message, setMessage] = useState<string>('');

  const announce = useCallback((newMessage: string) => {
    setMessage(''); // Clear first to ensure announcement
    setTimeout(() => setMessage(newMessage), 50);
  }, []);

  const ariaProps = useMemo(() => aria.liveRegion(politeness), [politeness]);

  return {
    regionRef,
    ariaProps,
    announce,
    message,
  };
}

// Modal accessibility hook
export function useModalAccessibility(isOpen: boolean) {
  const { saveFocus, restoreFocus } = useFocusManagement();
  const focusTrapRef = useFocusTrap(isOpen);
  const modalId = useId('modal');
  const titleId = useId('modal-title');
  const descriptionId = useId('modal-description');

  useEffect(() => {
    if (isOpen) {
      saveFocus();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      restoreFocus();
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
    };
  }, [isOpen, saveFocus, restoreFocus]);

  const ariaProps = useMemo(() => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
    id: modalId,
  }), [modalId, titleId, descriptionId]);

  return {
    focusTrapRef,
    ariaProps,
    ids: {
      modal: modalId,
      title: titleId,
      description: descriptionId,
    },
  };
}

// Button accessibility hook
export function useButtonAccessibility(props: {
  pressed?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}) {
  const { pressed, expanded, disabled, loading, onClick } = props;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && onClick && !disabled && !loading) {
      event.preventDefault();
      onClick();
    }
  }, [onClick, disabled, loading]);

  const ariaProps = useMemo(() => aria.button({
    pressed,
    expanded,
    disabled,
    loading,
  }), [pressed, expanded, disabled, loading]);

  return {
    ariaProps,
    handleKeyDown,
  };
}

// Skip link hook
export function useSkipLink(targetId: string, text?: string) {
  useEffect(() => {
    const skipLink = keyboard.createSkipLink(targetId, text);
    document.body.insertBefore(skipLink, document.body.firstChild);

    return () => {
      if (skipLink.parentNode) {
        skipLink.parentNode.removeChild(skipLink);
      }
    };
  }, [targetId, text]);
}

// Color contrast validation hook
export function useColorContrast(foreground: string, background: string, level: 'AA' | 'AAA' = 'AAA') {
  const validation = useMemo(() => {
    const { contrast } = require('@/lib/accessibility');
    return contrast.validateWCAG(foreground, background, level);
  }, [foreground, background, level]);

  return validation;
}

// Comprehensive accessibility state hook
export function useAccessibilityState() {
  const { prefersReducedMotion } = useReducedMotion();
  const { announce } = useAnnounce();

  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);

  useEffect(() => {
    // Check for high contrast mode
    const checkHighContrast = () => {
      setHighContrast(window.matchMedia('(prefers-contrast: high)').matches);
    };

    // Check for large text preference
    const checkLargeText = () => {
      setLargeText(window.matchMedia('(min-resolution: 2dppx)').matches);
    };

    checkHighContrast();
    checkLargeText();

    // Listen for changes
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const textQuery = window.matchMedia('(min-resolution: 2dppx)');

    contrastQuery.addEventListener('change', checkHighContrast);
    textQuery.addEventListener('change', checkLargeText);

    return () => {
      contrastQuery.removeEventListener('change', checkHighContrast);
      textQuery.removeEventListener('change', checkLargeText);
    };
  }, []);

  return {
    prefersReducedMotion,
    highContrast,
    largeText,
    announce,
  };
}

export {
  aria,
  focus,
  announce as announceUtil,
  keyboard,
  motion,
} from '@/lib/accessibility';