import { Page } from '@playwright/test';

/**
 * Authentication helper for Playwright E2E tests
 * Mocks authentication by injecting fake session into localStorage
 */

// Mock user session data
const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@cathcr.com',
  user_metadata: {
    username: 'Test User'
  }
};

/**
 * Bypass authentication by using real Supabase test credentials
 * This is more reliable than mocking since it uses the actual auth flow
 */
export async function authenticateTestUser(page: Page): Promise<void> {
  console.log('🔐 [Auth Helper] Authenticating test user...');

  try {
    // Navigate to the app - use relative path to respect baseURL from playwright.config.ts
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('📍 [Auth Helper] Page loaded, checking auth state...');

    // Wait for React to load (give it 2 seconds)
    await page.waitForTimeout(2000);

    // Check if already authenticated (maybe from previous test)
    const hasNewButton = await page.locator('button:has-text("New")').isVisible({ timeout: 3000 }).catch(() => false);

    if (hasNewButton) {
      console.log('✅ [Auth Helper] Already authenticated from previous test');
      return;
    }

    console.log('🔑 [Auth Helper] Not authenticated, signing in...');

    // Look for auth page elements
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    // Wait for auth page to be ready
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    console.log('📍 [Auth Helper] Auth page loaded');

    // Fill in test credentials (from .env file)
    const testEmail = process.env.TEST_USER_EMAIL || 'test@cathcr.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    console.log('📍 [Auth Helper] Credentials filled');

    // Click sign in button
    const signInButton = page.locator('button').filter({ hasText: /^Sign In$/i }).first();
    await signInButton.click();
    console.log('📍 [Auth Helper] Sign in clicked');

    // Wait a moment for the response
    await page.waitForTimeout(2000);

    // Check if sign in was successful or if we got an error
    const hasError = await page.locator('text=/Invalid login credentials/i').isVisible().catch(() => false);

    if (hasError) {
      console.log('⚠️  [Auth Helper] Invalid credentials - test account may not exist');
      console.log('🔧 [Auth Helper] Attempting to create test account via sign up...');

      // Switch to sign up mode
      const signUpLink = page.locator('a, button').filter({ hasText: /sign up|create account/i }).first();
      await signUpLink.click();
      await page.waitForTimeout(1000);

      // Fill sign up form
      const usernameInput = page.locator('input[type="text"]').first();
      const emailInputSignup = page.locator('input[type="email"]').first();
      const passwordInputSignup = page.locator('input[type="password"]').first();

      await usernameInput.fill('Test User');
      await emailInputSignup.fill(testEmail);
      await passwordInputSignup.fill(testPassword);

      // Click create account
      const createButton = page.locator('button').filter({ hasText: /create account/i }).first();
      await createButton.click();
      console.log('📍 [Auth Helper] Sign up submitted');

      // Wait for account creation to complete
      await page.waitForTimeout(3000);
    }

    // Wait for authentication to complete and app to load
    // The "+ New" button should appear when authenticated
    await page.waitForSelector('button:has-text("New")', { timeout: 15000 });
    console.log('✅ [Auth Helper] Authentication successful - app loaded');

    // Extra wait for any background data loading (notes, etc.)
    await page.waitForTimeout(2000);
    console.log('✅ [Auth Helper] Ready for testing');

  } catch (error) {
    console.error('❌ [Auth Helper] Authentication failed:', error);

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/auth-failure.png', fullPage: true });
    console.log('📸 [Auth Helper] Screenshot saved to test-results/auth-failure.png');

    throw new Error(`Failed to authenticate test user: ${error}`);
  }
}

/**
 * Alternative: Sign in using Supabase client directly
 * This bypasses the UI and is faster, but requires Supabase setup in test env
 */
export async function authenticateWithSupabaseClient(page: Page): Promise<void> {
  console.log('🔐 [Auth Helper] Authenticating via Supabase client...');

  await page.goto('/');

  // Inject authentication directly via browser context
  await page.evaluate(async ({ email, password }) => {
    // @ts-ignore - Access window.supabase injected by the app
    const { supabase } = await import('/src/config/supabase.ts');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(`Supabase auth error: ${error.message}`);
    }

    console.log('✅ Authenticated:', data.user?.email);
  }, TEST_USER);

  // Wait for app to recognize auth state
  await page.waitForSelector('button:has-text("New")', { timeout: 10000 });
  await page.waitForTimeout(2000);

  console.log('✅ [Auth Helper] Supabase authentication successful');
}

/**
 * Create a new test user (run once to set up test account)
 */
export async function createTestUser(page: Page): Promise<void> {
  console.log('🔐 [Auth Helper] Creating test user account...');

  await page.goto('/');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  // Switch to sign up mode
  const signUpButton = page.locator('button:has-text("Sign up")').first();
  await signUpButton.click();

  // Fill in sign up form
  await page.fill('input[type="text"]', 'Test User'); // Username
  await page.fill('input[type="email"]', TEST_USER.email);
  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.nth(0).fill(TEST_USER.password); // Password
  await passwordInputs.nth(1).fill(TEST_USER.password); // Confirm password

  // Submit
  const createAccountButton = page.locator('button[type="submit"]').filter({ hasText: /Create Account/i });
  await createAccountButton.click();

  console.log('✅ [Auth Helper] Test user created - check email to confirm');
}

/**
 * Check if user is already authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    const newButton = page.locator('button:has-text("New")');
    await newButton.waitFor({ timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}
