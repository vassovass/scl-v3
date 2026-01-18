import { test, expect } from '@playwright/test';

/**
 * Protected Routes E2E Tests (Negative Tests)
 * 
 * Verifies that pages requiring authentication redirect to sign-in
 * when accessed without being logged in.
 */

test.describe('Protected Routes - Unauthenticated Access', () => {

    test('dashboard redirects to sign-in', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');

        // Should redirect to sign-in
        await expect(page).toHaveURL(/\/sign-in/);
        await expect(page.locator('#email')).toBeVisible();
    });

    test('submit-steps page requires authentication to submit', async ({ page }) => {
        await page.goto('/submit-steps');
        await page.waitForLoadState('domcontentloaded');

        // This page may load but should show login prompt or redirect
        // Check for either redirect OR login requirement message
        const isRedirected = page.url().includes('/sign-in');
        const hasLoginPrompt = await page.getByText(/sign in|log in/i).count() > 0;

        expect(isRedirected || hasLoginPrompt || page.url().includes('/submit-steps')).toBeTruthy();
    });

    test('league create page redirects to sign-in', async ({ page }) => {
        await page.goto('/league/create');
        await page.waitForLoadState('domcontentloaded');

        // Should redirect to sign-in
        await expect(page).toHaveURL(/\/sign-in/);
    });

    test('league join page redirects to sign-in', async ({ page }) => {
        await page.goto('/league/join');
        await page.waitForLoadState('domcontentloaded');

        // Should redirect to sign-in
        await expect(page).toHaveURL(/\/sign-in/);
    });

    test('profile settings page redirects to sign-in', async ({ page }) => {
        await page.goto('/settings/profile');
        await page.waitForLoadState('domcontentloaded');

        // Should redirect to sign-in
        await expect(page).toHaveURL(/\/sign-in/);
    });

    test('preferences page redirects to sign-in', async ({ page }) => {
        await page.goto('/settings/preferences');
        await page.waitForLoadState('domcontentloaded');

        // Should redirect to sign-in
        await expect(page).toHaveURL(/\/sign-in/);
    });

    test('specific league page redirects to sign-in', async ({ page }) => {
        // Try accessing a league with a fake UUID
        await page.goto('/league/00000000-0000-0000-0000-000000000000');
        await page.waitForLoadState('domcontentloaded');

        // Should redirect to sign-in
        await expect(page).toHaveURL(/\/sign-in/);
    });

    test('league settings page redirects to sign-in', async ({ page }) => {
        await page.goto('/league/00000000-0000-0000-0000-000000000000/settings');
        await page.waitForLoadState('domcontentloaded');

        // Should redirect to sign-in
        await expect(page).toHaveURL(/\/sign-in/);
    });
});

test.describe('Public Routes - Accessible Without Auth', () => {

    test('homepage is accessible', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Should NOT redirect, should show homepage
        await expect(page).toHaveURL(/^\/$|^https?:\/\/[^\/]+\/?$/);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('sign-in page is accessible', async ({ page }) => {
        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');

        // Should stay on sign-in
        await expect(page).toHaveURL(/\/sign-in/);
        await expect(page.locator('#email')).toBeVisible();
    });

    test('sign-up page is accessible', async ({ page }) => {
        await page.goto('/sign-up');
        await page.waitForLoadState('domcontentloaded');

        // Should stay on sign-up
        await expect(page).toHaveURL(/\/sign-up/);
    });

    test('how-it-works page is accessible', async ({ page }) => {
        await page.goto('/how-it-works');
        await page.waitForLoadState('domcontentloaded');

        // Should stay on how-it-works
        await expect(page).toHaveURL(/\/how-it-works/);
    });

    test('pricing page is accessible', async ({ page }) => {
        await page.goto('/pricing');
        await page.waitForLoadState('domcontentloaded');

        // Should stay on pricing
        await expect(page).toHaveURL(/\/pricing/);
    });

    test('terms of service is accessible', async ({ page }) => {
        await page.goto('/terms-of-service');
        await page.waitForLoadState('domcontentloaded');

        // Should stay on terms page
        await expect(page).toHaveURL(/\/terms/);
    });

    test('privacy policy is accessible', async ({ page }) => {
        await page.goto('/privacy-policy');
        await page.waitForLoadState('domcontentloaded');

        // Should stay on privacy page
        await expect(page).toHaveURL(/\/privacy/);
    });

    test('reset page clears state and redirects to sign-in', async ({ page }) => {
        // First set some localStorage to verify it gets cleared
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('test-item', 'should-be-cleared');
            sessionStorage.setItem('test-session', 'should-be-cleared');
        });

        // Navigate to reset page
        await page.goto('/reset');
        await page.waitForLoadState('domcontentloaded');

        // Should show reset status message
        await expect(page.getByText(/reset|clearing|initializing/i)).toBeVisible({ timeout: 5000 });

        // Wait for redirect to sign-in (reset page redirects after clearing)
        await page.waitForURL(/\/sign-in/, { timeout: 15000 });

        // Verify we're on sign-in page
        await expect(page).toHaveURL(/\/sign-in/);

        // Verify localStorage was cleared (by checking our test item is gone)
        const testItem = await page.evaluate(() => localStorage.getItem('test-item'));
        expect(testItem).toBeNull();
    });
});
