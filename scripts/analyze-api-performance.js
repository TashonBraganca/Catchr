#!/usr/bin/env node

/**
 * API Performance Analyzer
 *
 * Analyzes Vercel serverless function performance
 *
 * Usage:
 *   node scripts/analyze-api-performance.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.join(__dirname, '../api');

const THRESHOLDS = {
  coldStart: 1000, // ms
  warmStart: 200, // ms
  memoryUsage: 256, // MB
  bundleSize: 5 * 1024 * 1024, // 5MB
};

/**
 * Analyze API structure
 */
function analyzeAPIStructure() {
  console.log('📁 API STRUCTURE');
  console.log('─'.repeat(80));

  if (!fs.existsSync(API_DIR)) {
    console.log('❌ API directory not found');
    return [];
  }

  const endpoints = [];

  function scanDirectory(dir, basePath = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath, relativePath);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
        const stats = fs.statSync(fullPath);
        endpoints.push({
          name: relativePath,
          path: fullPath,
          size: stats.size,
        });
      }
    });
  }

  scanDirectory(API_DIR);

  console.log(`Found ${endpoints.length} API endpoints:\n`);

  endpoints
    .sort((a, b) => b.size - a.size)
    .forEach((endpoint, i) => {
      const sizeKB = (endpoint.size / 1024).toFixed(2);
      const status = endpoint.size > 100 * 1024 ? '⚠️ ' : '  ';
      console.log(`${status}${i + 1}. ${endpoint.name.padEnd(40)} ${sizeKB} KB`);
    });

  console.log('');
  return endpoints;
}

/**
 * Analyze dependencies
 */
function analyzeDependencies(endpoints) {
  console.log('📦 DEPENDENCY ANALYSIS');
  console.log('─'.repeat(80));

  const dependencies = new Set();

  endpoints.forEach((endpoint) => {
    const content = fs.readFileSync(endpoint.path, 'utf-8');

    // Extract imports
    const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"](.*?)['"]/g);
    for (const match of importMatches) {
      const dep = match[1];
      if (!dep.startsWith('.') && !dep.startsWith('@/')) {
        dependencies.add(dep);
      }
    }

    // Extract requires
    const requireMatches = content.matchAll(/require\s*\(\s*['"](.*?)['"]\s*\)/g);
    for (const match of requireMatches) {
      const dep = match[1];
      if (!dep.startsWith('.') && !dep.startsWith('@/')) {
        dependencies.add(dep);
      }
    }
  });

  console.log(`Total unique dependencies: ${dependencies.size}\n`);

  const sortedDeps = Array.from(dependencies).sort();
  sortedDeps.forEach((dep, i) => {
    console.log(`${i + 1}. ${dep}`);
  });

  console.log('');

  // Check for heavy dependencies
  const heavyDeps = ['moment', 'lodash', 'axios'];
  const foundHeavy = sortedDeps.filter(dep => heavyDeps.includes(dep));

  if (foundHeavy.length > 0) {
    console.log('⚠️  Heavy dependencies detected:');
    foundHeavy.forEach(dep => {
      console.log(`   - ${dep} (consider lighter alternatives)`);
    });
    console.log('');
  }

  return sortedDeps;
}

/**
 * Analyze function configurations
 */
function analyzeFunctionConfigs() {
  console.log('⚙️  FUNCTION CONFIGURATIONS');
  console.log('─'.repeat(80));

  const vercelJsonPath = path.join(__dirname, '../vercel.json');

  if (!fs.existsSync(vercelJsonPath)) {
    console.log('ℹ️  No vercel.json found - using defaults\n');
    return null;
  }

  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));

  if (!vercelConfig.functions) {
    console.log('ℹ️  No function configurations defined\n');
    return null;
  }

  Object.entries(vercelConfig.functions).forEach(([pattern, config]) => {
    console.log(`Pattern: ${pattern}`);
    console.log(`  Memory: ${config.memory || 1024}MB`);
    console.log(`  Max Duration: ${config.maxDuration || 10}s`);
    console.log('');
  });

  return vercelConfig.functions;
}

/**
 * Performance best practices check
 */
function checkBestPractices(endpoints) {
  console.log('✅ BEST PRACTICES CHECK');
  console.log('─'.repeat(80));

  const checks = [];

  // Check for edge runtime usage
  let edgeRuntimeCount = 0;
  endpoints.forEach((endpoint) => {
    const content = fs.readFileSync(endpoint.path, 'utf-8');
    if (content.includes("export const runtime = 'edge'")) {
      edgeRuntimeCount++;
    }
  });

  checks.push({
    name: 'Edge Runtime Usage',
    status: edgeRuntimeCount > 0 ? 'GOOD' : 'OPPORTUNITY',
    message: edgeRuntimeCount > 0
      ? `${edgeRuntimeCount} endpoints using Edge Runtime`
      : 'Consider Edge Runtime for faster cold starts',
  });

  // Check for response caching
  let cachingCount = 0;
  endpoints.forEach((endpoint) => {
    const content = fs.readFileSync(endpoint.path, 'utf-8');
    if (content.includes('Cache-Control') || content.includes('maxAge')) {
      cachingCount++;
    }
  });

  checks.push({
    name: 'Response Caching',
    status: cachingCount > endpoints.length * 0.5 ? 'GOOD' : 'WARNING',
    message: cachingCount > 0
      ? `${cachingCount} endpoints with caching headers`
      : 'Add Cache-Control headers for cacheable responses',
  });

  // Check for error handling
  let errorHandlingCount = 0;
  endpoints.forEach((endpoint) => {
    const content = fs.readFileSync(endpoint.path, 'utf-8');
    if (content.includes('try') && content.includes('catch')) {
      errorHandlingCount++;
    }
  });

  checks.push({
    name: 'Error Handling',
    status: errorHandlingCount === endpoints.length ? 'GOOD' : 'WARNING',
    message: `${errorHandlingCount}/${endpoints.length} endpoints with try-catch`,
  });

  // Check for connection pooling
  let poolingCount = 0;
  endpoints.forEach((endpoint) => {
    const content = fs.readFileSync(endpoint.path, 'utf-8');
    if (content.includes('createClient') || content.includes('pool')) {
      poolingCount++;
    }
  });

  checks.push({
    name: 'Database Connection Pooling',
    status: poolingCount > 0 ? 'GOOD' : 'WARNING',
    message: poolingCount > 0
      ? 'Using connection pooling'
      : 'Implement connection pooling for database calls',
  });

  // Print results
  checks.forEach((check) => {
    const icon = check.status === 'GOOD' ? '✅' : '⚠️ ';
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.message}\n`);
  });

  return checks;
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(endpoints, dependencies, checks) {
  console.log('💡 PERFORMANCE RECOMMENDATIONS');
  console.log('═'.repeat(80));

  const recommendations = [];

  // Large endpoints
  const largeEndpoints = endpoints.filter(e => e.size > 50 * 1024);
  if (largeEndpoints.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: `${largeEndpoints.length} large API files (>50KB)`,
      actions: [
        'Split large handlers into smaller functions',
        'Move shared logic to utility files',
        'Use dynamic imports for heavy dependencies',
        'Enable tree-shaking in bundler',
      ],
    });
  }

  // Heavy dependencies
  const heavyDeps = ['moment', 'lodash', 'axios'];
  const foundHeavy = dependencies.filter(dep => heavyDeps.includes(dep));
  if (foundHeavy.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: `Heavy dependencies detected: ${foundHeavy.join(', ')}`,
      actions: [
        'moment → date-fns (10x smaller)',
        'lodash → lodash-es + tree shaking',
        'axios → native fetch API',
        'Import only needed functions',
      ],
    });
  }

  // Edge runtime opportunity
  const edgeCheck = checks.find(c => c.name === 'Edge Runtime Usage');
  if (edgeCheck && edgeCheck.status === 'OPPORTUNITY') {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Edge Runtime not utilized',
      actions: [
        "Add: export const runtime = 'edge'",
        'Benefit: ~50ms faster cold starts',
        'Benefit: Better geographic distribution',
        'Note: Limited to Edge-compatible APIs',
      ],
    });
  }

  // Caching opportunity
  const cacheCheck = checks.find(c => c.name === 'Response Caching');
  if (cacheCheck && cacheCheck.status === 'WARNING') {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Missing response caching',
      actions: [
        "Add: res.setHeader('Cache-Control', 's-maxage=3600')",
        'Cache static data at edge',
        'Use stale-while-revalidate pattern',
        'Reduce database/API calls',
      ],
    });
  }

  // Error handling
  const errorCheck = checks.find(c => c.name === 'Error Handling');
  if (errorCheck && errorCheck.status === 'WARNING') {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Incomplete error handling',
      actions: [
        'Wrap all handlers in try-catch',
        'Return proper HTTP status codes',
        'Log errors to monitoring service',
        'Include request ID for debugging',
      ],
    });
  }

  // Connection pooling
  const poolCheck = checks.find(c => c.name === 'Database Connection Pooling');
  if (poolCheck && poolCheck.status === 'WARNING') {
    recommendations.push({
      priority: 'HIGH',
      issue: 'No database connection pooling',
      actions: [
        'Use Supabase client singleton',
        'Reuse connections across invocations',
        'Set connection pool size appropriately',
        'Close connections after use',
      ],
    });
  }

  // Print recommendations
  if (recommendations.length === 0) {
    console.log('✅ No critical issues detected!');
    console.log('\nGeneral best practices:');
    console.log('   - Keep functions small and focused');
    console.log('   - Use environment variables for config');
    console.log('   - Implement request validation');
    console.log('   - Add comprehensive logging');
    console.log('   - Monitor function metrics regularly');
  } else {
    recommendations.forEach((rec, i) => {
      console.log(`\n${i + 1}. [${rec.priority}] ${rec.issue}`);
      console.log('   Actions:');
      rec.actions.forEach(action => {
        console.log(`   - ${action}`);
      });
    });
  }

  console.log('\n' + '═'.repeat(80));
}

/**
 * Main analysis
 */
function analyzeAPIPerformance() {
  console.log('🔍 API PERFORMANCE ANALYSIS');
  console.log('═'.repeat(80));
  console.log('');

  const endpoints = analyzeAPIStructure();
  const dependencies = analyzeDependencies(endpoints);
  analyzeFunctionConfigs();
  const checks = checkBestPractices(endpoints);

  generateRecommendations(endpoints, dependencies, checks);

  console.log('\n✅ Analysis complete');
}

// Run analysis
analyzeAPIPerformance();
