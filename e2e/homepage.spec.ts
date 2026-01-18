import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests
 * 
 * Basic smoke tests to verify the app is working.
 * Demonstrates Playwright working alongside Vitest.
 */

test.describe('Homepage', () => {
    test('loads successfully and shows main content', async ({ page }) => {
        // Navigate to homepage
        await page.goto('/');

        // Wait for DOM content to be ready
        await page.waitForLoadState('domcontentloaded');

        // Check page title contains StepLeague
        await expect(page).toHaveTitle(/Step/i);

        // Check that the page has loaded (no error page)
        await expect(page.locator('body')).not.toContainText('404');
        await expect(page.locator('body')).not.toContainText('500');

        // Verify hero section is visible
        await expect(page.getByText('Motivate. Connect. Thrive.')).toBeVisible();
    });

    test('has working navigation', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Check for header
        await expect(page.locator('header')).toBeVisible();

        // Check for Sign In link in header
        const signInLink = page.locator('header').getByRole('link', { name: /sign in/i });
        await expect(signInLink).toBeVisible();
    });

    test('has call-to-action buttons', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Check for primary CTA (use first() since there are multiple)
        const ctaButton = page.getByRole('link', { name: /get started/i }).first();
        await expect(ctaButton).toBeVisible();

        // Verify it links to sign-up
        await expect(ctaButton).toHaveAttribute('href', '/sign-up');
    });
});
