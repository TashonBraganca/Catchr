import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { performance as perfUtils, browser, optimize, budget } from '@/lib/performance';

/**
 * Performance optimization hooks for React components
 *
 * These hooks provide easy-to-use performance monitoring and optimization
 * features for the Cathcr orange glass UI system.
 */

// Performance monitoring hook
export function usePerformanceMonitoring(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    perfUtils.trackMetric('component_render_time', renderTime, {
      component: componentName,
      renderCount: renderCount.current
    });
  });

  const trackCustomMetric = useCallback((name: string, value: number, context?: Record<string, any>) => {
    perfUtils.trackMetric(name, value, {
      component: componentName,
      ...context
    });
  }, [componentName]);

  return {
    trackCustomMetric,
    renderCount: renderCount.current,
  };
}

// Browser compatibility hook
export function useBrowserCompat() {
  const [browserInfo] = useState(() => browser.detect());
  const [features] = useState(() => ({
    backdropFilter: browser.supports.backdropFilter(),
    webgl: browser.supports.webgl(),
    intersectionObserver: browser.supports.intersectionObserver(),
    webAnimations: browser.supports.webAnimations(),
    motion: browser.supports.motion(),
    touch: browser.supports.touch(),
    webp: browser.supports.webp(),
    avif: browser.supports.avif(),
  }));

  return {
    browser: browserInfo,
    supports: features,
    isMobile: browserInfo.mobile,
    isTouch: features.touch,
    canAnimate: features.motion,
  };
}

// Optimized rendering hook with automatic memoization
export function useOptimizedRender<T>(
  value: T,
  compareFn?: (prev: T, next: T) => boolean
): T {
  const memoizedValue = useMemo(() => value, [value]);

  // Custom comparison if provided
  if (compareFn) {
    const prevRef = useRef<T>(value);
    const shouldUpdate = !compareFn(prevRef.current, value);

    if (shouldUpdate) {
      prevRef.current = value;
      return value;
    }

    return prevRef.current;
  }

  return memoizedValue;
}

// Debounced value hook for performance
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => void>(
  callback: T,
  limit: number
): T {
  const throttledFn = useMemo(
    () => optimize.throttle(callback, limit),
    [callback, limit]
  );

  return throttledFn;
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  const { supports: browserSupports } = useBrowserCompat();

  useEffect(() => {
    const target = targetRef.current;
    if (!target || !browserSupports.intersectionObserver) {
      setIsIntersecting(true);
      setHasBeenVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasBeenVisible, browserSupports.intersectionObserver, options]);

  return {
    targetRef,
    isIntersecting,
    hasBeenVisible,
  };
}

// Animation performance monitoring hook
export function useAnimationPerformance(animationName: string, isActive: boolean = true) {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      return;
    }

    cleanupRef.current = perfUtils.trackAnimationPerformance(animationName);

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [animationName, isActive]);
}

// Memory usage monitoring hook
export function useMemoryMonitoring(interval: number = 5000) {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    const trackMemory = () => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        setMemoryInfo({
          used: Math.round(mem.usedJSHeapSize / 1048576), // MB
          total: Math.round(mem.totalJSHeapSize / 1048576), // MB
          limit: Math.round(mem.jsHeapSizeLimit / 1048576), // MB
        });

        // Check against budget
        const usedMB = mem.usedJSHeapSize / 1048576;
        budget.checkBudget('memoryUsage', usedMB);
      }
    };

    trackMemory();
    const intervalId = setInterval(trackMemory, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return memoryInfo;
}

// Performance budget hook
export function usePerformanceBudget() {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number>(100);

  const addMetric = useCallback((name: string, value: number) => {
    setMetrics(prev => {
      const newMetrics = { ...prev, [name]: value };
      const newScore = budget.calculateScore(newMetrics);
      setScore(newScore);
      return newMetrics;
    });
  }, []);

  const checkBudget = useCallback((metric: string, value: number) => {
    return budget.checkBudget(metric, value);
  }, []);

  return {
    metrics,
    score,
    addMetric,
    checkBudget,
    limits: budget.limits,
  };
}

// Lazy loading hook for components
export function useLazyLoad<T>(shouldLoad: boolean = true) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [component, setComponent] = useState<T | null>(null);

  const loadComponent = useCallback(async (importFn: () => Promise<{ default: T }>) => {
    if (!shouldLoad || isLoaded) return;

    try {
      const startTime = performance.now();
      const module = await importFn();
      const loadTime = performance.now() - startTime;

      perfUtils.trackMetric('lazy_load_time', loadTime, {
        component: module.default?.constructor?.name || 'Unknown'
      });

      setComponent(module.default);
      setIsLoaded(true);
    } catch (error) {
      console.error('Lazy load failed:', error);
    }
  }, [shouldLoad, isLoaded]);

  return {
    component,
    isLoaded,
    loadComponent,
  };
}

// Network performance hook
export function useNetworkPerformance() {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;

      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false,
        });
      };

      updateNetworkInfo();

      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  const isSlowConnection = useMemo(() => {
    if (!networkInfo) return false;
    return networkInfo.effectiveType === 'slow-2g' ||
           networkInfo.effectiveType === '2g' ||
           networkInfo.saveData;
  }, [networkInfo]);

  const isFastConnection = useMemo(() => {
    if (!networkInfo) return true;
    return networkInfo.effectiveType === '4g' &&
           networkInfo.downlink > 1.5;
  }, [networkInfo]);

  return {
    networkInfo,
    isSlowConnection,
    isFastConnection,
  };
}

// Component size monitoring hook
export function useComponentSize() {
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const targetRef = useRef<HTMLElement>(null);

  const { supports } = useBrowserCompat();

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    if (supports.intersectionObserver && 'ResizeObserver' in window) {
      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      });

      observer.observe(target);

      return () => observer.disconnect();
    } else {
      // Fallback for older browsers
      const updateSize = () => {
        if (target) {
          setSize({
            width: target.offsetWidth,
            height: target.offsetHeight,
          });
        }
      };

      updateSize();
      window.addEventListener('resize', updateSize);

      return () => window.removeEventListener('resize', updateSize);
    }
  }, [supports]);

  return {
    targetRef,
    size,
  };
}

export default {
  usePerformanceMonitoring,
  useBrowserCompat,
  useOptimizedRender,
  useDebouncedValue,
  useThrottledCallback,
  useIntersectionObserver,
  useAnimationPerformance,
  useMemoryMonitoring,
  usePerformanceBudget,
  useLazyLoad,
  useNetworkPerformance,
  useComponentSize,
};