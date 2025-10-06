/**
 * Run Migration 004 via Supabase SQL
 * Simpler approach - just output the SQL to run manually
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════');
console.log('  MIGRATION 004: Add is_pinned to thoughts table');
console.log('═══════════════════════════════════════════════════════\n');

const migrationPath = path.join(__dirname, 'supabase', 'migrations', '004_add_is_pinned_to_thoughts.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 **ACTION REQUIRED**: Run this SQL in Supabase Dashboard\n');
console.log('🔗 Go to: https://supabase.com/dashboard/project/jrowrloysdkluxtgzvxm/sql/new\n');
console.log('📝 Copy and paste the SQL below:\n');
console.log('─'.repeat(70));
console.log(migrationSQL);
console.log('─'.repeat(70));

console.log('\n\n✅ **After running the SQL**:');
console.log('   1. Verify in Supabase Table Editor: thoughts table has is_pinned column');
console.log('   2. Verify in Supabase Table Editor: thoughts table has title column');
console.log('   3. Run: node test-voice-api.js');
console.log('   4. Test voice capture in production\n');

console.log('💡 **Alternative - Use Supabase CLI**:');
console.log('   npx supabase migration up --db-url YOUR_DB_URL\n');

console.log('═══════════════════════════════════════════════════════\n');

// Also save to a standalone file for easy copy-paste
const outputPath = path.join(__dirname, 'MIGRATION-004-RUN-THIS.sql');
fs.writeFileSync(outputPath, migrationSQL);
console.log(`✅ SQL saved to: ${outputPath}`);
console.log('   You can also run: cat MIGRATION-004-RUN-THIS.sql | pbcopy (Mac) or clip < MIGRATION-004-RUN-THIS.sql (Windows)\n');
