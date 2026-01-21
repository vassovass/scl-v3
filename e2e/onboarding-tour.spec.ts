import { test, expect, login } from './fixtures/auth';

/**
 * Onboarding Tour E2E Tests
 *
 * Verifies that onboarding tours include required content,
 * specifically testing PRD 49 requirement that leaderboard tour
 * mentions global leaderboard (Item 10).
 */

test.describe('Onboarding Tour - Leaderboard', () => {

    test('leaderboard tour includes global leaderboard explanation', async ({ page }) => {
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
        // Step 1: "See how you rank against your league!"
        const firstStep = page.getByText(/see how you rank/i);
        await expect(firstStep).toBeVisible({ timeout: 5000 });

        // Click next to advance to step 2 (global vs league explanation)
        const nextButton = page.getByRole('button', { name: /next/i });
        await nextButton.click();

        // Verify global leaderboard step content (Step 2)
        // Content: "🌍 GLOBAL vs LEAGUE: This is your league's leaderboard..."
        await expect(page.getByText(/GLOBAL vs LEAGUE/i)).toBeVisible({ timeout: 3000 });
        await expect(page.getByText(/nickname is visible to everyone/i)).toBeVisible();

        // Verify it mentions the Global Leaderboard location
        await expect(page.getByText(/found in main navigation/i)).toBeVisible();
    });
});
