# Playwright E2E Testing Setup

## Prerequisites

Before running Playwright tests, you need to set up a test user account.

## Test User Setup

### Option 1: Create Test User via UI (Recommended)

1. **Start the development server:**
   ```bash
   npm run dev:client
   ```

2. **Navigate to** `http://localhost:3000`

3. **Sign up with test credentials:**
   - Email: `test@cathcr.com`
   - Password: `TestPassword123!`
   - Username: `Test User`

4. **Confirm email** (if Supabase email confirmation is enabled)
   - Check your email inbox for confirmation link
   - Click the link to activate the account

5. **Verify login works:**
   - Sign out
   - Sign back in with the credentials above
   - If you see the main app (+ New button), you're ready!

### Option 2: Use Custom Test Credentials

If you want to use different credentials:

1. **Update `.env` file:**
   ```env
   TEST_USER_EMAIL=your-test-email@example.com
   TEST_USER_PASSWORD=YourTestPassword123!
   ```

2. **Create account with those credentials** via the UI or Supabase dashboard

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Specific Test Suite
```bash
# Manual note creation tests
npx playwright test tests/e2e/manual-note-creation.spec.ts --project=chromium

# Voice capture tests
npx playwright test tests/e2e/voice-to-db-flow.spec.ts --project=chromium
```

### Run Tests in Headed Mode (Watch Execution)
```bash
npx playwright test --headed
```

### Run Tests with UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Debug a Specific Test
```bash
npx playwright test --debug tests/e2e/manual-note-creation.spec.ts
```

## Test Structure

### Manual Note Creation Tests (`manual-note-creation.spec.ts`)

Tests the complete manual note creation flow:

| Test | Purpose |
|------|---------|
| **Create manual note** | Verifies + New button → modal → type content → save → appears in list |
| **Empty note validation** | Ensures alert shows when trying to create empty note |
| **Cancel button** | Modal closes without saving when Cancel clicked |
| **Backdrop click** | Modal closes when clicking outside |
| **Text preservation** | Textarea clears after cancel/create |

### Voice Capture Tests (`voice-to-db-flow.spec.ts`)

Tests the voice → Whisper → GPT-5 → Supabase → UI flow:

| Test | Purpose |
|------|---------|
| **Full voice flow** | Voice capture → transcription → categorization → save → display |
| **Error handling** | Graceful failure when microphone permission denied |
| **Post-auth loading** | Notes load immediately after authentication (not stuck on "Loading...") |

## Authentication Helper

All tests use `tests/helpers/auth.ts` for authentication:

```typescript
import { authenticateTestUser } from '../helpers/auth';

test.beforeEach(async ({ page }) => {
  await authenticateTestUser(page);
});
```

This helper:
- ✅ Navigates to the app
- ✅ Fills in test credentials
- ✅ Clicks sign in
- ✅ Waits for app to load (+ New button visible)
- ✅ Takes screenshot on failure for debugging

## Troubleshooting

### Test Fails with "Sign In button not found"

**Cause:** Test user doesn't exist or credentials are wrong

**Fix:**
1. Manually create the test account via the UI
2. Verify `.env` has correct `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`
3. Try signing in manually to confirm credentials work

### Test Fails with "Authentication failed"

**Cause:** Email not confirmed or account disabled

**Fix:**
1. Check Supabase dashboard → Authentication → Users
2. Verify `test@cathcr.com` exists and email is confirmed
3. If needed, manually confirm email in Supabase dashboard

### Tests Timeout Waiting for "+ New" Button

**Cause:** App not loading after authentication

**Fix:**
1. Check browser console in headed mode: `npx playwright test --headed`
2. Look for JavaScript errors or API failures
3. Verify Supabase credentials in `.env` are correct
4. Check dev server is running on `localhost:3000`

### Tests Fail with "Element not found"

**Cause:** UI structure changed or selectors outdated

**Fix:**
1. Run test in UI mode to inspect: `npx playwright test --ui`
2. Use Playwright Inspector to find correct selectors
3. Update test selectors in `.spec.ts` files

## Test Screenshots and Videos

Failed tests automatically capture:

- **Screenshots:** `test-results/<test-name>/test-failed-1.png`
- **Videos:** `test-results/<test-name>/video.webm`
- **Traces:** `test-results/<test-name>/trace.zip` (on retry)

View HTML report:
```bash
npx playwright show-report
```

## CI/CD Integration

For GitHub Actions or CI pipelines:

1. **Store test credentials as secrets:**
   - `TEST_USER_EMAIL`
   - `TEST_USER_PASSWORD`

2. **Create test user during CI setup** (before running tests)

3. **Use headless mode** (default in CI)

Example GitHub Actions:
```yaml
- name: Run Playwright tests
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
  run: npm run test:e2e
```

## Writing New Tests

When adding new E2E tests:

1. **Import auth helper:**
   ```typescript
   import { authenticateTestUser } from '../helpers/auth';
   ```

2. **Add authentication to beforeEach:**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await authenticateTestUser(page);
   });
   ```

3. **Use data-testid attributes** for reliable selectors:
   ```typescript
   const button = page.locator('[data-testid="create-note-button"]');
   ```

4. **Add comprehensive logging** for debugging:
   ```typescript
   console.log('✅ Step completed');
   console.error('❌ Error occurred:', error);
   ```

5. **Handle async operations** properly:
   ```typescript
   await expect(element).toBeVisible({ timeout: 5000 });
   ```

## Best Practices

- ✅ Always authenticate before testing protected features
- ✅ Use meaningful test descriptions
- ✅ Test both success and failure scenarios
- ✅ Clean up test data after tests (if needed)
- ✅ Use realistic test data (not "asdf" or "test123")
- ✅ Wait for network/UI state, not arbitrary timeouts
- ✅ Take screenshots on failures for debugging
- ✅ Run tests locally before pushing to CI
