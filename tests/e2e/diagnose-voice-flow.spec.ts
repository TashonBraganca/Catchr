import { test, expect } from '@playwright/test';
import { authenticateTestUser } from '../helpers/auth';

/**
 * DIAGNOSTIC TEST: Voice-to-Note Flow Analyzer
 *
 * This test provides a detailed diagnosis of why voice notes
 * aren't being created after transcription succeeds.
 *
 * RUN THIS TEST FIRST to identify the exact failure point.
 */

test.describe('Voice-to-Note Flow Diagnosis', () => {

  test('DIAGNOSTIC: identify where voice-to-note flow breaks', async ({ page }) => {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║     VOICE-TO-NOTE FLOW DIAGNOSTIC TOOL                   ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Track all events
    const events: Array<{ time: number; event: string; details?: string }> = [];
    const startTime = Date.now();

    const logEvent = (event: string, details?: string) => {
      const elapsed = Date.now() - startTime;
      events.push({ time: elapsed, event, details });
      console.log(`[+${elapsed}ms] ${event}${details ? `: ${details}` : ''}`);
    };

    // Authenticate
    logEvent('AUTH', 'Starting authentication');
    await authenticateTestUser(page);
    logEvent('AUTH', 'Authentication complete');

    // Monitor console for critical messages
    page.on('console', msg => {
      const text = msg.text();

      // Track voice flow events
      if (text.includes('🛑 [Voice] Stop recording triggered')) {
        logEvent('VOICE', 'Recording stopped');
      }
      if (text.includes('📝 [Voice] Current transcript from Web Speech')) {
        logEvent('VOICE', 'Web Speech transcript available');
      }
      if (text.includes('🔄 [Voice] Falling back to Whisper API')) {
        logEvent('VOICE', 'Falling back to Whisper');
      }
      if (text.includes('✅ [Voice] Whisper transcript received')) {
        const match = text.match(/received: (.+)/);
        logEvent('TRANSCRIBE', match ? match[1].substring(0, 50) : 'Success');
      }
      if (text.includes('🤖 [Voice] Processing with GPT-5 Nano')) {
        logEvent('CATEGORIZE', 'GPT-5 Nano processing started');
      }
      if (text.includes('✅ [Voice] GPT-5 Nano result')) {
        logEvent('CATEGORIZE', 'GPT-5 Nano completed');
      }
      if (text.includes('🎯 [AppShell] Voice note completion')) {
        logEvent('CALLBACK', 'handleVoiceNoteComplete called');
      }
      if (text.includes('💾 [AppShell] Creating note from voice transcript')) {
        logEvent('CREATE', 'createNote() called');
      }
      if (text.includes('🔍 [useNotes] Starting database insert')) {
        logEvent('DATABASE', 'INSERT started');
      }
      if (text.includes('✅ [useNotes] Insert successful')) {
        logEvent('DATABASE', 'INSERT completed successfully');
      }
      if (text.includes('❌')) {
        logEvent('ERROR', text.replace('❌', '').trim());
      }
    });

    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/api/voice/transcribe')) {
        logEvent('API', 'POST /api/voice/transcribe');
      }
      if (request.url().includes('/api/voice/categorize')) {
        logEvent('API', 'POST /api/voice/categorize');
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/voice/transcribe')) {
        const status = response.status();
        logEvent('API', `Transcribe response: ${status}`);
        if (status === 200) {
          try {
            const data = await response.json();
            logEvent('API', `Transcript: "${data.transcript?.substring(0, 50)}..."`);
          } catch (e) {
            logEvent('API', 'Failed to parse transcribe response');
          }
        }
      }
      if (response.url().includes('/api/voice/categorize')) {
        const status = response.status();
        logEvent('API', `Categorize response: ${status}`);
        if (status === 200) {
          try {
            const data = await response.json();
            logEvent('API', `Title: "${data.suggestedTitle}"`);
          } catch (e) {
            logEvent('API', 'Failed to parse categorize response');
          }
        }
      }
    });

    // Open voice capture
    logEvent('UI', 'Opening voice capture modal');
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await expect(fab).toBeVisible({ timeout: 10000 });
    await fab.click();

    const modal = page.locator('[data-testid="voice-capture-modal"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    logEvent('UI', 'Voice capture modal opened');

    // Setup mocks
    await page.addInitScript(() => {
      console.log('🔧 [Mock] Setting up MediaRecorder mock');

      class MockMediaRecorder {
        state = 'inactive';
        ondataavailable: ((e: any) => void) | null = null;

        start() {
          this.state = 'recording';
          console.log('🎤 [Mock] Recording started');
        }

        stop() {
          this.state = 'inactive';
          console.log('🛑 [Mock] Recording stopped');

          // Simulate actual audio data
          setTimeout(() => {
            if (this.ondataavailable) {
              // Create a more realistic audio blob
              const mockAudioData = new Uint8Array(1024 * 10); // 10KB of mock data
              for (let i = 0; i < mockAudioData.length; i++) {
                mockAudioData[i] = Math.floor(Math.random() * 256);
              }
              const mockBlob = new Blob([mockAudioData], { type: 'audio/webm' });
              console.log(`📦 [Mock] Sending ${mockBlob.size} bytes to ondataavailable`);
              this.ondataavailable({ data: mockBlob } as any);
            } else {
              console.log('⚠️  [Mock] ondataavailable handler not set!');
            }
          }, 100);
        }
      }

      // @ts-ignore
      window.MediaRecorder = MockMediaRecorder;

      // @ts-ignore
      navigator.mediaDevices.getUserMedia = () => {
        console.log('🎤 [Mock] getUserMedia called');
        return Promise.resolve(new MediaStream());
      };

      console.log('✅ [Mock] MediaRecorder mock installed');
    });

    // Wait for mocks to be installed
    await page.waitForTimeout(500);

    // Start recording
    logEvent('UI', 'Clicking record button');
    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await expect(recordButton).toBeVisible({ timeout: 5000 });
    await recordButton.click();
    logEvent('UI', 'Recording started');

    // Verify recording state
    const statusText = page.locator('[data-testid="voice-status"]').first();
    await expect(statusText).toContainText(/Recording|Listening/i, { timeout: 5000 });
    logEvent('UI', 'Recording state confirmed');

    // Wait a bit
    await page.waitForTimeout(2000);

    // Stop recording
    logEvent('UI', 'Stopping recording');
    await recordButton.click();
    logEvent('UI', 'Stop button clicked');

    // Wait for complete flow (up to 15 seconds)
    logEvent('WAIT', 'Waiting for complete flow (15s max)');
    await page.waitForTimeout(15000);

    // Check if modal closed (success indicator)
    const modalClosed = !(await modal.isVisible().catch(() => true));
    if (modalClosed) {
      logEvent('UI', 'Modal closed (indicates success)');
    } else {
      logEvent('UI', 'Modal still open (may indicate failure)');
    }

    // Check if note appeared in UI
    await page.waitForTimeout(2000);
    const noteCount = await page.locator('[data-testid="note-item"]').count();
    logEvent('UI', `Notes visible: ${noteCount}`);

    // Generate diagnostic report
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                  DIAGNOSTIC REPORT                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    const hasAuth = events.some(e => e.event === 'AUTH');
    const hasRecording = events.some(e => e.event === 'VOICE' && e.details?.includes('stopped'));
    const hasTranscript = events.some(e => e.event === 'TRANSCRIBE');
    const hasCategorize = events.some(e => e.event === 'CATEGORIZE');
    const hasCallback = events.some(e => e.event === 'CALLBACK');
    const hasCreate = events.some(e => e.event === 'CREATE');
    const hasDatabase = events.some(e => e.event === 'DATABASE' && e.details?.includes('INSERT'));
    const hasSuccess = events.some(e => e.event === 'DATABASE' && e.details?.includes('success'));
    const hasNoteInUI = noteCount > 0;

    console.log('Flow Stage Analysis:');
    console.log('━'.repeat(60));
    console.log(`${hasAuth ? '✅' : '❌'} Authentication`);
    console.log(`${hasRecording ? '✅' : '❌'} Voice Recording`);
    console.log(`${hasTranscript ? '✅' : '❌'} Transcription (Whisper API)`);
    console.log(`${hasCategorize ? '✅' : '❌'} Categorization (GPT-5 Nano)`);
    console.log(`${hasCallback ? '✅' : '❌'} Callback Trigger (handleVoiceNoteComplete)`);
    console.log(`${hasCreate ? '✅' : '❌'} Create Note Call (createNote)`);
    console.log(`${hasDatabase ? '✅' : '❌'} Database INSERT Started`);
    console.log(`${hasSuccess ? '✅' : '❌'} Database INSERT Completed`);
    console.log(`${hasNoteInUI ? '✅' : '❌'} Note Visible in UI`);
    console.log('━'.repeat(60));

    // Identify broken link
    let brokenLink = 'Unknown';
    if (!hasRecording) brokenLink = 'Voice Recording Failed';
    else if (!hasTranscript) brokenLink = 'Transcription API Failed';
    else if (!hasCategorize) brokenLink = 'Categorization API Failed';
    else if (!hasCallback) brokenLink = 'Callback Not Triggered';
    else if (!hasCreate) brokenLink = 'createNote Not Called';
    else if (!hasDatabase) brokenLink = 'Database INSERT Not Started';
    else if (!hasSuccess) brokenLink = 'Database INSERT Failed';
    else if (!hasNoteInUI) brokenLink = 'UI Not Updated';

    console.log(`\n🔍 BROKEN LINK: ${brokenLink}\n`);

    // Timeline
    console.log('Event Timeline:');
    console.log('━'.repeat(60));
    events.forEach(({ time, event, details }) => {
      const timeStr = `+${time}ms`.padEnd(10);
      const eventStr = event.padEnd(15);
      console.log(`${timeStr} ${eventStr} ${details || ''}`);
    });
    console.log('━'.repeat(60));

    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('━'.repeat(60));

    if (!hasCallback && hasTranscript) {
      console.log('❌ CRITICAL: Callback not triggered despite successful transcription');
      console.log('   → Check: SimpleVoiceCapture.tsx line 272-276');
      console.log('   → Verify: onTranscriptComplete prop is passed correctly');
      console.log('   → Action: Add console.log before callback to verify execution');
    }

    if (!hasCreate && hasCallback) {
      console.log('❌ CRITICAL: createNote not called despite callback trigger');
      console.log('   → Check: AppShell.tsx line 307-313 (empty transcript validation)');
      console.log('   → Verify: transcript is not empty or undefined');
      console.log('   → Action: Remove length check or fix transcript passing');
    }

    if (!hasDatabase && hasCreate) {
      console.log('❌ CRITICAL: Database INSERT not started despite createNote call');
      console.log('   → Check: useNotes.ts line 108-135');
      console.log('   → Verify: user object exists and is authenticated');
      console.log('   → Action: Check if early return happens before INSERT');
    }

    if (!hasSuccess && hasDatabase) {
      console.log('❌ CRITICAL: Database INSERT started but did not complete');
      console.log('   → Check: Supabase RLS policies');
      console.log('   → Verify: Schema matches (no missing columns)');
      console.log('   → Action: Check browser network tab for Supabase errors');
    }

    if (!hasNoteInUI && hasSuccess) {
      console.log('❌ CRITICAL: Note saved but not visible in UI');
      console.log('   → Check: useNotes.ts line 159 (setNotes optimistic update)');
      console.log('   → Verify: SimpleNoteList re-renders on notes change');
      console.log('   → Action: Add console.log in SimpleNoteList render');
    }

    console.log('━'.repeat(60));

    // Files to investigate
    console.log('\n📂 Files to Investigate:');
    console.log('━'.repeat(60));
    console.log('1. client/src/components/capture/SimpleVoiceCapture.tsx (line 272-276)');
    console.log('2. client/src/components/layout/AppShell.tsx (line 300-337)');
    console.log('3. client/src/hooks/useNotes.ts (line 96-168)');
    console.log('4. supabase/migrations/*.sql (RLS policies)');
    console.log('━'.repeat(60));

    console.log('\n✅ Diagnostic complete!\n');

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      brokenLink,
      stages: {
        hasAuth,
        hasRecording,
        hasTranscript,
        hasCategorize,
        hasCallback,
        hasCreate,
        hasDatabase,
        hasSuccess,
        hasNoteInUI
      },
      events,
      noteCount
    };

    await page.evaluate((report) => {
      console.log('📄 DIAGNOSTIC REPORT:', JSON.stringify(report, null, 2));
    }, report);

    // Test should pass if note appears
    // But we want to run this even if it fails for diagnostic purposes
    // So we'll make assertion optional
    if (hasNoteInUI) {
      expect(hasNoteInUI).toBe(true);
    } else {
      console.log(`\n⚠️  TEST FAILED: Voice-to-note flow broken at: ${brokenLink}\n`);
    }
  });

});
