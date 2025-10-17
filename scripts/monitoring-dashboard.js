#!/usr/bin/env node

/**
 * Real-time Monitoring Dashboard
 *
 * Displays real-time metrics from various sources
 *
 * Usage:
 *   node scripts/monitoring-dashboard.js
 */

import https from 'https';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Format number with color based on threshold
 */
function formatMetric(value, good, warning, unit = '') {
  let color;
  if (value <= good) {
    color = COLORS.green;
  } else if (value <= warning) {
    color = COLORS.yellow;
  } else {
    color = COLORS.red;
  }

  return `${color}${value}${unit}${COLORS.reset}`;
}

/**
 * Fetch deployment status from Vercel
 */
async function fetchVercelStatus() {
  // This would require Vercel API token
  // For now, return mock data
  return {
    status: 'READY',
    url: 'https://cathcr.vercel.app',
    lastDeploy: new Date().toISOString(),
    buildTime: 120,
  };
}

/**
 * Fetch performance metrics
 */
async function fetchPerformanceMetrics() {
  // This would fetch from your backend
  // For now, return mock data
  return {
    pageLoad: 1.8,
    apiResponse: 180,
    dbQuery: 450,
    voiceProcessing: 2.5,
    aiCategorization: 2.8,
  };
}

/**
 * Fetch error metrics
 */
async function fetchErrorMetrics() {
  // This would fetch from Sentry or your error tracking
  return {
    last24h: 5,
    errorRate: 0.5,
    criticalErrors: 0,
  };
}

/**
 * Fetch user metrics
 */
async function fetchUserMetrics() {
  return {
    activeUsers: 42,
    notesCreated: 127,
    voiceCapturesTotal: 89,
    successRate: 98.5,
  };
}

/**
 * Draw dashboard
 */
function drawDashboard(deployment, performance, errors, users) {
  console.clear();

  // Header
  console.log(`${COLORS.bright}${COLORS.cyan}╔════════════════════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}║${COLORS.reset}               ${COLORS.bright}CATCHR MONITORING DASHBOARD${COLORS.reset}                    ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}╠════════════════════════════════════════════════════════════════════╣${COLORS.reset}`);

  // Deployment Status
  console.log(`${COLORS.cyan}║${COLORS.reset} ${COLORS.bright}🚀 DEPLOYMENT${COLORS.reset}                                                 ${COLORS.cyan}║${COLORS.reset}`);
  const statusColor = deployment.status === 'READY' ? COLORS.green : COLORS.red;
  console.log(`${COLORS.cyan}║${COLORS.reset}    Status:      ${statusColor}${deployment.status}${COLORS.reset}                                        ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    URL:         ${COLORS.blue}${deployment.url}${COLORS.reset}          ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    Build Time:  ${formatMetric(deployment.buildTime, 120, 180)}s                                      ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}                                                                    ${COLORS.cyan}║${COLORS.reset}`);

  // Performance Metrics
  console.log(`${COLORS.cyan}║${COLORS.reset} ${COLORS.bright}📊 PERFORMANCE${COLORS.reset}                                                 ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    Page Load:         ${formatMetric(performance.pageLoad, 2, 3)}s (target: <2s)              ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    API Response:      ${formatMetric(performance.apiResponse, 200, 500)}ms (target: <200ms)         ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    DB Query:          ${formatMetric(performance.dbQuery, 500, 1000)}ms (target: <500ms)         ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    Voice Processing:  ${formatMetric(performance.voiceProcessing, 5, 8)}s (target: <5s)          ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    AI Categorization: ${formatMetric(performance.aiCategorization, 3, 5)}s (target: <3s)          ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}                                                                    ${COLORS.cyan}║${COLORS.reset}`);

  // Error Metrics
  console.log(`${COLORS.cyan}║${COLORS.reset} ${COLORS.bright}⚠️  ERRORS${COLORS.reset}                                                     ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    Last 24h:      ${formatMetric(errors.last24h, 10, 50)}                                   ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    Error Rate:    ${formatMetric(errors.errorRate, 1, 2)}% (target: <1%)               ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    Critical:      ${formatMetric(errors.criticalErrors, 0, 1)}                                   ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}                                                                    ${COLORS.cyan}║${COLORS.reset}`);

  // User Metrics
  console.log(`${COLORS.cyan}║${COLORS.reset} ${COLORS.bright}👥 USERS${COLORS.reset}                                                       ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    Active Users:      ${COLORS.green}${users.activeUsers}${COLORS.reset}                                     ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    Notes Created:     ${COLORS.green}${users.notesCreated}${COLORS.reset}                                    ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    Voice Captures:    ${COLORS.green}${users.voiceCapturesTotal}${COLORS.reset}                                     ${COLORS.cyan}║${COLORS.reset}`);
  console.log(`${COLORS.cyan}║${COLORS.reset}    Success Rate:      ${COLORS.green}${users.successRate}%${COLORS.reset}                                  ${COLORS.cyan}║${COLORS.reset}`);

  // Footer
  console.log(`${COLORS.bright}${COLORS.cyan}╚════════════════════════════════════════════════════════════════════╝${COLORS.reset}`);
  console.log(`${COLORS.dim}Last updated: ${new Date().toLocaleString()}${COLORS.reset}`);
  console.log(`${COLORS.dim}Press Ctrl+C to exit${COLORS.reset}\n`);

  // Status Summary
  const issues = [];
  if (deployment.status !== 'READY') issues.push('Deployment not ready');
  if (performance.pageLoad > 3) issues.push('Page load slow');
  if (performance.apiResponse > 500) issues.push('API slow');
  if (performance.dbQuery > 1000) issues.push('Database slow');
  if (errors.criticalErrors > 0) issues.push(`${errors.criticalErrors} critical errors`);
  if (errors.errorRate > 2) issues.push('High error rate');

  if (issues.length > 0) {
    console.log(`${COLORS.red}⚠️  ISSUES DETECTED:${COLORS.reset}`);
    issues.forEach((issue) => {
      console.log(`   ${COLORS.red}•${COLORS.reset} ${issue}`);
    });
    console.log('');
  } else {
    console.log(`${COLORS.green}✅ All systems operational${COLORS.reset}\n`);
  }
}

/**
 * Main monitoring loop
 */
async function monitoringLoop() {
  try {
    const [deployment, performance, errors, users] = await Promise.all([
      fetchVercelStatus(),
      fetchPerformanceMetrics(),
      fetchErrorMetrics(),
      fetchUserMetrics(),
    ]);

    drawDashboard(deployment, performance, errors, users);
  } catch (error) {
    console.error('❌ Failed to fetch metrics:', error.message);
  }
}

/**
 * Start monitoring
 */
async function startMonitoring() {
  console.log('🚀 Starting monitoring dashboard...\n');

  // Initial fetch
  await monitoringLoop();

  // Refresh every 10 seconds
  setInterval(monitoringLoop, 10000);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitoring stopped');
  process.exit(0);
});

// Start
startMonitoring();
