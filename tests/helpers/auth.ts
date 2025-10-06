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
 * Bypass authentication by mocking Supabase session
 * This skips the login UI and goes directly to the authenticated app
 */
export async function authenticateTestUser(page: Page): Promise<void> {
  console.log('🔐 [Auth Helper] Mocking authenticated session...');

  try {
    // Navigate to the app
    await page.goto('/');

    // Inject fake Supabase session into localStorage
    await page.evaluate((mockUser) => {
      const mockSession = {
        access_token: 'mock-access-token-' + Date.now(),
        refresh_token: 'mock-refresh-token-' + Date.now(),
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      };

      // Store session in localStorage (Supabase format)
      const authStorageKey = `sb-${window.location.hostname.split('.')[0]}-auth-token`;
      localStorage.setItem(
        authStorageKey,
        JSON.stringify({
          currentSession: mockSession,
          expiresAt: mockSession.expires_at
        })
      );

      console.log('✅ [Mock Auth] Session injected into localStorage');
    }, MOCK_USER);

    console.log('✅ [Auth Helper] Mock session created');

    // Reload page to trigger auth state detection
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for app to recognize auth state and load
    await page.waitForSelector('button:has-text("New")', { timeout: 15000 });
    console.log('✅ [Auth Helper] App loaded in authenticated state');

    // Extra wait for any background data loading
    await page.waitForTimeout(2000);
    console.log('✅ [Auth Helper] Ready for testing');

  } catch (error) {
    console.error('❌ [Auth Helper] Failed to mock authentication:', error);

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/auth-mock-failure.png', fullPage: true });
    console.log('📸 [Auth Helper] Screenshot saved to test-results/auth-mock-failure.png');

    throw new Error(`Failed to mock authentication: ${error}`);
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
