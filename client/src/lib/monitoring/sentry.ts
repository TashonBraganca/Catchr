/**
 * Sentry Error Tracking Configuration
 *
 * Tracks:
 * - JavaScript errors and exceptions
 * - API failures and network errors
 * - Performance issues
 * - User context and breadcrumbs
 *
 * Setup:
 *   1. npm install @sentry/react @sentry/vite-plugin
 *   2. Add VITE_SENTRY_DSN to .env.production
 *   3. Call initSentry() in main.tsx before rendering
 */

import * as Sentry from '@sentry/react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Initialize Sentry error tracking
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn('Sentry DSN not provided. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE || 'unknown',

    // Performance Monitoring
    integrations: [
      // React Router integration
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),

      // Replay integration for session replay
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance monitoring sample rate (0.0 to 1.0)
    // 1.0 = 100% of transactions, 0.1 = 10%
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session Replay sample rate
    // Capture 10% of all sessions
    replaysSessionSampleRate: 0.1,

    // Capture 100% of sessions with errors
    replaysOnErrorSampleRate: 1.0,

    // Before sending error to Sentry
    beforeSend(event, hint) {
      // Filter out non-critical errors
      const error = hint.originalException;

      // Ignore network errors for offline users
      if (error instanceof Error && error.message.includes('NetworkError')) {
        return null;
      }

      // Ignore aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }

      // Add custom context
      event.tags = {
        ...event.tags,
        user_agent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      };

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Random plugins/extensions
      'Can\'t find variable: ZiteReader',
      'jigsaw is not defined',
      'ComboSearch is not defined',

      // Network errors
      'NetworkError',
      'Network request failed',
      'Failed to fetch',

      // User aborted requests
      'AbortError',
      'The user aborted a request',
    ],

    // Deny URLs - don't track errors from these sources
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
    ],
  });

  // Set user context (call after user authentication)
  Sentry.setUser({
    id: 'anonymous',
  });

  console.log('✅ Sentry initialized');
}

/**
 * Set user context after authentication
 */
export function setSentryUser(userId: string, email?: string): void {
  Sentry.setUser({
    id: userId,
    email,
  });
}

/**
 * Clear user context on logout
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(
  category: string,
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception manually
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message manually
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set custom tag
 */
export function setSentryTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set custom context
 */
export function setSentryContext(name: string, context: Record<string, unknown>): void {
  Sentry.setContext(name, context);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * React Error Boundary component
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * Higher-order component to track errors in components
 */
export const withErrorBoundary = Sentry.withErrorBoundary;

/**
 * Profiler to track component render performance
 */
export const Profiler = Sentry.Profiler;

// Export Sentry for advanced usage
export { Sentry };
