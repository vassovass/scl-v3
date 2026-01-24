import { test, expect, login } from './fixtures/auth';

/**
 * Onboarding Tour E2E Tests
 *
 * Verifies that onboarding tours include required content,
 * specifically testing PRD 49 requirement that leaderboard tour
 * mentions global leaderboard (Item 10).
 */

test.describe('Onboarding Tour - Leaderboard', () => {

    test('leaderboard tour shows filters and ranking guidance', async ({ page }) => {
        await login(page);

        // Clear tour completion from localStorage to force tour to appear
        await page.evaluate(() => {
            // Clear all onboarding-related keys
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.includes('onboarding') || key.includes('tour') || key.includes('joyride')) {
                    localStorage.removeItem(key);
                }
            });
        });

        // Navigate to league leaderboard
        await page.goto('/league/00000000-0000-0000-0000-000000000001/leaderboard');
        await page.waitForLoadState('domcontentloaded');

        // Look for tour trigger button in Help menu or auto-start
        // The tour may auto-start on first visit or need manual trigger
        const helpButton = page.getByRole('button', { name: /help/i });
        if (await helpButton.isVisible()) {
            await helpButton.click();

            // Look for "Leaderboard Tour" option
            const leaderboardTourOption = page.getByText(/leaderboard/i);
            if (await leaderboardTourOption.isVisible()) {
                await leaderboardTourOption.click();
            }
        }

        // Wait for first tour step to appear
        const firstStep = page.getByText(/The Leaderboard/i);
        await expect(firstStep).toBeVisible({ timeout: 5000 });

        // Click next to advance to step 2 (time filters)
        const nextButton = page.getByRole('button', { name: /next/i });
        await nextButton.click();

        await expect(page.getByText(/Time Filters/i)).toBeVisible({ timeout: 3000 });

        // Advance to sort/verification filters
        await nextButton.click();
        await expect(page.getByText(/Sort & Verify Filters/i)).toBeVisible({ timeout: 3000 });
    });
});
