/**
 * SIMPLE TEST - Check if title and is_pinned work
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env
const envContent = readFileSync('.env', 'utf8');
const SUPABASE_URL = envContent.match(/SUPABASE_URL=(.+)/)?.[1]?.trim();
const SUPABASE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_KEY ? 'Found' : 'Missing');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  console.log('\n🧪 Testing title and is_pinned columns...\n');

  // Test 1: Try to SELECT with these columns
  console.log('Test 1: SELECT with title and is_pinned');
  const { data: selectData, error: selectError } = await supabase
    .from('thoughts')
    .select('id, content, title, is_pinned')
    .limit(1);

  if (selectError) {
    console.log('❌ SELECT failed:', selectError.message);
    console.log('    Columns likely do not exist\n');
    return false;
  }

  console.log('✅ SELECT successful');
  if (selectData && selectData.length > 0) {
    console.log('   Sample:', JSON.stringify(selectData[0], null, 2));
  }

  // Test 2: Try to INSERT with these columns
  console.log('\nTest 2: INSERT with title and is_pinned');
  const startTime = Date.now();

  const { data: insertData, error: insertError } = await supabase
    .from('thoughts')
    .insert({
      content: 'Migration 004 verification test',
      title: 'Test Title',
      is_pinned: true,
      tags: ['test'],
      category: { main: 'note' }
    })
    .select()
    .single();

  const duration = Date.now() - startTime;

  if (insertError) {
    console.log('❌ INSERT failed:', insertError.message);
    return false;
  }

  console.log(`✅ INSERT successful (${duration}ms)`);
  console.log('   ID:', insertData.id);
  console.log('   Title:', insertData.title);
  console.log('   Pinned:', insertData.is_pinned);

  // Cleanup
  await supabase.from('thoughts').delete().eq('id', insertData.id);
  console.log('✅ Cleanup done\n');

  return true;
}

test()
  .then(success => {
    if (success) {
      console.log('═══════════════════════════════════════════');
      console.log('   ✅ MIGRATION 004 VERIFIED');
      console.log('═══════════════════════════════════════════');
      console.log('\nReady to uncomment frontend code:');
      console.log('  client/src/hooks/useNotes.ts lines 120, 123\n');
    } else {
      console.log('═══════════════════════════════════════════');
      console.log('   ❌ MIGRATION NEEDS TO BE APPLIED');
      console.log('═══════════════════════════════════════════');
      console.log('\nManually apply migration:');
      console.log('  1. Go to Supabase Dashboard > SQL Editor');
      console.log('  2. Run: supabase/migrations/004_add_is_pinned_to_thoughts.sql\n');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
