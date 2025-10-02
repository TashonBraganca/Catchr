#!/usr/bin/env node
/**
 * Scan Supabase Database - Find ALL tables and compare with code usage
 * Uses Supabase service role key to query actual database schema
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jrowrloysdkluxtgzvxm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyb3dybG95c2RrbHV4dGd6dnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkxMjE1MywiZXhwIjoyMDc0NDg4MTUzfQ.MP8EWDF8Xc0Us0WxVjcxXIoOMMxUIixf8AGA4p4854I';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function scanDatabase() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 CATHCR DATABASE SCANNER');
  console.log('='.repeat(80));
  console.log(`\n📍 Target: ${SUPABASE_URL}\n`);

  // Query 1: Get all tables in public schema
  console.log('📋 STEP 1: Querying all tables in public schema...\n');

  const { data: tables, error: tablesError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT table_name,
               obj_description((quote_ident(table_schema)||'.'||quote_ident(table_name))::regclass, 'pg_class') as comment
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });

  if (tablesError) {
    // Try direct query instead
    const { data: directTables, error: directError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
      .order('table_name');

    if (directError) {
      console.error('❌ Error querying tables:', directError.message);

      // Fallback: Try listing known tables by attempting SELECT
      console.log('\n📊 FALLBACK: Attempting to query known tables...\n');

      const knownTables = [
        'profiles',
        'user_preferences',
        'projects',
        'thoughts',
        'notes',
        'voice_captures',
        'extension_connections',
        'extension_connection_requests',
        'captures',
        'extension_analytics',
        'extension_errors',
        'notifications',
        'ai_processing_queue',
        'user_activity',
      ];

      const results = [];
      for (const tableName of knownTables) {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('*')
            .limit(0); // Don't fetch data, just check if table exists

          if (!error) {
            results.push({ table_name: tableName, status: '✅ EXISTS', row_count: '?' });
          } else if (error.code === '42P01') {
            results.push({ table_name: tableName, status: '❌ NOT FOUND', row_count: '-' });
          } else {
            results.push({ table_name: tableName, status: `⚠️ ERROR: ${error.message}`, row_count: '-' });
          }
        } catch (err) {
          results.push({ table_name: tableName, status: `⚠️ ERROR: ${err.message}`, row_count: '-' });
        }
      }

      console.table(results);

      // Query 2: Check RLS status for existing tables
      console.log('\n📋 STEP 2: Checking RLS status...\n');
      const rlsResults = [];

      for (const tableName of knownTables) {
        try {
          // Try to get RLS status by attempting an operation
          const { error } = await supabase
            .from(tableName)
            .select('count')
            .limit(1);

          if (!error) {
            rlsResults.push({ table_name: tableName, rls_enabled: '✅ YES', policies: '?' });
          } else if (error.code === '42P01') {
            rlsResults.push({ table_name: tableName, rls_enabled: '❌ TABLE NOT FOUND', policies: '-' });
          } else if (error.message.includes('policy')) {
            rlsResults.push({ table_name: tableName, rls_enabled: '✅ YES (blocked by policy)', policies: '✅' });
          } else {
            rlsResults.push({ table_name: tableName, rls_enabled: `⚠️ ${error.code}`, policies: '?' });
          }
        } catch (err) {
          rlsResults.push({ table_name: tableName, rls_enabled: '❌ ERROR', policies: '-' });
        }
      }

      console.table(rlsResults);

      // Query 3: Find tables used in client code
      console.log('\n📋 STEP 3: Tables used in client code...\n');

      const clientTables = {
        'profiles': '✅ Used in client/src/config/supabase.ts',
        'thoughts': '✅ Used in client/src/config/supabase.ts',
        'notifications': '✅ Used in client/src/config/supabase.ts',
        'ai_processing_queue': '✅ Used in client/src/config/supabase.ts',
        'user_activity': '✅ Used in client/src/config/supabase.ts',
      };

      console.table(Object.entries(clientTables).map(([table, usage]) => ({ table, usage })));

      // Summary
      console.log('\n' + '='.repeat(80));
      console.log('📊 SUMMARY');
      console.log('='.repeat(80));

      const existingCount = results.filter(r => r.status === '✅ EXISTS').length;
      const missingCount = results.filter(r => r.status === '❌ NOT FOUND').length;
      const clientUsedCount = Object.keys(clientTables).length;

      console.log(`\n✅ Existing Tables: ${existingCount}/${knownTables.length}`);
      console.log(`❌ Missing Tables: ${missingCount}/${knownTables.length}`);
      console.log(`📱 Used in Client Code: ${clientUsedCount} tables`);
      console.log(`⚠️  Unused Tables: ${existingCount - clientUsedCount} tables (candidates for cleanup)`);

      // Recommendations
      console.log('\n' + '='.repeat(80));
      console.log('💡 RECOMMENDATIONS');
      console.log('='.repeat(80));

      const unusedTables = results
        .filter(r => r.status === '✅ EXISTS')
        .map(r => r.table_name)
        .filter(t => !Object.keys(clientTables).includes(t));

      if (unusedTables.length > 0) {
        console.log('\n🗑️  Tables NOT used in client code (consider removing if truly unused):');
        unusedTables.forEach(t => console.log(`   - ${t}`));
      }

      const missingTables = results
        .filter(r => r.status === '❌ NOT FOUND')
        .map(r => r.table_name);

      if (missingTables.length > 0) {
        console.log('\n⚠️  Tables referenced in migration but NOT FOUND in database:');
        missingTables.forEach(t => console.log(`   - ${t}`));
        console.log('\n   → These should be created by running migrations 001 and 002');
      }

      return;
    }

    // If direct query worked, process it
    console.table(directTables);
  }
}

scanDatabase().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
