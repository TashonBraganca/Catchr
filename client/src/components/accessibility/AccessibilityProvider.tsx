import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAccessibilityState, useAnnounce } from '@/hooks/useAccessibility';
import { contrast } from '@/lib/accessibility';

/**
 * Accessibility Provider for Cathcr
 *
 * Provides global accessibility state and configuration.
 * Ensures WCAG AAA compliance across the entire application.
 */

interface AccessibilityConfig {
  // Color system validation
  enforceColorContrast: boolean;
  contrastLevel: 'AA' | 'AAA';

  // Animation preferences
  respectReducedMotion: boolean;
  fallbackAnimationDuration: number;

  // Focus management
  enableFocusRings: boolean;
  focusRingColor: string;

  // Screen reader support
  enableAnnouncements: boolean;
  announcementDelay: number;

  // Keyboard navigation
  enableKeyboardShortcuts: boolean;
  enableArrowNavigation: boolean;

  // Debug mode
  debugAccessibility: boolean;
  highlightFocusableElements: boolean;
}

interface AccessibilityContextValue {
  config: AccessibilityConfig;
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;

  // Accessibility state
  prefersReducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;

  // Utilities
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  validateContrast: (foreground: string, background: string) => {
    ratio: number;
    passes: boolean;
    required: number;
  };

  // Orange color system validation results
  colorSystemValidation: Record<string, any>;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

interface AccessibilityProviderProps {
  children: React.ReactNode;
  config?: Partial<AccessibilityConfig>;
}

// Default configuration optimized for Cathcr
const defaultConfig: AccessibilityConfig = {
  enforceColorContrast: true,
  contrastLevel: 'AAA',
  respectReducedMotion: true,
  fallbackAnimationDuration: 0,
  enableFocusRings: true,
  focusRingColor: '#FFA500', // Orange focus rings
  enableAnnouncements: true,
  announcementDelay: 100,
  enableKeyboardShortcuts: true,
  enableArrowNavigation: true,
  debugAccessibility: process.env.NODE_ENV === 'development',
  highlightFocusableElements: false,
};

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  config: configOverrides = {}
}) => {
  const [config, setConfig] = useState<AccessibilityConfig>({
    ...defaultConfig,
    ...configOverrides
  });

  const {
    prefersReducedMotion,
    highContrast,
    largeText,
    announce
  } = useAccessibilityState();

  // Validate orange color system on mount
  const [colorSystemValidation, setColorSystemValidation] = useState<Record<string, any>>({});

  useEffect(() => {
    const validation = contrast.validateOrangeSystem();
    setColorSystemValidation(validation);

    if (config.debugAccessibility) {
      console.group('🔍 Cathcr Accessibility System');
      console.log('Orange Color System WCAG Validation:', validation);
      console.log('User Preferences:', {
        prefersReducedMotion,
        highContrast,
        largeText
      });
      console.log('Configuration:', config);
      console.groupEnd();
    }
  }, [config.debugAccessibility, prefersReducedMotion, highContrast, largeText]);

  // Apply global accessibility styles
  useEffect(() => {
    const styles = document.createElement('style');
    styles.id = 'cathcr-accessibility-styles';

    let css = `
      /* Focus ring styles */
      [data-focus-visible="true"] {
        outline: 2px solid ${config.focusRingColor} !important;
        outline-offset: 2px !important;
      }

      /* Skip link styles */
      .skip-link:focus {
        background: ${config.focusRingColor} !important;
        color: #000 !important;
      }

      /* Reduced motion styles */
      ${prefersReducedMotion ? `
        *, *::before, *::after {
          animation-duration: ${config.fallbackAnimationDuration}s !important;
          animation-delay: 0s !important;
          transition-duration: ${config.fallbackAnimationDuration}s !important;
          transition-delay: 0s !important;
        }
      ` : ''}

      /* High contrast adjustments */
      ${highContrast ? `
        .glass-card, .glass-strong, .glass-premium {
          border-width: 2px !important;
          background-color: rgba(255, 165, 0, 0.2) !important;
        }
      ` : ''}

      /* Debug mode: highlight focusable elements */
      ${config.debugAccessibility && config.highlightFocusableElements ? `
        button:not([disabled]),
        input:not([disabled]),
        select:not([disabled]),
        textarea:not([disabled]),
        a[href],
        [tabindex]:not([tabindex="-1"]),
        [contenteditable="true"] {
          box-shadow: 0 0 0 1px rgba(255, 165, 0, 0.5) !important;
        }
      ` : ''}
    `;

    styles.textContent = css;
    document.head.appendChild(styles);

    return () => {
      const existingStyles = document.getElementById('cathcr-accessibility-styles');
      if (existingStyles) {
        existingStyles.remove();
      }
    };
  }, [
    config.focusRingColor,
    config.fallbackAnimationDuration,
    config.debugAccessibility,
    config.highlightFocusableElements,
    prefersReducedMotion,
    highContrast
  ]);

  const updateConfig = (updates: Partial<AccessibilityConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const validateContrast = (foreground: string, background: string) => {
    return contrast.validateWCAG(foreground, background, config.contrastLevel);
  };

  const contextValue: AccessibilityContextValue = {
    config,
    updateConfig,
    prefersReducedMotion,
    highContrast,
    largeText,
    announce,
    validateContrast,
    colorSystemValidation,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}

      {/* Debug panel in development */}
      {config.debugAccessibility && process.env.NODE_ENV === 'development' && (
        <AccessibilityDebugPanel />
      )}
    </AccessibilityContext.Provider>
  );
};

// Debug panel for development
const AccessibilityDebugPanel: React.FC = () => {
  const context = useContext(AccessibilityContext);
  if (!context) return null;

  const {
    config,
    updateConfig,
    prefersReducedMotion,
    highContrast,
    largeText,
    colorSystemValidation
  } = context;

  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-[9999] p-3 bg-orange-primary text-black rounded-full shadow-lg hover:scale-110 transition-transform"
        title="Toggle Accessibility Debug Panel"
        aria-label="Accessibility Debug Panel Toggle"
      >
        ♿
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-[9998] w-80 max-h-96 overflow-auto bg-black/90 backdrop-blur-xl border border-orange-light rounded-lg p-4 text-white text-sm font-primary">
          <h3 className="text-orange-primary font-bold mb-3">🔍 Accessibility Debug</h3>

          {/* User preferences */}
          <div className="mb-4">
            <h4 className="text-orange-secondary font-semibold mb-2">User Preferences</h4>
            <div className="space-y-1 text-xs">
              <div>Reduced Motion: {prefersReducedMotion ? '✅' : '❌'}</div>
              <div>High Contrast: {highContrast ? '✅' : '❌'}</div>
              <div>Large Text: {largeText ? '✅' : '❌'}</div>
            </div>
          </div>

          {/* Color system validation */}
          <div className="mb-4">
            <h4 className="text-orange-secondary font-semibold mb-2">Color System (WCAG {config.contrastLevel})</h4>
            <div className="space-y-1 text-xs">
              {Object.entries(colorSystemValidation).map(([color, results]) => {
                const firstResult = Array.isArray(results) ? results[0] : results;
                const passes = firstResult?.passes;
                return (
                  <div key={color}>
                    {color}: {passes ? '✅' : '❌'} ({firstResult?.ratio?.toFixed(1)}:1)
                  </div>
                );
              })}
            </div>
          </div>

          {/* Debug controls */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                checked={config.highlightFocusableElements}
                onChange={(e) => updateConfig({ highlightFocusableElements: e.target.checked })}
                className="accent-orange-primary"
              />
              <span>Highlight Focusable Elements</span>
            </label>

            <label className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                checked={config.enableAnnouncements}
                onChange={(e) => updateConfig({ enableAnnouncements: e.target.checked })}
                className="accent-orange-primary"
              />
              <span>Screen Reader Announcements</span>
            </label>
          </div>
        </div>
      )}
    </>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityProvider;