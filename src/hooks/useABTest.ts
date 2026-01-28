"use client";

import { useEffect, useState } from "react";
import { posthogFeatureFlag, posthogFeatureFlagPayload } from "@/components/analytics/PostHogProvider";

/**
 * A/B Test hook for experimenting with different variants
 *
 * Uses PostHog feature flags to serve different variants.
 * Falls back to default variant if PostHog isn't loaded or flag doesn't exist.
 *
 * PRD-53 P-3: A/B testing infrastructure for CTA text
 *
 * @example
 * const { variant, isLoading } = useABTest('cta_how_to_share', 'control');
 * // variant will be 'control', 'variant_a', or 'variant_b' based on PostHog flag
 *
 * @example
 * // With payload for more complex experiments
 * const { variant, payload } = useABTest('share_cta_text', 'control');
 * // payload might contain { buttonText: "Start Sharing Now!", color: "emerald" }
 */
export function useABTest<T = string>(
    experimentKey: string,
    defaultVariant: T
): {
    variant: T;
    payload: unknown;
    isLoading: boolean;
} {
    const [variant, setVariant] = useState<T>(defaultVariant);
    const [payload, setPayload] = useState<unknown>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if PostHog is loaded and get the feature flag
        const checkFlag = () => {
            try {
                // Try to get the feature flag value
                const flagEnabled = posthogFeatureFlag(experimentKey);

                if (flagEnabled) {
                    // Get the payload which contains the variant details
                    const flagPayload = posthogFeatureFlagPayload(experimentKey);

                    if (flagPayload && typeof flagPayload === "object" && "variant" in (flagPayload as object)) {
                        setVariant((flagPayload as { variant: T }).variant);
                    }

                    setPayload(flagPayload);
                }
            } catch (error) {
                console.warn(`A/B test ${experimentKey} failed to load:`, error);
            } finally {
                setIsLoading(false);
            }
        };

        // Delay slightly to allow PostHog to load
        const timer = setTimeout(checkFlag, 100);

        return () => clearTimeout(timer);
    }, [experimentKey]);

    return { variant, payload, isLoading };
}

/**
 * Pre-defined CTA text variants for the share page
 *
 * To use: Create a feature flag in PostHog called 'share_cta_text'
 * with payloads for each variant:
 *
 * control: { variant: "control", buttonText: "Get Started Free", demoText: "Try Demo" }
 * variant_a: { variant: "variant_a", buttonText: "Start Sharing", demoText: "See Example" }
 * variant_b: { variant: "variant_b", buttonText: "Share Your First Card", demoText: "Preview Card" }
 */
export interface ShareCTAVariant {
    variant: "control" | "variant_a" | "variant_b";
    buttonText: string;
    buttonTextLoggedIn: string;
    demoText: string;
}

export const SHARE_CTA_VARIANTS: Record<string, ShareCTAVariant> = {
    control: {
        variant: "control",
        buttonText: "Get Started Free",
        buttonTextLoggedIn: "Start Sharing",
        demoText: "Try Demo",
    },
    variant_a: {
        variant: "variant_a",
        buttonText: "Create Your First Card",
        buttonTextLoggedIn: "Share Now",
        demoText: "See Example",
    },
    variant_b: {
        variant: "variant_b",
        buttonText: "Join the Challenge",
        buttonTextLoggedIn: "Share Your Progress",
        demoText: "Preview Card",
    },
};

/**
 * Hook specifically for share CTA A/B testing
 *
 * @example
 * const { variant, isLoading } = useShareCTATest();
 * const buttonText = user ? variant.buttonTextLoggedIn : variant.buttonText;
 */
export function useShareCTATest(): {
    variant: ShareCTAVariant;
    isLoading: boolean;
} {
    const { variant, payload, isLoading } = useABTest<string>("share_cta_text", "control");

    // If PostHog returns a full payload, use it; otherwise fall back to predefined variants
    if (payload && typeof payload === "object" && "buttonText" in (payload as object)) {
        return {
            variant: payload as ShareCTAVariant,
            isLoading,
        };
    }

    return {
        variant: SHARE_CTA_VARIANTS[variant] || SHARE_CTA_VARIANTS.control,
        isLoading,
    };
}
