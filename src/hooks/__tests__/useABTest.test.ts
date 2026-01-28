/**
 * A/B Test Hook Tests (PRD-53 P-3)
 *
 * Tests for the A/B testing hooks that power experiment-driven UX.
 *
 * Systems Thinking:
 * - Hooks must gracefully degrade when PostHog is unavailable
 * - Variants must be consistent for the same user
 * - Loading states prevent layout shift
 *
 * Design Patterns:
 * - Strategy pattern: different variants produce different CTA text
 * - Fallback pattern: default variant when PostHog fails
 *
 * Future-Proofing:
 * - Generic useABTest hook can be used for any experiment
 * - Pre-defined variants in SHARE_CTA_VARIANTS for type safety
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { SHARE_CTA_VARIANTS, type ShareCTAVariant } from "../useABTest";

// Mock PostHog provider functions
vi.mock("@/components/analytics/PostHogProvider", () => ({
    posthogFeatureFlag: vi.fn(),
    posthogFeatureFlagPayload: vi.fn(),
}));

import { posthogFeatureFlag, posthogFeatureFlagPayload } from "@/components/analytics/PostHogProvider";

// ============================================================================
// SHARE_CTA_VARIANTS Tests
// ============================================================================

describe("SHARE_CTA_VARIANTS", () => {
    it("contains control variant", () => {
        expect(SHARE_CTA_VARIANTS.control).toBeDefined();
        expect(SHARE_CTA_VARIANTS.control.variant).toBe("control");
    });

    it("contains variant_a", () => {
        expect(SHARE_CTA_VARIANTS.variant_a).toBeDefined();
        expect(SHARE_CTA_VARIANTS.variant_a.variant).toBe("variant_a");
    });

    it("contains variant_b", () => {
        expect(SHARE_CTA_VARIANTS.variant_b).toBeDefined();
        expect(SHARE_CTA_VARIANTS.variant_b.variant).toBe("variant_b");
    });

    it("all variants have required fields", () => {
        Object.values(SHARE_CTA_VARIANTS).forEach((variant) => {
            expect(variant.variant).toBeTruthy();
            expect(variant.buttonText).toBeTruthy();
            expect(variant.buttonTextLoggedIn).toBeTruthy();
            expect(variant.demoText).toBeTruthy();
        });
    });

    it("variants have different button text", () => {
        const control = SHARE_CTA_VARIANTS.control;
        const variantA = SHARE_CTA_VARIANTS.variant_a;
        const variantB = SHARE_CTA_VARIANTS.variant_b;

        expect(control.buttonText).not.toBe(variantA.buttonText);
        expect(control.buttonText).not.toBe(variantB.buttonText);
        expect(variantA.buttonText).not.toBe(variantB.buttonText);
    });

    it("control has expected default values", () => {
        const control = SHARE_CTA_VARIANTS.control;
        expect(control.buttonText).toBe("Get Started Free");
        expect(control.buttonTextLoggedIn).toBe("Start Sharing");
        expect(control.demoText).toBe("Try Demo");
    });
});

// ============================================================================
// useABTest Hook Tests (Unit Tests for Logic)
// ============================================================================

describe("useABTest Logic", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("default behavior", () => {
        it("returns default variant initially", async () => {
            // PostHog returns undefined (not loaded)
            vi.mocked(posthogFeatureFlag).mockReturnValue(undefined);

            // Import hook after mocks are set up
            const { useABTest } = await import("../useABTest");

            const { result } = renderHook(() =>
                useABTest<string>("test_experiment", "control")
            );

            expect(result.current.variant).toBe("control");
            expect(result.current.isLoading).toBe(true);
        });

        it("sets isLoading to false after timeout", async () => {
            vi.mocked(posthogFeatureFlag).mockReturnValue(undefined);

            const { useABTest } = await import("../useABTest");

            const { result } = renderHook(() =>
                useABTest<string>("test_experiment", "control")
            );

            // Advance past the 100ms delay
            await act(async () => {
                vi.advanceTimersByTime(150);
            });

            expect(result.current.isLoading).toBe(false);
        });
    });

    describe("PostHog integration", () => {
        it("uses PostHog variant when flag is enabled", async () => {
            vi.mocked(posthogFeatureFlag).mockReturnValue(true);
            vi.mocked(posthogFeatureFlagPayload).mockReturnValue({
                variant: "variant_a",
            });

            const { useABTest } = await import("../useABTest");

            const { result } = renderHook(() =>
                useABTest<string>("test_experiment", "control")
            );

            await act(async () => {
                vi.advanceTimersByTime(150);
            });

            expect(result.current.variant).toBe("variant_a");
            expect(result.current.isLoading).toBe(false);
        });

        it("returns payload from PostHog", async () => {
            const mockPayload = {
                variant: "variant_b",
                customData: "test",
            };

            vi.mocked(posthogFeatureFlag).mockReturnValue(true);
            vi.mocked(posthogFeatureFlagPayload).mockReturnValue(mockPayload);

            const { useABTest } = await import("../useABTest");

            const { result } = renderHook(() =>
                useABTest<string>("test_experiment", "control")
            );

            await act(async () => {
                vi.advanceTimersByTime(150);
            });

            expect(result.current.payload).toEqual(mockPayload);
        });
    });

    describe("error handling", () => {
        it("falls back to default when PostHog throws", async () => {
            vi.mocked(posthogFeatureFlag).mockImplementation(() => {
                throw new Error("PostHog not initialized");
            });

            const { useABTest } = await import("../useABTest");

            const { result } = renderHook(() =>
                useABTest<string>("test_experiment", "fallback")
            );

            await act(async () => {
                vi.advanceTimersByTime(150);
            });

            expect(result.current.variant).toBe("fallback");
            expect(result.current.isLoading).toBe(false);
        });
    });
});

// ============================================================================
// useShareCTATest Hook Tests
// ============================================================================

describe("useShareCTATest Logic", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns control variant by default", async () => {
        vi.mocked(posthogFeatureFlag).mockReturnValue(undefined);

        const { useShareCTATest } = await import("../useABTest");

        const { result } = renderHook(() => useShareCTATest());

        await act(async () => {
            vi.advanceTimersByTime(150);
        });

        expect(result.current.variant.variant).toBe("control");
        expect(result.current.variant.buttonText).toBe("Get Started Free");
    });

    it("uses PostHog payload when available", async () => {
        const mockPayload: ShareCTAVariant = {
            variant: "variant_a",
            buttonText: "Custom Button",
            buttonTextLoggedIn: "Custom Logged In",
            demoText: "Custom Demo",
        };

        vi.mocked(posthogFeatureFlag).mockReturnValue(true);
        vi.mocked(posthogFeatureFlagPayload).mockReturnValue(mockPayload);

        const { useShareCTATest } = await import("../useABTest");

        const { result } = renderHook(() => useShareCTATest());

        await act(async () => {
            vi.advanceTimersByTime(150);
        });

        expect(result.current.variant.buttonText).toBe("Custom Button");
    });

    it("falls back to predefined variants when payload is simple string", async () => {
        vi.mocked(posthogFeatureFlag).mockReturnValue(true);
        vi.mocked(posthogFeatureFlagPayload).mockReturnValue({
            variant: "variant_b",
        });

        const { useShareCTATest } = await import("../useABTest");

        const { result } = renderHook(() => useShareCTATest());

        await act(async () => {
            vi.advanceTimersByTime(150);
        });

        // Should fall back to SHARE_CTA_VARIANTS since payload doesn't have buttonText
        expect(result.current.variant.buttonText).toBe(
            SHARE_CTA_VARIANTS.variant_b.buttonText
        );
    });
});

// ============================================================================
// Integration Test Scenarios
// ============================================================================

describe("A/B Test Integration Scenarios", () => {
    describe("Marketing Page CTA", () => {
        it("guest user sees control buttonText", () => {
            const variant = SHARE_CTA_VARIANTS.control;
            const isLoggedIn = false;

            const buttonText = isLoggedIn
                ? variant.buttonTextLoggedIn
                : variant.buttonText;

            expect(buttonText).toBe("Get Started Free");
        });

        it("logged in user sees control buttonTextLoggedIn", () => {
            const variant = SHARE_CTA_VARIANTS.control;
            const isLoggedIn = true;

            const buttonText = isLoggedIn
                ? variant.buttonTextLoggedIn
                : variant.buttonText;

            expect(buttonText).toBe("Start Sharing");
        });

        it("variant_a has action-oriented text", () => {
            const variant = SHARE_CTA_VARIANTS.variant_a;
            expect(variant.buttonText).toContain("Create");
        });

        it("variant_b has social proof text", () => {
            const variant = SHARE_CTA_VARIANTS.variant_b;
            expect(variant.buttonText).toContain("Join");
        });
    });

    describe("Experiment Consistency", () => {
        it("all variants are type-safe ShareCTAVariant", () => {
            Object.values(SHARE_CTA_VARIANTS).forEach((variant) => {
                // Type guard check
                const isValid =
                    "variant" in variant &&
                    "buttonText" in variant &&
                    "buttonTextLoggedIn" in variant &&
                    "demoText" in variant;

                expect(isValid).toBe(true);
            });
        });

        it("variant names match keys", () => {
            Object.entries(SHARE_CTA_VARIANTS).forEach(([key, value]) => {
                expect(value.variant).toBe(key);
            });
        });
    });
});
