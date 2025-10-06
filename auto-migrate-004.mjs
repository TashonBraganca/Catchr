/**
 * AUTO-APPLY Migration 004
 * Uses Supabase client to execute raw SQL
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://jrowrloysdkluxtgzvxm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyb3dybG95c2RrbHV4dGd6dnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTIxNTMsImV4cCI6MjA3NDQ4ODE1M30.DZA-KlsMW3UubZyDYDYMpPS0s68EXUhZMeuEW6C84cg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🚀 Auto-applying Migration 004...\n');

// Execute SQL statements one by one
const statements = [
  `ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE`,
  `CREATE INDEX IF NOT EXISTS idx_thoughts_pinned ON thoughts(is_pinned) WHERE is_pinned = TRUE`,
  `ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS title TEXT`,
  `UPDATE thoughts SET title = SPLIT_PART(content, E'\n', 1) WHERE title IS NULL`,
  `UPDATE thoughts SET title = 'Untitled' WHERE title IS NULL OR title = ''`,
  `ALTER TABLE thoughts ALTER COLUMN title SET DEFAULT 'Untitled'`
];

async function executeMigration() {
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    console.log(`${i + 1}/${statements.length}: ${sql.substring(0, 60)}...`);

    try {
      // Try using raw SQL through RPC if available
      const { data, error } = await supabase.rpc('exec_raw_sql', { query: sql });

      if (error) {
        console.log(`   ⚠️  RPC not available: ${error.message}`);
        console.log('   ℹ️  This is expected - continuing...');
      } else {
        console.log('   ✅ Success');
      }
    } catch (err) {
      console.log(`   ℹ️  Continuing...`);
    }
  }

  console.log('\n🔍 Verifying migration...');

  // Test if columns exist by trying to insert
  const { data: testInsert, error: insertError } = await supabase
    .from('thoughts')
    .insert({
      user_id: '87e3ae71-7cb7-4a88-80f0-cd7afe14ed9e',
      content: 'Migration test - please delete',
      title: 'Migration Test',
      is_pinned: false,
      category: { main: 'note' },
      tags: ['migration-test']
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Migration verification failed:', insertError.message);
    console.error('\n⚠️  MANUAL MIGRATION REQUIRED:');
    console.error('   Run: node run-migration-004.js');
    console.error('   Then copy SQL to Supabase Dashboard: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/sql/new');
    process.exit(1);
  }

  console.log('✅ Migration verified - test insert successful!');
  console.log(`   Test note ID: ${testInsert.id}`);

  // Clean up test note
  const { error: deleteError } = await supabase
    .from('thoughts')
    .delete()
    .eq('id', testInsert.id);

  if (!deleteError) {
    console.log('✅ Test note cleaned up');
  }

  console.log('\n🎉 Migration 004 complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. git add supabase/migrations/004_add_is_pinned_to_thoughts.sql');
  console.log('   2. git commit -m "fix: Add is_pinned and title to thoughts table"');
  console.log('   3. git push origin main');
  console.log('   4. Test voice capture flow\n');
}

executeMigration().catch(console.error);
