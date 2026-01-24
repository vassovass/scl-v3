/**
 * Unified Tour Analytics Facade
 * 
 * Single interface for tracking tour events across all analytics systems:
 * - GTM/GA4 (for Google Analytics)
 * - Supabase (for persistence/SQL queries)
 * - PostHog (deferred - will be added when MCP is activated)
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import { tourGTM } from './gtm-integration';
import {
    saveTourCompletion,
    saveStepInteraction,
    saveTourFeedback
} from './supabase-sync';
import { dispatchValidationEvent } from './validation';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TourStartData {
    tourId: string;
    tourVersion: string;
    tourCategory: string;
    totalSteps: number;
    variant?: string;
    userId?: string;
}

interface StepViewData {
    tourId: string;
    stepId: string;
    stepIndex: number;
    totalSteps: number;
}

interface StepCompleteData {
    tourId: string;
    stepId: string;
    stepIndex: number;
    durationMs: number;
    userId?: string;
}

interface TourCompleteData {
    tourId: string;
    tourVersion: string;
    completionType: 'completed' | 'skipped';
    stepsCompleted: number;
    totalSteps: number;
    durationMs: number;
    variant?: string;
    userId?: string;
}

interface ValidationData {
    tourId: string;
    stepId: string;
    result: 'success' | 'timeout' | 'cancelled';
    userId?: string;
}

interface FeedbackData {
    tourId: string;
    rating?: number;
    comment?: string;
    userId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED ANALYTICS CLASS
// ═══════════════════════════════════════════════════════════════════════════

class UnifiedTourAnalytics {
    private userId: string | null = null;

    /**
     * Set the current user ID for Supabase persistence
     */
    setUserId(userId: string | null): void {
        this.userId = userId;
    }

    /**
     * Track tour start
     */
    trackTourStart(data: TourStartData): void {
        // GTM/GA4
        tourGTM.tourStarted({
            tourId: data.tourId,
            tourVersion: data.tourVersion,
            tourCategory: data.tourCategory,
            totalSteps: data.totalSteps,
            variant: data.variant,
        });

        // Note: Supabase doesn't track starts, only completions
        // PostHog: TODO when MCP is activated

        if (process.env.NODE_ENV === 'development') {
            console.log('[TourAnalytics] Tour started:', data.tourId);
        }
    }

    /**
     * Track step viewed
     */
    trackStepViewed(data: StepViewData): void {
        // GTM/GA4
        tourGTM.stepViewed({
            tourId: data.tourId,
            stepId: data.stepId,
            stepIndex: data.stepIndex,
            totalSteps: data.totalSteps,
        });

        // Supabase
        if (this.userId) {
            saveStepInteraction({
                user_id: this.userId,
                tour_id: data.tourId,
                step_id: data.stepId,
                step_index: data.stepIndex,
                action: 'viewed',
            });
        }
    }

    /**
     * Track step completed
     */
    trackStepCompleted(data: StepCompleteData): void {
        // GTM/GA4
        tourGTM.stepCompleted({
            tourId: data.tourId,
            stepId: data.stepId,
            stepIndex: data.stepIndex,
            durationMs: data.durationMs,
        });

        // Supabase
        const userId = data.userId || this.userId;
        if (userId) {
            saveStepInteraction({
                user_id: userId,
                tour_id: data.tourId,
                step_id: data.stepId,
                step_index: data.stepIndex,
                action: 'completed',
                duration_ms: data.durationMs,
            });
        }

        // Dispatch validation event for interactive steps
        dispatchValidationEvent(`step_completed_${data.stepId}`);
    }

    /**
     * Track tour completion or skip
     */
    trackTourComplete(data: TourCompleteData): void {
        // GTM/GA4
        tourGTM.tourCompleted({
            tourId: data.tourId,
            tourVersion: data.tourVersion,
            completionType: data.completionType,
            stepsCompleted: data.stepsCompleted,
            totalSteps: data.totalSteps,
            durationMs: data.durationMs,
            variant: data.variant,
        });

        // Supabase
        const userId = data.userId || this.userId;
        if (userId) {
            saveTourCompletion({
                user_id: userId,
                tour_id: data.tourId,
                tour_version: data.tourVersion,
                completion_type: data.completionType,
                steps_completed: data.stepsCompleted,
                total_steps: data.totalSteps,
                duration_ms: data.durationMs,
                experiment_variant: data.variant,
            });
        }
    }

    /**
     * Track tour drop-off (close without completing)
     */
    trackTourDropOff(data: {
        tourId: string;
        stepId: string;
        stepIndex: number;
        totalSteps: number;
        durationMs: number;
    }): void {
        // GTM/GA4
        tourGTM.tourDropOff(data);

        // Note: Drop-offs are tracked implicitly in Supabase
        // (no completion record = drop-off)
    }

    /**
     * Track interactive validation result
     */
    trackValidationResult(data: ValidationData): void {
        // GTM/GA4
        tourGTM.validationResult({
            tourId: data.tourId,
            stepId: data.stepId,
            result: data.result,
        });

        // Supabase
        const userId = data.userId || this.userId;
        if (userId) {
            saveStepInteraction({
                user_id: userId,
                tour_id: data.tourId,
                step_id: data.stepId,
                step_index: 0, // We don't have index here
                action: 'completed',
                validation_result: data.result,
            });
        }
    }

    /**
     * Track feedback submission
     */
    trackFeedbackSubmitted(data: FeedbackData): void {
        // GTM/GA4
        tourGTM.feedbackSubmitted({
            tourId: data.tourId,
            rating: data.rating,
            hasComment: !!data.comment,
        });

        // Supabase
        const userId = data.userId || this.userId;
        if (userId) {
            saveTourFeedback({
                user_id: userId,
                tour_id: data.tourId,
                rating: data.rating,
                comment: data.comment,
            });
        }
    }

    /**
     * Track menu interaction during tour
     */
    trackMenuInteraction(data: {
        tourId: string;
        menuItem: string;
        stepIndex: number;
    }): void {
        // GTM/GA4 only - not persisted to Supabase
        tourGTM.menuInteraction(data);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const tourAnalytics = new UnifiedTourAnalytics();
