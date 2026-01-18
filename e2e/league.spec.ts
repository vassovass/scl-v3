import { test, expect, login } from './fixtures/auth';
import * as fs from 'fs';
import * as path from 'path';

/**
 * League Management E2E Tests
 * 
 * Tests creating and deleting leagues with incremental naming (PWTest######).
 * Each test run:
 * 1. Creates a new league with next number (e.g., PWTest000002)
 * 2. Deletes the previous test league (e.g., PWTest000001) to keep DB clean
 * 
 * Counter is stored in e2e/.pw-test-counter to persist between runs.
 */

const COUNTER_FILE = path.join(__dirname, '.pw-test-counter');
const LEAGUE_PREFIX = 'PWTest';

/**
 * Get current counter value
 */
function getCurrentCounter(): number {
    try {
        if (fs.existsSync(COUNTER_FILE)) {
            const content = fs.readFileSync(COUNTER_FILE, 'utf-8').trim();
            return parseInt(content, 10) || 0;
        }
    } catch {
        // File doesn't exist or is invalid
    }
    return 0;
}

/**
 * Increment and save counter
 */
function incrementCounter(): number {
    const current = getCurrentCounter();
    const next = current + 1;
    fs.writeFileSync(COUNTER_FILE, next.toString());
    return next;
}

/**
 * Generate league name from counter
 */
function getLeagueName(counter: number): string {
    return `${LEAGUE_PREFIX}${counter.toString().padStart(6, '0')}`;
}

test.describe('League Management', () => {

    test('can create a new league', async ({ page }) => {
        // Login first
        await login(page);

        // Get next counter and generate name
        const counter = incrementCounter();
        const leagueName = getLeagueName(counter);

        console.log(`Creating league: ${leagueName}`);

        // Navigate to create league page
        await page.goto('/league/create');
        await page.waitForLoadState('domcontentloaded');

        // Check page loaded
        await expect(page.getByRole('heading', { name: /create.*league/i })).toBeVisible();

        // Fill in league name
        await page.locator('#name').fill(leagueName);

        // Submit form
        await page.getByRole('button', { name: /create league/i }).click();

        // Wait for button to show "Creating League..." then complete
        await expect(page.getByRole('button', { name: /creating/i })).toBeVisible({ timeout: 5000 });

        // Wait for navigation to new league page (UUID format)
        await page.waitForURL(/\/league\/[a-f0-9-]{36}/, { timeout: 30000 });

        // Verify URL changed
        expect(page.url()).toMatch(/\/league\/[a-f0-9-]{36}/);

        console.log(`✅ Created league: ${leagueName} at ${page.url()}`);
    });

    test('can delete previous test league', async ({ page }) => {
        // Login first
        await login(page);

        // Get counter to determine which league to delete
        // We delete counter - 2 to allow for build-up (counter - 1 was just created in parallel)
        const currentCounter = getCurrentCounter();
        const deleteCounter = currentCounter - 2;

        // Skip if no leagues to delete (need at least 3 runs to have something to delete)
        if (deleteCounter <= 0) {
            console.log(`No previous test league to delete (counter=${currentCounter}, would delete ${deleteCounter})`);
            test.skip();
            return;
        }

        const leagueToDelete = getLeagueName(deleteCounter);
        console.log(`Looking for league to delete: ${leagueToDelete}`);

        // Go to dashboard to find the league
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');

        // Look for the league card/link - use text matcher for flexibility
        const leagueLink = page.getByText(leagueToDelete, { exact: true });

        // Wait a bit for dashboard to fully load
        await page.waitForTimeout(1000);

        // Dismiss any joyride tour overlay that might be blocking
        const joyrideOverlay = page.locator('[data-test-id="overlay"]');
        if (await joyrideOverlay.count() > 0) {
            // Try clicking the skip button or pressing Escape
            const skipButton = page.getByRole('button', { name: /skip/i });
            if (await skipButton.count() > 0) {
                await skipButton.click();
            } else {
                await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(500);
        }

        // Check if the league exists
        if (await leagueLink.count() === 0) {
            console.log(`League ${leagueToDelete} not found on dashboard (may already be deleted)`);
            test.skip();
            return;
        }

        // Click to go to league page - force click to bypass any remaining overlays
        await leagueLink.click({ force: true });
        await page.waitForURL(/\/league\/[a-f0-9-]+/);

        // Extract league ID from URL
        const url = page.url();
        const leagueIdMatch = url.match(/\/league\/([a-f0-9-]+)/);
        if (!leagueIdMatch) {
            throw new Error('Could not extract league ID from URL');
        }

        // Navigate to settings
        await page.goto(`/league/${leagueIdMatch[1]}/settings`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for settings page to load
        await expect(page.getByText('Danger Zone')).toBeVisible({ timeout: 10000 });

        // Click Delete League button in Danger Zone
        await page.getByRole('button', { name: 'Delete League' }).first().click();

        // Wait for dialog to appear
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

        // Click confirm button inside dialog
        await page.getByRole('dialog').getByRole('button', { name: 'Delete League' }).click();

        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard', { timeout: 15000 });

        console.log(`✅ Deleted league: ${leagueToDelete}`);
    });

    test('create and verify league appears on dashboard', async ({ page }) => {
        // This test verifies the full flow without affecting counter
        await login(page);

        // Get current counter to verify the league exists
        const counter = getCurrentCounter();
        if (counter <= 0) {
            console.log('No test leagues created yet');
            test.skip();
            return;
        }

        const leagueName = getLeagueName(counter);

        // Go to dashboard
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');

        // Verify league appears
        await expect(page.getByText(leagueName)).toBeVisible({ timeout: 10000 });

        console.log(`✅ Verified league on dashboard: ${leagueName}`);
    });
});
