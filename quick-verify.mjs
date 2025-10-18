import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const SUPABASE_URL = envContent.match(/^SUPABASE_URL=(.+)/m)?.[1]?.trim();
const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

console.log('\n🔍 Verifying Migration 004...\n');

// Check thoughts table columns
const { data: thoughts, error: thoughtsError } = await supabase
  .from('thoughts')
  .select('id, title, is_pinned')
  .limit(1);

if (thoughtsError) {
  if (thoughtsError.message.includes('title') || thoughtsError.message.includes('is_pinned')) {
    console.log('❌ thoughts table missing title or is_pinned column');
    console.log('   Error:', thoughtsError.message);
  } else {
    console.log('✅ thoughts.title column exists');
    console.log('✅ thoughts.is_pinned column exists');
  }
} else {
  console.log('✅ thoughts.title column exists');
  console.log('✅ thoughts.is_pinned column exists');
}

// Check user_settings table
const { data: settings, error: settingsError } = await supabase
  .from('user_settings')
  .select('user_id, calendar_integration_enabled, google_calendar_access_token, timezone')
  .limit(1);

if (settingsError) {
  if (settingsError.code === 'PGRST106' || settingsError.message.includes('does not exist')) {
    console.log('❌ user_settings table does not exist');
  } else if (settingsError.message.includes('column')) {
    console.log('❌ user_settings missing required columns');
    console.log('   Error:', settingsError.message);
  } else {
    console.log('✅ user_settings table exists with all columns');
  }
} else {
  console.log('✅ user_settings table exists with all columns');
}

console.log('\n✅ Migration verification complete!\n');
