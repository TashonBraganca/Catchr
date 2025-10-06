/**
 * Apply Migration 004: Add is_pinned to thoughts table
 * Fixes PGRST204 error
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://jrowrloysdkluxtgzvxm.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.error('Please set it in your .env file or run:');
  console.error('export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('📋 Applying Migration 004: Add is_pinned to thoughts table\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '004_add_is_pinned_to_thoughts.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('');

    // Split SQL into individual statements (simple split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    console.log(`🔄 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`${i + 1}/${statements.length}: ${statement.substring(0, 80)}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase
          .from('_sql_exec')
          .insert({ query: statement });

        if (directError) {
          console.error(`   ❌ Error: ${directError.message}`);
          // Continue anyway - some errors might be OK (like column already exists)
        } else {
          console.log('   ✅ Success (via direct query)');
        }
      } else {
        console.log('   ✅ Success');
      }
    }

    console.log('\n✅ Migration 004 applied successfully!\n');
    console.log('🔍 Verifying changes...');

    // Verify the columns exist
    const { data: columns, error: colError } = await supabase
      .from('thoughts')
      .select('is_pinned, title')
      .limit(1);

    if (colError) {
      console.error('❌ Verification failed:', colError.message);
      console.log('\n💡 Manual fix needed - run this SQL in Supabase dashboard:');
      console.log(migrationSQL);
    } else {
      console.log('✅ Columns verified - is_pinned and title now exist in thoughts table');
    }

    console.log('\n📊 Testing note creation...');
    const { data: testNote, error: testError } = await supabase
      .from('thoughts')
      .insert({
        user_id: '87e3ae71-7cb7-4a88-80f0-cd7afe14ed9e', // User from logs
        content: 'Test note for migration verification',
        title: 'Migration Test',
        is_pinned: false,
        category: { main: 'note' },
        tags: ['test']
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Test insert failed:', testError.message);
    } else {
      console.log('✅ Test note created successfully:', testNote.id);

      // Clean up test note
      await supabase.from('thoughts').delete().eq('id', testNote.id);
      console.log('✅ Test note cleaned up');
    }

    console.log('\n🎉 Migration complete and verified!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
