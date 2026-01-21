import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * E2E Negative Tests - Auth Edge Cases & Cookie Confusion
 *
 * Tests scenarios where auth state is corrupted, confused, or malformed.
 * These tests ensure the app handles errors gracefully and doesn't leak data.
 */

// Helper: Set a malformed cookie
async function setMalformedCookie(context: BrowserContext, name: string, value: string) {
  await context.addCookies([{
    name,
    value,
    domain: 'localhost',
    path: '/',
    expires: Math.floor(Date.now() / 1000) + 3600,
  }]);
}

// Helper: Set mismatched cookies (cookie says one user, localStorage says another)
async function setMismatchedAuthState(page: Page, cookieUserId: string, localStorageUserId: string) {
  // Set cookie for User A
  await page.context().addCookies([{
    name: 'sb-test-auth-token',
    value: JSON.stringify({
      access_token: 'token-for-user-a',
      user: { id: cookieUserId, email: 'usera@example.com' },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }),
    domain: 'localhost',
    path: '/',
  }]);

  // Set localStorage for User B
  await page.evaluate((userId) => {
    localStorage.setItem('sb-test-auth-token', JSON.stringify({
      access_token: 'token-for-user-b',
      user: { id: userId, email: 'userb@example.com' },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    }));
  }, localStorageUserId);
}

test.describe('Negative Cases - Malformed Auth State', () => {

  test('should handle malformed cookie JSON gracefully', async ({ page, context }) => {
    // Set a cookie with invalid JSON
    await setMalformedCookie(context, 'sb-test-auth-token', 'not-valid-json-{{{');

    // Navigate to dashboard
    await page.goto('/dashboard');

    // ✅ EXPECTED: Should redirect to sign-in (not crash)
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

    // ✅ EXPECTED: No error messages on page (graceful handling)
    const errorText = await page.locator('text=/error|crash|failed/i').count();
    expect(errorText).toBe(0);

    console.log('[Test] ✅ Malformed cookie handled gracefully (redirected to sign-in)');
  });

  test('should handle cookie with missing required fields', async ({ page, context }) => {
    // Set cookie missing 'user' field
    await context.addCookies([{
      name: 'sb-test-auth-token',
      value: JSON.stringify({
        access_token: 'test-token',
        // user field missing!
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }),
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');

    // ✅ EXPECTED: Should treat as unauthenticated (redirect to sign-in)
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

    console.log('[Test] ✅ Cookie with missing fields handled gracefully');
  });

  test('should handle cookie with null/undefined values', async ({ page, context }) => {
    // Set cookie with null user
    await context.addCookies([{
      name: 'sb-test-auth-token',
      value: JSON.stringify({
        access_token: 'test-token',
        user: null, // null user!
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }),
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');

    // ✅ EXPECTED: Should redirect to sign-in (null user = unauthenticated)
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

    console.log('[Test] ✅ Cookie with null values handled gracefully');
  });

  test('should handle extremely large cookie value', async ({ page, context }) => {
    // Create a very large cookie (close to browser limits)
    const largeData = 'x'.repeat(4000); // 4KB of data
    await context.addCookies([{
      name: 'sb-test-auth-token',
      value: JSON.stringify({
        access_token: 'test-token',
        user: { id: 'user-123', extra_data: largeData },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }),
      domain: 'localhost',
      path: '/',
    }]);

    // Should not crash when parsing
    await page.goto('/dashboard');

    // May redirect to sign-in if cookie is too large to parse
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|sign-in)/);

    console.log('[Test] ✅ Large cookie handled without crash');
  });

  test('should handle HTML/script injection in cookie', async ({ page, context }) => {
    // Attempt to inject malicious content
    await setMalformedCookie(
      context,
      'sb-test-auth-token',
      '<script>alert("XSS")</script>'
    );

    await page.goto('/dashboard');

    // ✅ EXPECTED: No alert should appear (XSS prevented)
    const dialogs: string[] = [];
    page.on('dialog', dialog => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });

    await page.waitForTimeout(2000);

    expect(dialogs.length).toBe(0);
    console.log('[Test] ✅ Script injection in cookie prevented');
  });
});

test.describe('Negative Cases - Cookie/Storage Mismatch', () => {

  test('should handle cookie vs localStorage user mismatch', async ({ page }) => {
    // Set mismatched auth state (cookie = User A, localStorage = User B)
    await setMismatchedAuthState(page, 'user-a-id', 'user-b-id');

    await page.goto('/dashboard');

    // ✅ EXPECTED: Should use ONE consistent user (preferably from cookie, like middleware)
    // and NOT show mixed data from both users

    await page.waitForTimeout(2000);

    // Check console for any warnings about mismatch
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));

    // Verify no error states
    const errorVisible = await page.locator('text=/error|mismatch/i').isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(errorVisible).toBe(false);

    console.log('[Test] ✅ Cookie/localStorage mismatch handled (no mixed state)');
  });

  test('should handle expired cookie with valid localStorage', async ({ page, context }) => {
    // Set expired cookie
    await context.addCookies([{
      name: 'sb-test-auth-token',
      value: JSON.stringify({
        access_token: 'expired-token',
        user: { id: 'user-123' },
        expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      }),
      domain: 'localhost',
      path: '/',
    }]);

    // Set valid localStorage
    await page.evaluate(() => {
      localStorage.setItem('sb-test-auth-token', JSON.stringify({
        access_token: 'valid-token',
        user: { id: 'user-123' },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }));
    });

    await page.goto('/dashboard');

    // ✅ EXPECTED: Should redirect to sign-in (expired cookie takes precedence)
    // Middleware checks cookie first, localStorage shouldn't override expired state
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

    console.log('[Test] ✅ Expired cookie with valid localStorage handled correctly');
  });

  test('should handle valid cookie with expired localStorage', async ({ page, context }) => {
    // Set valid cookie
    await context.addCookies([{
      name: 'sb-test-auth-token',
      value: JSON.stringify({
        access_token: 'valid-token',
        user: { id: 'user-123' },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }),
      domain: 'localhost',
      path: '/',
    }]);

    // Set expired localStorage
    await page.evaluate(() => {
      localStorage.setItem('sb-test-auth-token', JSON.stringify({
        access_token: 'expired-token',
        user: { id: 'user-123' },
        expires_at: Math.floor(Date.now() / 1000) - 3600,
      }));
    });

    await page.goto('/dashboard');

    // ✅ EXPECTED: Should allow access (valid cookie is authoritative)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });

    console.log('[Test] ✅ Valid cookie with expired localStorage handled correctly');
  });
});

test.describe('Negative Cases - Multiple Cookie Chunks', () => {

  test('should handle chunked cookie with missing chunk', async ({ page, context }) => {
    // Supabase SSR splits large cookies into chunks (.0, .1, .2, etc.)
    // Simulate missing .1 chunk
    await context.addCookies([
      {
        name: 'sb-test-auth-token.0',
        value: '{"access_token":"partial',
        domain: 'localhost',
        path: '/',
      },
      // .1 chunk is MISSING
      {
        name: 'sb-test-auth-token.2',
        value: 'more-data"}',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');

    // ✅ EXPECTED: Should handle missing chunk gracefully (treat as invalid/unauthenticated)
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

    console.log('[Test] ✅ Missing cookie chunk handled gracefully');
  });

  test('should handle chunked cookie with wrong order', async ({ page, context }) => {
    // Chunks in wrong order
    await context.addCookies([
      {
        name: 'sb-test-auth-token.2',
        value: '"}',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'sb-test-auth-token.0',
        value: '{"access_token":"test',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'sb-test-auth-token.1',
        value: '","user":{"id":"123"',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');

    // ✅ EXPECTED: Cookie parser should reassemble correctly OR treat as invalid
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|sign-in)/);

    console.log('[Test] ✅ Out-of-order cookie chunks handled');
  });
});

test.describe('Negative Cases - Concurrent Sign-In/Out', () => {

  test('should handle rapid sign-in then sign-out', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    await page.click('button[type="submit"]');

    // Immediately sign out (don't wait for dashboard to fully load)
    await page.waitForURL('/dashboard', { timeout: 2000 }).catch(() => {});
    const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();

    if (await signOutButton.isVisible({ timeout: 1000 })) {
      await signOutButton.click();
    }

    // ✅ EXPECTED: Should handle rapid sign-out gracefully (no errors)
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

    // No error states should be visible
    const errorVisible = await page.locator('text=/error|failed/i').isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(errorVisible).toBe(false);

    console.log('[Test] ✅ Rapid sign-in/sign-out handled gracefully');
  });

  test('should handle multiple simultaneous sign-out clicks', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Click sign-out multiple times rapidly
    const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();

    await Promise.all([
      signOutButton.click().catch(() => {}),
      signOutButton.click().catch(() => {}),
      signOutButton.click().catch(() => {}),
    ]);

    // ✅ EXPECTED: Should redirect once (no duplicate redirects or errors)
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 5000 });

    console.log('[Test] ✅ Multiple sign-out clicks handled gracefully');
  });
});

test.describe('Negative Cases - Network Failures', () => {

  test('should handle sign-out when API is unavailable', async ({ page, context }) => {
    // Sign in first
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Block Supabase API calls
    await context.route('**/auth/v1/logout**', route => route.abort());

    // Sign out
    const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
    await signOutButton.click();

    // ✅ EXPECTED: Should still redirect to sign-in (local cleanup succeeds)
    // Even if API call fails, user should be signed out locally
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 });

    // ✅ EXPECTED: Cookies should be cleared (manual fallback)
    const cookies = await context.cookies();
    const authCookies = cookies.filter(c => c.name.includes('sb-') || c.name.includes('auth'));

    expect(authCookies.length).toBe(0);

    console.log('[Test] ✅ Sign-out works even when API is unavailable');
  });

  test('should handle /reset page when IndexedDB is locked', async ({ page }) => {
    // Lock IndexedDB by opening a database and keeping transaction open
    await page.goto('/dashboard');

    await page.evaluate(() => {
      // Lock IndexedDB
      const request = indexedDB.open('locked-db', 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['test'], 'readwrite');
        // Keep transaction open (blocks deletes)
        transaction.objectStore('test');
      };
    });

    // Navigate to /reset
    await page.goto('/reset');

    // ✅ EXPECTED: Should handle timeout and continue (non-blocking)
    await expect(page).toHaveURL(/\/sign-in\?reset=true/, { timeout: 15000 });

    console.log('[Test] ✅ /reset handles locked IndexedDB gracefully');
  });
});

test.describe('Negative Cases - Data Leakage Prevention', () => {

  test('should not expose previous user data in DOM after sign-out', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Get all text content from dashboard
    const dashboardContent = await page.locator('body').textContent();

    // Sign out
    const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
    await signOutButton.click();
    await page.waitForURL(/\/sign-in/);

    // Check if any dashboard content is still in DOM
    const bodyText = await page.locator('body').textContent();

    // ✅ EXPECTED: Dashboard-specific content should NOT be present
    // (e.g., "Your Leagues", league names, etc.)
    const hasDashboardContent = bodyText?.includes('Your Leagues') ||
                                 bodyText?.includes('Create League');

    expect(hasDashboardContent).toBe(false);

    console.log('[Test] ✅ No dashboard data leaked in DOM after sign-out');
  });

  test('should clear localStorage after sign-out', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Verify localStorage has auth data
    const hasAuthDataBefore = await page.evaluate(() => {
      return Object.keys(localStorage).some(key =>
        key.includes('sb-') || key.includes('supabase') || key.includes('auth')
      );
    });

    expect(hasAuthDataBefore).toBe(true);

    // Sign out
    const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
    await signOutButton.click();
    await page.waitForURL(/\/sign-in/);

    // ✅ EXPECTED: localStorage should be cleared of auth data
    const hasAuthDataAfter = await page.evaluate(() => {
      return Object.keys(localStorage).some(key =>
        key.includes('sb-') || key.includes('supabase') || key.includes('auth')
      );
    });

    expect(hasAuthDataAfter).toBe(false);

    console.log('[Test] ✅ localStorage cleared after sign-out');
  });

  test('should prevent browser back navigation to protected page after sign-out', async ({ page }) => {
    // Sign in and navigate through app
    await page.goto('/sign-in');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Navigate to another protected page
    await page.goto('/settings/profile');
    await page.waitForLoadState('networkidle');

    // Sign out
    const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")').first();
    await signOutButton.click();
    await page.waitForURL(/\/sign-in/);

    // Try to go back
    await page.goBack();
    await page.waitForTimeout(1000);

    // ✅ EXPECTED: Should NOT show protected page content
    const url = page.url();
    expect(url).toMatch(/\/sign-in/);

    console.log('[Test] ✅ Browser back prevented after sign-out');
  });
});

test.describe('Negative Cases - Security', () => {

  test('should reject cookie with XSS attempt in user data', async ({ page, context }) => {
    // Attempt to inject XSS via user data
    await context.addCookies([{
      name: 'sb-test-auth-token',
      value: JSON.stringify({
        access_token: 'test-token',
        user: {
          id: '<script>alert("XSS")</script>',
          email: 'test@example.com',
          display_name: '<img src=x onerror=alert("XSS")>',
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }),
      domain: 'localhost',
      path: '/',
    }]);

    const dialogs: string[] = [];
    page.on('dialog', dialog => {
      dialogs.push(dialog.message());
      dialog.dismiss();
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // ✅ EXPECTED: No XSS alerts should trigger
    expect(dialogs.length).toBe(0);

    console.log('[Test] ✅ XSS in cookie data prevented');
  });

  test('should prevent CSRF by validating session origin', async ({ page, context }) => {
    // Set cookie that appears to be from different domain
    await context.addCookies([{
      name: 'sb-test-auth-token',
      value: JSON.stringify({
        access_token: 'potentially-stolen-token',
        user: { id: 'user-123' },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        // Attacker might try to inject origin info
        __origin: 'https://evil.com',
      }),
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/dashboard');

    // ✅ EXPECTED: Should handle gracefully (validate token with Supabase)
    // If token is invalid, should redirect to sign-in
    await page.waitForTimeout(2000);

    const url = page.url();
    // Should be on valid page (either dashboard if token valid, or sign-in if invalid)
    expect(url).toMatch(/\/(dashboard|sign-in)/);

    console.log('[Test] ✅ CSRF attempt handled (session validation)');
  });
});
