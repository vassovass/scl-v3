import { test as base, expect, Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * Auth Fixtures for Playwright E2E Tests
 * 
 * Provides authenticated page context for tests that require login.
 * Uses credentials from SL_PW_LOGIN_TEST_USERNAME and SL_PW_LOGIN_TEST_PASSWORD
 */

// Get credentials from environment
const TEST_EMAIL = process.env.SL_PW_LOGIN_TEST_USERNAME;
const TEST_PASSWORD = process.env.SL_PW_LOGIN_TEST_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.warn('⚠️ Test credentials not found. Set SL_PW_LOGIN_TEST_USERNAME and SL_PW_LOGIN_TEST_PASSWORD in .env.local');
}

/**
 * Login helper function
 * Navigates to sign-in and logs in with test credentials
 */
export async function login(page: Page) {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
        throw new Error('Test credentials not configured. Add SL_PW_LOGIN_TEST_USERNAME and SL_PW_LOGIN_TEST_PASSWORD to .env.local');
    }

    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');

    // Fill login form
    await page.locator('#email').fill(TEST_EMAIL);
    await page.locator('#password').fill(TEST_PASSWORD);

    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
}

/**
 * Extended test fixture with authenticated page
 */
export const test = base.extend<{ authenticatedPage: Page }>({
    authenticatedPage: async ({ page }, use) => {
        await login(page);
        await use(page);
    },
});

export { expect };
