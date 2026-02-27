import { test, expect } from '@playwright/test';

/**
 * Password Reset Flow E2E Tests (PRD 57)
 *
 * Tests the forgot password → reset email → update password flow.
 * Note: Full email flow requires a real Supabase instance.
 * These tests cover UI rendering, navigation, and validation.
 */

test.describe('Password Reset - Reset Request Page', () => {

  test('reset-password page renders with email input and submit button', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
  });

  test('has link back to sign-in', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForLoadState('domcontentloaded');

    const signInLink = page.getByRole('link', { name: /sign in/i });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/sign-in');
  });

  test('shows expired link warning when error=link_expired', async ({ page }) => {
    await page.goto('/reset-password?error=link_expired');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByText(/link has expired/i)).toBeVisible();
  });

  test('shows confirmation after email submission', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForLoadState('domcontentloaded');

    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByRole('button', { name: /send reset link/i }).click();

    // Should show success message (NIST: always shows regardless of email existence)
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Password Reset - Sign In Page Link', () => {

  test('sign-in page has "Forgot password?" link', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');

    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute('href', '/reset-password');
  });

  test('"Forgot password?" link navigates to reset page', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('link', { name: /forgot password/i }).click();
    await page.waitForURL('**/reset-password');

    await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible();
  });
});

test.describe('Password Reset - Update Password Page', () => {

  test('redirects to sign-in when no session (expired link)', async ({ page }) => {
    await page.goto('/update-password');
    await page.waitForLoadState('domcontentloaded');

    // Should redirect to sign-in (middleware protects this route)
    // OR show expired link message if page loads without session
    const redirected = page.url().includes('/sign-in');
    const showsExpired = await page.getByText(/expired|invalid/i).count() > 0;

    expect(redirected || showsExpired).toBeTruthy();
  });
});
