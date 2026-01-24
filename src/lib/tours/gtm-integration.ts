/**
 * Google Tag Manager Integration for Tours
 * 
 * Pushes tour events to dataLayer for GA4 custom events.
 * Works alongside the existing analytics.ts pattern.
 * 
 * @see PRD 50: Modular Tour System v2.0
 * @see src/lib/analytics.ts for main analytics hub
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TourEventData {
    tour_id: string;
    tour_version?: string;
    tour_category?: string;
    step_id?: string;
    step_index?: number;
    total_steps?: number;
    experiment_variant?: string;
    completion_type?: 'completed' | 'skipped';
    duration_ms?: number;
    validation_result?: 'success' | 'timeout' | 'cancelled';
}

// ═══════════════════════════════════════════════════════════════════════════
// GTM DATALAYER EVENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Push tour event to GTM dataLayer
 */
function pushToDataLayer(eventName: string, data: TourEventData): void {
    if (typeof window === 'undefined') return;

    // Ensure dataLayer exists
    window.dataLayer = window.dataLayer || [];

    const event = {
        event: eventName,
        event_timestamp: new Date().toISOString(),
        ...data,
    };

    window.dataLayer.push(event);

    // Debug in development
    if (process.env.NODE_ENV === 'development') {
        console.log('[TourGTM] Event pushed:', eventName, data);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// TOUR EVENT TRACKING
// ═══════════════════════════════════════════════════════════════════════════

export const tourGTM = {
    /**
     * Tour started
     */
    tourStarted: (data: {
        tourId: string;
        tourVersion: string;
        tourCategory: string;
        totalSteps: number;
        variant?: string;
    }) => {
        pushToDataLayer('tour_started', {
            tour_id: data.tourId,
            tour_version: data.tourVersion,
            tour_category: data.tourCategory,
            total_steps: data.totalSteps,
            experiment_variant: data.variant,
        });
    },

    /**
     * Tour step viewed
     */
    stepViewed: (data: {
        tourId: string;
        stepId: string;
        stepIndex: number;
        totalSteps: number;
    }) => {
        pushToDataLayer('tour_step_viewed', {
            tour_id: data.tourId,
            step_id: data.stepId,
            step_index: data.stepIndex,
            total_steps: data.totalSteps,
        });
    },

    /**
     * Tour step completed (user clicked Next/Prev)
     */
    stepCompleted: (data: {
        tourId: string;
        stepId: string;
        stepIndex: number;
        durationMs: number;
    }) => {
        pushToDataLayer('tour_step_completed', {
            tour_id: data.tourId,
            step_id: data.stepId,
            step_index: data.stepIndex,
            duration_ms: data.durationMs,
        });
    },

    /**
     * Tour completed or skipped
     */
    tourCompleted: (data: {
        tourId: string;
        tourVersion: string;
        completionType: 'completed' | 'skipped';
        stepsCompleted: number;
        totalSteps: number;
        durationMs: number;
        variant?: string;
    }) => {
        pushToDataLayer('tour_completed', {
            tour_id: data.tourId,
            tour_version: data.tourVersion,
            completion_type: data.completionType,
            step_index: data.stepsCompleted,
            total_steps: data.totalSteps,
            duration_ms: data.durationMs,
            experiment_variant: data.variant,
        });
    },

    /**
     * Tour drop-off (user closed without completing)
     */
    tourDropOff: (data: {
        tourId: string;
        stepId: string;
        stepIndex: number;
        totalSteps: number;
        durationMs: number;
    }) => {
        pushToDataLayer('tour_drop_off', {
            tour_id: data.tourId,
            step_id: data.stepId,
            step_index: data.stepIndex,
            total_steps: data.totalSteps,
            duration_ms: data.durationMs,
        });
    },

    /**
     * Interactive validation result
     */
    validationResult: (data: {
        tourId: string;
        stepId: string;
        result: 'success' | 'timeout' | 'cancelled';
    }) => {
        pushToDataLayer('tour_validation_result', {
            tour_id: data.tourId,
            step_id: data.stepId,
            validation_result: data.result,
        });
    },

    /**
     * Tour feedback submitted
     */
    feedbackSubmitted: (data: {
        tourId: string;
        rating?: number;
        hasComment: boolean;
    }) => {
        pushToDataLayer('tour_feedback_submitted', {
            tour_id: data.tourId,
            step_index: data.rating, // Reusing step_index for rating
            total_steps: data.hasComment ? 1 : 0, // Hack to indicate comment presence
        });
    },

    /**
     * Menu interaction during active tour
     */
    menuInteraction: (data: {
        tourId: string;
        menuItem: string;
        stepIndex: number;
    }) => {
        pushToDataLayer('tour_menu_interaction', {
            tour_id: data.tourId,
            step_id: data.menuItem,
            step_index: data.stepIndex,
        });
    },
};
