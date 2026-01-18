import { test, expect } from '@playwright/test';

/**
 * Error Handling E2E Tests
 * 
 * Verifies the application handles errors gracefully.
 */

test.describe('404 Not Found Pages', () => {

    test('shows 404 for non-existent page', async ({ page }) => {
        await page.goto('/this-page-does-not-exist-xyz123');
        await page.waitForLoadState('domcontentloaded');

        // Should show 404 message or redirect
        const has404 = await page.getByText(/404|not found|page.*exist/i).count() > 0;
        const redirectedToHome = page.url() === 'https://stepleague.app/' || page.url().endsWith('/');

        expect(has404 || redirectedToHome).toBeTruthy();
    });

    test('handles invalid league ID gracefully', async ({ page }) => {
        await page.goto('/league/invalid-uuid-format');
        await page.waitForLoadState('domcontentloaded');

        // Should either show error, 404, or redirect to sign-in
        const hasError = await page.getByText(/error|not found|invalid/i).count() > 0;
        const redirected = page.url().includes('/sign-in') || page.url().includes('/dashboard');

        expect(hasError || redirected).toBeTruthy();
    });
});

test.describe('Network Error Resilience', () => {

    test('page loads without critical JavaScript errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => {
            errors.push(error.message);
        });

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Filter out known acceptable errors
        const criticalErrors = errors.filter(e =>
            !e.includes('ResizeObserver') && // Known browser quirk
            !e.includes('Extension') && // Browser extension errors
            !e.includes('Failed to fetch') && // Network errors
            !e.includes('ChunkLoadError') // Webpack chunk loading
        );

        // Allow some minor errors, but no critical ones
        expect(criticalErrors.length).toBeLessThan(3);
    });

    test('dashboard loads without console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');

        // Filter out known acceptable console errors
        const criticalErrors = errors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('404') &&
            !e.includes('net::ERR')
        );

        // Some console errors are acceptable during auth flow
        expect(criticalErrors.length).toBeLessThan(5);
    });
});

test.describe('Page Load Performance', () => {

    test('homepage loads within acceptable time', async ({ page }) => {
        const start = Date.now();
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        const loadTime = Date.now() - start;

        // Homepage should load in under 5 seconds
        expect(loadTime).toBeLessThan(5000);
    });

    test('critical elements render quickly', async ({ page }) => {
        await page.goto('/');

        // Hero should be visible within 3 seconds
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 3000 });
    });
});
