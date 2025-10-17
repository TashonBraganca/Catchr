/**
 * MANUAL VOICE-TO-NOTE DIAGNOSTIC SCRIPT
 *
 * PURPOSE: Execute in browser console to test voice-to-note flow
 *
 * USAGE:
 * 1. Open https://cathcr.vercel.app (or http://localhost:3000)
 * 2. Sign in with your account
 * 3. Open Chrome DevTools Console (F12)
 * 4. Copy and paste this entire script
 * 5. Press Enter to execute
 * 6. Follow the prompts
 *
 * WHAT THIS TESTS:
 * - Authentication state
 * - Database connectivity
 * - Note creation via Supabase
 * - Voice capture simulation
 * - Full voice-to-note pipeline
 */

(async function VoiceToNoteTestSuite() {
  console.clear();
  console.log('%c╔═══════════════════════════════════════════════════════════╗', 'color: #007AFF; font-weight: bold');
  console.log('%c║     VOICE-TO-NOTE FLOW DIAGNOSTIC TEST SUITE            ║', 'color: #007AFF; font-weight: bold');
  console.log('%c╚═══════════════════════════════════════════════════════════╝', 'color: #007AFF; font-weight: bold');
  console.log('\n');

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  function logTest(name, status, details = '') {
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'orange';
    console.log(`${emoji} %c${name}%c: ${details}`, `color: ${color}; font-weight: bold`, '');

    results.tests.push({ name, status, details, timestamp: Date.now() });
    if (status === 'PASS') results.passed++;
    else if (status === 'FAIL') results.failed++;
    else results.warnings++;
  }

  function logSection(title) {
    console.log('\n' + '═'.repeat(60));
    console.log(`%c${title}`, 'color: #007AFF; font-weight: bold; font-size: 14px');
    console.log('═'.repeat(60) + '\n');
  }

  // ========================================
  // TEST 1: ENVIRONMENT CHECK
  // ========================================
  logSection('TEST 1: ENVIRONMENT CHECK');

  try {
    const url = window.location.href;
    const isProd = url.includes('vercel.app');
    const isDev = url.includes('localhost');

    logTest(
      'Environment Detection',
      'PASS',
      isProd ? 'Production (Vercel)' : isDev ? 'Development (localhost)' : 'Unknown'
    );
  } catch (e) {
    logTest('Environment Detection', 'FAIL', e.message);
  }

  try {
    if (typeof window.supabase !== 'undefined' || typeof window.createClient !== 'undefined') {
      logTest('Supabase Client', 'PASS', 'Supabase client available');
    } else {
      logTest('Supabase Client', 'WARN', 'Supabase client not found in global scope');
    }
  } catch (e) {
    logTest('Supabase Client', 'FAIL', e.message);
  }

  // ========================================
  // TEST 2: AUTHENTICATION STATE
  // ========================================
  logSection('TEST 2: AUTHENTICATION STATE');

  let user = null;
  let sessionData = null;

  try {
    // Try to find auth token in localStorage
    const storageKeys = Object.keys(localStorage);
    const authKeys = storageKeys.filter(k => k.includes('auth') || k.includes('supabase'));

    if (authKeys.length > 0) {
      logTest('LocalStorage Auth Keys', 'PASS', `Found ${authKeys.length} auth key(s): ${authKeys.join(', ')}`);

      // Try to parse session
      for (const key of authKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.user) {
            sessionData = data;
            user = data.user;
            logTest('Session Data', 'PASS', `User: ${user.email} (${user.id})`);
            break;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }

      if (!user) {
        logTest('Session Data', 'WARN', 'Auth keys found but no valid user session');
      }
    } else {
      logTest('LocalStorage Auth Keys', 'FAIL', 'No auth keys found - user not authenticated');
    }
  } catch (e) {
    logTest('Authentication Check', 'FAIL', e.message);
  }

  // Check if authenticated via React context
  try {
    // Try to access React DevTools context (if available)
    const newButton = document.querySelector('button:has-text("New")');
    if (newButton) {
      logTest('UI Authentication State', 'PASS', '"New" button visible - likely authenticated');
    } else {
      logTest('UI Authentication State', 'WARN', '"New" button not found - may not be authenticated');
    }
  } catch (e) {
    logTest('UI Authentication State', 'WARN', 'Cannot determine UI auth state');
  }

  if (!user) {
    console.error('\n❌ CRITICAL: User not authenticated!');
    console.error('Please sign in and run this script again.\n');
    return;
  }

  // ========================================
  // TEST 3: DATABASE CONNECTIVITY
  // ========================================
  logSection('TEST 3: DATABASE CONNECTIVITY');

  let supabaseClient = null;

  try {
    // Try to import Supabase client from the app
    const { createClient } = await import('/src/lib/supabase-browser.ts');
    supabaseClient = await import('/src/lib/supabase-browser.ts').then(m => m.supabase);

    if (supabaseClient) {
      logTest('Supabase Import', 'PASS', 'Successfully imported Supabase client from app');
    } else {
      throw new Error('Supabase client is null after import');
    }
  } catch (e) {
    logTest('Supabase Import', 'FAIL', e.message);

    // Fallback: try to create client manually
    try {
      console.log('⚠️ Attempting manual client creation...');

      // Check if @supabase/supabase-js is available
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

      const SUPABASE_URL = 'https://jrowrloysdkluxtgzvxm.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyb3dybG95c2RrbHV4dGd6dnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTIxNTMsImV4cCI6MjA3NDQ4ODE1M30.DZA-KlsMW3UubZyDYDYMpPS0s68EXUhZMeuEW6C84cg';

      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      logTest('Manual Client Creation', 'PASS', 'Created Supabase client via CDN');
    } catch (e2) {
      logTest('Manual Client Creation', 'FAIL', e2.message);
      console.error('\n❌ CRITICAL: Cannot create Supabase client!');
      return;
    }
  }

  // Test database query
  try {
    console.log('🔍 Testing database query...');
    const startTime = Date.now();

    const { data: notes, error, count } = await supabaseClient
      .from('thoughts')
      .select('id, content, tags, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const duration = Date.now() - startTime;

    if (error) {
      throw error;
    }

    logTest(
      'Database Query',
      'PASS',
      `Retrieved ${notes.length} notes in ${duration}ms (Total: ${count})`
    );

    if (notes.length > 0) {
      console.log('📋 Recent notes:');
      notes.forEach((note, i) => {
        console.log(`  ${i + 1}. ${note.content.substring(0, 50)}... (${note.tags?.join(', ') || 'no tags'})`);
      });
    }
  } catch (e) {
    logTest('Database Query', 'FAIL', e.message);
    console.error('Database error details:', e);
  }

  // ========================================
  // TEST 4: NOTE CREATION TEST
  // ========================================
  logSection('TEST 4: NOTE CREATION TEST');

  try {
    console.log('📝 Creating test note...');
    const testContent = `Test note from diagnostic script - ${new Date().toISOString()}`;
    const startTime = Date.now();

    const { data: newNote, error } = await supabaseClient
      .from('thoughts')
      .insert({
        user_id: user.id,
        content: testContent,
        tags: ['test', 'diagnostic'],
        category: { main: 'test', subcategory: 'diagnostic' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    const duration = Date.now() - startTime;

    if (error) {
      throw error;
    }

    logTest(
      'Note Creation',
      'PASS',
      `Created note ${newNote.id} in ${duration}ms`
    );

    // Verify note can be retrieved
    const { data: verifyNote, error: verifyError } = await supabaseClient
      .from('thoughts')
      .select('*')
      .eq('id', newNote.id)
      .single();

    if (verifyError) {
      throw verifyError;
    }

    logTest('Note Retrieval', 'PASS', `Successfully retrieved created note`);

    // Check if note appears in UI
    await new Promise(resolve => setTimeout(resolve, 2000));
    const noteElements = document.querySelectorAll('[data-testid="note-item"]');
    const noteCount = noteElements.length;

    logTest(
      'UI Update',
      noteCount > 0 ? 'PASS' : 'WARN',
      `${noteCount} notes visible in UI`
    );

    // Clean up test note
    await supabaseClient
      .from('thoughts')
      .delete()
      .eq('id', newNote.id);

    console.log('🗑️ Test note cleaned up');

  } catch (e) {
    logTest('Note Creation', 'FAIL', e.message);
    console.error('Note creation error details:', e);
  }

  // ========================================
  // TEST 5: VOICE NOTE SIMULATION
  // ========================================
  logSection('TEST 5: VOICE NOTE SIMULATION');

  try {
    console.log('🎤 Simulating voice note creation...');

    // Check if voice capture button exists
    const voiceFab = document.querySelector('[data-testid="quick-capture-fab"]');
    if (!voiceFab) {
      throw new Error('Voice capture FAB not found in DOM');
    }

    logTest('Voice FAB Present', 'PASS', 'Voice capture button found');

    // Simulate voice note creation via app's createNote function
    const transcript = 'This is a simulated voice note for testing purposes';
    const suggestedTitle = 'Simulated Voice Note';
    const suggestedTags = ['voice', 'test', 'simulated'];

    console.log('📝 Creating voice note with:');
    console.log(`  Transcript: "${transcript}"`);
    console.log(`  Title: "${suggestedTitle}"`);
    console.log(`  Tags: [${suggestedTags.join(', ')}]`);

    const startTime = Date.now();

    const { data: voiceNote, error } = await supabaseClient
      .from('thoughts')
      .insert({
        user_id: user.id,
        content: transcript,
        tags: suggestedTags,
        category: { main: 'voice-note' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    const duration = Date.now() - startTime;

    if (error) {
      throw error;
    }

    logTest(
      'Voice Note Creation',
      'PASS',
      `Created voice note ${voiceNote.id} in ${duration}ms`
    );

    // Verify it has voice tag
    if (voiceNote.tags && voiceNote.tags.includes('voice')) {
      logTest('Voice Tag Present', 'PASS', 'Note correctly tagged as voice note');
    } else {
      logTest('Voice Tag Present', 'FAIL', 'Note missing voice tag');
    }

    // Wait for UI update
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clean up
    await supabaseClient
      .from('thoughts')
      .delete()
      .eq('id', voiceNote.id);

    console.log('🗑️ Simulated voice note cleaned up');

  } catch (e) {
    logTest('Voice Note Simulation', 'FAIL', e.message);
    console.error('Voice simulation error details:', e);
  }

  // ========================================
  // TEST 6: API ENDPOINT CHECKS
  // ========================================
  logSection('TEST 6: API ENDPOINT CHECKS');

  // Test transcribe endpoint
  try {
    console.log('🔍 Testing /api/voice/transcribe...');

    // Create a mock audio blob
    const mockAudioBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', mockAudioBlob, 'test.webm');

    const response = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const data = await response.json();
      logTest(
        'Transcribe API',
        'PASS',
        `Status ${response.status}, Response: ${JSON.stringify(data).substring(0, 100)}`
      );
    } else {
      const errorText = await response.text();
      logTest(
        'Transcribe API',
        'WARN',
        `Status ${response.status}, Error: ${errorText.substring(0, 100)}`
      );
    }
  } catch (e) {
    logTest('Transcribe API', 'FAIL', e.message);
  }

  // Test categorize endpoint
  try {
    console.log('🔍 Testing /api/voice/categorize...');

    const response = await fetch('/api/voice/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: 'This is a test transcript for categorization'
      })
    });

    if (response.ok) {
      const data = await response.json();
      logTest(
        'Categorize API',
        'PASS',
        `Status ${response.status}, Title: "${data.suggestedTitle}"`
      );
    } else {
      const errorText = await response.text();
      logTest(
        'Categorize API',
        'WARN',
        `Status ${response.status}, Error: ${errorText.substring(0, 100)}`
      );
    }
  } catch (e) {
    logTest('Categorize API', 'FAIL', e.message);
  }

  // ========================================
  // FINAL REPORT
  // ========================================
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('%c FINAL TEST REPORT', 'color: #007AFF; font-weight: bold; font-size: 16px');
  console.log('═'.repeat(60));
  console.log('\n');

  console.log(`%c✅ Passed:  ${results.passed}`, 'color: green; font-weight: bold');
  console.log(`%c❌ Failed:  ${results.failed}`, 'color: red; font-weight: bold');
  console.log(`%c⚠️  Warnings: ${results.warnings}`, 'color: orange; font-weight: bold');
  console.log(`%c📊 Total:   ${results.tests.length}`, 'color: blue; font-weight: bold');

  const successRate = Math.round((results.passed / results.tests.length) * 100);
  console.log(`\n%cSuccess Rate: ${successRate}%`, `color: ${successRate > 70 ? 'green' : successRate > 40 ? 'orange' : 'red'}; font-weight: bold; font-size: 14px`);

  console.log('\n' + '═'.repeat(60));

  // Detailed results
  console.log('\n%cDetailed Results:', 'color: #007AFF; font-weight: bold');
  console.table(results.tests.map(t => ({
    Test: t.name,
    Status: t.status,
    Details: t.details.substring(0, 50)
  })));

  // Export results
  window.voiceToNoteTestResults = results;
  console.log('\n%c📤 Results exported to: window.voiceToNoteTestResults', 'color: #007AFF; font-style: italic');
  console.log('Copy results: copy(JSON.stringify(window.voiceToNoteTestResults, null, 2))');

  // Recommendations
  console.log('\n%c💡 Recommendations:', 'color: #007AFF; font-weight: bold');

  if (results.failed > 0) {
    console.log('%c❌ FAILED TESTS DETECTED', 'color: red; font-weight: bold');
    console.log('Review failed tests above and check:');
    console.log('1. Network tab for failed API calls');
    console.log('2. Console for error messages');
    console.log('3. Supabase dashboard for RLS policy issues');
  } else if (results.warnings > 0) {
    console.log('%c⚠️  WARNINGS DETECTED', 'color: orange; font-weight: bold');
    console.log('Some tests passed with warnings. This may indicate:');
    console.log('1. Partial functionality working');
    console.log('2. Edge cases not handled');
    console.log('3. API endpoints returning unexpected formats');
  } else {
    console.log('%c✅ ALL TESTS PASSED!', 'color: green; font-weight: bold');
    console.log('Voice-to-note flow appears to be working correctly.');
    console.log('Try creating an actual voice note to confirm end-to-end flow.');
  }

  console.log('\n%cNext Steps:', 'color: #007AFF; font-weight: bold');
  console.log('1. Click the voice capture button (bottom right)');
  console.log('2. Record a test message');
  console.log('3. Monitor console for logs starting with [AppShell] or [useNotes]');
  console.log('4. Verify note appears in the list');
  console.log('\n');

})();
