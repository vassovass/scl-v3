import { test, expect, login } from './fixtures/auth';

/**
 * Auth Flow E2E Tests
 * 
 * Tests the login flow with real credentials.
 * Requires SL_PW_LOGIN_TEST_USERNAME and SL_PW_LOGIN_TEST_PASSWORD in .env.local
 */

test.describe('Auth Flow', () => {
    test('can navigate to sign-in page', async ({ page }) => {
        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');

        // Check page has sign-in heading
        await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

        // Check form elements are present
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

        // Check Google OAuth button
        await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    });

    test('shows error for invalid credentials', async ({ page }) => {
        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');

        // Fill with invalid credentials
        await page.locator('#email').fill('invalid@example.com');
        await page.locator('#password').fill('wrongpassword123');

        // Submit form
        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait for error message
        await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 10000 });
    });

    test('can login with valid credentials', async ({ page }) => {
        // Use the login helper
        await login(page);

        // Should be on dashboard
        await expect(page).toHaveURL(/dashboard/);

        // Check for logged-in state indicators
        await expect(page.locator('header')).toBeVisible();
    });

    test('dashboard redirects to sign-in when not logged in', async ({ page }) => {
        // Try accessing dashboard without login
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');

        // Should redirect to sign-in
        await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
    });
});

test.describe('Authenticated User', () => {
    test('can access dashboard after login', async ({ authenticatedPage }) => {
        // Already logged in via fixture
        await expect(authenticatedPage).toHaveURL(/dashboard/);

        // Check dashboard content is visible
        await expect(authenticatedPage.locator('main')).toBeVisible();
    });

    test('can navigate to submit steps page', async ({ authenticatedPage }) => {
        // Go to submit steps
        await authenticatedPage.goto('/submit-steps');
        await authenticatedPage.waitForLoadState('domcontentloaded');

        // Should be on submit steps page (not redirected)
        await expect(authenticatedPage).toHaveURL(/submit-steps/);
    });
});
