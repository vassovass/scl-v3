/**
 * Tour Hook
 * 
 * Main hook for tour functionality:
 * - startTour(tourId): Launch a specific tour
 * - startContextualTour(): Launch tour for current page
 * - skipTour(): Skip current tour
 * - hasCompletedTour(tourId): Check completion status
 * - resetAllTours(): Reset all progress (dev/admin)
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

'use client';

import { useContext } from 'react';
import { TourContext } from '@/components/tours/TourProvider';
import type { TourContextType } from '@/lib/tours/types';

/**
 * Hook for tour functionality
 * 
 * @example
 * ```tsx
 * const { startTour, isRunning, hasCompletedTour } = useTour();
 * 
 * if (!hasCompletedTour('dashboard-v1')) {
 *   startTour('dashboard-v1');
 * }
 * ```
 */
export function useTour(): TourContextType {
    const context = useContext(TourContext);

    if (!context) {
        throw new Error('useTour must be used within a TourProvider');
    }

    return context;
}

/**
 * Hook to check if a specific tour has been completed
 * 
 * @param tourId - Tour ID to check
 * @returns boolean
 */
export function useTourCompleted(tourId: string): boolean {
    const { hasCompletedTour } = useTour();
    return hasCompletedTour(tourId);
}

/**
 * Hook to get current tour state
 * 
 * @returns Object with isRunning, activeTour, and currentStep
 */
export function useTourState() {
    const { isRunning, activeTour, currentStepIndex } = useTour();

    return {
        isRunning,
        activeTour,
        currentStep: activeTour?.steps[currentStepIndex] ?? null,
        currentStepIndex,
        totalSteps: activeTour?.steps.length ?? 0,
    };
}
