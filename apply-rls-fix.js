const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://vysdpthbimdlkciusbvx.supabase.co';
const SERVICE_KEY = 'sbp_633b59253d14df5e222013adc747bc1fb2ea3307';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyRLSFix() {
  console.log('🔧 Applying RLS policy fixes...\n');

  const sqlScript = fs.readFileSync('fix-rls-policies.sql', 'utf8');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });

    if (error) {
      console.error('❌ Error applying RLS fixes:', error);
      
      // Try alternative approach - execute via REST API
      console.log('\n🔄 Trying alternative method...');
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'apikey': SERVICE_KEY
        },
        body: JSON.stringify({ sql: sqlScript })
      });

      if (!response.ok) {
        console.error('❌ Alternative method failed:', await response.text());
        console.log('\n⚠️  You need to apply the SQL manually in Supabase dashboard');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Go to SQL Editor');
        console.log('   4. Paste the contents of fix-rls-policies.sql');
        console.log('   5. Click RUN');
        process.exit(1);
      }
    }

    console.log('✅ RLS policies updated successfully!\n');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('\n📋 Please apply this SQL manually in Supabase dashboard:');
    console.log(sqlScript);
  }
}

applyRLSFix();
