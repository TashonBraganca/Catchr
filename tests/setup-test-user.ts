/**
 * Setup Script: Create Test User for E2E Testing
 * Run this once before running Playwright tests
 *
 * Usage:
 *   npx ts-node tests/setup-test-user.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@cathcr.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

async function setupTestUser() {
  console.log('🔧 Setting up test user for E2E testing...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials!');
    console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
  }

  // Create Supabase admin client (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('📧 Test User Credentials:');
  console.log(`   Email: ${TEST_USER_EMAIL}`);
  console.log(`   Password: ${TEST_USER_PASSWORD}\n`);

  try {
    // Check if user already exists
    console.log('🔍 Checking if test user already exists...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === TEST_USER_EMAIL);

    if (existingUser) {
      console.log('✅ Test user already exists!');
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Email Confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}`);

      // If email not confirmed, auto-confirm it
      if (!existingUser.email_confirmed_at) {
        console.log('\n📧 Confirming email...');
        await supabase.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true
        });
        console.log('✅ Email confirmed!');
      }

      console.log('\n✨ Test user is ready for E2E testing!');
      return;
    }

    // Create new test user
    console.log('👤 Creating new test user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        username: 'Test User'
      }
    });

    if (error) {
      console.error('❌ Failed to create test user:', error.message);
      process.exit(1);
    }

    console.log('✅ Test user created successfully!');
    console.log(`   User ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   Email Confirmed: Yes (auto-confirmed)`);

    // Create user profile
    console.log('\n📝 Creating user profile...');
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
      console.warn('⚠️  Profile creation failed (may already exist):', profileError.message);
    } else {
      console.log('✅ User profile created!');
    }

    console.log('\n✨ Test user setup complete!');
    console.log('\n📝 You can now run E2E tests:');
    console.log('   npx playwright test');
    console.log('   npx playwright test tests/e2e/manual-note-creation.spec.ts --project=chromium');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run setup
setupTestUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
