/**
 * CREATE TEST USER FOR E2E TESTS
 *
 * This script creates the test@cathcr.com user account for E2E testing
 * Run this ONCE before running Playwright tests: npx tsx tests/setup/create-test-user.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@cathcr.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

async function createTestUser() {
  console.log('🔧 [Setup] Creating test user account...\n');
  console.log(`   Email: ${TEST_USER_EMAIL}`);
  console.log(`   Password: ${TEST_USER_PASSWORD}\n`);

  // Create admin client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ [Setup] Error listing users:', listError);
      process.exit(1);
    }

    const existingUser = existingUsers.users.find(u => u.email === TEST_USER_EMAIL);

    if (existingUser) {
      console.log('✅ [Setup] Test user already exists!');
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Created: ${existingUser.created_at}`);
      console.log('\n✅ Setup complete - ready to run E2E tests!\n');
      return;
    }

    // Create new test user
    console.log('📝 [Setup] Creating new test user...');

    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true, // Auto-confirm email for testing
      user_metadata: {
        username: 'Test User'
      }
    });

    if (error) {
      console.error('❌ [Setup] Error creating user:', error);
      process.exit(1);
    }

    console.log('✅ [Setup] Test user created successfully!');
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Email Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);

    // Create profile for the test user
    console.log('\n📝 [Setup] Creating user profile...');

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        username: 'Test User',
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.warn('⚠️  [Setup] Profile creation failed:', profileError.message);
      console.warn('   This is OK - profile will be created on first login');
    } else {
      console.log('✅ [Setup] Profile created successfully!');
    }

    console.log('\n✅ Setup complete - ready to run E2E tests!\n');
    console.log('Run tests with: npx playwright test\n');

  } catch (error) {
    console.error('❌ [Setup] Fatal error:', error);
    process.exit(1);
  }
}

// Run setup
createTestUser();
