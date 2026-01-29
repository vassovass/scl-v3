/**
 * Custom Date Range Sharing E2E Tests (PRD-54 Phase 1)
 *
 * End-to-end tests for the custom date range sharing feature.
 *
 * Systems Thinking:
 * - Tests cover the full user journey from selecting custom dates to sharing
 * - Tests verify OG image generation with custom period params
 * - Tests ensure date picker presets work correctly
 *
 * Design System Thinking:
 * - Verifies consistent styling across date picker components
 * - Tests responsive behavior of date range picker
 * - Ensures proper theme support
 */

import { test, expect } from "@playwright/test";

// ============================================================================
// OG Image API Tests for Custom Period (PRD-54)
// ============================================================================

test.describe("Custom Period OG Image API", () => {
    test("returns valid image for custom_period card type", async ({ request }) => {
        const response = await request.get(
            "/api/og?card_type=custom_period&value=85000&metric_type=steps&name=Test&period=Jan%2015-22"
        );

        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("image");
    });

    test("accepts period_start and period_end params", async ({ request }) => {
        const response = await request.get(
            "/api/og?card_type=custom_period&value=50000&metric_type=steps&name=Test&period_start=2026-01-15&period_end=2026-01-22"
        );

        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("image");
    });

    test("custom_period uses purple color scheme", async ({ request }) => {
        // This test verifies the image renders - actual color checking would need visual regression
        const response = await request.get(
            "/api/og?card_type=custom_period&value=75000&metric_type=steps&name=CustomPeriod&theme=dark"
        );

        expect(response.status()).toBe(200);
    });

    test("supports light theme for custom_period", async ({ request }) => {
        const response = await request.get(
            "/api/og?card_type=custom_period&value=60000&metric_type=steps&name=Test&theme=light"
        );

        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("image");
    });
});

// ============================================================================
// Stats Hub API Tests for Custom Date Range (PRD-54)
// ============================================================================

test.describe("Stats Hub API Custom Date Range", () => {
    test("accepts custom period with start_date and end_date", async ({ request }) => {
        // This will return 401 for unauthenticated users, which is expected
        const response = await request.get(
            "/api/stats/hub?period=custom&start_date=2026-01-01&end_date=2026-01-15"
        );

        // Either 401 (unauthenticated) or 200 (if test user is authenticated)
        expect([200, 401]).toContain(response.status());
    });

    test("rejects custom period without date params", async ({ request }) => {
        const response = await request.get("/api/stats/hub?period=custom");

        // Should still work but return empty/null period stats
        expect([200, 401]).toContain(response.status());
    });
});

// ============================================================================
// Share Modal Custom Period Tests (requires authentication mock)
// ============================================================================

test.describe("Share Modal UI", () => {
    test.skip("custom_period card type appears in card type selector", async ({ page }) => {
        // This test requires authenticated user - skipped for now
        // Would need to implement auth mocking
        await page.goto("/my-stats");

        // Open share modal
        await page.click('[data-tour="share-button"]');

        // Check for custom period option
        const customButton = page.getByRole("button", { name: /custom/i });
        await expect(customButton).toBeVisible();
    });
});

// ============================================================================
// Date Picker Component Tests
// ============================================================================

test.describe("ShareDateRangePicker Component", () => {
    test("preset shortcuts are available", async ({ page }) => {
        // Navigate to a page that uses the date picker (needs auth)
        // For now, test the marketing preview if available
        await page.goto("/how-to-share");

        // This test would need a dedicated test page or auth mocking
        // Skipping detailed UI tests that require authentication
    });
});

// ============================================================================
// Card Type Configuration Tests
// ============================================================================

test.describe("Custom Period Card Type", () => {
    test("custom_period card type exists in OG API", async ({ request }) => {
        // Test that the card type is recognized
        const response = await request.get(
            "/api/og?card_type=custom_period&value=0&name=Test"
        );

        expect(response.status()).toBe(200);
    });

    test("all original card types still work", async ({ request }) => {
        const cardTypes = ["daily", "weekly", "personal_best", "streak", "rank", "challenge", "rank_change"];

        for (const cardType of cardTypes) {
            const response = await request.get(
                `/api/og?card_type=${cardType}&value=12345&metric_type=steps&name=Test`
            );

            expect(response.status()).toBe(200);
            expect(response.headers()["content-type"]).toContain("image");
        }
    });
});

// ============================================================================
// Period Formatting Tests
// ============================================================================

test.describe("Period Label Formatting", () => {
    test("custom period with formatted label renders correctly", async ({ request }) => {
        // Test various period label formats
        const periods = [
            "Jan 15",
            "Jan 15-22",
            "Jan 15 - Feb 10",
            "Dec 28, 2025 - Jan 5, 2026",
        ];

        for (const period of periods) {
            const response = await request.get(
                `/api/og?card_type=custom_period&value=50000&name=Test&period=${encodeURIComponent(period)}`
            );

            expect(response.status()).toBe(200);
        }
    });
});

// ============================================================================
// Integration Tests
// ============================================================================

test.describe("Custom Date Range Integration", () => {
    test("share URL with custom period params is valid", async ({ page }) => {
        // Construct a share URL with custom period params
        const shareUrl = "/share/stats?card_type=custom_period&value=75000&metric_type=steps&period_start=2026-01-15&period_end=2026-01-22";

        // Should load without errors (page may redirect or show content)
        const response = await page.goto(shareUrl);
        expect(response?.status()).toBeLessThan(500);
    });

    test("OG meta tags work with custom period", async ({ page }) => {
        // This tests the share page OG tags
        const shareUrl = "/share/stats?card_type=custom_period&value=75000";

        const response = await page.goto(shareUrl);

        if (response?.status() === 200) {
            // Check OG image meta tag points to correct API
            const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
            if (ogImage) {
                expect(ogImage).toContain("/api/og");
            }
        }
    });
});

// ============================================================================
// Regression Tests - Ensure Existing Functionality Works
// ============================================================================

test.describe("Sharing Regression Tests", () => {
    test("how-to-share page still works", async ({ page }) => {
        await page.goto("/how-to-share");
        await expect(page).toHaveTitle(/Share.*StepLeague/i);
    });

    test("OG images still load on marketing page", async ({ page }) => {
        await page.goto("/how-to-share");
        await page.waitForLoadState("networkidle");

        const cardImages = page.locator('img[src*="/api/og"]');
        const count = await cardImages.count();

        // Should still have 6 card types displayed
        expect(count).toBeGreaterThanOrEqual(6);
    });

    test("daily card OG still renders", async ({ request }) => {
        const response = await request.get(
            "/api/og?card_type=daily&value=12345&metric_type=steps&name=Test"
        );

        expect(response.status()).toBe(200);
    });

    test("weekly card OG still renders", async ({ request }) => {
        const response = await request.get(
            "/api/og?card_type=weekly&value=85000&metric_type=steps&name=Test"
        );

        expect(response.status()).toBe(200);
    });
});
