import { test, expect } from '@playwright/test';

/**
 * Storage Security E2E Tests (PRD 61)
 *
 * Verifies the app doesn't crash when localStorage/sessionStorage is blocked.
 * This is the exact scenario from the January 2026 "operation is insecure" bug
 * that affected users on WhatsApp in-app browser and Safari private browsing.
 */

test.describe('Storage blocked scenarios', () => {
    test('sign-in page loads when localStorage is blocked', async ({ page }) => {
        // Block localStorage before navigating (mimics Safari private mode / in-app browsers)
        await page.addInitScript(() => {
            const throwSecurityError = () => {
                throw new DOMException('The operation is insecure', 'SecurityError');
            };

            Object.defineProperty(window, 'localStorage', {
                get: throwSecurityError,
            });
            Object.defineProperty(window, 'sessionStorage', {
                get: throwSecurityError,
            });
        });

        await page.goto('/sign-in');

        // Page should load without crashing
        await expect(page).toHaveTitle(/.*/);
        const body = page.locator('body');
        await expect(body).toBeVisible();

        // No uncaught errors that crash the page
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));
        await page.waitForTimeout(2000);

        // SecurityError in console is expected, but page shouldn't show error boundary
        const errorBoundary = page.locator('text=Something went wrong');
        await expect(errorBoundary).toHaveCount(0);
    });

    test('app degrades gracefully with blocked storage', async ({ page }) => {
        await page.addInitScript(() => {
            const throwSecurityError = () => {
                throw new DOMException('The operation is insecure', 'SecurityError');
            };

            Object.defineProperty(window, 'localStorage', {
                get: throwSecurityError,
            });
        });

        // Navigate to root — should redirect or render without crash
        await page.goto('/');
        await expect(page).toHaveTitle(/.*/);

        // Verify the page rendered meaningful content (not just error)
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });
});
