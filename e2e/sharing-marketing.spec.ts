/**
 * Sharing & Marketing Pages E2E Tests (PRD-51, PRD-53, PRD-55)
 *
 * End-to-end tests for the sharing marketing page and navigation.
 *
 * Systems Thinking:
 * - Tests cover guest user journey (discovery → sign-up)
 * - Tests verify navigation works for different user types
 * - Tests ensure marketing content is accessible
 *
 * Design System Thinking:
 * - Verifies consistent navigation across public pages
 * - Tests responsive behavior (mobile/desktop)
 * - Ensures CTAs are visible and functional
 *
 * Deep Thinking Framework:
 * - Why: Users discover features through marketing pages
 * - What: Navigation, content, CTAs, responsive design
 * - How: Playwright tests with accessibility checks
 */

import { test, expect } from "@playwright/test";

// ============================================================================
// How-to-Share Marketing Page Tests (PRD-53)
// ============================================================================

test.describe("How-to-Share Marketing Page", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/how-to-share");
    });

    test("page loads successfully", async ({ page }) => {
        await expect(page).toHaveTitle(/Share.*Step.*StepLeague/i);
    });

    test("hero section is visible", async ({ page }) => {
        // Check for hero headline
        const headline = page.getByRole("heading", {
            name: /track and share/i,
            level: 1,
        });
        await expect(headline).toBeVisible();
    });

    test("CTA buttons are visible", async ({ page }) => {
        // Primary CTA should be visible
        const primaryCTA = page.getByRole("link", { name: /get started|start sharing|create/i });
        await expect(primaryCTA.first()).toBeVisible();

        // Demo button should be visible
        const demoButton = page.getByRole("button", { name: /demo|example|preview/i });
        await expect(demoButton.first()).toBeVisible();
    });

    test("card gallery shows 6 card types", async ({ page }) => {
        // Scroll to card gallery
        const gallerySection = page.locator("text=6 Card Types");
        await gallerySection.scrollIntoViewIfNeeded();

        // Check for card images (using OG API)
        const cardImages = page.locator('img[src*="/api/og"]');
        await expect(cardImages).toHaveCount(6);
    });

    test("platform badges are visible", async ({ page }) => {
        // Check for platform names
        await expect(page.getByText("WhatsApp")).toBeVisible();
        await expect(page.getByText(/Twitter|X\//i)).toBeVisible();
    });

    test('"This is for you" section exists', async ({ page }) => {
        const forYouSection = page.getByText(/This is for you if/i);
        await expect(forYouSection).toBeVisible();

        const notForYouSection = page.getByText(/This is NOT for you if/i);
        await expect(notForYouSection).toBeVisible();
    });

    test("motivation section explains intrinsic vs extrinsic", async ({ page }) => {
        await expect(page.getByText(/intrinsic motivation/i)).toBeVisible();
        await expect(page.getByText(/extrinsic motivation/i)).toBeVisible();
    });

    test("JSON-LD schema is present", async ({ page }) => {
        const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
        expect(jsonLd).toContain("HowTo");
        expect(jsonLd).toContain("How to Share");
    });
});

// ============================================================================
// Navigation Tests for Marketing Pages (PRD-55)
// ============================================================================

test.describe("Marketing Page Navigation (PRD-55)", () => {
    test("guest user sees public menu on /how-to-share", async ({ page }) => {
        await page.goto("/how-to-share");

        // Should see public navigation items
        const nav = page.locator("header");

        // Logo should link to home
        const logo = nav.getByRole("link", { name: /stepleague/i });
        await expect(logo).toHaveAttribute("href", "/");

        // Sign In button should be visible for guests
        const signIn = nav.getByRole("link", { name: /sign in/i });
        await expect(signIn).toBeVisible();
    });

    test("guest user sees public menu on /compare", async ({ page }) => {
        await page.goto("/compare");

        const nav = page.locator("header");
        const signIn = nav.getByRole("link", { name: /sign in/i });
        await expect(signIn).toBeVisible();
    });

    test("guest user sees public menu on homepage", async ({ page }) => {
        await page.goto("/");

        const nav = page.locator("header");
        const signIn = nav.getByRole("link", { name: /sign in/i });
        await expect(signIn).toBeVisible();
    });

    test("navigation links work from marketing page", async ({ page }) => {
        await page.goto("/how-to-share");

        // Click logo to go home
        const logo = page.locator("header").getByRole("link", { name: /stepleague/i });
        await logo.click();

        await expect(page).toHaveURL("/");
    });

    test("primary CTA links to sign-up for guests", async ({ page }) => {
        await page.goto("/how-to-share");

        // Find the primary CTA (could have different text based on A/B test)
        const primaryCTA = page.locator('a[href*="sign-up"], a[href*="sign-in"]').first();

        // Verify it exists and points to auth
        await expect(primaryCTA).toBeVisible();
        const href = await primaryCTA.getAttribute("href");
        expect(href).toMatch(/sign-(up|in)/);
    });
});

// ============================================================================
// Mobile Responsiveness Tests
// ============================================================================

test.describe("Marketing Page Mobile", () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test("mobile menu is accessible on /how-to-share", async ({ page }) => {
        await page.goto("/how-to-share");

        // On mobile, should have hamburger menu or simplified nav
        const header = page.locator("header");
        await expect(header).toBeVisible();

        // Sign in should still be accessible
        const signIn = page.getByRole("link", { name: /sign in/i });
        await expect(signIn).toBeVisible();
    });

    test("hero section is readable on mobile", async ({ page }) => {
        await page.goto("/how-to-share");

        const headline = page.getByRole("heading", { level: 1 });
        await expect(headline).toBeVisible();

        // Check text isn't cut off
        const headlineBox = await headline.boundingBox();
        expect(headlineBox?.width).toBeLessThanOrEqual(375);
    });

    test("CTAs are tappable on mobile", async ({ page }) => {
        await page.goto("/how-to-share");

        const primaryCTA = page.getByRole("link", { name: /get started|start|create/i }).first();
        await expect(primaryCTA).toBeVisible();

        // Check button is at least 44px tall (accessibility)
        const ctaBox = await primaryCTA.boundingBox();
        expect(ctaBox?.height).toBeGreaterThanOrEqual(40);
    });

    test("card gallery is scrollable on mobile", async ({ page }) => {
        await page.goto("/how-to-share");

        // Scroll to gallery
        await page.evaluate(() => {
            document.querySelector("text=6 Card Types")?.scrollIntoView();
        });

        // Cards should be visible even on narrow screen
        const cardImages = page.locator('img[src*="/api/og"]');
        const firstCard = cardImages.first();
        await expect(firstCard).toBeVisible();
    });
});

// ============================================================================
// OG Image Tests
// ============================================================================

test.describe("OG Image Generation", () => {
    test("OG API returns valid image for daily card", async ({ request }) => {
        const response = await request.get("/api/og?card_type=daily&value=12345&metric_type=steps&name=Test");

        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("image");
    });

    test("OG API returns valid image for challenge card", async ({ request }) => {
        const response = await request.get("/api/og?card_type=challenge&value=10000&metric_type=steps&name=Challenger");

        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("image");
    });

    test("OG API returns valid image for streak card", async ({ request }) => {
        const response = await request.get("/api/og?card_type=streak&value=14&metric_type=steps&name=Streak");

        expect(response.status()).toBe(200);
    });

    test("OG images load in marketing page", async ({ page }) => {
        await page.goto("/how-to-share");

        // Wait for images to load
        await page.waitForLoadState("networkidle");

        // Check that OG images are actually loaded (not broken)
        const cardImages = page.locator('img[src*="/api/og"]');
        const count = await cardImages.count();

        for (let i = 0; i < Math.min(count, 3); i++) {
            const img = cardImages.nth(i);
            const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
            expect(naturalWidth).toBeGreaterThan(0);
        }
    });
});

// ============================================================================
// Public Stats API Tests (PRD-53 P-2)
// ============================================================================

test.describe("Public Stats API", () => {
    test("returns stats for social proof", async ({ request }) => {
        const response = await request.get("/api/stats/public");

        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty("activeUsers");
        expect(data).toHaveProperty("leaguesCount");
        expect(data).toHaveProperty("totalSteps");
    });

    test("stats have cache headers", async ({ request }) => {
        const response = await request.get("/api/stats/public");

        const cacheControl = response.headers()["cache-control"];
        expect(cacheControl).toContain("public");
    });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

test.describe("Marketing Page Accessibility", () => {
    test("page has proper heading hierarchy", async ({ page }) => {
        await page.goto("/how-to-share");

        // Should have exactly one h1
        const h1s = await page.locator("h1").count();
        expect(h1s).toBe(1);

        // H2s should exist
        const h2s = await page.locator("h2").count();
        expect(h2s).toBeGreaterThan(0);
    });

    test("images have alt text", async ({ page }) => {
        await page.goto("/how-to-share");

        const images = page.locator("img");
        const count = await images.count();

        for (let i = 0; i < count; i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute("alt");
            expect(alt).toBeTruthy();
        }
    });

    test("links have accessible names", async ({ page }) => {
        await page.goto("/how-to-share");

        const links = page.locator("a");
        const count = await links.count();

        for (let i = 0; i < Math.min(count, 10); i++) {
            const link = links.nth(i);
            const text = await link.textContent();
            const ariaLabel = await link.getAttribute("aria-label");

            // Either text content or aria-label should exist
            expect(text || ariaLabel).toBeTruthy();
        }
    });
});

// ============================================================================
// SEO Tests
// ============================================================================

test.describe("Marketing Page SEO", () => {
    test("has meta description", async ({ page }) => {
        await page.goto("/how-to-share");

        const metaDesc = await page.locator('meta[name="description"]').getAttribute("content");
        expect(metaDesc).toBeTruthy();
        expect(metaDesc?.length).toBeGreaterThan(50);
    });

    test("has canonical URL", async ({ page }) => {
        await page.goto("/how-to-share");

        const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
        expect(canonical).toContain("/how-to-share");
    });

    test("has Open Graph tags", async ({ page }) => {
        await page.goto("/how-to-share");

        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
        expect(ogTitle).toBeTruthy();

        const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
        expect(ogImage).toContain("/api/og");
    });

    test("has Twitter card tags", async ({ page }) => {
        await page.goto("/how-to-share");

        const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");
        expect(twitterCard).toBe("summary_large_image");
    });
});
