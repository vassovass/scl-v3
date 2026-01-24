/**
 * A/B Testing Experiments for Tours
 * 
 * PostHog integration for tour A/B testing:
 * - Variant selection
 * - Event tracking
 * - User filtering (ineligible users)
 * 
 * Note: PostHog-specific code is stubbed - will be activated
 * when PostHog MCP becomes available.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

'use client';

import { useEffect, useState } from 'react';
import posthog from 'posthog-js';
import type { TourExperiment, TourDefinition } from './types';
import { posthogCapture } from '@/components/analytics/PostHogProvider';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ExperimentResult {
    /** Selected variant */
    variant: string;
    /** Whether user is eligible for experiment */
    isEligible: boolean;
    /** Experiment ID */
    experimentId: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPERIMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the experiment variant for a tour
 * 
 * @param experiment - Experiment configuration
 * @returns Selected variant name
 */
export function getTourExperimentVariant(
    experiment: TourExperiment
): ExperimentResult {
    if (typeof window !== 'undefined' && posthog.__loaded) {
        const flagValue = posthog.getFeatureFlag(experiment.experimentId);
        if (typeof flagValue === 'string') {
            return {
                variant: flagValue,
                isEligible: true,
                experimentId: experiment.experimentId,
            };
        }
    }

    return {
        variant: experiment.defaultVariant,
        isEligible: true,
        experimentId: experiment.experimentId,
    };
}

/**
 * Check if user should see the experiment
 * 
 * @param experimentId - PostHog experiment ID
 * @returns boolean
 */
export function shouldShowExperiment(experimentId: string): boolean {
    if (typeof window !== 'undefined' && posthog.__loaded) {
        return posthog.isFeatureEnabled(experimentId);
    }

    return process.env.NODE_ENV === 'development';
}

/**
 * Get tour definition for the assigned variant
 * 
 * @param tour - Base tour definition
 * @returns Tour with variant-specific overrides applied
 */
export function getVariantTour(tour: TourDefinition, variantOverride?: string): TourDefinition {
    if (!tour.experiment) {
        return tour;
    }

    const { variant } = variantOverride
        ? { variant: variantOverride }
        : getTourExperimentVariant(tour.experiment);

    // If no variants defined or using default, return base tour
    if (!tour.variants || !tour.variants[variant]) {
        return tour;
    }

    // Merge variant overrides into base tour
    return {
        ...tour,
        ...tour.variants[variant],
        // Steps can be replaced entirely or merged
        steps: tour.variants[variant].steps || tour.steps,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPERIMENT TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track that user was enrolled in an experiment
 * 
 * @param experimentId - Experiment ID
 * @param variant - Assigned variant
 */
export function trackExperimentEnrollment(
    experimentId: string,
    variant: string
): void {
    posthogCapture('$experiment_started', {
        experiment: experimentId,
        $feature_flag_response: variant,
    });
}

/**
 * Track experiment conversion (tour completed)
 * 
 * @param experimentId - Experiment ID
 * @param variant - Variant that converted
 */
export function trackExperimentConversion(
    experimentId: string,
    variant: string
): void {
    posthogCapture('tour_experiment_completed', {
        experiment: experimentId,
        variant,
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * React hook for tour experiments
 * 
 * Usage:
 * const { variant, isLoading } = useTourExperiment(tour.experiment);
 */
export function useTourExperiment(experiment?: TourExperiment): {
    variant: string;
    isLoading: boolean;
    isEligible: boolean;
} {
    const [variant, setVariant] = useState(experiment?.defaultVariant ?? 'control');

    useEffect(() => {
        if (!experiment) return;

        const result = getTourExperimentVariant(experiment);
        setVariant(result.variant);
    }, [experiment?.experimentId]);

    if (!experiment) {
        return { variant: 'control', isLoading: false, isEligible: true };
    }

    return {
        variant,
        isLoading: false,
        isEligible: true,
    };
}
