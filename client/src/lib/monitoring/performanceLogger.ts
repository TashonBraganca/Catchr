/**
 * Performance Logger - Track application performance metrics
 *
 * Monitors:
 * - Voice processing time
 * - AI categorization latency
 * - Database operations
 * - User flow success rates
 * - API response times
 *
 * Usage:
 *   const timer = performanceLogger.startTimer('operation_name');
 *   // ... do work
 *   performanceLogger.endTimer(timer, { metadata });
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
  success: boolean;
}

interface PerformanceTimer {
  name: string;
  startTime: number;
  startMark?: string;
}

interface PerformanceReport {
  totalMetrics: number;
  averageDuration: number;
  successRate: number;
  slowestOperation: PerformanceMetric | null;
  fastestOperation: PerformanceMetric | null;
  metricsByType: Record<string, {
    count: number;
    avgDuration: number;
    successRate: number;
    p95Duration: number;
  }>;
  recentMetrics: PerformanceMetric[];
}

class PerformanceLogger {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics in memory
  private isEnabled = true;

  constructor() {
    // Disable in development unless explicitly enabled
    if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_PERFORMANCE_LOGGING) {
      this.isEnabled = false;
    }
  }

  /**
   * Start a performance timer
   */
  startTimer(name: string): PerformanceTimer {
    if (!this.isEnabled) {
      return { name, startTime: 0 };
    }

    const startTime = performance.now();
    const startMark = `${name}_start_${Date.now()}`;

    // Use Performance API for better accuracy
    if (typeof performance.mark === 'function') {
      performance.mark(startMark);
    }

    return { name, startTime, startMark };
  }

  /**
   * End a performance timer and record metric
   */
  endTimer(
    timer: PerformanceTimer,
    options?: {
      metadata?: Record<string, unknown>;
      success?: boolean;
    }
  ): number {
    if (!this.isEnabled) return 0;

    const endTime = performance.now();
    const duration = endTime - timer.startTime;

    // Create performance measure if mark exists
    if (timer.startMark && typeof performance.measure === 'function') {
      const endMark = `${timer.name}_end_${Date.now()}`;
      performance.mark(endMark);

      try {
        performance.measure(timer.name, timer.startMark, endMark);
      } catch (error) {
        // Mark might not exist, ignore
      }
    }

    this.recordMetric({
      name: timer.name,
      duration,
      timestamp: Date.now(),
      metadata: options?.metadata,
      success: options?.success ?? true,
    });

    return duration;
  }

  /**
   * Track an async operation
   */
  async trackAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const timer = this.startTimer(name);
    let success = false;

    try {
      const result = await fn();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      this.endTimer(timer, { metadata, success });
    }
  }

  /**
   * Track a synchronous operation
   */
  track<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const timer = this.startTimer(name);
    let success = false;

    try {
      const result = fn();
      success = true;
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      this.endTimer(timer, { metadata, success });
    }
  }

  /**
   * Record a metric directly
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push(metric);

    // Trim metrics if we exceed max
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      this.logMetric(metric);
    }

    // Send to analytics in production
    if (import.meta.env.PROD) {
      this.sendToAnalytics(metric);
    }
  }

  /**
   * Track user flow events
   */
  trackUserFlow(
    flowName: string,
    data: {
      step?: string;
      duration?: number;
      success: boolean;
      metadata?: Record<string, unknown>;
    }
  ): void {
    this.recordMetric({
      name: `flow_${flowName}`,
      duration: data.duration ?? 0,
      timestamp: Date.now(),
      success: data.success,
      metadata: {
        ...data.metadata,
        step: data.step,
      },
    });
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageDuration: 0,
        successRate: 0,
        slowestOperation: null,
        fastestOperation: null,
        metricsByType: {},
        recentMetrics: [],
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const successfulMetrics = this.metrics.filter(m => m.success);

    // Group by metric name
    const metricsByType: Record<string, PerformanceMetric[]> = {};
    this.metrics.forEach(metric => {
      if (!metricsByType[metric.name]) {
        metricsByType[metric.name] = [];
      }
      metricsByType[metric.name].push(metric);
    });

    // Calculate stats per type
    const metricStats: Record<string, {
      count: number;
      avgDuration: number;
      successRate: number;
      p95Duration: number;
    }> = {};

    Object.entries(metricsByType).forEach(([name, metrics]) => {
      const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
      const successCount = metrics.filter(m => m.success).length;
      const p95Index = Math.floor(durations.length * 0.95);

      metricStats[name] = {
        count: metrics.length,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        successRate: (successCount / metrics.length) * 100,
        p95Duration: durations[p95Index] || durations[durations.length - 1],
      };
    });

    // Find slowest and fastest
    const sortedMetrics = [...this.metrics].sort((a, b) => a.duration - b.duration);

    return {
      totalMetrics: this.metrics.length,
      averageDuration: totalDuration / this.metrics.length,
      successRate: (successfulMetrics.length / this.metrics.length) * 100,
      slowestOperation: sortedMetrics[sortedMetrics.length - 1],
      fastestOperation: sortedMetrics[0],
      metricsByType: metricStats,
      recentMetrics: this.metrics.slice(-10),
    };
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Log metric to console
   */
  private logMetric(metric: PerformanceMetric): void {
    const emoji = metric.success ? '✅' : '❌';
    const color = metric.duration > 1000 ? 'color: orange' : 'color: green';

    console.log(
      `%c[PERF] ${emoji} ${metric.name}`,
      color,
      `${metric.duration.toFixed(2)}ms`,
      metric.metadata || ''
    );
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetric): void {
    // Send to Vercel Analytics, Google Analytics, or custom analytics
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va('track', 'Performance', {
        metric: metric.name,
        duration: Math.round(metric.duration),
        success: metric.success,
        ...metric.metadata,
      });
    }

    // Batch metrics and send to backend every 30 seconds
    this.batchSendMetrics();
  }

  private batchMetricsQueue: PerformanceMetric[] = [];
  private batchSendTimer: NodeJS.Timeout | null = null;

  private batchSendMetrics(): void {
    if (this.batchSendTimer) return;

    this.batchSendTimer = setTimeout(() => {
      if (this.batchMetricsQueue.length > 0) {
        this.sendMetricsBatch(this.batchMetricsQueue);
        this.batchMetricsQueue = [];
      }
      this.batchSendTimer = null;
    }, 30000); // Send every 30 seconds
  }

  private async sendMetricsBatch(metrics: PerformanceMetric[]): Promise<void> {
    try {
      // Send to your backend endpoint
      await fetch('/api/metrics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      });
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if logging is enabled
   */
  get enabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const performanceLogger = new PerformanceLogger();

// Export types
export type { PerformanceMetric, PerformanceTimer, PerformanceReport };

// Utility functions for common operations
export const trackVoiceProcessing = async <T>(fn: () => Promise<T>): Promise<T> => {
  return performanceLogger.trackAsync('voice_processing', fn);
};

export const trackAICategorization = async <T>(
  fn: () => Promise<T>,
  model: string
): Promise<T> => {
  return performanceLogger.trackAsync('ai_categorization', fn, { model });
};

export const trackDatabaseOperation = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  return performanceLogger.trackAsync(`db_${operation}`, fn);
};

export const trackAPICall = async <T>(
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> => {
  return performanceLogger.trackAsync(`api_${endpoint}`, fn);
};
