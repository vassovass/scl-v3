import { test, expect, login } from './fixtures/auth';

/**
 * Navigation E2E Tests
 * 
 * Verifies navigation flows work correctly across the application.
 */

test.describe('Navigation - Header Links', () => {

    test('homepage loads and has navigation elements', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Verify header exists with key elements
        await expect(page.locator('header')).toBeVisible();

        // Verify sign in link exists in header
        await expect(page.locator('header').getByRole('link', { name: /sign in/i })).toBeVisible();
    });

    test('sign in link navigates to login page', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Find sign in link in header
        await page.locator('header').getByRole('link', { name: /sign in/i }).click();
        await expect(page).toHaveURL(/\/sign-in/);
    });
});

test.describe('Navigation - Footer Links', () => {

    test('terms of service link works', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        await page.getByRole('link', { name: /terms of service/i }).click();
        await expect(page).toHaveURL(/\/terms/);
    });

    test('privacy policy link works', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        await page.getByRole('link', { name: /privacy policy/i }).click();
        await expect(page).toHaveURL(/\/privacy/);
    });

    test('why upload link works', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        await page.getByRole('link', { name: /why upload/i }).click();
        await expect(page).toHaveURL(/\/why-upload/);

        // Verify page content loads
        await expect(page.getByRole('heading', { name: /every step counts/i })).toBeVisible();
    });
});

test.describe('Navigation - Authenticated Dashboard', () => {

    test('dashboard sidebar navigation works', async ({ page }) => {
        await login(page);

        // Verify we're on dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // Click Create League in main area (not footer)
        await page.getByRole('main').getByRole('link', { name: /create league/i }).click();
        await expect(page).toHaveURL(/\/league\/create/);
    });

    test('can navigate back to dashboard from league creation', async ({ page }) => {
        await login(page);

        await page.goto('/league/create');
        await page.waitForLoadState('domcontentloaded');

        // Click Dashboard link
        await page.getByRole('link', { name: /dashboard/i }).first().click();
        await expect(page).toHaveURL(/\/dashboard/);
    });
});
