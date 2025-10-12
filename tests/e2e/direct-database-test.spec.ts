import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * DIRECT DATABASE TEST: Note Creation via Supabase SDK
 *
 * This test verifies that notes can be created successfully using
 * the Supabase SDK directly, bypassing UI authentication issues.
 *
 * Purpose: Confirm the schema fix resolved the INSERT hanging issue
 */

const supabaseUrl = 'https://jrowrloysdkluxtgzvxm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyb3dybG95c2RrbHV4dGd6dnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTIxNTMsImV4cCI6MjA3NDQ4ODE1M30.DZA-KlsMW3UubZyDYDYMpPS0s68EXUhZMeuEW6C84cg';

test.describe('Direct Database Note Creation Test', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;

  test.beforeAll(async () => {
    // Create Supabase client
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('🔐 Creating/signing in test user...');

    const testEmail = 'playwright-db-test@catchr.com';
    const testPassword = 'PlaywrightTestPassword123!';

    // Try to sign in first
    let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    // If sign in fails, create the user
    if (signInError) {
      console.log('📝 Test user does not exist, creating...');

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            username: 'Playwright DB Test User'
          }
        }
      });

      if (signUpError) {
        throw new Error(`Failed to create test user: ${signUpError.message}`);
      }

      console.log('✅ Test user created');
      testUserId = signUpData.user!.id;

      // Create profile for new user (required for foreign key constraint)
      console.log('📝 Creating user profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          username: 'Playwright DB Test User',
          preferences: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn(`⚠️ Profile creation failed: ${profileError.message}`);
      } else {
        console.log('✅ User profile created');
      }
    } else {
      console.log('✅ Signed in as existing test user');
      testUserId = signInData.user!.id;
    }

    console.log(`   User ID: ${testUserId}`);

    // Ensure profile exists (upsert to handle both new and existing users)
    console.log('📝 Ensuring user profile exists...');
    const { error: profileUpsertError } = await supabase
      .from('profiles')
      .upsert({
        id: testUserId,
        username: 'Playwright DB Test User',
        preferences: {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      });

    if (profileUpsertError) {
      console.error(`❌ Profile upsert failed: ${profileUpsertError.message}`);
      throw new Error(`Profile creation/update failed: ${profileUpsertError.message}`);
    }

    console.log('✅ User profile ready');
  });

  test('should insert a note into the database without hanging', async () => {
    console.log('\n🧪 TEST: Database Note Insertion');
    console.log('=' .repeat(60));

    const testContent = `Test note created at ${new Date().toISOString()}`;

    console.log(`\n📍 Inserting note...`);
    console.log(`   Content: "${testContent.substring(0, 50)}..."`);
    console.log(`   User ID: ${testUserId}`);

    const insertStartTime = Date.now();

    const { data: insertedNote, error: insertError } = await supabase
      .from('thoughts')
      .insert({
        user_id: testUserId,
        content: testContent,
        type: 'note',
        category: {
          main: 'test',
          subcategory: 'playwright',
          color: '#10B981',
          icon: '🧪'
        },
        tags: ['test', 'playwright', 'database'],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    const insertDuration = Date.now() - insertStartTime;

    console.log(`\n⏱️  INSERT Duration: ${insertDuration}ms`);

    // Check for errors
    if (insertError) {
      console.error(`\n❌ INSERT FAILED`);
      console.error(`   Error: ${insertError.message}`);
      console.error(`   Code: ${insertError.code}`);
      console.error(`   Details:`, JSON.stringify(insertError.details, null, 2));
      console.error(`   Hint: ${insertError.hint}`);

      throw new Error(`Insert failed: ${insertError.message}`);
    }

    expect(insertError).toBeNull();
    expect(insertedNote).toBeTruthy();

    console.log(`\n✅ INSERT SUCCESSFUL`);
    console.log(`   Note ID: ${insertedNote.id}`);
    console.log(`   Created at: ${insertedNote.created_at}`);
    console.log(`   Content: "${insertedNote.content.substring(0, 50)}..."`);

    // Verify insert was fast (not hanging)
    expect(insertDuration).toBeLessThan(5000);
    console.log(`✅ Insert did not hang (completed in ${insertDuration}ms < 5000ms)`);

    // Verify data integrity
    expect(insertedNote.content).toBe(testContent);
    expect(insertedNote.user_id).toBe(testUserId);
    expect(insertedNote.type).toBe('note');
    expect(insertedNote.category.main).toBe('test');
    console.log('✅ Data integrity verified');

    // Step 2: Retrieve the note to confirm persistence
    console.log(`\n📍 Retrieving note ${insertedNote.id}...`);

    const { data: retrievedNote, error: retrieveError } = await supabase
      .from('thoughts')
      .select('*')
      .eq('id', insertedNote.id)
      .single();

    expect(retrieveError).toBeNull();
    expect(retrievedNote).toBeTruthy();

    console.log('✅ Note retrieved successfully');

    // Verify retrieved data matches
    expect(retrievedNote.content).toBe(testContent);
    expect(retrievedNote.user_id).toBe(testUserId);
    console.log('✅ Retrieved data matches inserted data');

    console.log('\n🎉 ALL CHECKS PASSED - DATABASE INSERT IS WORKING!');
    console.log('=' .repeat(60));
  });

  test('should handle multiple rapid inserts without hanging', async () => {
    console.log('\n🧪 TEST: Rapid Database Inserts');
    console.log('=' .repeat(60));

    const noteCount = 5;
    console.log(`\n📍 Inserting ${noteCount} notes in parallel...`);

    const startTime = Date.now();
    const insertPromises = [];

    for (let i = 0; i < noteCount; i++) {
      const promise = supabase
        .from('thoughts')
        .insert({
          user_id: testUserId,
          content: `Rapid insert test note ${i + 1} - ${new Date().toISOString()}`,
          type: 'note',
          category: {
            main: 'test',
            subcategory: 'rapid',
            color: '#F59E0B',
            icon: '⚡'
          },
          tags: ['test', 'rapid'],
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      insertPromises.push(promise);
    }

    const results = await Promise.all(insertPromises);
    const totalDuration = Date.now() - startTime;

    console.log(`\n⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`   Average per note: ${(totalDuration / noteCount).toFixed(0)}ms`);

    // Check results
    const errors = results.filter(r => r.error);
    const successful = results.filter(r => !r.error);

    console.log(`\n📊 Results:`);
    console.log(`   Successful: ${successful.length}/${noteCount}`);
    console.log(`   Failed: ${errors.length}/${noteCount}`);

    if (errors.length > 0) {
      console.error(`\n❌ ${errors.length} INSERT(S) FAILED:`);
      errors.forEach((result, index) => {
        console.error(`   ${index + 1}. ${result.error!.message}`);
      });
    }

    // All inserts should succeed
    expect(errors.length).toBe(0);
    expect(successful.length).toBe(noteCount);
    console.log(`✅ All ${noteCount} inserts succeeded`);

    // Should complete in reasonable time
    expect(totalDuration).toBeLessThan(15000);
    console.log(`✅ No hanging detected (total time ${totalDuration}ms < 15000ms)`);

    // Verify all notes were created
    const noteIds = successful.map(r => r.data!.id);
    console.log(`\n📍 Verifying ${noteIds.length} notes exist in database...`);

    const { data: verifyNotes, error: verifyError } = await supabase
      .from('thoughts')
      .select('id')
      .in('id', noteIds);

    expect(verifyError).toBeNull();
    expect(verifyNotes).toHaveLength(noteIds.length);
    console.log(`✅ All ${noteIds.length} notes confirmed in database`);

    console.log('\n🎉 RAPID INSERT TEST PASSED!');
    console.log('=' .repeat(60));
  });

  test('should retrieve all notes for the test user', async () => {
    console.log('\n🧪 TEST: Retrieve All Notes');
    console.log('=' .repeat(60));

    console.log(`\n📍 Fetching all notes for user ${testUserId}...`);

    const { data: allNotes, error, count } = await supabase
      .from('thoughts')
      .select('*', { count: 'exact' })
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false });

    expect(error).toBeNull();
    expect(allNotes).toBeTruthy();

    console.log(`\n📊 Query Results:`);
    console.log(`   Total notes: ${allNotes.length}`);
    console.log(`   Count (exact): ${count}`);

    if (allNotes.length > 0) {
      console.log(`\n📝 First note:`);
      console.log(`   ID: ${allNotes[0].id}`);
      console.log(`   Content: "${allNotes[0].content.substring(0, 50)}..."`);
      console.log(`   Created: ${allNotes[0].created_at}`);
    }

    // Should have at least the notes we just created (1 + 5 = 6)
    expect(allNotes.length).toBeGreaterThanOrEqual(6);
    console.log(`✅ Found ${allNotes.length} notes (expected >= 6)`);

    console.log('\n🎉 RETRIEVE TEST PASSED!');
    console.log('=' .repeat(60));
  });

});
