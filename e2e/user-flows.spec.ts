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

test.describe('Display Name Management', () => {

    test('can update display name from profile settings', async ({ page }) => {
        await login(page);

        // Navigate to profile settings
        await page.goto('/settings/profile');
        await page.waitForLoadState('domcontentloaded');

        // Find the display name field
        const displayNameInput = page.locator('input[name="display_name"], input#display_name, input[id*="display"]').first();
        await expect(displayNameInput).toBeVisible();

        // Get current value and create incremental update
        const currentValue = await displayNameInput.inputValue();
        const timestamp = Date.now().toString().slice(-4);
        const newDisplayName = `TestUser_${timestamp}`;

        // Clear and enter new value
        await displayNameInput.clear();
        await displayNameInput.fill(newDisplayName);

        // Submit the form
        const saveButton = page.getByRole('button', { name: /save|update|submit/i });
        await saveButton.click();

        // Wait for success indication (toast or page update)
        await page.waitForTimeout(1500);

        // Refresh and verify persistence
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // Verify the new name persisted
        const updatedInput = page.locator('input[name="display_name"], input#display_name, input[id*="display"]').first();
        await expect(updatedInput).toHaveValue(newDisplayName);

        // Restore original value if it existed
        if (currentValue && currentValue !== newDisplayName) {
            await updatedInput.clear();
            await updatedInput.fill(currentValue);
            await page.getByRole('button', { name: /save|update|submit/i }).click();
            await page.waitForTimeout(1000);
        }
    });

    test('display name appears correctly on leaderboard', async ({ page }) => {
        await login(page);

        // Navigate to a league leaderboard (assumes test user has a league)
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');

        // Try to find a league link
        const leagueLink = page.getByRole('link', { name: /view league|leaderboard/i }).first();

        if (await leagueLink.count() > 0) {
            await leagueLink.click();
            await page.waitForLoadState('domcontentloaded');

            // Verify leaderboard shows display names (not "undefined" or empty)
            const leaderboardEntries = page.locator('[data-testid="leaderboard-entry"], tr, .leaderboard-row');
            const entryCount = await leaderboardEntries.count();

            if (entryCount > 0) {
                // Check first entry doesn't show "undefined" or "null"
                const firstEntry = leaderboardEntries.first();
                const text = await firstEntry.textContent();
                expect(text).not.toContain('undefined');
                expect(text).not.toContain('null');
            }
        }
    });
});

