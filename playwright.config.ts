import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for StepLeague E2E Tests
 * 
 * Runs alongside Vitest (unit/integration tests).
 * Use `npm run test:e2e` to run E2E tests.
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',

    // Run tests in parallel
    fullyParallel: true,

    // Fail the build on CI if test.only is accidentally left in
    forbidOnly: !!process.env.CI,

    // Retry on CI only
    retries: process.env.CI ? 2 : 0,

    // Opt out of parallel tests on CI
    workers: process.env.CI ? 1 : undefined,

    // Reporter to use
    reporter: [
        ['html', { open: 'never' }],
        ['list']
    ],

    // Shared settings for all projects
    use: {
        // Base URL for navigation
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

        // Force dark mode
        colorScheme: 'dark',

        // Collect trace when retrying
        trace: 'on-first-retry',

        // Screenshot on failure
        screenshot: 'only-on-failure',

        // Video on failure
        video: 'on-first-retry',
    },

    // Configure projects for major browsers
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // Uncomment to test on more browsers
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
    ],

    // Run local dev server before tests (optional)
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
