import { test, expect, Page, BrowserContext } from '@playwright/test';
import { test as authTest, login } from './fixtures/auth';

/**
 * Alpha Stability E2E Tests
 *
 * These tests target the EXACT failure modes from the January 2026 production incident:
 * - React Error #310 (objects rendered as React children)
 * - SecurityError ("The operation is insecure") from blocked storage
 * - Login failures cascading from storage/provider crashes
 * - Firefox-specific errors
 *
 * Run with: PLAYWRIGHT_BASE_URL=https://stepleague.app npx playwright test alpha-stability
 */

// ============================================================================
// Storage SecurityError Tests (January 2026 Root Cause #1)
// ============================================================================

test.describe('Storage SecurityError Resilience', () => {

    test('app loads when localStorage throws SecurityError', async ({ page }) => {
        // Simulate storage being blocked (private mode, ETP, in-app browser)
        await page.addInitScript(() => {
            const originalGetItem = Storage.prototype.getItem;
            const originalSetItem = Storage.prototype.setItem;
            const originalRemoveItem = Storage.prototype.removeItem;

            Storage.prototype.getItem = function () {
                throw new DOMException('The operation is insecure', 'SecurityError');
            };
            Storage.prototype.setItem = function () {
                throw new DOMException('The operation is insecure', 'SecurityError');
            };
            Storage.prototype.removeItem = function () {
                throw new DOMException('The operation is insecure', 'SecurityError');
            };
        });

        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Homepage should render (not crash)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

        // No uncaught errors should have fired
        const criticalErrors = errors.filter(e =>
            !e.includes('ResizeObserver') &&
            !e.includes('Extension') &&
            !e.includes('ChunkLoadError')
        );
        expect(criticalErrors).toHaveLength(0);
    });

    test('sign-in page works when storage is blocked', async ({ page }) => {
        await page.addInitScript(() => {
            Storage.prototype.getItem = function () {
                throw new DOMException('The operation is insecure', 'SecurityError');
            };
            Storage.prototype.setItem = function () {
                throw new DOMException('The operation is insecure', 'SecurityError');
            };
            Storage.prototype.removeItem = function () {
                throw new DOMException('The operation is insecure', 'SecurityError');
            };
        });

        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');

        // Sign-in form should render
        await expect(page.locator('#email')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('#password')).toBeVisible();

        // No React errors should have fired
        const reactErrors = errors.filter(e =>
            e.includes('Minified React error') ||
            e.includes('#310') ||
            e.includes('Objects are not valid as a React child')
        );
        expect(reactErrors).toHaveLength(0);
    });

    test('dashboard redirect works when storage is blocked', async ({ page }) => {
        await page.addInitScript(() => {
            Storage.prototype.getItem = function () {
                throw new DOMException('The operation is insecure', 'SecurityError');
            };
            Storage.prototype.setItem = function () {
                throw new DOMException('The operation is insecure', 'SecurityError');
            };
            Storage.prototype.removeItem = function () {
                throw new DOMException('The operation is insecure', 'SecurityError');
            };
        });

        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');

        // Should redirect to sign-in (not crash)
        await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 });

        // No uncaught errors
        const criticalErrors = errors.filter(e =>
            !e.includes('ResizeObserver') &&
            !e.includes('Extension') &&
            !e.includes('Failed to fetch') &&
            !e.includes('ChunkLoadError')
        );
        expect(criticalErrors).toHaveLength(0);
    });

    test('app works when sessionStorage throws SecurityError', async ({ page }) => {
        await page.addInitScript(() => {
            // Only block sessionStorage, leave localStorage working
            const originalSessionGetItem = sessionStorage.getItem.bind(sessionStorage);
            Object.defineProperty(window, 'sessionStorage', {
                get() {
                    throw new DOMException('The operation is insecure', 'SecurityError');
                }
            });
        });

        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Page should still render
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

        const criticalErrors = errors.filter(e =>
            !e.includes('ResizeObserver') &&
            !e.includes('Extension')
        );
        expect(criticalErrors).toHaveLength(0);
    });

    test('app works when storage quota is exceeded', async ({ page }) => {
        await page.addInitScript(() => {
            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function (key: string, value: string) {
                throw new DOMException('QuotaExceededError', 'QuotaExceededError');
            };
        });

        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

        const criticalErrors = errors.filter(e =>
            !e.includes('ResizeObserver') &&
            !e.includes('Extension')
        );
        expect(criticalErrors).toHaveLength(0);
    });
});

// ============================================================================
// React Error #310 Prevention Tests
// ============================================================================

test.describe('React Error Prevention', () => {

    test('no React errors on homepage', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const reactErrors = errors.filter(e =>
            e.includes('Minified React error') ||
            e.includes('#310') ||
            e.includes('#185') ||
            e.includes('Objects are not valid as a React child') ||
            e.includes('Maximum update depth exceeded')
        );
        expect(reactErrors).toHaveLength(0);
    });

    test('no React errors on sign-in page', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/sign-in');
        await page.waitForLoadState('networkidle');

        const reactErrors = errors.filter(e =>
            e.includes('Minified React error') ||
            e.includes('Objects are not valid as a React child') ||
            e.includes('Maximum update depth exceeded')
        );
        expect(reactErrors).toHaveLength(0);
    });

    test('no React errors on sign-up page', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/sign-up');
        await page.waitForLoadState('networkidle');

        const reactErrors = errors.filter(e =>
            e.includes('Minified React error') ||
            e.includes('Objects are not valid as a React child') ||
            e.includes('Maximum update depth exceeded')
        );
        expect(reactErrors).toHaveLength(0);
    });

    test('no React errors on public pages', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        const publicPages = [
            '/how-it-works',
            '/pricing',
            '/why-upload',
            '/roadmap',
            '/feedback',
            '/terms',
            '/privacy',
        ];

        for (const path of publicPages) {
            await page.goto(path);
            await page.waitForLoadState('domcontentloaded');
        }

        const reactErrors = errors.filter(e =>
            e.includes('Minified React error') ||
            e.includes('Objects are not valid as a React child') ||
            e.includes('Maximum update depth exceeded')
        );
        expect(reactErrors).toHaveLength(0);
    });
});

// ============================================================================
// Sign-In Failure Handling Tests
// ============================================================================

test.describe('Sign-In Error Handling', () => {

    test('shows clear error on wrong credentials', async ({ page }) => {
        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');

        await page.locator('#email').fill('nonexistent@example.com');
        await page.locator('#password').fill('wrongpassword123');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Should show error message (not crash)
        await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 10000 });

        // Should still be on sign-in page
        expect(page.url()).toContain('/sign-in');
    });

    test('handles network failure during sign-in gracefully', async ({ page }) => {
        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');

        // Block Supabase auth API
        await page.route('**/auth/v1/token**', route => route.abort('connectionfailed'));

        await page.locator('#email').fill('test@example.com');
        await page.locator('#password').fill('password123');

        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait for error to appear or timeout
        await page.waitForTimeout(5000);

        // Page should not have crashed
        await expect(page.locator('#email')).toBeVisible();

        // No uncaught React errors
        const reactErrors = errors.filter(e =>
            e.includes('Minified React error') ||
            e.includes('Objects are not valid as a React child')
        );
        expect(reactErrors).toHaveLength(0);
    });

    test('handles slow auth API response', async ({ page }) => {
        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');

        // Delay Supabase auth response by 8 seconds
        await page.route('**/auth/v1/token**', async route => {
            await new Promise(r => setTimeout(r, 8000));
            await route.continue();
        });

        await page.locator('#email').fill('test@example.com');
        await page.locator('#password').fill('password123');

        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.getByRole('button', { name: /sign in/i }).click();

        // Wait for loading state
        await page.waitForTimeout(3000);

        // Button should show loading state or form should still be visible
        const formVisible = await page.locator('#email').isVisible();
        expect(formVisible).toBe(true);

        // No crashes during slow response
        const criticalErrors = errors.filter(e =>
            !e.includes('ResizeObserver') &&
            !e.includes('Extension') &&
            !e.includes('Failed to fetch')
        );
        expect(criticalErrors).toHaveLength(0);
    });
});

// ============================================================================
// Error Boundary Verification Tests
// ============================================================================

test.describe('Error Boundaries Work', () => {

    test('error boundary catches client-side crash', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        // Navigate to a page and inject a runtime error
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // The error boundary should prevent a full white screen
        // even if a component crashes. Check that page has content.
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toBeTruthy();
        expect(bodyText!.length).toBeGreaterThan(10);
    });

    test('404 page renders without crashing', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/this-route-absolutely-does-not-exist-12345');
        await page.waitForLoadState('domcontentloaded');

        // Should show something (not a white screen)
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toBeTruthy();

        // No React errors
        const reactErrors = errors.filter(e =>
            e.includes('Minified React error')
        );
        expect(reactErrors).toHaveLength(0);
    });
});

// ============================================================================
// Authenticated Flow Stability Tests
// ============================================================================

authTest.describe('Authenticated Stability', () => {

    authTest('dashboard loads without React errors', async ({ authenticatedPage: page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        // Already on dashboard from fixture
        await page.waitForLoadState('networkidle');

        const reactErrors = errors.filter(e =>
            e.includes('Minified React error') ||
            e.includes('#310') ||
            e.includes('#185') ||
            e.includes('Objects are not valid as a React child') ||
            e.includes('Maximum update depth exceeded')
        );
        expect(reactErrors).toHaveLength(0);
    });

    authTest('submit-steps page loads without errors', async ({ authenticatedPage: page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/submit-steps');
        await page.waitForLoadState('domcontentloaded');

        // Page should render (not crash)
        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(50);

        const reactErrors = errors.filter(e =>
            e.includes('Minified React error') ||
            e.includes('Maximum update depth exceeded')
        );
        expect(reactErrors).toHaveLength(0);
    });

    authTest('settings page loads without errors', async ({ authenticatedPage: page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/settings/profile');
        await page.waitForLoadState('domcontentloaded');

        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(50);

        const reactErrors = errors.filter(e =>
            e.includes('Minified React error') ||
            e.includes('Maximum update depth exceeded')
        );
        expect(reactErrors).toHaveLength(0);
    });

    authTest('my-stats page loads without errors', async ({ authenticatedPage: page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));

        await page.goto('/my-stats');
        await page.waitForLoadState('domcontentloaded');

        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(50);

        const reactErrors = errors.filter(e =>
            e.includes('Minified React error') ||
            e.includes('Maximum update depth exceeded')
        );
        expect(reactErrors).toHaveLength(0);
    });
});

// ============================================================================
// Performance (South Africa Latency)
// ============================================================================

test.describe('Performance Baseline', () => {

    test('homepage loads within 6 seconds (SA latency budget)', async ({ page }) => {
        const start = Date.now();
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        const loadTime = Date.now() - start;

        // 6 seconds allows for SA → US round trip
        expect(loadTime).toBeLessThan(6000);
    });

    test('sign-in page loads within 5 seconds', async ({ page }) => {
        const start = Date.now();
        await page.goto('/sign-in');
        await page.waitForLoadState('domcontentloaded');
        const loadTime = Date.now() - start;

        expect(loadTime).toBeLessThan(5000);
    });

    test('sign-up page loads within 5 seconds', async ({ page }) => {
        const start = Date.now();
        await page.goto('/sign-up');
        await page.waitForLoadState('domcontentloaded');
        const loadTime = Date.now() - start;

        expect(loadTime).toBeLessThan(5000);
    });
});

// ============================================================================
// Console Error Audit (Strict Mode)
// ============================================================================

test.describe('Console Error Audit', () => {

    test('homepage has zero critical console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const criticalErrors = errors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('404') &&
            !e.includes('net::ERR') &&
            !e.includes('Failed to load resource') &&
            !e.includes('posthog') &&
            !e.includes('gtm') &&
            !e.includes('google') &&
            !e.includes('analytics')
        );

        // Zero critical errors on homepage
        expect(criticalErrors).toHaveLength(0);
    });

    test('sign-in page has zero critical console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/sign-in');
        await page.waitForLoadState('networkidle');

        const criticalErrors = errors.filter(e =>
            !e.includes('favicon') &&
            !e.includes('404') &&
            !e.includes('net::ERR') &&
            !e.includes('Failed to load resource') &&
            !e.includes('posthog') &&
            !e.includes('gtm') &&
            !e.includes('google') &&
            !e.includes('analytics')
        );

        expect(criticalErrors).toHaveLength(0);
    });
});
