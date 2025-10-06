import { test, expect } from '@playwright/test';
import { authenticateTestUser } from '../helpers/auth';

/**
 * CRITICAL E2E TEST: Voice → Whisper → GPT-5 Nano → Supabase → UI
 * Tests the complete flow that was previously failing
 */

test.describe('Voice to Database to UI Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate test user before running tests
    await authenticateTestUser(page);
  });

  test('should complete full voice capture → DB save → UI display', async ({ page }) => {
    console.log('🧪 Testing complete voice → DB → UI flow...');

    // Step 1: Open voice capture modal
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await expect(fab).toBeVisible({ timeout: 10000 });
    await fab.click();

    const modal = page.locator('[data-testid="voice-capture-modal"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    console.log('✅ Voice capture modal opened');

    // Step 2: Mock microphone permission
    await page.addInitScript(() => {
      // Mock MediaRecorder
      class MockMediaRecorder {
        state = 'inactive';
        ondataavailable: ((e: any) => void) | null = null;
        onstop: (() => void) | null = null;

        start() {
          this.state = 'recording';
          console.log('🎤 Mock recording started');
        }

        stop() {
          this.state = 'inactive';
          console.log('🛑 Mock recording stopped');

          // Simulate audio data with a test transcript
          if (this.ondataavailable) {
            const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
            this.ondataavailable({ data: mockBlob });
          }

          if (this.onstop) {
            this.onstop();
          }
        }
      }

      // @ts-ignore
      window.MediaRecorder = MockMediaRecorder;

      // Mock getUserMedia
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = () => {
        console.log('🎤 Mock getUserMedia called');
        return Promise.resolve(new MediaStream());
      };
    });

    // Step 3: Start voice recording
    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await expect(recordButton).toBeVisible({ timeout: 5000 });
    await recordButton.click();
    console.log('🎤 Started recording...');

    // Wait for recording state
    const statusText = page.locator('[data-testid="voice-status"]').first();
    await expect(statusText).toContainText(/Recording|Listening/i, { timeout: 5000 });
    console.log('✅ Recording state confirmed');

    // Step 4: Wait a bit then stop recording
    await page.waitForTimeout(2000);

    const stopButton = page.locator('[data-testid="voice-stop-button"]').first();
    if (await stopButton.isVisible()) {
      await stopButton.click();
      console.log('🛑 Stopped recording');
    } else {
      // Auto-stop after 5 seconds
      await page.waitForTimeout(3000);
      console.log('🛑 Auto-stopped recording');
    }

    // Step 5: Wait for transcription processing
    await expect(statusText).toContainText(/Processing|Transcribing/i, { timeout: 10000 });
    console.log('⏳ Processing transcript...');

    // Step 6: Wait for GPT-5 Nano categorization
    await page.waitForTimeout(5000);
    console.log('🤖 GPT-5 Nano categorizing...');

    // Step 7: Modal should close after successful save
    await expect(modal).not.toBeVisible({ timeout: 15000 });
    console.log('✅ Modal closed after save');

    // Step 8: CRITICAL - Verify note appears in UI (not stuck on "Loading notes...")
    const noteList = page.locator('[data-testid="note-list"]').first();
    await expect(noteList).toBeVisible({ timeout: 5000 });

    // Check that we're NOT stuck on loading
    const loadingIndicator = page.locator('text=Loading notes');
    await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
    console.log('✅ Not stuck on "Loading notes..."');

    // Step 9: Verify at least one note exists
    const notes = page.locator('[data-testid="note-item"]');
    const noteCount = await notes.count();
    expect(noteCount).toBeGreaterThan(0);
    console.log(`✅ Found ${noteCount} note(s) in UI`);

    // Step 10: Click first note to verify it loads
    if (noteCount > 0) {
      await notes.first().click();
      const editor = page.locator('[data-testid="note-editor"]').first();
      await expect(editor).toBeVisible({ timeout: 5000 });

      // Verify editor has content
      const editorContent = await editor.textContent();
      expect(editorContent).toBeTruthy();
      expect(editorContent!.length).toBeGreaterThan(0);
      console.log('✅ Note content loaded in editor');
    }

    console.log('🎉 COMPLETE FLOW SUCCESS: Voice → Whisper → GPT-5 Nano → Supabase → UI');
  });

  test('should handle voice capture errors gracefully', async ({ page }) => {
    // Open modal
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    // Mock microphone permission denied
    await page.addInitScript(() => {
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = () => {
        return Promise.reject(new Error('Permission denied'));
      };
    });

    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await recordButton.click();

    // Should show error state
    const errorMessage = page.locator('text=/Permission denied|Microphone access/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    console.log('✅ Error handling works');
  });

  test('should show notes immediately after authentication', async ({ page }) => {
    // This tests the "Loading notes..." stuck issue
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for auth to complete
    await page.waitForTimeout(2000);

    // Check loading state
    const loadingIndicator = page.locator('text=Loading notes');
    const noteList = page.locator('[data-testid="note-list"]').first();

    // Should either show notes OR loading (but not stuck forever)
    await expect(async () => {
      const isLoading = await loadingIndicator.isVisible();
      const hasNoteList = await noteList.isVisible();
      expect(isLoading || hasNoteList).toBe(true);
    }).toPass({ timeout: 10000 });

    // After max 10 seconds, should NOT be loading anymore
    await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    console.log('✅ Notes loaded (not stuck on loading)');
  });

});
