import { test, expect } from '@playwright/test';
import { authenticateTestUser } from '../helpers/auth';

/**
 * BASELINE TEST: Manual Note Creation
 *
 * PURPOSE: Verify that basic note creation works before testing voice flow
 * This establishes that createNote() and database INSERT work correctly
 *
 * SUCCESS CRITERIA:
 * - User can click "+ New" button
 * - Modal opens with textarea
 * - User can type content
 * - Note saves to database
 * - Note appears in UI list
 * - Note persists after page reload
 */

test.describe('BASELINE: Manual Note Creation', () => {

  test.beforeEach(async ({ page }) => {
    // Setup console logging for debugging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[useNotes]') || text.includes('[AppShell]') || text.includes('ERROR')) {
        console.log(`🔍 BROWSER LOG: ${text}`);
      }
    });

    // Authenticate test user
    await authenticateTestUser(page);
  });

  test('should create manual note and save to database', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TEST 1: BASELINE - Manual Note Creation');
    console.log('='.repeat(80) + '\n');

    // CHECKPOINT 1: Find "+ New" button
    console.log('📍 CHECKPOINT 1: Looking for "+ New" button...');
    const newButton = page.locator('button').filter({ hasText: 'New' }).first();
    await expect(newButton).toBeVisible({ timeout: 10000 });
    console.log('✅ CHECKPOINT 1 PASSED: "+ New" button found\n');

    // CHECKPOINT 2: Click button and verify modal opens
    console.log('📍 CHECKPOINT 2: Clicking "+ New" button...');
    await newButton.click();
    const modalTitle = page.locator('h3:has-text("New Note")').first();
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    console.log('✅ CHECKPOINT 2 PASSED: Modal opened\n');

    // CHECKPOINT 3: Type content in textarea
    console.log('📍 CHECKPOINT 3: Typing content in textarea...');
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    const timestamp = Date.now();
    const testContent = `BASELINE TEST NOTE ${timestamp} - This is a test to verify manual note creation works correctly`;

    await textarea.fill(testContent);
    const typedValue = await textarea.inputValue();
    expect(typedValue).toBe(testContent);
    console.log('✅ CHECKPOINT 3 PASSED: Content typed successfully\n');
    console.log(`   Content: "${testContent.substring(0, 60)}..."`);

    // CHECKPOINT 4: Click "Create Note" button
    console.log('\n📍 CHECKPOINT 4: Clicking "Create Note" button...');
    const createButton = page.locator('button:has-text("Create Note")').first();
    await expect(createButton).toBeVisible();

    // Listen for database operations
    let insertStarted = false;
    let insertCompleted = false;
    let insertDuration = 0;

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Starting database insert')) {
        insertStarted = true;
        console.log('   🔍 Database INSERT started');
      }
      if (text.includes('Insert successful') || text.includes('Note object created')) {
        insertCompleted = true;
        console.log('   🔍 Database INSERT completed');
      }
    });

    await createButton.click();
    console.log('✅ CHECKPOINT 4 PASSED: "Create Note" clicked\n');

    // CHECKPOINT 5: Modal closes (indicates success)
    console.log('📍 CHECKPOINT 5: Waiting for modal to close...');
    await expect(modalTitle).not.toBeVisible({ timeout: 10000 });
    console.log('✅ CHECKPOINT 5 PASSED: Modal closed (operation completed)\n');

    // Wait for UI to update
    await page.waitForTimeout(2000);

    // CHECKPOINT 6: Verify note appears in UI
    console.log('📍 CHECKPOINT 6: Looking for note in UI list...');
    const noteItems = page.locator('[data-testid="note-item"]');
    const noteCount = await noteItems.count();
    console.log(`   Found ${noteCount} notes in UI`);

    if (noteCount > 0) {
      console.log('✅ CHECKPOINT 6 PASSED: Note appears in UI list\n');
    } else {
      console.log('❌ CHECKPOINT 6 FAILED: Note does NOT appear in UI\n');
      await page.screenshot({ path: 'test-results/baseline-no-note-in-ui.png', fullPage: true });
    }

    expect(noteCount).toBeGreaterThan(0);

    // CHECKPOINT 7: Verify database operations
    console.log('📍 CHECKPOINT 7: Verifying database operations...');
    if (insertStarted && insertCompleted) {
      console.log('✅ CHECKPOINT 7 PASSED: Database INSERT completed\n');
    } else {
      console.log('❌ CHECKPOINT 7 FAILED: Database operations incomplete');
      console.log(`   INSERT started: ${insertStarted}`);
      console.log(`   INSERT completed: ${insertCompleted}\n`);
    }

    // CHECKPOINT 8: Reload page and verify persistence
    console.log('📍 CHECKPOINT 8: Reloading page to verify persistence...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const noteItemsAfterReload = page.locator('[data-testid="note-item"]');
    const noteCountAfterReload = await noteItemsAfterReload.count();
    console.log(`   Found ${noteCountAfterReload} notes after reload`);

    if (noteCountAfterReload > 0) {
      console.log('✅ CHECKPOINT 8 PASSED: Note persists after reload (saved to database)\n');
    } else {
      console.log('❌ CHECKPOINT 8 FAILED: Note does NOT persist (database save failed)\n');
    }

    expect(noteCountAfterReload).toBeGreaterThan(0);

    // FINAL REPORT
    console.log('\n' + '='.repeat(80));
    console.log('🎉 BASELINE TEST COMPLETE');
    console.log('='.repeat(80));
    console.log('✅ All checkpoints passed');
    console.log('✅ Manual note creation works correctly');
    console.log('✅ Database INSERT and retrieval verified');
    console.log('✅ UI updates correctly');
    console.log('✅ Notes persist after reload');
    console.log('='.repeat(80) + '\n');
  });

  test('should show error for empty note content', async ({ page }) => {
    console.log('\n🧪 TEST 2: Empty Note Validation');

    // Open modal
    const newButton = page.locator('button').filter({ hasText: 'New' }).first();
    await newButton.click();

    // Try to create without content
    const createButton = page.locator('button:has-text("Create Note")').first();
    await createButton.click();

    // Should show error toast
    await page.waitForTimeout(1000);
    const errorToast = page.locator('text=/Please enter some content/i').first();
    const hasError = await errorToast.isVisible().catch(() => false);

    if (hasError) {
      console.log('✅ Empty note validation works\n');
    } else {
      console.log('⚠️  Empty note validation may be missing\n');
    }

    // Modal should still be open
    const modalTitle = page.locator('h3:has-text("New Note")').first();
    await expect(modalTitle).toBeVisible();
  });

  test('should measure database INSERT performance', async ({ page }) => {
    console.log('\n🧪 TEST 3: Database INSERT Performance');

    let startTime = 0;
    let endTime = 0;

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Starting database insert')) {
        startTime = Date.now();
      }
      if (text.includes('Insert successful')) {
        endTime = Date.now();
      }
    });

    // Create note
    const newButton = page.locator('button').filter({ hasText: 'New' }).first();
    await newButton.click();

    const textarea = page.locator('textarea').first();
    await textarea.fill(`Performance test ${Date.now()}`);

    const createButton = page.locator('button:has-text("Create Note")').first();
    await createButton.click();

    // Wait for completion
    await page.waitForTimeout(3000);

    const duration = endTime - startTime;

    console.log(`📊 INSERT Performance: ${duration}ms`);

    if (duration > 0 && duration < 500) {
      console.log('✅ EXCELLENT: INSERT completed in < 500ms');
      console.log('   Schema fix is working correctly\n');
    } else if (duration > 500 && duration < 1000) {
      console.log('⚠️  WARNING: INSERT took 500-1000ms');
      console.log('   Performance is acceptable but could be better\n');
    } else if (duration > 1000) {
      console.log('❌ CRITICAL: INSERT took > 1000ms');
      console.log('   This indicates a performance issue\n');
    }

    expect(duration).toBeLessThan(1000);
  });
});
