#!/usr/bin/env node

/**
 * Apply Migration 004 to Supabase
 * This script applies the user_settings table migration directly to Supabase
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read environment variables
const SUPABASE_URL = 'https://jrowrloysdkluxtgzvxm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyb3dybG95c2RrbHV4dGd6dnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODkxMjE1MywiZXhwIjoyMDc0NDg4MTUzfQ.MP8EWDF8Xc0Us0WxVjcxXIoOMMxUIixf8AGA4p4854I';

async function applyMigration() {
  console.log('🚀 Starting Migration 004 Application...\n');

  // Create Supabase client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read migration file
  const migrationSQL = fs.readFileSync('./supabase/migrations/004_user_settings_calendar.sql', 'utf8');

  console.log('📄 Migration SQL loaded');
  console.log(`   File: supabase/migrations/004_user_settings_calendar.sql`);
  console.log(`   Size: ${migrationSQL.length} characters\n`);

  // Check if table already exists
  console.log('🔍 Checking if user_settings table already exists...');
  const { data: existingTables, error: checkError } = await supabase
    .from('user_settings')
    .select('user_id')
    .limit(1);

  if (!checkError) {
    console.log('⚠️  WARNING: user_settings table already exists!');
    console.log('   Migration may have already been applied.');
    console.log('   The migration uses IF NOT EXISTS, so it\'s safe to run again.\n');
  } else {
    console.log('✅ Table does not exist yet - ready to create\n');
  }

  // Apply migration using RPC (if available) or show manual instructions
  console.log('📝 Migration SQL ready to apply:');
  console.log('─'.repeat(60));

  console.log('\n⚠️  MANUAL APPLICATION REQUIRED\n');
  console.log('Supabase REST API does not support direct SQL execution.');
  console.log('Please apply the migration manually:\n');

  console.log('1. Go to: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/sql');
  console.log('2. Click "New Query"');
  console.log('3. Copy the SQL from: supabase/migrations/004_user_settings_calendar.sql');
  console.log('4. Paste into the SQL editor');
  console.log('5. Click "Run"\n');

  console.log('✨ The migration SQL has been fixed and is ready:');
  console.log('   - Function return type fixed (SETOF)');
  console.log('   - View wrapped in conditional DO block');
  console.log('   - Safe to run multiple times (IF NOT EXISTS)\n');

  console.log('📊 After applying, verify with:');
  console.log('   node verify-migration-004.js\n');

  return true;
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('✅ Migration preparation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
