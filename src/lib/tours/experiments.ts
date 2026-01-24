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

import type { TourExperiment, TourDefinition } from './types';

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
    // TODO: Replace with actual PostHog integration when MCP is activated
    // Example:
    // const variant = posthog.getFeatureFlag(experiment.experimentId);

    // For now, return default variant
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
    // TODO: Replace with actual PostHog integration
    // Example:
    // return posthog.isFeatureEnabled(experimentId);

    // For now, always show experiments in development
    if (process.env.NODE_ENV === 'development') {
        return true;
    }

    return true;
}

/**
 * Get tour definition for the assigned variant
 * 
 * @param tour - Base tour definition
 * @returns Tour with variant-specific overrides applied
 */
export function getVariantTour(tour: TourDefinition): TourDefinition {
    if (!tour.experiment) {
        return tour;
    }

    const { variant } = getTourExperimentVariant(tour.experiment);

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
    // TODO: Replace with actual PostHog capture when MCP is activated
    // Example:
    // posthog.capture('$experiment_started', {
    //   experiment: experimentId,
    //   $feature_flag_response: variant,
    // });

    if (process.env.NODE_ENV === 'development') {
        console.log('[TourExperiments] Enrolled in experiment:', experimentId, variant);
    }
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
    // TODO: Replace with actual PostHog capture when MCP is activated
    // Example:
    // posthog.capture('tour_experiment_completed', {
    //   experiment: experimentId,
    //   variant: variant,
    // });

    if (process.env.NODE_ENV === 'development') {
        console.log('[TourExperiments] Experiment converted:', experimentId, variant);
    }
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
    // TODO: Use PostHog React hooks when MCP is activated
    // Example:
    // const variant = useFeatureFlag(experiment?.experimentId);

    if (!experiment) {
        return { variant: 'control', isLoading: false, isEligible: true };
    }

    const result = getTourExperimentVariant(experiment);

    return {
        variant: result.variant,
        isLoading: false, // Would be true while PostHog loads
        isEligible: result.isEligible,
    };
}
