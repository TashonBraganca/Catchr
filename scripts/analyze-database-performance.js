#!/usr/bin/env node

/**
 * Database Performance Analyzer
 *
 * Analyzes Supabase database performance and identifies optimization opportunities
 *
 * Usage:
 *   node scripts/analyze-database-performance.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

const THRESHOLDS = {
  slowQueryTime: 500, // ms
  highQueryCalls: 1000,
  largeTableSize: 100 * 1024 * 1024, // 100MB
  indexUsagePercent: 90,
};

/**
 * Connect to database
 */
async function connectDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.error('   Add DATABASE_URL to .env file');
    process.exit(1);
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
  }
}

/**
 * Analyze slow queries
 */
async function analyzeSlowQueries(client) {
  console.log('🐢 SLOW QUERIES (>500ms average)');
  console.log('─'.repeat(80));

  try {
    const result = await client.query(`
      SELECT
        substring(query, 1, 100) as query_short,
        calls,
        round(total_exec_time::numeric, 2) as total_time_ms,
        round(mean_exec_time::numeric, 2) as mean_time_ms,
        round(max_exec_time::numeric, 2) as max_time_ms,
        round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) as percent_time
      FROM pg_stat_statements
      WHERE mean_exec_time > ${THRESHOLDS.slowQueryTime}
      ORDER BY mean_exec_time DESC
      LIMIT 10;
    `);

    if (result.rows.length === 0) {
      console.log('✅ No slow queries detected!\n');
      return [];
    }

    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.query_short}...`);
      console.log(`   Calls: ${row.calls} | Avg: ${row.mean_time_ms}ms | Max: ${row.max_time_ms}ms`);
      console.log(`   Total time: ${row.total_time_ms}ms (${row.percent_time}% of total)\n`);
    });

    return result.rows;
  } catch (error) {
    console.log('⚠️  pg_stat_statements extension not available');
    console.log('   Enable it with: CREATE EXTENSION pg_stat_statements;\n');
    return [];
  }
}

/**
 * Analyze table sizes
 */
async function analyzeTableSizes(client) {
  console.log('📊 TABLE SIZES');
  console.log('─'.repeat(80));

  const result = await client.query(`
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
      pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
      (SELECT count(*) FROM information_schema.tables WHERE table_schema = schemaname AND table_name = tablename) as exists
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 15;
  `);

  result.rows.forEach((row, i) => {
    const status = row.size_bytes > THRESHOLDS.largeTableSize ? '⚠️ ' : '  ';
    console.log(`${status}${i + 1}. ${row.tablename.padEnd(30)} ${row.size}`);
  });

  console.log('');
  return result.rows;
}

/**
 * Analyze index usage
 */
async function analyzeIndexUsage(client) {
  console.log('🔍 INDEX USAGE');
  console.log('─'.repeat(80));

  const result = await client.query(`
    SELECT
      schemaname,
      tablename,
      indexname,
      idx_scan as index_scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan ASC
    LIMIT 15;
  `);

  if (result.rows.length === 0) {
    console.log('ℹ️  No indexes found or statistics not available\n');
    return [];
  }

  const unusedIndexes = result.rows.filter(row => row.index_scans === '0');

  if (unusedIndexes.length > 0) {
    console.log('⚠️  Unused Indexes (consider removing):');
    unusedIndexes.forEach((row) => {
      console.log(`   ${row.tablename}.${row.indexname} (${row.index_size})`);
    });
    console.log('');
  }

  console.log('Most Used Indexes:');
  result.rows
    .filter(row => row.index_scans !== '0')
    .sort((a, b) => parseInt(b.index_scans) - parseInt(a.index_scans))
    .slice(0, 10)
    .forEach((row) => {
      console.log(`   ${row.tablename}.${row.indexname}`);
      console.log(`   Scans: ${row.index_scans} | Size: ${row.index_size}\n`);
    });

  return result.rows;
}

/**
 * Analyze missing indexes
 */
async function analyzeMissingIndexes(client) {
  console.log('🔎 SEQUENTIAL SCANS (potential missing indexes)');
  console.log('─'.repeat(80));

  const result = await client.query(`
    SELECT
      schemaname,
      tablename,
      seq_scan as sequential_scans,
      seq_tup_read as tuples_read,
      idx_scan as index_scans,
      n_live_tup as live_tuples,
      round(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) as seq_scan_percent
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND seq_scan > 0
      AND n_live_tup > 100
    ORDER BY seq_scan DESC
    LIMIT 10;
  `);

  if (result.rows.length === 0) {
    console.log('✅ No concerning sequential scans detected!\n');
    return [];
  }

  result.rows.forEach((row) => {
    const percent = parseFloat(row.seq_scan_percent) || 0;
    const status = percent > 50 ? '⚠️ ' : '  ';
    console.log(`${status}${row.tablename}`);
    console.log(`   Sequential scans: ${row.sequential_scans} (${row.seq_scan_percent}%)`);
    console.log(`   Index scans: ${row.index_scans}`);
    console.log(`   Live tuples: ${row.live_tuples}\n`);
  });

  return result.rows;
}

/**
 * Analyze connection pool
 */
async function analyzeConnections(client) {
  console.log('🔌 DATABASE CONNECTIONS');
  console.log('─'.repeat(80));

  const result = await client.query(`
    SELECT
      count(*) as total_connections,
      count(*) FILTER (WHERE state = 'active') as active,
      count(*) FILTER (WHERE state = 'idle') as idle,
      count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
      max(now() - state_change) as longest_idle
    FROM pg_stat_activity
    WHERE datname = current_database();
  `);

  const conn = result.rows[0];
  console.log(`Total connections: ${conn.total_connections}`);
  console.log(`Active: ${conn.active}`);
  console.log(`Idle: ${conn.idle}`);
  console.log(`Idle in transaction: ${conn.idle_in_transaction}`);

  if (parseInt(conn.idle_in_transaction) > 0) {
    console.log('⚠️  Warning: Idle transactions detected');
  }

  console.log('');
}

/**
 * Analyze RLS policies
 */
async function analyzeRLSPolicies(client) {
  console.log('🔒 ROW LEVEL SECURITY POLICIES');
  console.log('─'.repeat(80));

  const result = await client.query(`
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);

  if (result.rows.length === 0) {
    console.log('ℹ️  No RLS policies found\n');
    return;
  }

  const byTable = {};
  result.rows.forEach(row => {
    if (!byTable[row.tablename]) {
      byTable[row.tablename] = [];
    }
    byTable[row.tablename].push(row);
  });

  Object.entries(byTable).forEach(([table, policies]) => {
    console.log(`${table} (${policies.length} policies)`);
    policies.forEach(policy => {
      console.log(`   - ${policy.policyname} (${policy.cmd})`);
    });
    console.log('');
  });
}

/**
 * Generate recommendations
 */
function generateRecommendations(slowQueries, tableSizes, indexUsage, missingIndexes) {
  console.log('💡 RECOMMENDATIONS');
  console.log('═'.repeat(80));

  const recommendations = [];

  // Slow queries
  if (slowQueries.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: `${slowQueries.length} slow queries detected (>${THRESHOLDS.slowQueryTime}ms)`,
      actions: [
        'Run EXPLAIN ANALYZE on slow queries',
        'Add indexes on frequently filtered columns',
        'Optimize complex joins',
        'Consider materialized views for complex queries',
      ],
    });
  }

  // Large tables
  const largeTables = tableSizes.filter(t => t.size_bytes > THRESHOLDS.largeTableSize);
  if (largeTables.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: `${largeTables.length} large tables (>100MB)`,
      actions: [
        'Consider partitioning large tables',
        'Archive old data',
        'Implement soft deletes if hard deletes are common',
        'Review retention policies',
      ],
    });
  }

  // Unused indexes
  const unusedIndexes = indexUsage.filter(i => i.index_scans === '0');
  if (unusedIndexes.length > 0) {
    recommendations.push({
      priority: 'LOW',
      issue: `${unusedIndexes.length} unused indexes`,
      actions: [
        'Drop unused indexes to save space',
        'Monitor for one week before dropping',
        'Keep primary key and foreign key indexes',
      ],
    });
  }

  // Missing indexes
  if (missingIndexes.length > 0) {
    const highSeqScan = missingIndexes.filter(m => parseFloat(m.seq_scan_percent) > 80);
    if (highSeqScan.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: `${highSeqScan.length} tables with high sequential scan ratio`,
        actions: [
          'Add indexes on frequently queried columns',
          'Review WHERE clauses in queries',
          'Consider composite indexes for multiple columns',
        ],
      });
    }
  }

  if (recommendations.length === 0) {
    console.log('✅ No critical issues detected!');
    console.log('\nGeneral best practices:');
    console.log('   - Monitor query performance regularly');
    console.log('   - Keep statistics up to date with ANALYZE');
    console.log('   - Review slow query logs weekly');
    console.log('   - Test schema changes in staging first');
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
 * Main analysis function
 */
async function analyzeDatabase() {
  console.log('🔍 DATABASE PERFORMANCE ANALYSIS');
  console.log('═'.repeat(80));
  console.log('');

  const client = await connectDatabase();

  try {
    const slowQueries = await analyzeSlowQueries(client);
    const tableSizes = await analyzeTableSizes(client);
    const indexUsage = await analyzeIndexUsage(client);
    const missingIndexes = await analyzeMissingIndexes(client);
    await analyzeConnections(client);
    await analyzeRLSPolicies(client);

    generateRecommendations(slowQueries, tableSizes, indexUsage, missingIndexes);

    console.log('\n✅ Analysis complete');
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run analysis
analyzeDatabase();
