/**
 * Unified Tour Analytics Facade
 * 
 * Single interface for tracking tour events across all analytics systems:
 * - GTM/GA4 (for Google Analytics)
 * - Supabase (for persistence/SQL queries)
 * - PostHog (feature flags, funnels, session replay)
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
import { posthogCapture } from '@/components/analytics/PostHogProvider';

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

        // PostHog
        posthogCapture('tour_started', {
            tour_id: data.tourId,
            tour_version: data.tourVersion,
            tour_category: data.tourCategory,
            total_steps: data.totalSteps,
            experiment_variant: data.variant,
            user_id: data.userId || this.userId,
        });

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

        // PostHog
        posthogCapture('tour_step_viewed', {
            tour_id: data.tourId,
            step_id: data.stepId,
            step_index: data.stepIndex,
            total_steps: data.totalSteps,
            user_id: this.userId,
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

        // PostHog
        posthogCapture('tour_step_completed', {
            tour_id: data.tourId,
            step_id: data.stepId,
            step_index: data.stepIndex,
            duration_ms: data.durationMs,
            user_id: data.userId || this.userId,
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

        // PostHog
        posthogCapture('tour_completed', {
            tour_id: data.tourId,
            tour_version: data.tourVersion,
            completion_type: data.completionType,
            steps_completed: data.stepsCompleted,
            total_steps: data.totalSteps,
            duration_ms: data.durationMs,
            experiment_variant: data.variant,
            user_id: data.userId || this.userId,
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
        reason?: 'navigation' | 'close' | 'timeout' | 'error';
    }): void {
        // GTM/GA4
        tourGTM.tourDropOff(data);

        // PostHog
        posthogCapture('tour_drop_off', {
            tour_id: data.tourId,
            step_id: data.stepId,
            step_index: data.stepIndex,
            total_steps: data.totalSteps,
            duration_ms: data.durationMs,
            drop_off_reason: data.reason,
            user_id: this.userId,
        });

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

        const eventName =
            data.result === 'success' ? 'tour_validation_success' : 'tour_validation_failure';
        posthogCapture(eventName, {
            tour_id: data.tourId,
            step_id: data.stepId,
            validation_result: data.result,
            user_id: data.userId || this.userId,
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

        // PostHog
        posthogCapture('tour_feedback_submitted', {
            tour_id: data.tourId,
            rating: data.rating,
            has_comment: !!data.comment,
            comment_length: data.comment?.length ?? 0,
            user_id: data.userId || this.userId,
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
        // GTM/GA4
        tourGTM.menuInteraction(data);

        // PostHog
        posthogCapture('tour_menu_interaction', {
            tour_id: data.tourId,
            menu_item: data.menuItem,
            step_index: data.stepIndex,
            user_id: this.userId,
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const tourAnalytics = new UnifiedTourAnalytics();
