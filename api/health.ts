/**
 * Health Check API Endpoint
 *
 * Provides system health status for monitoring services
 *
 * GET /api/health
 *
 * Response:
 * {
 *   status: 'healthy' | 'degraded' | 'unhealthy',
 *   timestamp: '2025-10-16T12:00:00Z',
 *   version: '1.0.0',
 *   uptime: 123456,
 *   services: {
 *     database: 'up' | 'down',
 *     api: 'up' | 'down',
 *     openai: 'up' | 'down'
 *   },
 *   metrics: {
 *     responseTime: 45,
 *     errorRate: 0.002,
 *     activeConnections: 5
 *   }
 * }
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Edge runtime for faster response
export const config = {
  runtime: 'edge',
};

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'up' | 'down';
    api: 'up' | 'down';
    openai: 'up' | 'down';
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    activeConnections: number;
  };
  checks: {
    name: string;
    status: 'pass' | 'fail';
    duration: number;
    error?: string;
  }[];
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<{ status: 'up' | 'down'; duration: number; error?: string }> {
  const startTime = performance.now();

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Simple query to check connectivity
    const { error } = await supabase
      .from('thoughts')
      .select('id')
      .limit(1);

    if (error) {
      throw error;
    }

    const duration = performance.now() - startTime;
    return { status: 'up', duration };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      status: 'down',
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check OpenAI API health
 */
async function checkOpenAI(): Promise<{ status: 'up' | 'down'; duration: number; error?: string }> {
  const startTime = performance.now();

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Lightweight check - just verify API key format
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid API key format');
    }

    const duration = performance.now() - startTime;
    return { status: 'up', duration };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      status: 'down',
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const startTime = performance.now();

  try {
    // Run health checks in parallel
    const [dbCheck, openaiCheck] = await Promise.all([
      checkDatabase(),
      checkOpenAI(),
    ]);

    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    const failedChecks = [dbCheck, openaiCheck].filter((c) => c.status === 'down');

    if (failedChecks.length === 0) {
      overallStatus = 'healthy';
    } else if (failedChecks.length === 1) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime ? process.uptime() : 0,
      services: {
        database: dbCheck.status,
        api: 'up',
        openai: openaiCheck.status,
      },
      metrics: {
        responseTime,
        errorRate: 0, // Would be calculated from actual error tracking
        activeConnections: 0, // Would be fetched from connection pool
      },
      checks: [
        {
          name: 'database',
          status: dbCheck.status === 'up' ? 'pass' : 'fail',
          duration: Math.round(dbCheck.duration),
          error: dbCheck.error,
        },
        {
          name: 'openai',
          status: openaiCheck.status === 'up' ? 'pass' : 'fail',
          duration: Math.round(openaiCheck.duration),
          error: openaiCheck.error,
        },
      ],
    };

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 503 : 500;

    // Cache for 30 seconds
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');

    res.status(httpStatus).json(healthStatus);
  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: 0,
      services: {
        database: 'down',
        api: 'down',
        openai: 'down',
      },
      metrics: {
        responseTime,
        errorRate: 1,
        activeConnections: 0,
      },
      checks: [
        {
          name: 'health_check',
          status: 'fail',
          duration: responseTime,
          error: error instanceof Error ? error.message : 'Health check failed',
        },
      ],
    });
  }
}
