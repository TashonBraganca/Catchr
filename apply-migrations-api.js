#!/usr/bin/env node
/**
 * Apply migrations using Supabase Management API
 * Uses service role key to execute SQL directly
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://jrowrloysdkluxtgzvxm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyb3dybG95c2RrbHV4dGd6dnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkxMjE1MywiZXhwIjoyMDc0NDg4MTUzfQ.MP8EWDF8Xc0Us0WxVjcxXIoOMMxUIixf8AGA4p4854I';

// Read migration files
const migration001 = fs.readFileSync(path.join(__dirname, 'supabase/migrations/001_initial_schema.sql'), 'utf8');
const migration002 = fs.readFileSync(path.join(__dirname, 'supabase/migrations/002_functions_triggers_rls.sql'), 'utf8');

async function executeSQL(sql, migrationName) {
  console.log(`\n📝 Applying ${migrationName}...`);

  // Try using PostgREST query endpoint
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'params=single-object'
      },
      body: JSON.stringify({ query: sql })
    });

    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', text);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    console.log(`✅ ${migrationName} applied successfully!`);
    return true;

  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return false;
  }
}

async function createExecSQLFunction() {
  console.log('\n📝 Creating exec_sql helper function...');

  const createFuncSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''
    AS $$
    BEGIN
      EXECUTE query;
      RETURN 'OK';
    END;
    $$;
  `;

  // Try to create the function via simple INSERT
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({})
    });

    console.log('Status:', response.status);
    const result = await response.text();
    console.log('Result:', result);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function listTables() {
  console.log('\n📋 Checking current database state...');

  try {
    // Try to query existing tables
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    });

    console.log('Database endpoint status:', response.status);
    const result = await response.json();
    console.log('Available endpoints:', result);

  } catch (error) {
    console.error('Error checking database:', error.message);
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 CATHCR DATABASE MIGRATION - SUPABASE API');
  console.log('='.repeat(70));
  console.log(`\n📍 Target: ${SUPABASE_URL}`);

  await listTables();
  await createExecSQLFunction();

  console.log('\n⚠️  Direct SQL execution via REST API is not supported.');
  console.log('📋 You need to run migrations manually in Supabase SQL Editor:');
  console.log('\n1. Go to: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/sql/new');
  console.log('2. Copy supabase/migrations/001_initial_schema.sql');
  console.log('3. Paste and click "Run"');
  console.log('4. Copy supabase/migrations/002_functions_triggers_rls.sql');
  console.log('5. Paste and click "Run"\n');
}

main().catch(console.error);
