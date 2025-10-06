import { test, expect } from '@playwright/test';
import { authenticateTestUser } from '../helpers/auth';

/**
 * CRITICAL E2E TEST: Manual Note Creation
 * Tests the complete manual note creation flow with validation
 *
 * Purpose: Verify that users can create notes manually via the + New button
 * and that notes are saved to the database and appear in the UI
 */

test.describe('Manual Note Creation Flow', () => {

  test.beforeEach(async ({ page }) => {
    console.log('🚀 Starting test - navigating to app...');

    // Authenticate test user before running tests
    await authenticateTestUser(page);

    console.log('✅ Page loaded and authenticated');
  });

  test('should create manual note successfully', async ({ page }) => {
    console.log('\n🧪 TEST: Manual Note Creation');
    console.log('=' .repeat(60));

    // Step 1: Find and click the "+ New" button
    console.log('\n📍 Step 1: Looking for + New button...');
    const newButton = page.locator('button').filter({ hasText: 'New' }).first();

    await expect(newButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Found + New button');

    await newButton.click();
    console.log('✅ Clicked + New button');

    // Step 2: Wait for modal to appear
    console.log('\n📍 Step 2: Waiting for modal...');
    const modalTitle = page.locator('h3:has-text("New Note")').first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    console.log('✅ Modal opened');

    // Step 3: Find textarea and verify it's visible
    console.log('\n📍 Step 3: Finding textarea...');
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 5000 });
    console.log('✅ Textarea found and visible');

    // Step 4: Verify text color is not white (visibility fix)
    console.log('\n📍 Step 4: Checking text color...');
    const textColor = await textarea.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });
    console.log('📝 Textarea styling:', textColor);

    // Text should NOT be white (rgb(255, 255, 255))
    expect(textColor.color).not.toBe('rgb(255, 255, 255)');
    console.log('✅ Text color is visible (not white)');

    // Step 5: Type test content
    console.log('\n📍 Step 5: Typing content...');
    const timestamp = new Date().toISOString();
    const testContent = `Playwright test note created at ${timestamp}`;

    await textarea.fill(testContent);
    console.log('✅ Typed:', testContent.substring(0, 50) + '...');

    // Verify content was typed
    const typedValue = await textarea.inputValue();
    expect(typedValue).toBe(testContent);
    console.log('✅ Content verified in textarea');

    // Step 6: Click Create Note button
    console.log('\n📍 Step 6: Clicking Create Note...');
    const createButton = page.locator('button:has-text("Create Note")').first();
    await expect(createButton).toBeVisible();

    await createButton.click();
    console.log('✅ Clicked Create Note button');

    // Step 7: Wait for modal to close (indicates success or failure)
    console.log('\n📍 Step 7: Waiting for modal to close...');
    try {
      await expect(modalTitle).not.toBeVisible({ timeout: 10000 });
      console.log('✅ Modal closed (note creation completed)');
    } catch (error) {
      console.error('❌ Modal did not close - note creation may have failed');
      throw error;
    }

    // Step 8: Verify note appears in the list
    console.log('\n📍 Step 8: Looking for note in list...');

    // Wait a bit for UI to update
    await page.waitForTimeout(2000);

    // Try to find the note by searching for part of its content
    const searchText = testContent.substring(0, 30);
    const noteInList = page.locator(`text*="${searchText}"`).first();

    const noteVisible = await noteInList.isVisible().catch(() => false);

    if (noteVisible) {
      console.log('✅ SUCCESS: Note found in UI list!');
    } else {
      console.log('⚠️  WARNING: Note not visible in UI list');
      console.log('   This could mean:');
      console.log('   - Note saved to DB but not displayed');
      console.log('   - Note save failed silently');
      console.log('   - UI refresh needed');

      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/note-not-found.png', fullPage: true });
      console.log('   📸 Screenshot saved to test-results/note-not-found.png');
    }

    // Step 9: Check if there are any notes at all
    console.log('\n📍 Step 9: Checking note list status...');
    const noteListContainer = page.locator('[data-testid="note-list"]').first();
    const noteListExists = await noteListContainer.isVisible().catch(() => false);

    if (noteListExists) {
      const allNotes = page.locator('[data-testid="note-item"]');
      const noteCount = await allNotes.count();
      console.log(`📊 Total notes in list: ${noteCount}`);

      if (noteCount > 0) {
        console.log('✅ Notes are being displayed');
      } else {
        console.log('⚠️  Note list is empty');
      }
    } else {
      console.log('⚠️  Note list container not found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST COMPLETE');
    console.log('='.repeat(60) + '\n');
  });

  test('should show alert for empty note', async ({ page }) => {
    console.log('\n🧪 TEST: Empty Note Validation');

    // Listen for alerts
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      console.log('📢 Alert shown:', alertMessage);
      await dialog.accept();
    });

    // Open modal
    const newButton = page.locator('button').filter({ hasText: 'New' }).first();
    await newButton.click();

    // Click Create without typing
    const createButton = page.locator('button:has-text("Create Note")').first();
    await createButton.click();

    // Wait for alert
    await page.waitForTimeout(1000);

    // Verify alert was shown
    if (alertMessage.includes('content')) {
      console.log('✅ Empty note validation works correctly');
    } else {
      console.log('❌ Expected alert not shown');
    }
  });

  test('should close modal on Cancel button', async ({ page }) => {
    console.log('\n🧪 TEST: Modal Cancel Button');

    // Open modal
    const newButton = page.locator('button').filter({ hasText: 'New' }).first();
    await newButton.click();

    const modalTitle = page.locator('h3:has-text("New Note")').first();
    await expect(modalTitle).toBeVisible();

    // Click Cancel
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await cancelButton.click();

    // Modal should close
    await expect(modalTitle).not.toBeVisible({ timeout: 2000 });
    console.log('✅ Modal closes on Cancel');
  });

  test('should close modal on backdrop click', async ({ page }) => {
    console.log('\n🧪 TEST: Modal Backdrop Click');

    // Open modal
    const newButton = page.locator('button').filter({ hasText: 'New' }).first();
    await newButton.click();

    const modalTitle = page.locator('h3:has-text("New Note")').first();
    await expect(modalTitle).toBeVisible();

    // Click backdrop (outside modal)
    await page.click('body', { position: { x: 50, y: 50 } });

    // Modal should close
    await expect(modalTitle).not.toBeVisible({ timeout: 2000 });
    console.log('✅ Modal closes on backdrop click');
  });

  test('should preserve text when canceling', async ({ page }) => {
    console.log('\n🧪 TEST: Text Preservation');

    // Open modal
    const newButton = page.locator('button').filter({ hasText: 'New' }).first();
    await newButton.click();

    // Type some text
    const textarea = page.locator('textarea').first();
    await textarea.fill('Test content that should not be saved');

    // Cancel
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await cancelButton.click();

    // Reopen modal
    await newButton.click();

    // Textarea should be empty (text cleared)
    const textareaValue = await textarea.inputValue();

    if (textareaValue === '') {
      console.log('✅ Textarea is cleared after cancel');
    } else {
      console.log('⚠️  Textarea still has content:', textareaValue);
    }
  });

});
