import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { performance as perfUtils, browser, budget } from '@/lib/performance';
import { usePerformanceBudget, useBrowserCompat, useMemoryMonitoring } from '@/hooks/usePerformance';

/**
 * Performance Monitoring Provider for Cathcr
 *
 * Provides global performance monitoring, cross-browser compatibility checks,
 * and performance optimization features for the orange glass UI system.
 */

interface PerformanceConfig {
  // Monitoring settings
  enablePerformanceTracking: boolean;
  trackComponentRenders: boolean;
  trackAnimationFPS: boolean;
  trackMemoryUsage: boolean;

  // Budget settings
  strictBudgets: boolean;
  alertOnBudgetExceed: boolean;

  // Browser compatibility
  enableBrowserFixes: boolean;
  enableFeatureDetection: boolean;

  // Development features
  showPerformanceOverlay: boolean;
  logPerformanceMetrics: boolean;

  // Network optimization
  adaptToSlowConnections: boolean;
  enableLazyLoading: boolean;
}

interface PerformanceState {
  // Browser info
  browser: ReturnType<typeof browser.detect>;
  features: Record<string, boolean>;

  // Performance metrics
  metrics: Record<string, number>;
  score: number;

  // Memory info
  memory: {
    used: number;
    total: number;
    limit: number;
  } | null;

  // Network info
  network: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  } | null;

  // Status
  initialized: boolean;
  budgetViolations: string[];
}

interface PerformanceContextValue {
  config: PerformanceConfig;
  state: PerformanceState;
  updateConfig: (updates: Partial<PerformanceConfig>) => void;

  // Utilities
  trackMetric: (name: string, value: number, context?: Record<string, any>) => void;
  checkBudget: (metric: string, value: number) => boolean;
  optimizeForConnection: (isSlowConnection: boolean) => void;
}

const PerformanceContext = createContext<PerformanceContextValue | undefined>(undefined);

// Default configuration optimized for Cathcr
const defaultConfig: PerformanceConfig = {
  enablePerformanceTracking: true,
  trackComponentRenders: process.env.NODE_ENV === 'development',
  trackAnimationFPS: true,
  trackMemoryUsage: true,
  strictBudgets: process.env.NODE_ENV === 'development',
  alertOnBudgetExceed: process.env.NODE_ENV === 'development',
  enableBrowserFixes: true,
  enableFeatureDetection: true,
  showPerformanceOverlay: process.env.NODE_ENV === 'development',
  logPerformanceMetrics: process.env.NODE_ENV === 'development',
  adaptToSlowConnections: true,
  enableLazyLoading: true,
};

interface PerformanceProviderProps {
  children: React.ReactNode;
  config?: Partial<PerformanceConfig>;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({
  children,
  config: configOverrides = {}
}) => {
  const [config, setConfig] = useState<PerformanceConfig>({
    ...defaultConfig,
    ...configOverrides
  });

  const [state, setState] = useState<PerformanceState>({
    browser: browser.detect(),
    features: {},
    metrics: {},
    score: 100,
    memory: null,
    network: null,
    initialized: false,
    budgetViolations: [],
  });

  const { metrics, score, addMetric, checkBudget } = usePerformanceBudget();
  const { browser: browserInfo, supports } = useBrowserCompat();
  const memoryInfo = useMemoryMonitoring(5000);

  // Initialize performance monitoring
  useEffect(() => {
    if (!state.initialized) {
      // Initialize performance tracking
      if (config.enablePerformanceTracking) {
        perfUtils.init();
      }

      // Apply browser fixes
      if (config.enableBrowserFixes) {
        browser.applyFixes();
      }

      // Update state
      setState(prev => ({
        ...prev,
        browser: browserInfo,
        features: supports,
        initialized: true,
      }));

      console.log('🚀 Cathcr Performance System Initialized', {
        browser: browserInfo,
        features: supports,
        config,
      });
    }

    return () => {
      if (state.initialized) {
        perfUtils.cleanup();
      }
    };
  }, [config, browserInfo, supports, state.initialized]);

  // Update performance state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      metrics,
      score,
      memory: memoryInfo,
    }));
  }, [metrics, score, memoryInfo]);

  // Track network changes
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;

      const updateNetwork = () => {
        setState(prev => ({
          ...prev,
          network: {
            effectiveType: connection.effectiveType || 'unknown',
            downlink: connection.downlink || 0,
            rtt: connection.rtt || 0,
            saveData: connection.saveData || false,
          },
        }));
      };

      updateNetwork();
      connection.addEventListener('change', updateNetwork);

      return () => {
        connection.removeEventListener('change', updateNetwork);
      };
    }
  }, []);

  const updateConfig = useCallback((updates: Partial<PerformanceConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const trackMetric = useCallback((name: string, value: number, context?: Record<string, any>) => {
    if (!config.enablePerformanceTracking) return;

    perfUtils.trackMetric(name, value, context);
    addMetric(name, value);

    // Check budget and alert if needed
    if (config.alertOnBudgetExceed && !checkBudget(name, value)) {
      setState(prev => ({
        ...prev,
        budgetViolations: [...prev.budgetViolations, name].slice(-10), // Keep last 10
      }));
    }
  }, [config.enablePerformanceTracking, config.alertOnBudgetExceed, addMetric, checkBudget]);

  const optimizeForConnection = useCallback((isSlowConnection: boolean) => {
    if (!config.adaptToSlowConnections) return;

    if (isSlowConnection) {
      // Apply slow connection optimizations
      updateConfig({
        trackAnimationFPS: false,
        trackComponentRenders: false,
      });

      // Inject reduced performance CSS
      const style = document.createElement('style');
      style.id = 'cathcr-slow-connection-optimizations';
      style.textContent = `
        .glass-card, .glass-strong, .glass-premium {
          backdrop-filter: blur(4px) !important;
          -webkit-backdrop-filter: blur(4px) !important;
        }
        .animate-orange-glow {
          animation: none !important;
        }
        * {
          transition-duration: 0.1s !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      // Remove optimizations for fast connections
      const slowOptStyle = document.getElementById('cathcr-slow-connection-optimizations');
      if (slowOptStyle) {
        slowOptStyle.remove();
      }
    }
  }, [config.adaptToSlowConnections, updateConfig]);

  // Monitor connection and apply optimizations
  useEffect(() => {
    if (state.network) {
      const isSlowConnection = state.network.effectiveType === 'slow-2g' ||
                              state.network.effectiveType === '2g' ||
                              state.network.saveData;
      optimizeForConnection(isSlowConnection);
    }
  }, [state.network, optimizeForConnection]);

  const contextValue: PerformanceContextValue = {
    config,
    state,
    updateConfig,
    trackMetric,
    checkBudget,
    optimizeForConnection,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}

      {/* Performance overlay in development */}
      {config.showPerformanceOverlay && process.env.NODE_ENV === 'development' && (
        <PerformanceOverlay />
      )}
    </PerformanceContext.Provider>
  );
};

// Performance overlay component for development
const PerformanceOverlay: React.FC = () => {
  const context = useContext(PerformanceContext);
  if (!context) return null;

  const { state, config } = context;
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-collapse on budget violations
  useEffect(() => {
    if (state.budgetViolations.length > 0) {
      setIsExpanded(true);
    }
  }, [state.budgetViolations]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-[9999] p-2 bg-orange-primary text-black rounded shadow-lg hover:scale-110 transition-transform"
        title="Show Performance Monitor"
      >
        ⚡
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-black/90 backdrop-blur-xl border border-orange-light rounded-lg p-3 text-white text-xs font-mono max-w-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-orange-primary">⚡</span>
          <span className="font-bold">Performance</span>
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            state.score >= 90 ? 'bg-green-500/20 text-green-400' :
            state.score >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {state.score}
          </span>
        </div>

        <div className="flex space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-orange-primary hover:text-orange-secondary"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-2">
          {/* Browser info */}
          <div>
            <div className="text-orange-secondary font-semibold">Browser</div>
            <div className="text-white/70">
              {state.browser.chrome ? 'Chrome' :
               state.browser.firefox ? 'Firefox' :
               state.browser.safari ? 'Safari' :
               state.browser.edge ? 'Edge' : 'Unknown'}
              {state.browser.mobile ? ' (Mobile)' : ''}
            </div>
          </div>

          {/* Memory */}
          {state.memory && (
            <div>
              <div className="text-orange-secondary font-semibold">Memory</div>
              <div className="text-white/70">
                {state.memory.used}MB / {state.memory.limit}MB
              </div>
            </div>
          )}

          {/* Network */}
          {state.network && (
            <div>
              <div className="text-orange-secondary font-semibold">Network</div>
              <div className="text-white/70">
                {state.network.effectiveType.toUpperCase()}
                {state.network.saveData && ' (Data Saver)'}
              </div>
            </div>
          )}

          {/* Budget violations */}
          {state.budgetViolations.length > 0 && (
            <div>
              <div className="text-red-400 font-semibold">Budget Violations</div>
              <div className="text-red-300 text-xs">
                {state.budgetViolations.slice(-3).join(', ')}
              </div>
            </div>
          )}

          {/* Feature support */}
          <div>
            <div className="text-orange-secondary font-semibold">Features</div>
            <div className="flex flex-wrap gap-1">
              <span className={`px-1 py-0.5 rounded text-xs ${
                state.features.backdropFilter ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                Backdrop Filter
              </span>
              <span className={`px-1 py-0.5 rounded text-xs ${
                state.features.webAnimations ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                Web Animations
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
};

export default PerformanceProvider;