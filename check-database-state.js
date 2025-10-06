const SUPABASE_URL = 'https://jrowrloysdkluxtgzvxm.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyb3dybG95c2RrbHV4dGd6dnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg2MjE0MTAsImV4cCI6MjA0NDE5NzQxMH0.oObBSDfau6r5VWZPLc_vhq_yHrMGdvGOKU7KA2iwz5M';

console.log('🔍 Checking Supabase Database State...\n');

// Check 1: Verify RLS policies on thoughts table
console.log('1️⃣ Checking RLS policies on thoughts table...');
fetch(`${SUPABASE_URL}/rest/v1/rpc/pg_policies`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`
  },
  body: JSON.stringify({})
}).then(r => r.json())
  .then(data => console.log('RLS Policies:', JSON.stringify(data, null, 2)))
  .catch(err => console.log('⚠️ Could not fetch policies'));

// Check 2: Query thoughts table (will fail without auth)
console.log('\n2️⃣ Attempting to query thoughts table (unauthenticated)...');
fetch(`${SUPABASE_URL}/rest/v1/thoughts?select=id,user_id,content&limit=3`, {
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`
  }
}).then(r => {
  console.log('Response status:', r.status, r.statusText);
  return r.json();
}).then(data => console.log('Data:', JSON.stringify(data, null, 2)))
  .catch(err => console.log('Error:', err.message));

// Check 3: Query profiles table (getting 406)
console.log('\n3️⃣ Attempting to query profiles table...');
fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.a5e09637-9ddd-415d-8a6b-52fe8cc192e2`, {
  headers: {
    'apikey': ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'Accept': 'application/json'
  }
}).then(async r => {
  console.log('Response status:', r.status, r.statusText);
  console.log('Response headers:', Object.fromEntries(r.headers.entries()));
  const text = await r.text();
  console.log('Response body:', text);
  try {
    const json = JSON.parse(text);
    console.log('Parsed JSON:', JSON.stringify(json, null, 2));
  } catch {
    console.log('Not JSON response');
  }
}).catch(err => console.log('Error:', err.message));

setTimeout(() => {
  console.log('\n✅ Check complete');
}, 3000);
