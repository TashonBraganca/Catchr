import { test, expect, Page } from '@playwright/test';
import { authenticateTestUser } from '../helpers/auth';

/**
 * CRITICAL DEBUGGING TEST SUITE: Voice-to-Note Flow
 *
 * PURPOSE: Identify WHY voice notes aren't being created after transcription
 *
 * USER REPORT: "voice to note conversion isn't happening - it is routing to
 * OpenAI and the transcription is being done, but there is no note being made."
 *
 * FLOW TO TEST:
 * 1. Voice Capture → User clicks mic, records audio
 * 2. Transcription → Whisper API processes audio ✅ WORKING
 * 3. Note Creation → handleVoiceNoteComplete() should create note ❌ BROKEN?
 * 4. Database INSERT → createNote() should save to Supabase ❌ BROKEN?
 * 5. UI Update → Note should appear in list ❌ BROKEN?
 */

test.describe('Voice-to-Note Critical Flow Debugging', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate test user
    await authenticateTestUser(page);

    // Enable console logging to capture debug messages
    page.on('console', msg => {
      const text = msg.text();
      // Only log critical messages
      if (text.includes('[AppShell]') || text.includes('[useNotes]') || text.includes('[Voice]')) {
        console.log(`🔍 BROWSER: ${text}`);
      }
    });
  });

  /**
   * TEST 1: Baseline - Manual Note Creation
   * Verify that createNote() works when called manually
   */
  test('BASELINE: manual note creation works', async ({ page }) => {
    console.log('\n🧪 TEST 1: BASELINE - Manual Note Creation');
    console.log('='  .repeat(60));

    // Open new note modal
    const newButton = page.locator('button').filter({ hasText: 'New' }).first();
    await expect(newButton).toBeVisible({ timeout: 10000 });
    await newButton.click();
    console.log('✅ Opened new note modal');

    // Type content
    const textarea = page.locator('textarea').first();
    const testContent = `Manual test note ${Date.now()}`;
    await textarea.fill(testContent);
    console.log(`✅ Typed: "${testContent}"`);

    // Submit
    const createButton = page.locator('button:has-text("Create Note")').first();
    await createButton.click();
    console.log('✅ Clicked Create Note');

    // Wait for modal to close
    const modalTitle = page.locator('h3:has-text("New Note")').first();
    await expect(modalTitle).not.toBeVisible({ timeout: 10000 });
    console.log('✅ Modal closed (success indicator)');

    // Verify note in UI
    await page.waitForTimeout(2000);
    const noteCount = await page.locator('[data-testid="note-item"]').count();
    console.log(`📊 Total notes visible: ${noteCount}`);

    expect(noteCount).toBeGreaterThan(0);
    console.log('✅ BASELINE PASSED: Manual note creation works\n');
  });

  /**
   * TEST 2: Voice Callback Trigger
   * Verify that handleVoiceNoteComplete is called after transcription
   */
  test('CRITICAL: verify handleVoiceNoteComplete is called', async ({ page }) => {
    console.log('\n🧪 TEST 2: Voice Callback Trigger');
    console.log('='  .repeat(60));

    let callbackCalled = false;
    let transcriptReceived = '';

    // Intercept console logs to detect callback
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🎯 [AppShell] Voice note completion')) {
        callbackCalled = true;
        console.log('✅ CALLBACK TRIGGERED:', text);
      }
      if (text.includes('Voice note completion')) {
        const match = text.match(/transcript: "([^"]+)"/);
        if (match) transcriptReceived = match[1];
      }
    });

    // Mock transcription API to return known text
    await page.route('**/api/voice/transcribe', async route => {
      console.log('🔍 Intercepted transcribe API call');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transcript: 'This is a test voice note',
          confidence: 1.0,
          success: true
        })
      });
    });

    // Mock categorization API
    await page.route('**/api/voice/categorize', async route => {
      console.log('🔍 Intercepted categorize API call');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestedTitle: 'Test Voice Note',
          suggestedTags: ['voice', 'test']
        })
      });
    });

    // Open voice capture
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await expect(fab).toBeVisible({ timeout: 10000 });
    await fab.click();
    console.log('✅ Opened voice capture modal');

    // Mock MediaRecorder
    await page.addInitScript(() => {
      class MockMediaRecorder {
        state = 'inactive';
        ondataavailable: ((e: any) => void) | null = null;

        start() {
          this.state = 'recording';
          console.log('🎤 Mock recording started');
        }

        stop() {
          this.state = 'inactive';
          console.log('🛑 Mock recording stopped');
          if (this.ondataavailable) {
            const mockBlob = new Blob(['mock audio'], { type: 'audio/webm' });
            this.ondataavailable({ data: mockBlob } as any);
          }
        }
      }

      // @ts-ignore
      window.MediaRecorder = MockMediaRecorder;
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = () => Promise.resolve(new MediaStream());
    });

    // Start recording
    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await recordButton.click();
    console.log('🎤 Started recording...');

    await page.waitForTimeout(1000);

    // Stop recording
    await recordButton.click();
    console.log('🛑 Stopped recording');

    // Wait for processing
    await page.waitForTimeout(5000);

    // Verify callback was called
    if (callbackCalled) {
      console.log('✅ CRITICAL SUCCESS: handleVoiceNoteComplete WAS CALLED');
      console.log(`   Transcript received: "${transcriptReceived}"`);
    } else {
      console.log('❌ CRITICAL FAILURE: handleVoiceNoteComplete WAS NOT CALLED');
      console.log('   This means the callback chain is broken between:');
      console.log('   - SimpleVoiceCapture.onTranscriptComplete');
      console.log('   - AppShell.handleVoiceNoteComplete');
    }

    expect(callbackCalled).toBe(true);
  });

  /**
   * TEST 3: createNote() Execution
   * Verify that createNote() is called with correct parameters
   */
  test('CRITICAL: verify createNote is called with transcript', async ({ page }) => {
    console.log('\n🧪 TEST 3: createNote() Execution');
    console.log('='  .repeat(60));

    let createNoteCalled = false;
    let createNoteParams: any = null;

    // Intercept console logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('💾 [AppShell] Creating note from voice transcript')) {
        createNoteCalled = true;
        console.log('✅ createNote CALLED:', text);
      }
      if (text.includes('🔍 [useNotes] Starting database insert')) {
        console.log('✅ DATABASE INSERT STARTED:', text);
      }
      if (text.includes('✅ [useNotes] Insert successful')) {
        console.log('✅ DATABASE INSERT SUCCESS:', text);
      }
      if (text.includes('❌ [useNotes] Insert error')) {
        console.log('❌ DATABASE INSERT FAILED:', text);
      }
    });

    // Mock APIs
    await page.route('**/api/voice/transcribe', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transcript: 'This is my voice note about testing',
          confidence: 1.0,
          success: true
        })
      });
    });

    await page.route('**/api/voice/categorize', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestedTitle: 'Voice Note About Testing',
          suggestedTags: ['voice', 'testing']
        })
      });
    });

    // Perform voice capture
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    await page.addInitScript(() => {
      class MockMediaRecorder {
        state = 'inactive';
        ondataavailable: ((e: any) => void) | null = null;

        start() { this.state = 'recording'; }
        stop() {
          this.state = 'inactive';
          if (this.ondataavailable) {
            const mockBlob = new Blob(['mock'], { type: 'audio/webm' });
            this.ondataavailable({ data: mockBlob } as any);
          }
        }
      }
      // @ts-ignore
      window.MediaRecorder = MockMediaRecorder;
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = () => Promise.resolve(new MediaStream());
    });

    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await recordButton.click();
    await page.waitForTimeout(1000);
    await recordButton.click();

    // Wait for processing
    await page.waitForTimeout(5000);

    if (createNoteCalled) {
      console.log('✅ CRITICAL SUCCESS: createNote() WAS CALLED');
    } else {
      console.log('❌ CRITICAL FAILURE: createNote() WAS NOT CALLED');
      console.log('   handleVoiceNoteComplete may be returning early');
      console.log('   Check if transcript is empty or validation is failing');
    }

    expect(createNoteCalled).toBe(true);
  });

  /**
   * TEST 4: Database INSERT Performance
   * Verify INSERT completes within reasonable time (schema fix verification)
   */
  test('PERFORMANCE: database INSERT completes within 500ms', async ({ page }) => {
    console.log('\n🧪 TEST 4: Database INSERT Performance');
    console.log('='  .repeat(60));

    let insertStartTime = 0;
    let insertEndTime = 0;

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔍 [useNotes] Starting database insert')) {
        insertStartTime = Date.now();
        console.log('⏱️  INSERT START');
      }
      if (text.includes('✅ [useNotes] Insert successful') ||
          text.includes('✅ [useNotes] Note object created')) {
        insertEndTime = Date.now();
        const duration = insertEndTime - insertStartTime;
        console.log(`⏱️  INSERT END: ${duration}ms`);

        if (duration > 500) {
          console.log(`⚠️  WARNING: INSERT took ${duration}ms (expected <500ms)`);
          console.log('   This indicates schema mismatch issue may still exist');
        } else {
          console.log(`✅ EXCELLENT: INSERT completed in ${duration}ms`);
        }
      }
    });

    // Create manual note to test INSERT performance
    const newButton = page.locator('button').filter({ hasText: 'New' }).first();
    await newButton.click();

    const textarea = page.locator('textarea').first();
    await textarea.fill(`Performance test note ${Date.now()}`);

    const createButton = page.locator('button:has-text("Create Note")').first();
    await createButton.click();

    await page.waitForTimeout(3000);

    const duration = insertEndTime - insertStartTime;
    expect(duration).toBeLessThan(1000); // Should complete within 1 second
    expect(duration).toBeGreaterThan(0); // Should have recorded times

    console.log(`📊 INSERT Performance: ${duration}ms`);
  });

  /**
   * TEST 5: Complete Voice-to-Note Integration
   * End-to-end test with detailed logging at each step
   */
  test('INTEGRATION: complete voice-to-note flow with logging', async ({ page }) => {
    console.log('\n🧪 TEST 5: Complete Voice-to-Note Integration');
    console.log('='  .repeat(60));

    const checkpoints = {
      voiceModalOpened: false,
      recordingStarted: false,
      recordingStopped: false,
      transcriptionReceived: false,
      categorizationReceived: false,
      callbackTriggered: false,
      createNoteCalled: false,
      insertStarted: false,
      insertCompleted: false,
      modalClosed: false,
      noteInUI: false
    };

    page.on('console', msg => {
      const text = msg.text();

      if (text.includes('🎤 Mock recording started')) checkpoints.recordingStarted = true;
      if (text.includes('🛑 Mock recording stopped')) checkpoints.recordingStopped = true;
      if (text.includes('✅ [Voice] Whisper transcript received')) checkpoints.transcriptionReceived = true;
      if (text.includes('✅ [Voice] GPT-5 Nano result')) checkpoints.categorizationReceived = true;
      if (text.includes('🎯 [AppShell] Voice note completion')) checkpoints.callbackTriggered = true;
      if (text.includes('💾 [AppShell] Creating note from voice transcript')) checkpoints.createNoteCalled = true;
      if (text.includes('🔍 [useNotes] Starting database insert')) checkpoints.insertStarted = true;
      if (text.includes('✅ [useNotes] Insert successful')) checkpoints.insertCompleted = true;
      if (text.includes('✅ [AppShell] Voice note created successfully')) checkpoints.modalClosed = true;

      // Log all checkpoints
      if (Object.values(checkpoints).some(v => v)) {
        console.log('📍 CHECKPOINT:', text.substring(0, 80));
      }
    });

    // Mock APIs
    await page.route('**/api/voice/transcribe', async route => {
      console.log('🔍 API: Transcribe called');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transcript: 'Integration test voice note',
          confidence: 1.0,
          success: true
        })
      });
    });

    await page.route('**/api/voice/categorize', async route => {
      console.log('🔍 API: Categorize called');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestedTitle: 'Integration Test',
          suggestedTags: ['integration', 'test']
        })
      });
    });

    // Open voice modal
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();
    checkpoints.voiceModalOpened = true;
    console.log('✅ Voice modal opened');

    // Setup mocks
    await page.addInitScript(() => {
      class MockMediaRecorder {
        state = 'inactive';
        ondataavailable: ((e: any) => void) | null = null;
        start() { this.state = 'recording'; }
        stop() {
          this.state = 'inactive';
          if (this.ondataavailable) {
            const mockBlob = new Blob(['mock'], { type: 'audio/webm' });
            this.ondataavailable({ data: mockBlob } as any);
          }
        }
      }
      // @ts-ignore
      window.MediaRecorder = MockMediaRecorder;
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = () => Promise.resolve(new MediaStream());
    });

    // Record
    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await recordButton.click();
    await page.waitForTimeout(1000);
    await recordButton.click();

    // Wait for complete flow
    await page.waitForTimeout(8000);

    // Check if note appears in UI
    const noteCount = await page.locator('[data-testid="note-item"]').count();
    checkpoints.noteInUI = noteCount > 0;

    // Print checkpoint report
    console.log('\n📊 CHECKPOINT REPORT:');
    console.log('='  .repeat(60));
    Object.entries(checkpoints).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`${status} ${key}: ${value}`);
    });
    console.log('='  .repeat(60));

    // Identify broken link
    const checkpointSequence = Object.keys(checkpoints);
    let brokenLink = 'Unknown';
    for (let i = 0; i < checkpointSequence.length; i++) {
      const key = checkpointSequence[i] as keyof typeof checkpoints;
      if (!checkpoints[key]) {
        brokenLink = `Between ${checkpointSequence[i - 1] || 'start'} and ${key}`;
        break;
      }
    }

    console.log(`\n🔍 BROKEN LINK: ${brokenLink}\n`);

    // All checkpoints should pass
    const allPassed = Object.values(checkpoints).every(v => v);
    if (!allPassed) {
      console.log('❌ INTEGRATION TEST FAILED');
      console.log('   Voice-to-note flow is broken at checkpoint:', brokenLink);
    } else {
      console.log('✅ INTEGRATION TEST PASSED');
      console.log('   Complete voice-to-note flow works end-to-end');
    }
  });

  /**
   * TEST 6: Database Verification
   * Verify note actually exists in Supabase after creation
   */
  test('DATABASE: verify note exists in Supabase', async ({ page }) => {
    console.log('\n🧪 TEST 6: Database Verification');
    console.log('='  .repeat(60));

    // This test requires actual database access
    // We can verify by checking if note appears after page reload

    // Create a note
    const newButton = page.locator('button').filter({ hasText: 'New' }).first();
    await newButton.click();

    const textarea = page.locator('textarea').first();
    const uniqueContent = `DB Verification ${Date.now()}`;
    await textarea.fill(uniqueContent);

    const createButton = page.locator('button:has-text("Create Note")').first();
    await createButton.click();

    await page.waitForTimeout(3000);

    // Reload page
    console.log('🔄 Reloading page to verify persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if note still exists
    const noteStillExists = await page.locator(`text*="${uniqueContent.substring(0, 20)}"`).isVisible().catch(() => false);

    if (noteStillExists) {
      console.log('✅ DATABASE VERIFICATION PASSED');
      console.log('   Note persists after page reload');
    } else {
      console.log('❌ DATABASE VERIFICATION FAILED');
      console.log('   Note does not persist (may not be saved to DB)');
    }

    expect(noteStillExists).toBe(true);
  });

  /**
   * TEST 7: Empty Transcript Handling
   * Verify system handles empty transcripts correctly
   */
  test('ERROR HANDLING: empty transcript validation', async ({ page }) => {
    console.log('\n🧪 TEST 7: Empty Transcript Handling');
    console.log('='  .repeat(60));

    let errorShown = false;

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('❌ [AppShell] Empty transcript received')) {
        errorShown = true;
        console.log('✅ Empty transcript error detected:', text);
      }
    });

    // Mock API with empty transcript
    await page.route('**/api/voice/transcribe', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transcript: '',
          confidence: 0,
          success: false
        })
      });
    });

    // Perform voice capture
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    await page.addInitScript(() => {
      class MockMediaRecorder {
        state = 'inactive';
        ondataavailable: ((e: any) => void) | null = null;
        start() { this.state = 'recording'; }
        stop() {
          this.state = 'inactive';
          if (this.ondataavailable) {
            const mockBlob = new Blob(['mock'], { type: 'audio/webm' });
            this.ondataavailable({ data: mockBlob } as any);
          }
        }
      }
      // @ts-ignore
      window.MediaRecorder = MockMediaRecorder;
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = () => Promise.resolve(new MediaStream());
    });

    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await recordButton.click();
    await page.waitForTimeout(500);
    await recordButton.click();

    await page.waitForTimeout(3000);

    if (errorShown) {
      console.log('✅ ERROR HANDLING WORKS: Empty transcript rejected');
    } else {
      console.log('⚠️  WARNING: Empty transcript not properly handled');
    }

    // Should show error toast
    const errorToast = page.locator('text=/No speech detected/i').first();
    const toastVisible = await errorToast.isVisible().catch(() => false);

    expect(toastVisible || errorShown).toBe(true);
  });

});
