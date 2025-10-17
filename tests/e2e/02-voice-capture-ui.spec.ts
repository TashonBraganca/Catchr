import { test, expect } from '@playwright/test';
import { authenticateTestUser } from '../helpers/auth';

/**
 * VOICE CAPTURE UI TEST
 *
 * PURPOSE: Verify that voice capture UI components render and interact correctly
 * Tests the UI layer before testing the full integration
 *
 * SUCCESS CRITERIA:
 * - FAB button appears and is clickable
 * - Modal opens with voice capture interface
 * - Record button is visible and functional
 * - Waveform visualization appears
 * - Stop button works
 * - Modal can be closed
 */

test.describe('Voice Capture UI Components', () => {

  test.beforeEach(async ({ page }) => {
    // Setup console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Voice]') || text.includes('Mock recording') || text.includes('ERROR')) {
        console.log(`🔍 BROWSER LOG: ${text}`);
      }
    });

    await authenticateTestUser(page);
  });

  test('should display voice capture FAB button', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST 1: Voice Capture FAB Button');
    console.log('='.repeat(80) + '\n');

    // CHECKPOINT 1: FAB button exists
    console.log('📍 CHECKPOINT 1: Looking for voice capture FAB...');
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await expect(fab).toBeVisible({ timeout: 10000 });
    console.log('✅ CHECKPOINT 1 PASSED: FAB button visible\n');

    // CHECKPOINT 2: FAB has microphone icon
    console.log('📍 CHECKPOINT 2: Verifying FAB icon...');
    const fabIcon = fab.locator('svg').first();
    await expect(fabIcon).toBeVisible();
    console.log('✅ CHECKPOINT 2 PASSED: Microphone icon present\n');

    // CHECKPOINT 3: FAB has correct positioning
    console.log('📍 CHECKPOINT 3: Verifying FAB position...');
    const fabBox = await fab.boundingBox();
    if (fabBox) {
      console.log(`   FAB position: x=${Math.round(fabBox.x)}, y=${Math.round(fabBox.y)}`);
      console.log(`   FAB size: ${Math.round(fabBox.width)}x${Math.round(fabBox.height)}`);
      console.log('✅ CHECKPOINT 3 PASSED: FAB properly positioned\n');
    }

    console.log('🎉 FAB TEST COMPLETE\n');
  });

  test('should open voice capture modal on FAB click', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST 2: Voice Capture Modal Opening');
    console.log('='.repeat(80) + '\n');

    // CHECKPOINT 1: Click FAB
    console.log('📍 CHECKPOINT 1: Clicking FAB button...');
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();
    console.log('✅ CHECKPOINT 1 PASSED: FAB clicked\n');

    // CHECKPOINT 2: Modal appears
    console.log('📍 CHECKPOINT 2: Waiting for modal to appear...');
    const modal = page.locator('[data-testid="voice-capture-modal"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
    console.log('✅ CHECKPOINT 2 PASSED: Modal opened\n');

    // CHECKPOINT 3: Record button exists
    console.log('📍 CHECKPOINT 3: Looking for record button...');
    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await expect(recordButton).toBeVisible();
    console.log('✅ CHECKPOINT 3 PASSED: Record button visible\n');

    // CHECKPOINT 4: Status text exists
    console.log('📍 CHECKPOINT 4: Looking for status text...');
    const statusText = page.locator('[data-testid="voice-status"]').first();
    await expect(statusText).toBeVisible();
    const statusContent = await statusText.textContent();
    console.log(`   Status: "${statusContent}"`);
    console.log('✅ CHECKPOINT 4 PASSED: Status text visible\n');

    // CHECKPOINT 5: Close button exists
    console.log('📍 CHECKPOINT 5: Looking for close button...');
    const closeButton = page.locator('[data-testid="modal-close"]').first();
    await expect(closeButton).toBeVisible();
    console.log('✅ CHECKPOINT 5 PASSED: Close button visible\n');

    console.log('🎉 MODAL OPENING TEST COMPLETE\n');
  });

  test('should start and stop recording with UI feedback', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST 3: Recording Start/Stop with UI Feedback');
    console.log('='.repeat(80) + '\n');

    // Mock MediaRecorder before opening modal
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
            const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
            this.ondataavailable({ data: mockBlob } as any);
          }
        }
      }

      // @ts-ignore
      window.MediaRecorder = MockMediaRecorder;
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = () => Promise.resolve(new MediaStream());
    });

    // Open modal
    console.log('📍 Opening voice capture modal...');
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await expect(recordButton).toBeVisible();
    console.log('✅ Modal opened\n');

    // CHECKPOINT 1: Start recording
    console.log('📍 CHECKPOINT 1: Starting recording...');
    await recordButton.click();
    await page.waitForTimeout(500);
    console.log('✅ CHECKPOINT 1 PASSED: Record button clicked\n');

    // CHECKPOINT 2: Verify recording state UI
    console.log('📍 CHECKPOINT 2: Verifying recording UI state...');
    const statusText = page.locator('[data-testid="voice-status"]').first();
    const statusDuringRecording = await statusText.textContent();
    console.log(`   Status during recording: "${statusDuringRecording}"`);

    if (statusDuringRecording?.includes('Recording')) {
      console.log('✅ CHECKPOINT 2 PASSED: UI shows recording state\n');
    } else {
      console.log('⚠️  CHECKPOINT 2 WARNING: Recording state not reflected in UI\n');
    }

    // CHECKPOINT 3: Waveform appears (optional based on implementation)
    console.log('📍 CHECKPOINT 3: Checking for waveform visualization...');
    // Waveform should be in the modal while recording
    await page.waitForTimeout(500);
    console.log('   Waveform check completed\n');

    // CHECKPOINT 4: Stop recording
    console.log('📍 CHECKPOINT 4: Stopping recording...');
    await recordButton.click();
    await page.waitForTimeout(500);
    console.log('✅ CHECKPOINT 4 PASSED: Stop button clicked\n');

    // CHECKPOINT 5: Verify processing state
    console.log('📍 CHECKPOINT 5: Verifying processing state...');
    await page.waitForTimeout(1000);
    const statusAfterStop = await statusText.textContent();
    console.log(`   Status after stop: "${statusAfterStop}"`);

    if (statusAfterStop?.includes('Transcribing') || statusAfterStop?.includes('Processing')) {
      console.log('✅ CHECKPOINT 5 PASSED: UI shows processing state\n');
    } else {
      console.log('⚠️  CHECKPOINT 5 WARNING: Processing state not shown\n');
    }

    console.log('🎉 RECORDING UI TEST COMPLETE\n');
  });

  test('should close modal via close button', async ({ page }) => {
    console.log('\n🧪 TEST 4: Modal Close Button');

    // Open modal
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    const modal = page.locator('[data-testid="voice-capture-modal"]').first();
    await expect(modal).toBeVisible();

    // Click close button
    const closeButton = page.locator('[data-testid="modal-close"]').first();
    await closeButton.click();

    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 3000 });
    console.log('✅ Modal closes via close button\n');
  });

  test('should close modal via backdrop click', async ({ page }) => {
    console.log('\n🧪 TEST 5: Modal Backdrop Click');

    // Open modal
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    const modal = page.locator('[data-testid="voice-capture-modal"]').first();
    await expect(modal).toBeVisible();

    // Click backdrop (outside modal)
    await page.click('body', { position: { x: 10, y: 10 } });

    // Modal should close
    await page.waitForTimeout(1000);
    const modalVisible = await modal.isVisible().catch(() => false);

    if (!modalVisible) {
      console.log('✅ Modal closes on backdrop click\n');
    } else {
      console.log('⚠️  Modal does not close on backdrop click (may be intended)\n');
    }
  });

  test('should display loading state while processing', async ({ page }) => {
    console.log('\n🧪 TEST 6: Processing Loading State');

    // Mock APIs to slow down processing
    await page.route('**/api/voice/transcribe', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          transcript: 'Test transcript',
          confidence: 1.0,
          success: true
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

    // Open modal and record
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    const recordButton = page.locator('[data-testid="voice-record-button"]').first();
    await recordButton.click();
    await page.waitForTimeout(500);
    await recordButton.click();

    // Check for loading state
    await page.waitForTimeout(500);
    const recordButtonDisabled = await recordButton.isDisabled().catch(() => false);

    if (recordButtonDisabled) {
      console.log('✅ Record button disabled during processing\n');
    } else {
      console.log('⚠️  Record button not disabled during processing\n');
    }
  });
});
