import { test, expect } from '@playwright/test';

/**
 * DIRECT DATABASE TEST: Note Insertion Verification
 *
 * This test directly verifies that the schema fix worked by:
 * 1. Using Supabase client directly (bypassing UI)
 * 2. Creating a test note with INSERT
 * 3. Verifying the note was created successfully
 * 4. Verifying the note can be retrieved
 *
 * Purpose: Confirm the schema fix resolved the INSERT hanging issue
 */

test.describe('Database Note Insertion Test', () => {

  test('should successfully insert and retrieve a note from database', async ({ page }) => {
    console.log('\n🧪 DATABASE INSERT TEST');
    console.log('=' .repeat(60));

    // Navigate to the app to get Supabase client access
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    console.log('\n📍 Step 1: Injecting test script...');

    // Execute test directly in browser context
    const result = await page.evaluate(async () => {
      try {
        // Import Supabase client
        const { createClient } = await import('@supabase/supabase-js');

        const supabaseUrl = 'https://jrowrloysdkluxtgzvxm.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyb3dybG95c2RrbHV4dGd6dnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTIxNTMsImV4cCI6MjA3NDQ4ODE1M30.DZA-KlsMW3UubZyDYDYMpPS0s68EXUhZMeuEW6C84cg';

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        console.log('✅ Supabase client created');

        // Create a test user session (or use anon)
        // For this test, we'll try with anon key which might not work for RLS
        // So let's sign in with a test account

        const testEmail = 'playwright-test@cathcr.com';
        const testPassword = 'playwright-test-password-123';

        console.log('🔐 Attempting to sign in or create test user...');

        // Try to sign in
        let authResult = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });

        // If sign in fails, create the user
        if (authResult.error) {
          console.log('📝 User does not exist, creating...');

          authResult = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
              data: {
                username: 'Playwright Test User'
              }
            }
          });

          if (authResult.error) {
            return {
              success: false,
              error: `Failed to create test user: ${authResult.error.message}`,
              stage: 'user_creation'
            };
          }

          console.log('✅ Test user created');
        } else {
          console.log('✅ Signed in as test user');
        }

        const user = authResult.data.user;
        if (!user) {
          return {
            success: false,
            error: 'No user returned from auth',
            stage: 'auth'
          };
        }

        console.log(`✅ Authenticated as ${user.email}`);

        // Now try to insert a note
        const testContent = `Test note created at ${new Date().toISOString()}`;

        console.log('📝 Inserting test note...');
        console.log(`   Content: ${testContent.substring(0, 50)}...`);

        const insertStartTime = Date.now();

        const { data: insertedNote, error: insertError } = await supabase
          .from('thoughts')
          .insert({
            user_id: user.id,
            content: testContent,
            type: 'note',
            category: {
              main: 'test',
              subcategory: 'playwright',
              color: '#10B981',
              icon: '🧪'
            },
            tags: ['test', 'playwright'],
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        const insertDuration = Date.now() - insertStartTime;

        console.log(`⏱️  INSERT took ${insertDuration}ms`);

        if (insertError) {
          return {
            success: false,
            error: `Insert failed: ${insertError.message}`,
            errorDetails: insertError,
            duration: insertDuration,
            stage: 'insert'
          };
        }

        console.log('✅ Note inserted successfully');
        console.log(`   Note ID: ${insertedNote.id}`);

        // Verify we can retrieve it
        console.log('🔍 Retrieving inserted note...');

        const { data: retrievedNote, error: retrieveError } = await supabase
          .from('thoughts')
          .select('*')
          .eq('id', insertedNote.id)
          .single();

        if (retrieveError) {
          return {
            success: false,
            error: `Retrieve failed: ${retrieveError.message}`,
            errorDetails: retrieveError,
            insertedNoteId: insertedNote.id,
            stage: 'retrieve'
          };
        }

        console.log('✅ Note retrieved successfully');

        // Verify content matches
        const contentMatches = retrievedNote.content === testContent;

        return {
          success: true,
          insertDuration,
          noteId: insertedNote.id,
          contentMatches,
          insertedNote,
          retrievedNote,
          stage: 'complete'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          stack: error.stack,
          stage: 'exception'
        };
      }
    });

    console.log('\n📊 TEST RESULTS:');
    console.log('=' .repeat(60));
    console.log(JSON.stringify(result, null, 2));

    // Assertions
    expect(result.success).toBe(true);

    if (result.success) {
      console.log('\n✅ SUCCESS: Note insertion completed in', result.insertDuration, 'ms');
      console.log(`   Note ID: ${result.noteId}`);
      console.log(`   Content matches: ${result.contentMatches}`);

      // Verify insert was fast (not hanging)
      expect(result.insertDuration).toBeLessThan(5000); // Should complete in < 5s
      console.log('✅ Insert did not hang (completed quickly)');

      // Verify content matches
      expect(result.contentMatches).toBe(true);
      console.log('✅ Retrieved content matches inserted content');

      console.log('\n🎉 ALL CHECKS PASSED - DATABASE INSERT IS WORKING!');
    } else {
      console.error('\n❌ TEST FAILED');
      console.error(`   Stage: ${result.stage}`);
      console.error(`   Error: ${result.error}`);
      if (result.errorDetails) {
        console.error('   Details:', JSON.stringify(result.errorDetails, null, 2));
      }

      throw new Error(`Database insert test failed at stage: ${result.stage} - ${result.error}`);
    }

    console.log('\n' + '='.repeat(60));
  });

  test('should handle multiple rapid inserts without hanging', async ({ page }) => {
    console.log('\n🧪 RAPID INSERT TEST');
    console.log('=' .repeat(60));

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const result = await page.evaluate(async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');

        const supabaseUrl = 'https://jrowrloysdkluxtgzvxm.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyb3dybG95c2RrbHV4dGd6dnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTIxNTMsImV4cCI6MjA3NDQ4ODE1M30.DZA-KlsMW3UubZyDYDYMpPS0s68EXUhZMeuEW6C84cg';

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Sign in as test user
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: 'playwright-test@cathcr.com',
          password: 'playwright-test-password-123'
        });

        if (authError || !authData.user) {
          return { success: false, error: 'Auth failed', stage: 'auth' };
        }

        const user = authData.user;
        console.log('✅ Authenticated');

        // Insert 5 notes rapidly
        const startTime = Date.now();
        const promises = [];

        for (let i = 0; i < 5; i++) {
          const promise = supabase
            .from('thoughts')
            .insert({
              user_id: user.id,
              content: `Rapid test note ${i + 1} - ${new Date().toISOString()}`,
              type: 'note',
              category: { main: 'test', subcategory: 'rapid', color: '#10B981', icon: '⚡' },
              tags: ['test', 'rapid'],
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          promises.push(promise);
        }

        console.log('🚀 Inserting 5 notes in parallel...');

        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;

        console.log(`⏱️  All 5 inserts completed in ${duration}ms`);

        const errors = results.filter(r => r.error);
        const successful = results.filter(r => !r.error);

        return {
          success: errors.length === 0,
          totalDuration: duration,
          successfulInserts: successful.length,
          failedInserts: errors.length,
          averageTime: duration / 5,
          stage: 'complete'
        };

      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          stack: error.stack,
          stage: 'exception'
        };
      }
    });

    console.log('\n📊 RAPID INSERT RESULTS:');
    console.log('=' .repeat(60));
    console.log(JSON.stringify(result, null, 2));

    expect(result.success).toBe(true);

    if (result.success) {
      console.log(`\n✅ SUCCESS: ${result.successfulInserts}/5 notes inserted`);
      console.log(`   Total time: ${result.totalDuration}ms`);
      console.log(`   Average time per note: ${result.averageTime.toFixed(0)}ms`);

      // All inserts should complete in reasonable time
      expect(result.totalDuration).toBeLessThan(15000); // < 15s for 5 inserts
      console.log('✅ No hanging detected (all inserts completed quickly)');

      console.log('\n🎉 RAPID INSERT TEST PASSED!');
    } else {
      console.error('\n❌ RAPID INSERT TEST FAILED');
      throw new Error(result.error);
    }

    console.log('\n' + '='.repeat(60));
  });

});
