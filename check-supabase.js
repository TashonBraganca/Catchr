const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vysdpthbimdlkciusbvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eHNkcHRoYmltZGxrY2l1c2J2eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI3NzE5NTc2LCJleHAiOjIwNDMyOTU1NzZ9.k3vF_2g0FqWYSOQqVbYPOxM0z3N1-xJDmvFXBSKjpRo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking Supabase database...\n');
  
  // Check thoughts table schema
  console.log('1️⃣ Checking thoughts table schema...');
  const { data: schemaData, error: schemaError } = await supabase
    .from('thoughts')
    .select('*')
    .limit(1);
  
  if (schemaError) {
    console.error('❌ Schema check error:', schemaError);
  } else {
    console.log('✅ Table exists, sample row:', schemaData);
  }
  
  // Check RLS policies
  console.log('\n2️⃣ Checking recent thoughts...');
  const { data: thoughts, error: thoughtsError } = await supabase
    .from('thoughts')
    .select('id, user_id, content, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (thoughtsError) {
    console.error('❌ Query error:', thoughtsError);
  } else {
    console.log(`✅ Found ${thoughts.length} recent thoughts:`);
    thoughts.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.id.substring(0, 8)}... - "${t.content.substring(0, 50)}..."`);
    });
  }
  
  // Try to insert a test note
  console.log('\n3️⃣ Testing INSERT (will fail without auth)...');
  const { data: insertData, error: insertError } = await supabase
    .from('thoughts')
    .insert({
      user_id: 'a5e09637-9ddd-415d-8a6b-52fe8cc192e2',
      content: 'Test insert from script',
      tags: [],
      category: { main: 'note' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select();
  
  if (insertError) {
    console.error('❌ INSERT error:', insertError);
  } else {
    console.log('✅ INSERT successful:', insertData);
  }
}

checkDatabase().catch(console.error);
