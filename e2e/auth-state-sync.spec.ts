import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for auth state synchronization fixes.
 *
 * Tests three critical issues:
 * 1. Cookie sync-back prevention (PRIMARY)
 * 2. Data leakage on sign-out (SECURITY)
 * 3. NavHeader flash during auth init (UI)
 */

// Helper: Sign in a user
async function signIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

// Helper: Get all cookies for the domain
async function getCookies(page: Page) {
  const cookies = await page.context().cookies();
  return cookies.filter(c => c.domain.includes('stepleague') || c.name.includes('sb-'));
}

test.describe('Auth State Synchronization', () => {

  // ============================================================================
  // PRIMARY FIX: Cookie Sync-Back Prevention
  // ============================================================================

  test.describe('Cookie Sync-Back Prevention', () => {
    test('cookies stay deleted after manual deletion (no sync-back)', async ({ page }) => {
      // Sign in first
      await signIn(page, process.env.TEST_USER_EMAIL || 'test@example.com',
                          process.env.TEST_USER_PASSWORD || 'password123');

      // Verify we're signed in (cookies exist)
      const cookiesBeforeDelete = await getCookies(page);
      expect(cookiesBeforeDelete.length).toBeGreaterThan(0);
      console.log(`[Test] Found ${cookiesBeforeDelete.length} cookies before delete`);

      // Delete ALL cookies
      await page.context().clearCookies();

      // Wait 2 seconds (give Supabase time to "sync back" if bug exists)
      await page.waitForTimeout(2000);

      // Check cookies again
      const cookiesAfterDelete = await getCookies(page);

      // ✅ EXPECTED: Cookies stay deleted (no sync-back from localStorage)
      expect(cookiesAfterDelete.length).toBe(0);
      console.log(`[Test] ✅ Cookies stayed deleted (count: ${cookiesAfterDelete.length})`);
    });

    test('/reset page clears all auth state permanently', async ({ page }) => {
      // Sign in first
      await signIn(page, process.env.TEST_USER_EMAIL || 'test@example.com',
                          process.env.TEST_USER_PASSWORD || 'password123');

      // Navigate to /reset
      await page.goto('/reset');

      // Wait for reset to complete (should redirect to /sign-in?reset=true)
      await page.waitForURL(/\/sign-in\?reset=true/, { timeout: 10000 });

      // Verify all storage is cleared
      const localStorageCount = await page.evaluate(() => localStorage.length);
      const sessionStorageCount = await page.evaluate(() => sessionStorage.length);
      const cookies = await getCookies(page);

      expect(localStorageCount).toBe(0);
      expect(sessionStorageCount).toBe(0);
      expect(cookies.length).toBe(0);

      console.log('[Test] ✅ /reset cleared all storage and cookies');

      // Wait 5 seconds to see if cookies sync back
      await page.waitForTimeout(5000);

      const cookiesAfterWait = await getCookies(page);

      // ✅ EXPECTED: Cookies stay cleared (no sync-back)
      expect(cookiesAfterWait.length).toBe(0);
      console.log('[Test] ✅ Cookies stayed cleared after 5s (no sync-back)');
    });
  });

  // ============================================================================
  // SECURITY FIX: Data Leakage Prevention
  // ============================================================================

  test.describe('Data Leakage on Sign-Out', () => {
    test('no user data visible during sign-out transition', async ({ page }) => {
      // Sign in
      await signIn(page, process.env.TEST_USER_EMAIL || 'test@example.com',
                          process.env.TEST_USER_PASSWORD || 'password123');

      // Wait for dashboard to fully load
      await page.waitForSelector('h1:has-text("Your Leagues")', { timeout: 10000 });

      // Get dashboard content (league names)
      const leagueNames = await page.locator('[data-testid*="league"], .league-card').allTextContents();
      console.log('[Test] Dashboard loaded with leagues:', leagueNames.length);

      // Set up listener for any text content changes
      let dataLeakDetected = false;
      page.on('console', msg => {
        if (msg.type() === 'log' && msg.text().includes('League')) {
          console.warn('[Test] ⚠️ Potential data leak: console log with league data during sign-out');
        }
      });

      // Click sign-out button
      const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
      await signOutButton.click();

      // Immediately check if loading spinner appears (should prevent data flash)
      const loadingSpinner = page.locator('.animate-spin, [role="status"]');
      const isLoadingVisible = await loadingSpinner.isVisible({ timeout: 500 }).catch(() => false);

      // ✅ EXPECTED: Loading spinner appears immediately
      expect(isLoadingVisible).toBe(true);
      console.log('[Test] ✅ Loading spinner appeared immediately on sign-out');

      // Wait for redirect to sign-in
      await page.waitForURL(/\/sign-in/, { timeout: 10000 });

      // ✅ EXPECTED: No league data visible on sign-in page
      const leagueDataOnSignIn = await page.locator('[data-testid*="league"], .league-card').count();
      expect(leagueDataOnSignIn).toBe(0);
      console.log('[Test] ✅ No user data visible after sign-out redirect');
    });

    test('switching users does not flash previous user data', async ({ page, context }) => {
      // Requires two test users
      const userA = {
        email: process.env.TEST_USER_A_EMAIL || 'usera@example.com',
        password: process.env.TEST_USER_A_PASSWORD || 'password123'
      };
      const userB = {
        email: process.env.TEST_USER_B_EMAIL || 'userb@example.com',
        password: process.env.TEST_USER_B_PASSWORD || 'password123'
      };

      // Sign in as User A
      await signIn(page, userA.email, userA.password);
      await page.waitForSelector('h1:has-text("Your Leagues")');

      // Capture User A's league names
      const userALeagues = await page.locator('[data-testid*="league"], .league-card').first().textContent();
      console.log('[Test] User A leagues:', userALeagues);

      // Sign out
      const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
      await signOutButton.click();
      await page.waitForURL(/\/sign-in/);

      // Sign in as User B
      await signIn(page, userB.email, userB.password);
      await page.waitForSelector('h1:has-text("Your Leagues")');

      // Check if User A's data is visible (it shouldn't be)
      if (userALeagues) {
        const userADataVisible = await page.locator(`text="${userALeagues}"`).isVisible({ timeout: 1000 })
          .catch(() => false);

        // ✅ EXPECTED: User A's data is NOT visible
        expect(userADataVisible).toBe(false);
        console.log('[Test] ✅ User A data not visible on User B dashboard');
      }

      // Verify User B's data loads correctly
      const userBLeagues = await page.locator('[data-testid*="league"], .league-card').first().textContent();
      console.log('[Test] User B leagues:', userBLeagues);

      // ✅ EXPECTED: User A and User B have different data (or test is inconclusive)
      if (userALeagues && userBLeagues) {
        expect(userALeagues).not.toBe(userBLeagues);
        console.log('[Test] ✅ User B sees their own data (not User A)');
      }
    });

    test('browser back button does not show cached protected pages', async ({ page }) => {
      // Sign in
      await signIn(page, process.env.TEST_USER_EMAIL || 'test@example.com',
                          process.env.TEST_USER_PASSWORD || 'password123');

      await page.waitForSelector('h1:has-text("Your Leagues")');

      // Sign out
      const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
      await signOutButton.click();
      await page.waitForURL(/\/sign-in/);

      // Click browser back button
      await page.goBack();

      // Wait a moment for any cached content to appear
      await page.waitForTimeout(1000);

      // ✅ EXPECTED: Either shows sign-in page OR loading, NOT cached dashboard
      const isDashboardVisible = await page.locator('h1:has-text("Your Leagues")').isVisible({ timeout: 1000 })
        .catch(() => false);

      expect(isDashboardVisible).toBe(false);
      console.log('[Test] ✅ Back button does not show cached dashboard');

      // Should be redirected back to sign-in
      expect(page.url()).toContain('/sign-in');
    });
  });

  // ============================================================================
  // UI FIX: NavHeader Flash Prevention
  // ============================================================================

  test.describe('NavHeader Flash Prevention', () => {
    test('authenticated user sees no "Sign in" button flash on page load', async ({ page }) => {
      // Sign in
      await signIn(page, process.env.TEST_USER_EMAIL || 'test@example.com',
                          process.env.TEST_USER_PASSWORD || 'password123');

      // Navigate away and back to dashboard
      await page.goto('/');
      await page.goto('/dashboard');

      // Track if "Sign in" button ever appears (it shouldn't)
      let signInButtonAppeared = false;

      // Check multiple times during page load
      for (let i = 0; i < 5; i++) {
        const signInVisible = await page.locator('button:has-text("Sign in"), a:has-text("Sign in")')
          .isVisible({ timeout: 100 })
          .catch(() => false);

        if (signInVisible) {
          signInButtonAppeared = true;
          console.warn('[Test] ⚠️ "Sign in" button flashed during load');
          break;
        }

        await page.waitForTimeout(100);
      }

      // ✅ EXPECTED: "Sign in" button never appeared
      expect(signInButtonAppeared).toBe(false);
      console.log('[Test] ✅ No "Sign in" button flash on authenticated load');

      // Verify authenticated menu is visible
      const userMenuVisible = await page.locator('[data-testid="user-menu"], button:has-text("Sign out")')
        .isVisible({ timeout: 5000 });

      expect(userMenuVisible).toBe(true);
      console.log('[Test] ✅ Authenticated menu visible');
    });

    test('unauthenticated user sees smooth skeleton to "Sign in" transition', async ({ page }) => {
      // Ensure signed out
      await page.goto('/reset');
      await page.waitForURL(/\/sign-in\?reset=true/);

      // Navigate to public page (homepage)
      await page.goto('/');

      // Check for loading skeleton (should appear during auth init)
      const skeletonVisible = await page.locator('.animate-pulse, [role="status"]')
        .isVisible({ timeout: 500 })
        .catch(() => false);

      // Note: Skeleton might not always be visible if auth loads very fast
      if (skeletonVisible) {
        console.log('[Test] ✅ Loading skeleton appeared during auth init');
      }

      // Wait for "Sign in" button to appear
      const signInButton = await page.locator('a:has-text("Sign in"), button:has-text("Sign in")').first();
      await expect(signInButton).toBeVisible({ timeout: 5000 });

      console.log('[Test] ✅ "Sign in" button appeared after auth init');
    });
  });

  // ============================================================================
  // ADDITIONAL: Session Expiry Handling
  // ============================================================================

  test.describe('Session Expiry Handling', () => {
    test('expired session redirects to sign-in before dashboard renders', async ({ page, context }) => {
      // Note: This test requires ability to set expired cookies
      // Skip if not in controlled test environment
      test.skip(process.env.CI !== 'true', 'Requires cookie manipulation');

      // Set an expired auth cookie
      await context.addCookies([{
        name: 'sb-test-auth-token',
        value: JSON.stringify({
          access_token: 'expired_token',
          expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          user: { id: 'test-user-id' }
        }),
        domain: 'localhost',
        path: '/',
        expires: -1
      }]);

      // Try to access dashboard
      await page.goto('/dashboard');

      // ✅ EXPECTED: Should redirect to sign-in
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

      // ✅ EXPECTED: Should NOT see dashboard content
      const dashboardVisible = await page.locator('h1:has-text("Your Leagues")').isVisible({ timeout: 1000 })
        .catch(() => false);

      expect(dashboardVisible).toBe(false);
      console.log('[Test] ✅ Expired session redirected before dashboard rendered');
    });
  });

  // ============================================================================
  // INTEGRATION: Combined Scenarios
  // ============================================================================

  test.describe('Integration Tests', () => {
    test('full auth flow: sign in → use app → sign out → sign in again', async ({ page }) => {
      // 1. Sign in
      await signIn(page, process.env.TEST_USER_EMAIL || 'test@example.com',
                          process.env.TEST_USER_PASSWORD || 'password123');

      console.log('[Test] Step 1: Signed in ✅');

      // 2. Use app (navigate to different pages)
      await page.goto('/dashboard');
      await page.waitForSelector('h1:has-text("Your Leagues")');

      console.log('[Test] Step 2: Navigated to dashboard ✅');

      // 3. Sign out
      const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
      await signOutButton.click();
      await page.waitForURL(/\/sign-in/);

      // Verify loading spinner appeared (no data leak)
      const loadingVisible = await page.locator('.animate-spin, [role="status"]')
        .isVisible({ timeout: 500 })
        .catch(() => false);

      console.log('[Test] Step 3: Signed out, loading spinner:', loadingVisible ? '✅' : '⚠️');

      // 4. Verify all auth state cleared
      const cookies = await getCookies(page);
      expect(cookies.length).toBe(0);

      console.log('[Test] Step 4: Auth state cleared ✅');

      // 5. Sign in again
      await signIn(page, process.env.TEST_USER_EMAIL || 'test@example.com',
                          process.env.TEST_USER_PASSWORD || 'password123');

      // Verify no "Sign in" button flash
      const signInFlashed = await page.locator('button:has-text("Sign in")')
        .isVisible({ timeout: 100 })
        .catch(() => false);

      expect(signInFlashed).toBe(false);

      console.log('[Test] Step 5: Signed in again (no flash) ✅');

      // ✅ EXPECTED: Full flow works without issues
      expect(page.url()).toContain('/dashboard');
    });
  });
});
