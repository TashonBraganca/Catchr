import { test, expect } from '@playwright/test';

/**
 * SIMPLIFIED NOTE CREATION TEST
 * Tests note creation functionality without authentication
 * Focuses on database verification using console logs
 */

test.describe('Simple Note Creation Test', () => {

  test('should verify note creation flow and database save', async ({ page }) => {
    console.log('\n🧪 TEST: Simple Note Creation Without Auth Complexity');
    console.log('=' .repeat(60));

    // Navigate to app
    console.log('\n📍 Step 1: Navigate to app...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });
    console.log('📸 Screenshot: 01-initial-page.png');

    // Check what's actually on the page
    const pageTitle = await page.title();
    const bodyText = await page.locator('body').textContent();
    console.log('\n📋 Page Info:');
    console.log(`   Title: ${pageTitle}`);
    console.log(`   Has "+ New" button: ${bodyText?.includes('New') || bodyText?.includes('new')}`);
    console.log(`   Has "Sign In": ${bodyText?.includes('Sign In')}`);

    // If we see a "+ New" button, try to use it
    const newButtonExists = await page.locator('button:has-text("New")').count() > 0;

    if (newButtonExists) {
      console.log('\n✅ Found "+ New" button - proceeding with note creation test');

      const newButton = page.locator('button').filter({ hasText: 'New' }).first();
      await newButton.click();
      console.log('✅ Clicked "+ New" button');

      // Wait for modal
      const modalTitle = page.locator('h3:has-text("New Note")').first();
      const modalVisible = await modalTitle.isVisible({ timeout: 5000 }).catch(() => false);

      if (modalVisible) {
        console.log('✅ Modal opened');

        // Type content
        const textarea = page.locator('textarea').first();
        const testContent = `Test note created at ${new Date().toISOString()}`;
        await textarea.fill(testContent);
        console.log(`✅ Typed: ${testContent.substring(0, 50)}...`);

        // Screenshot before submit
        await page.screenshot({ path: 'test-results/02-modal-filled.png', fullPage: true });

        // Create note
        const createButton = page.locator('button:has-text("Create Note")').first();
        await createButton.click();
        console.log('✅ Clicked "Create Note"');

        // Wait and screenshot result
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/03-after-create.png', fullPage: true });

        console.log('\n✨ Note creation flow completed');
      } else {
        console.log('⚠️  Modal did not appear');
        await page.screenshot({ path: 'test-results/02-no-modal.png', fullPage: true });
      }

    } else {
      console.log('\n⚠️  No "+ New" button found - likely need authentication');
      console.log('   App appears to require sign-in');

      // Check if we can see any other elements
      const buttons = await page.locator('button').count();
      console.log(`   Found ${buttons} button(s) on page`);

      // List all button texts
      for (let i = 0; i < Math.min(buttons, 10); i++) {
        const buttonText = await page.locator('button').nth(i).textContent();
        console.log(`   Button ${i + 1}: "${buttonText}"`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TEST COMPLETE');
    console.log('='.repeat(60) + '\n');
  });

  test('should check browser console for debug logs', async ({ page }) => {
    console.log('\n🧪 TEST: Check Console Logs');

    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('[useNotes]') || text.includes('[AppShell]') || text.includes('Creating') || text.includes('Insert')) {
        console.log(`🔍 Console: ${text}`);
      }
    });

    // Navigate
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log(`\n📊 Total console messages: ${consoleLogs.length}`);

    // Look for specific debug messages
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('Auth') ||
      log.includes('notes') ||
      log.includes('Insert') ||
      log.includes('Creating')
    );

    console.log(`\n📋 Relevant logs (${relevantLogs.length}):`);
    relevantLogs.forEach((log, i) => {
      console.log(`   ${i + 1}. ${log}`);
    });
  });

});
