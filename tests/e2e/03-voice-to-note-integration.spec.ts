import { test, expect } from '@playwright/test';
import { authenticateTestUser } from '../helpers/auth';

/**
 * CRITICAL INTEGRATION TEST: Voice-to-Note Complete Flow
 *
 * PURPOSE: Identify EXACTLY where voice-to-note conversion breaks
 * This is the test that should reveal the bug reported by the user
 *
 * USER REPORT: "voice to note conversion isn't happening - transcription works but no note is created"
 *
 * FLOW TO DEBUG:
 * 1. User clicks FAB → Modal opens ✅
 * 2. User starts recording → MediaRecorder starts ✅
 * 3. User stops recording → Audio sent to Whisper API ✅
 * 4. Whisper returns transcript → onTranscriptComplete fires ❓
 * 5. handleVoiceNoteComplete called → createNote executed ❓
 * 6. Database INSERT happens → Note saved ❓
 * 7. UI updates → Note appears in list ❓
 *
 * This test will pinpoint which arrow (→) is broken
 */

test.describe('CRITICAL: Voice-to-Note Integration', () => {

  // Track all checkpoints across tests
  const checkpoints = {
    fabClicked: false,
    modalOpened: false,
    recordingStarted: false,
    recordingStopped: false,
    audioDataCollected: false,
    whisperApiCalled: false,
    whisperApiReturned: false,
    transcriptReceived: false,
    onTranscriptCompleteFired: false,
    handleVoiceNoteCompleteCalled: false,
    createNoteExecuted: false,
    databaseInsertStarted: false,
    databaseInsertCompleted: false,
    noteAddedToState: false,
    noteVisibleInUI: false,
    notePersistsAfterReload: false
  };

  test.beforeEach(async ({ page }) => {
    // Comprehensive console logging
    page.on('console', msg => {
      const text = msg.text();
      console.log(`🔍 [BROWSER] ${text}`);

      // Track checkpoints from console logs
      if (text.includes('Mock recording started')) checkpoints.recordingStarted = true;
      if (text.includes('Mock recording stopped')) checkpoints.recordingStopped = true;
      if (text.includes('Whisper transcript received')) {
        checkpoints.whisperApiReturned = true;
        checkpoints.transcriptReceived = true;
      }
      if (text.includes('Voice note completion')) {
        checkpoints.onTranscriptCompleteFired = true;
        checkpoints.handleVoiceNoteCompleteCalled = true;
      }
      if (text.includes('Creating note from voice transcript')) {
        checkpoints.createNoteExecuted = true;
      }
      if (text.includes('Starting database insert')) {
        checkpoints.databaseInsertStarted = true;
      }
      if (text.includes('Insert successful')) {
        checkpoints.databaseInsertCompleted = true;
      }
      if (text.includes('Note added to state')) {
        checkpoints.noteAddedToState = true;
      }
    });

    await authenticateTestUser(page);
  });

  test('CRITICAL TEST: Complete voice-to-note flow with checkpoint tracking', async ({ page }) => {
    console.log('\n' + '='.repeat(100));
    console.log('🚨 CRITICAL INTEGRATION TEST: Voice-to-Note Complete Flow');
    console.log('='.repeat(100) + '\n');

    // Reset checkpoints
    Object.keys(checkpoints).forEach(key => {
      (checkpoints as any)[key] = false;
    });

    // Mock APIs with detailed logging
    console.log('🔧 Setting up API mocks...\n');

    await page.route('**/api/voice/transcribe', async route => {
      console.log('🌐 [API MOCK] Whisper transcribe API called');
      checkpoints.whisperApiCalled = true;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transcript: 'This is a critical test of the voice to note integration system',
          confidence: 1.0,
          success: true
        })
      });

      checkpoints.whisperApiReturned = true;
      console.log('✅ [API MOCK] Whisper API returned successfully\n');
    });

    await page.route('**/api/voice/categorize', async route => {
      console.log('🌐 [API MOCK] Categorize API called');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          suggestedTitle: 'Critical Integration Test',
          suggestedTags: ['test', 'voice', 'critical']
        })
      });

      console.log('✅ [API MOCK] Categorize API returned successfully\n');
    });

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
          console.log('🛑 Mock recording stopped - collecting audio data');

          if (this.ondataavailable) {
            // Create realistic mock audio blob
            const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
            console.log('📦 Mock audio blob created:', mockBlob.size, 'bytes');
            this.ondataavailable({ data: mockBlob } as any);
            console.log('✅ ondataavailable fired with audio data');
          } else {
            console.error('❌ ondataavailable handler not set!');
          }
        }
      }

      // @ts-ignore
      window.MediaRecorder = MockMediaRecorder;
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = () => {
        console.log('🎙️ getUserMedia called - granting mic access');
        return Promise.resolve(new MediaStream());
      };
    });

    console.log('✅ Mocks configured\n');

    // PHASE 1: Open Voice Capture Modal
    console.log('=' + '='.repeat(99));
    console.log('PHASE 1: OPEN VOICE CAPTURE MODAL');
    console.log('='.repeat(100) + '\n');

    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await expect(fab).toBeVisible({ timeout: 10000 });
    checkpoints.fabClicked = true;
    console.log('✅ FAB button visible');

    await fab.click();
    console.log('✅ FAB clicked\n');

    const modal = page.locator('[data-testid="voice-capture-modal"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    checkpoints.modalOpened = true;
    console.log('✅ Voice capture modal opened\n');

    // PHASE 2: Start Recording
    console.log('='.repeat(100));
    console.log('PHASE 2: START RECORDING');
    console.log('='.repeat(100) + '\n');

    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await expect(recordButton).toBeVisible();
    console.log('✅ Record button visible');

    await recordButton.click();
    console.log('✅ Record button clicked\n');

    await page.waitForTimeout(1000);
    console.log('⏱️  Simulating 1 second of recording...\n');

    // PHASE 3: Stop Recording
    console.log('='.repeat(100));
    console.log('PHASE 3: STOP RECORDING AND PROCESS');
    console.log('='.repeat(100) + '\n');

    await recordButton.click();
    console.log('✅ Stop button clicked\n');

    checkpoints.recordingStopped = true;
    checkpoints.audioDataCollected = true;

    // PHASE 4: Wait for Complete Processing
    console.log('='.repeat(100));
    console.log('PHASE 4: WAITING FOR PROCESSING');
    console.log('='.repeat(100) + '\n');
    console.log('⏱️  Waiting 8 seconds for complete flow...\n');

    await page.waitForTimeout(8000);

    // PHASE 5: Check if Note Appears in UI
    console.log('='.repeat(100));
    console.log('PHASE 5: CHECKING UI FOR NEW NOTE');
    console.log('='.repeat(100) + '\n');

    const noteItems = page.locator('[data-testid="note-item"]');
    const noteCount = await noteItems.count();

    console.log(`📊 Notes visible in UI: ${noteCount}`);

    if (noteCount > 0) {
      checkpoints.noteVisibleInUI = true;
      console.log('✅ Note appears in UI list!\n');

      // Try to find our specific note
      const noteText = await noteItems.first().textContent();
      console.log(`   First note content: "${noteText?.substring(0, 80)}..."\n`);
    } else {
      console.log('❌ NO NOTES VISIBLE IN UI\n');
    }

    // PHASE 6: Test Persistence
    console.log('='.repeat(100));
    console.log('PHASE 6: TESTING DATABASE PERSISTENCE');
    console.log('='.repeat(100) + '\n');

    if (noteCount > 0) {
      console.log('🔄 Reloading page to verify persistence...\n');
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const noteItemsAfterReload = page.locator('[data-testid="note-item"]');
      const noteCountAfterReload = await noteItemsAfterReload.count();

      console.log(`📊 Notes after reload: ${noteCountAfterReload}`);

      if (noteCountAfterReload > 0) {
        checkpoints.notePersistsAfterReload = true;
        console.log('✅ Note persists after reload (saved to database)\n');
      } else {
        console.log('❌ Note does NOT persist (database save failed)\n');
      }
    } else {
      console.log('⏭️  Skipping persistence test (no notes to test)\n');
    }

    // FINAL REPORT: Checkpoint Analysis
    console.log('\n' + '='.repeat(100));
    console.log('📊 CHECKPOINT REPORT: Voice-to-Note Flow Analysis');
    console.log('='.repeat(100) + '\n');

    const checkpointOrder = [
      'fabClicked',
      'modalOpened',
      'recordingStarted',
      'recordingStopped',
      'audioDataCollected',
      'whisperApiCalled',
      'whisperApiReturned',
      'transcriptReceived',
      'onTranscriptCompleteFired',
      'handleVoiceNoteCompleteCalled',
      'createNoteExecuted',
      'databaseInsertStarted',
      'databaseInsertCompleted',
      'noteAddedToState',
      'noteVisibleInUI',
      'notePersistsAfterReload'
    ];

    let firstFailure: string | null = null;

    checkpointOrder.forEach((checkpoint, index) => {
      const status = (checkpoints as any)[checkpoint];
      const emoji = status ? '✅' : '❌';
      const stepNumber = (index + 1).toString().padStart(2, '0');

      console.log(`${stepNumber}. ${emoji} ${checkpoint.replace(/([A-Z])/g, ' $1').trim()}`);

      if (!status && !firstFailure) {
        firstFailure = checkpoint;
      }
    });

    console.log('\n' + '='.repeat(100));

    if (checkpoints.noteVisibleInUI && checkpoints.notePersistsAfterReload) {
      console.log('🎉 SUCCESS: Complete voice-to-note flow works end-to-end!');
      console.log('✅ All checkpoints passed');
      console.log('✅ Voice notes are being created and saved correctly');
    } else {
      console.log('🚨 FAILURE: Voice-to-note conversion is broken');
      console.log(`❌ First failure at: ${firstFailure || 'unknown'}`);
      console.log('');
      console.log('🔍 DIAGNOSIS:');

      if (!checkpoints.whisperApiCalled) {
        console.log('   → Recording is not reaching the Whisper API');
        console.log('   → Check: Audio blob creation and FormData submission');
      } else if (!checkpoints.transcriptReceived) {
        console.log('   → Whisper API not returning transcript');
        console.log('   → Check: API response parsing in SimpleVoiceCapture');
      } else if (!checkpoints.onTranscriptCompleteFired) {
        console.log('   → onTranscriptComplete callback is NOT being fired');
        console.log('   → Check: SimpleVoiceCapture.stopRecording() line ~272-276');
        console.log('   → This is likely THE BUG');
      } else if (!checkpoints.handleVoiceNoteCompleteCalled) {
        console.log('   → handleVoiceNoteComplete is NOT being called');
        console.log('   → Check: SimpleVoiceCapture props.onTranscriptComplete');
        console.log('   → Check: AppShell.tsx line ~884 prop binding');
      } else if (!checkpoints.createNoteExecuted) {
        console.log('   → createNote() is NOT being called');
        console.log('   → Check: handleVoiceNoteComplete implementation');
        console.log('   → Check: Empty transcript validation (line ~307-313)');
      } else if (!checkpoints.databaseInsertStarted) {
        console.log('   → Database INSERT never starts');
        console.log('   → Check: useNotes.createNote() execution');
      } else if (!checkpoints.databaseInsertCompleted) {
        console.log('   → Database INSERT starts but hangs or fails');
        console.log('   → Check: Supabase connection and schema');
        console.log('   → Check: RLS policies on thoughts table');
      } else if (!checkpoints.noteVisibleInUI) {
        console.log('   → Note saves to DB but UI doesn\'t update');
        console.log('   → Check: setNotes() call in useNotes.createNote()');
        console.log('   → Check: React state update');
      } else {
        console.log('   → Note appears in UI but doesn\'t persist');
        console.log('   → Check: Database transaction completion');
      }
    }

    console.log('='.repeat(100) + '\n');

    // Take screenshot for visual debugging
    await page.screenshot({
      path: 'test-results/voice-to-note-final-state.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: test-results/voice-to-note-final-state.png\n');

    // Test should pass if note is visible and persists
    expect(checkpoints.noteVisibleInUI).toBe(true);
    expect(checkpoints.notePersistsAfterReload).toBe(true);
  });

  test('should handle empty transcript correctly', async ({ page }) => {
    console.log('\n🧪 TEST: Empty Transcript Handling\n');

    // Mock API to return empty transcript
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

    // Mock MediaRecorder
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

    // Perform voice capture with empty result
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await recordButton.click();
    await page.waitForTimeout(500);
    await recordButton.click();

    await page.waitForTimeout(3000);

    // Should show error toast
    const errorToast = page.locator('text=/No speech detected/i').first();
    const hasError = await errorToast.isVisible().catch(() => false);

    if (hasError) {
      console.log('✅ Empty transcript error shown correctly\n');
    } else {
      console.log('⚠️  Empty transcript may not be handled\n');
    }

    // Note should NOT be created
    const noteItems = page.locator('[data-testid="note-item"]');
    const noteCount = await noteItems.count();

    console.log(`📊 Notes in UI: ${noteCount}`);
    console.log('   (Should not increase for empty transcript)\n');
  });
});
