/**
 * Performance Optimization and Monitoring System
 *
 * Comprehensive tools for monitoring and optimizing the Cathcr orange glass UI system.
 * Includes cross-browser compatibility, performance budgets, and optimization utilities.
 */

import React from 'react';

// Performance monitoring utilities
export const performance = {
  // Performance observer for tracking metrics
  observer: null as PerformanceObserver | null,

  // Initialize performance monitoring
  init: () => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('Performance monitoring not available');
      return;
    }

    // Monitor largest contentful paint, first input delay, layout shifts
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          performance.trackMetric('LCP', entry.startTime);
        } else if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          performance.trackMetric('FID', fidEntry.processingStart - fidEntry.startTime);
        } else if (entry.entryType === 'layout-shift') {
          const clsEntry = entry as any;
          if (!clsEntry.hadRecentInput) {
            performance.trackMetric('CLS', clsEntry.value);
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      performance.observer = observer;
    } catch (error) {
      console.warn('Performance observer initialization failed:', error);
    }
  },

  // Track custom metrics
  trackMetric: (name: string, value: number, context?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric: ${name}`, {
        value: Math.round(value * 100) / 100,
        context,
        timestamp: Date.now()
      });
    }

    // In production, send to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_name: name,
        value: value,
        custom_parameters: context
      });
    }
  },

  // Measure component render time
  measureRender: <T extends (...args: any[]) => any>(
    componentName: string,
    renderFn: T
  ): T => {
    return ((...args: any[]) => {
      const startTime = performance.now();
      const result = renderFn(...args);
      const endTime = performance.now();

      performance.trackMetric('component_render_time', endTime - startTime, {
        component: componentName
      });

      return result;
    }) as T;
  },

  // Track animation frame rate
  trackAnimationPerformance: (animationName: string) => {
    let frameCount = 0;
    let startTime = performance.now();
    let animationId: number;

    const trackFrame = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - startTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - startTime));
        performance.trackMetric('animation_fps', fps, { animation: animationName });

        // Reset counters
        frameCount = 0;
        startTime = currentTime;
      }

      animationId = requestAnimationFrame(trackFrame);
    };

    animationId = requestAnimationFrame(trackFrame);

    return () => cancelAnimationFrame(animationId);
  },

  // Memory usage tracking
  trackMemoryUsage: () => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      performance.trackMetric('memory_used', memInfo.usedJSHeapSize / 1048576); // MB
      performance.trackMetric('memory_total', memInfo.totalJSHeapSize / 1048576); // MB
      performance.trackMetric('memory_limit', memInfo.jsHeapSizeLimit / 1048576); // MB
    }
  },

  // Bundle size tracking
  trackBundleSize: () => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      performance.trackMetric('network_type', 0, {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });
    }
  },

  // Cleanup
  cleanup: () => {
    if (performance.observer) {
      performance.observer.disconnect();
      performance.observer = null;
    }
  }
};

// Cross-browser compatibility utilities
export const browser = {
  // Browser detection
  detect: () => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

    return {
      chrome: /Chrome/.test(ua) && !/Edge/.test(ua),
      firefox: /Firefox/.test(ua),
      safari: /Safari/.test(ua) && !/Chrome/.test(ua),
      edge: /Edge/.test(ua),
      mobile: /Mobile|Android|iPhone|iPad/.test(ua),
      ios: /iPhone|iPad|iPod/.test(ua),
      android: /Android/.test(ua),
    };
  },

  // Feature detection
  supports: {
    backdropFilter: () => {
      if (typeof CSS === 'undefined') return false;
      return CSS.supports('backdrop-filter', 'blur(10px)') ||
             CSS.supports('-webkit-backdrop-filter', 'blur(10px)');
    },

    webgl: () => {
      if (typeof document === 'undefined') return false;
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch {
        return false;
      }
    },

    intersectionObserver: () => typeof IntersectionObserver !== 'undefined',

    resizeObserver: () => typeof ResizeObserver !== 'undefined',

    performanceObserver: () => typeof PerformanceObserver !== 'undefined',

    webAnimations: () => typeof document !== 'undefined' && 'animate' in document.createElement('div'),

    customProperties: () => {
      if (typeof CSS === 'undefined') return false;
      return CSS.supports('--test', 'red');
    },

    gridLayout: () => {
      if (typeof CSS === 'undefined') return false;
      return CSS.supports('display', 'grid');
    },

    flexbox: () => {
      if (typeof CSS === 'undefined') return false;
      return CSS.supports('display', 'flex');
    },

    motion: () => {
      if (typeof window === 'undefined') return true;
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    touch: () => typeof window !== 'undefined' && 'ontouchstart' in window,

    webp: () => {
      if (typeof document === 'undefined') return false;
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    },

    avif: () => {
      if (typeof document === 'undefined') return false;
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    }
  },

  // Apply browser-specific fixes
  applyFixes: () => {
    const browserInfo = browser.detect();
    const fixes: string[] = [];

    // Safari backdrop-filter fix
    if (browserInfo.safari && browser.supports.backdropFilter()) {
      fixes.push(`
        .glass-card, .glass-strong, .glass-premium, .glass-light, .glass-neon {
          -webkit-backdrop-filter: var(--backdrop-acrylic-apple);
          backdrop-filter: var(--backdrop-acrylic-apple);
        }
      `);
    }

    // Firefox performance optimizations
    if (browserInfo.firefox) {
      fixes.push(`
        * {
          will-change: auto !important;
        }
        .animate-orange-glow {
          animation-duration: 0.3s !important;
        }
      `);
    }

    // Mobile performance optimizations
    if (browserInfo.mobile) {
      fixes.push(`
        .glass-card, .glass-strong, .glass-premium {
          backdrop-filter: blur(8px) !important;
          -webkit-backdrop-filter: blur(8px) !important;
        }
        * {
          transform: translateZ(0);
        }
      `);
    }

    // iOS specific fixes
    if (browserInfo.ios) {
      fixes.push(`
        .glass-card, .glass-strong, .glass-premium {
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .rounded-xl, .rounded-lg {
          -webkit-mask-image: -webkit-radial-gradient(white, black);
        }
      `);
    }

    // Apply fixes
    if (fixes.length > 0) {
      const style = document.createElement('style');
      style.id = 'cathcr-browser-fixes';
      style.textContent = fixes.join('\n');
      document.head.appendChild(style);
    }

    return browserInfo;
  }
};

// Performance optimization utilities
export const optimize = {
  // Lazy load components
  lazyLoad: <T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) => {
    return React.lazy(() => {
      const startTime = performance.now();
      return importFn().then(module => {
        const loadTime = performance.now() - startTime;
        performance.trackMetric('component_load_time', loadTime, {
          component: module.default.name || 'Unknown'
        });
        return module;
      });
    });
  },

  // Memoize expensive components
  memoize: <T extends React.ComponentType<any>>(
    Component: T,
    areEqual?: (prevProps: any, nextProps: any) => boolean
  ): T => {
    const MemoizedComponent = React.memo(Component, areEqual) as T;

    // Add performance tracking
    return React.forwardRef<any, any>((props, ref) => {
      const startTime = React.useRef(0);

      React.useLayoutEffect(() => {
        startTime.current = performance.now();
      });

      React.useEffect(() => {
        const renderTime = performance.now() - startTime.current;
        performance.trackMetric('memoized_render_time', renderTime, {
          component: Component.name || 'Unknown'
        });
      });

      return React.createElement(MemoizedComponent, { ...props, ref });
    }) as T;
  },

  // Debounce functions for performance
  debounce: <T extends (...args: any[]) => void>(
    func: T,
    wait: number,
    immediate?: boolean
  ): T => {
    let timeout: NodeJS.Timeout | null = null;

    return ((...args: any[]) => {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };

      const callNow = immediate && !timeout;

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) func(...args);
    }) as T;
  },

  // Throttle functions for performance
  throttle: <T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean = false;

    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },

  // Optimize images
  optimizeImage: (src: string, options: {
    width?: number;
    height?: number;
    format?: 'webp' | 'avif' | 'auto';
    quality?: number;
  } = {}) => {
    const { width, height, format = 'auto', quality = 80 } = options;

    // Use modern formats if supported
    if (format === 'auto') {
      if (browser.supports.avif()) {
        return `${src}?format=avif&quality=${quality}${width ? `&w=${width}` : ''}${height ? `&h=${height}` : ''}`;
      } else if (browser.supports.webp()) {
        return `${src}?format=webp&quality=${quality}${width ? `&w=${width}` : ''}${height ? `&h=${height}` : ''}`;
      }
    }

    return src;
  },

  // Bundle splitting utilities
  splitBundle: {
    // Core UI components (loaded immediately)
    core: () => import('@/components/ui/button'),

    // Capture components (loaded on demand)
    capture: () => import('@/components/capture/CaptureModal'),

    // Testing components (loaded in development)
    testing: () => process.env.NODE_ENV === 'development'
      ? import('@/components/testing/ColorSystemTest')
      : Promise.resolve(null),

    // Animation utilities (loaded when needed)
    animations: () => import('@/lib/animations'),
  }
};

// Performance budget monitoring
export const budget = {
  limits: {
    // Performance budgets (in milliseconds)
    LCP: 2500,       // Largest Contentful Paint
    FID: 100,        // First Input Delay
    CLS: 0.1,        // Cumulative Layout Shift
    TTI: 3800,       // Time to Interactive

    // Component budgets
    componentRender: 16,    // 60fps budget
    animationFrame: 16.67,  // 60fps

    // Memory budgets (in MB)
    memoryUsage: 50,

    // Bundle size budgets (in KB)
    mainBundle: 250,
    chunkBundle: 100,
  },

  // Check if metric exceeds budget
  checkBudget: (metric: string, value: number): boolean => {
    const limit = budget.limits[metric as keyof typeof budget.limits];
    if (limit === undefined) return true;

    const exceedsBudget = value > limit;

    if (exceedsBudget) {
      console.warn(`⚠️ Performance budget exceeded: ${metric}`, {
        value,
        limit,
        exceeded: value - limit
      });
    }

    return !exceedsBudget;
  },

  // Performance score calculation
  calculateScore: (metrics: Record<string, number>): number => {
    let score = 100;

    Object.entries(metrics).forEach(([metric, value]) => {
      if (!budget.checkBudget(metric, value)) {
        const limit = budget.limits[metric as keyof typeof budget.limits];
        if (limit) {
          const penalty = Math.min(30, ((value - limit) / limit) * 100);
          score -= penalty;
        }
      }
    });

    return Math.max(0, Math.round(score));
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performance.init();
      browser.applyFixes();

      // Track initial metrics
      setTimeout(() => {
        performance.trackMemoryUsage();
        performance.trackBundleSize();
      }, 1000);
    });
  } else {
    performance.init();
    browser.applyFixes();
  }
}

export default {
  performance,
  browser,
  optimize,
  budget
};