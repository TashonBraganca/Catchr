const SUPABASE_URL = 'https://jrowrloysdkluxtgzvxm.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyb3dybG95c2RrbHV4dGd6dnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTIxNTMsImV4cCI6MjA3NDQ4ODE1M30.DZA-KlsMW3UubZyDYDYMpPS0s68EXUhZMeuEW6C84cg';

console.log('🔍 Verifying Supabase Database State\n');
console.log('📊 Project: jrowrloysdkluxtgzvxm\n');

async function checkDatabase() {
  // Check thoughts table
  console.log('1️⃣ Checking thoughts table schema...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/thoughts?select=*&limit=0`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', response.status, response.statusText);
    
    if (response.status === 200) {
      console.log('   ✅ thoughts table exists and is accessible');
    } else {
      const error = await response.text();
      console.log('   ❌ Error:', error);
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  // Check profiles table  
  console.log('\n2️⃣ Checking profiles table...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=0`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', response.status, response.statusText);
    
    if (response.status === 406) {
      console.log('   ⚠️ 406 Not Acceptable - likely Accept header issue');
      const contentType = response.headers.get('content-type');
      console.log('   Response Content-Type:', contentType);
      const text = await response.text();
      console.log('   Response:', text.substring(0, 200));
    } else if (response.status === 200) {
      console.log('   ✅ profiles table exists and is accessible');
    } else {
      const error = await response.text();
      console.log('   Error:', error);
    }
  } catch (err) {
    console.log('   ❌ Error:', err.message);
  }

  // Try querying with different Accept headers
  console.log('\n3️⃣ Testing different Accept headers on profiles...');
  
  const acceptHeaders = [
    'application/json',
    'application/vnd.pgrst.object+json',
    '*/*'
  ];
  
  for (const accept of acceptHeaders) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
          'Accept': accept
        }
      });
      
      console.log(`   Accept: "${accept}" → Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('   ✅ This Accept header works!');
        break;
      }
    } catch (err) {
      console.log(`   Accept: "${accept}" → Error: ${err.message}`);
    }
  }

  console.log('\n✅ Database check complete');
}

checkDatabase().catch(console.error);
