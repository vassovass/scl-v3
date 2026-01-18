import { test, expect, login } from './fixtures/auth';

/**
 * User Flow E2E Tests
 * 
 * Tests complete user journeys through the application.
 */

test.describe('New User Onboarding Flow', () => {

    test('can navigate from homepage to sign-up', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Click Get Started or Sign Up CTA
        const cta = page.getByRole('link', { name: /get started|sign up|start free/i }).first();
        await cta.click();

        // Should be on sign-up or sign-in page
        await expect(page).toHaveURL(/\/sign-(up|in)/);
    });

    test('can navigate from pricing to sign-up', async ({ page }) => {
        await page.goto('/pricing');
        await page.waitForLoadState('domcontentloaded');

        // Look for sign up/get started button
        const signUpBtn = page.getByRole('link', { name: /get started|sign up|start/i }).first();

        if (await signUpBtn.count() > 0) {
            await signUpBtn.click();
            await expect(page).toHaveURL(/\/sign-(up|in)/);
        }
    });
});

test.describe('Authenticated User Flows', () => {

    test('can view profile settings', async ({ page }) => {
        await login(page);

        await page.goto('/settings/profile');
        await page.waitForLoadState('domcontentloaded');

        // Should be on settings page
        await expect(page).toHaveURL(/\/settings\/profile/);
        await expect(page.getByText(/profile|settings/i).first()).toBeVisible();
    });

    test('can view preferences', async ({ page }) => {
        await login(page);

        await page.goto('/settings/preferences');
        await page.waitForLoadState('domcontentloaded');

        // Should be on preferences page
        await expect(page).toHaveURL(/\/settings\/preferences/);
    });

    test('can navigate league creation flow', async ({ page }) => {
        await login(page);

        // Go to dashboard
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');

        // Click create league link in main content (not footer)
        await page.getByRole('main').getByRole('link', { name: /create league/i }).click();

        // Should be on create page
        await expect(page).toHaveURL(/\/league\/create/);
        await expect(page.getByRole('heading', { name: /create.*league/i })).toBeVisible();
    });
});

test.describe('Compare Feature', () => {

    test('can access compare page', async ({ page }) => {
        await page.goto('/compare');
        await page.waitForLoadState('domcontentloaded');

        // Should load compare page
        await expect(page).toHaveURL(/\/compare/);
    });
});

test.describe('Feedback Flow', () => {

    test('feedback form is accessible when logged in', async ({ page }) => {
        await login(page);

        // Look for feedback button/link
        const feedbackBtn = page.getByRole('link', { name: /feedback|send feedback/i });

        if (await feedbackBtn.count() > 0) {
            await feedbackBtn.click();
            await page.waitForLoadState('domcontentloaded');

            // Should navigate to feedback page/modal
            const hasFeedbackForm = await page.locator('form').count() > 0 ||
                await page.getByText(/feedback/i).count() > 0;
            expect(hasFeedbackForm).toBeTruthy();
        }
    });
});

test.describe('Session Persistence', () => {

    test('stays logged in after page refresh', async ({ page }) => {
        await login(page);

        // Verify we're logged in
        await expect(page).toHaveURL(/\/dashboard/);

        // Refresh the page
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // Should still be on dashboard (not redirected to sign-in)
        await expect(page).toHaveURL(/\/dashboard/);
    });

    test('stays logged in when navigating between pages', async ({ page }) => {
        await login(page);

        // Navigate to different pages
        await page.goto('/league/create');
        await expect(page).toHaveURL(/\/league\/create/);

        await page.goto('/settings/profile');
        await expect(page).toHaveURL(/\/settings\/profile/);

        // Back to dashboard
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/\/dashboard/);
    });
});
