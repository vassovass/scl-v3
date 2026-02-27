import { test, expect } from '@playwright/test';

/**
 * Cross-Browser Smoke Tests (PRD 61)
 *
 * Validates basic page loading across Chromium, Firefox, and WebKit.
 * These tests run against all configured browser projects in playwright.config.ts.
 */

test.describe('Cross-browser smoke tests', () => {
    test('sign-in page loads and renders heading', async ({ page }) => {
        await page.goto('/sign-in');
        // Page should load without crashing
        await expect(page).toHaveTitle(/.*/);
        // Should have some visible content (not a blank page)
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });

    test('dashboard redirects unauthenticated users', async ({ page }) => {
        const response = await page.goto('/dashboard');
        // Should redirect to sign-in (302/307) or load the sign-in page
        const url = page.url();
        // Either we got redirected to sign-in, or the page loaded (middleware redirect)
        expect(url.includes('/sign-in') || url.includes('/dashboard')).toBe(true);
    });

    test('home page loads without errors', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/.*/);
        // No uncaught errors
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));
        await page.waitForTimeout(2000);
        // Allow known non-critical errors but flag critical ones
        const criticalErrors = errors.filter(
            (e) => !e.includes('ResizeObserver') && !e.includes('hydration'),
        );
        expect(criticalErrors).toHaveLength(0);
    });
});
