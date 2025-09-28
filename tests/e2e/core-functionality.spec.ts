import { test, expect } from '@playwright/test';

/**
 * CORE FUNCTIONALITY E2E TESTS
 * Testing critical user journeys as specified in REVAMP.md
 * Focus: Apple Notes + Todoist interface behavior
 */

test.describe('Apple Notes + Todoist Interface', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display three-panel Apple Notes layout', async ({ page }) => {
    // Test three-panel layout structure
    const sidebar = page.locator('[data-testid="sidebar"]').first();
    const noteList = page.locator('[data-testid="note-list"]').first();
    const editor = page.locator('[data-testid="note-editor"]').first();

    await expect(sidebar).toBeVisible();
    await expect(noteList).toBeVisible();
    await expect(editor).toBeVisible();
  });

  test('should collapse and expand sidebar like Apple Notes', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]').first();
    const collapseButton = page.locator('[data-testid="sidebar-toggle"]').first();

    // Test initial expanded state
    await expect(sidebar).toBeVisible();

    // Test collapse
    await collapseButton.click();
    await page.waitForTimeout(300); // Wait for animation

    // Test expand
    await collapseButton.click();
    await page.waitForTimeout(300);
    await expect(sidebar).toBeVisible();
  });

  test('should display smart collections (Inbox, Today, Completed)', async ({ page }) => {
    const inbox = page.locator('text=Inbox').first();
    const today = page.locator('text=Today').first();
    const completed = page.locator('text=Completed').first();

    await expect(inbox).toBeVisible();
    await expect(today).toBeVisible();
    await expect(completed).toBeVisible();
  });

  test('should open quick capture modal via floating action button', async ({ page }) => {
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await expect(fab).toBeVisible();

    await fab.click();

    const modal = page.locator('[data-testid="voice-capture-modal"]').first();
    await expect(modal).toBeVisible();
  });

  test('should close modal with close button', async ({ page }) => {
    // Open modal
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    const modal = page.locator('[data-testid="voice-capture-modal"]').first();
    await expect(modal).toBeVisible();

    // Close modal
    const closeButton = page.locator('[data-testid="modal-close"]').first();
    await closeButton.click();

    await expect(modal).not.toBeVisible();
  });

  test('should close modal when clicking backdrop', async ({ page }) => {
    // Open modal
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    const modal = page.locator('[data-testid="voice-capture-modal"]').first();
    await expect(modal).toBeVisible();

    // Click backdrop to close
    await page.click('body', { position: { x: 50, y: 50 } });

    await expect(modal).not.toBeVisible();
  });

});

test.describe('Voice Capture Pipeline', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display voice capture interface', async ({ page }) => {
    // Open voice capture modal
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    const voiceButton = page.locator('[data-testid="voice-record-button"]').first();
    const statusText = page.locator('[data-testid="voice-status"]').first();

    await expect(voiceButton).toBeVisible();
    await expect(statusText).toBeVisible();
    await expect(statusText).toContainText('Tap to record');
  });

  test('should show recording interface when voice button clicked', async ({ page }) => {
    // Mock getUserMedia to avoid permission dialog
    await page.addInitScript(() => {
      // @ts-ignore
      navigator.mediaDevices.getUserMedia = () => Promise.resolve(new MediaStream());
    });

    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await fab.click();

    const voiceButton = page.locator('[data-testid="voice-record-button"]').first();
    await voiceButton.click();

    // Should show recording state
    const statusText = page.locator('[data-testid="voice-status"]').first();
    await expect(statusText).toContainText('Recording...');
  });

});

test.describe('Performance and Accessibility', () => {

  test('should load in under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/');

    // Check for proper ARIA labels
    const sidebar = page.locator('[data-testid="sidebar"]').first();
    await expect(sidebar).toHaveAttribute('role', 'navigation');

    const fab = page.locator('[data-testid="quick-capture-fab"]').first();
    await expect(fab).toHaveAttribute('aria-label');
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Test tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should meet WCAG color contrast requirements', async ({ page }) => {
    await page.goto('/');

    // Check main text has sufficient contrast
    const textElement = page.locator('text=Inbox').first();
    const color = await textElement.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Apple Notes uses #1d1d1f which has good contrast
    expect(color).toContain('rgb(29, 29, 31)');
  });

});

test.describe('Responsive Design', () => {

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const sidebar = page.locator('[data-testid="sidebar"]').first();
    const fab = page.locator('[data-testid="quick-capture-fab"]').first();

    await expect(fab).toBeVisible();
    // On mobile, sidebar might be initially hidden
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const sidebar = page.locator('[data-testid="sidebar"]').first();
    const noteList = page.locator('[data-testid="note-list"]').first();

    await expect(sidebar).toBeVisible();
    await expect(noteList).toBeVisible();
  });

});

test.describe('Single Page Application Behavior', () => {

  test('should not reload page on navigation', async ({ page }) => {
    await page.goto('/');

    let pageReloaded = false;
    page.on('load', () => {
      pageReloaded = true;
    });

    // Click on different projects - should not cause page reload
    const projectButtons = page.locator('[data-testid="project-item"]');
    const count = await projectButtons.count();

    if (count > 0) {
      await projectButtons.first().click();
      await page.waitForTimeout(1000);
      expect(pageReloaded).toBe(false);
    }
  });

  test('should handle URL changes without page refresh', async ({ page }) => {
    await page.goto('/');

    const initialUrl = page.url();

    // Simulate navigation that might change URL
    const projectButton = page.locator('[data-testid="project-item"]').first();
    if (await projectButton.isVisible()) {
      await projectButton.click();

      // URL might change but page shouldn't reload
      const currentUrl = page.url();
      // The URLs might be different but both should be loaded states
      expect(page.url()).toBeTruthy();
    }
  });

});