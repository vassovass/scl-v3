/**
 * Tour Registry
 * 
 * Central registry of all tour definitions. This file imports
 * individual tour definitions and exports them for use.
 * 
 * Helper functions:
 * - getTour(id): Get a tour by its ID
 * - getToursByCategory(): Filter tours by category
 * - getToursForPath(): Get applicable tours for a route
 * - getAllTours(): Get all registered tours
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import type { TourDefinition, TourCategory } from './types';

// Import tour definitions
// Note: These will be created in the next phase
import { dashboardTour } from './definitions/dashboard.tour';
import { leagueTour } from './definitions/league.tour';
import { submitTour } from './definitions/submit.tour';
import { leaderboardTour } from './definitions/leaderboard.tour';
import { analyticsTour } from './definitions/analytics.tour';
import { settingsTour } from './definitions/settings.tour';
import { adminTour } from './definitions/admin.tour';

// ═══════════════════════════════════════════════════════════════════════════
// TOUR REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Central registry of all tour definitions
 * Keyed by tour ID for O(1) lookup
 */
export const TOUR_REGISTRY: Record<string, TourDefinition> = {
    [dashboardTour.id]: dashboardTour,
    [leagueTour.id]: leagueTour,
    [submitTour.id]: submitTour,
    [leaderboardTour.id]: leaderboardTour,
    [analyticsTour.id]: analyticsTour,
    [settingsTour.id]: settingsTour,
    [adminTour.id]: adminTour,
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get a tour by its ID
 * 
 * @param tourId - Tour ID (e.g., 'dashboard-v1')
 * @returns Tour definition or undefined
 */
export function getTour(tourId: string): TourDefinition | undefined {
    return TOUR_REGISTRY[tourId];
}

/**
 * Get all tours in a specific category
 * 
 * @param category - Tour category
 * @returns Array of tour definitions
 */
export function getToursByCategory(category: TourCategory): TourDefinition[] {
    return Object.values(TOUR_REGISTRY).filter(
        (tour) => tour.category === category
    );
}

/**
 * Get tours applicable to a specific path
 * 
 * @param pathname - Current route pathname
 * @returns Array of applicable tour definitions
 */
export function getToursForPath(pathname: string): TourDefinition[] {
    return Object.values(TOUR_REGISTRY).filter((tour) => {
        if (!tour.requiredPath) return false;

        if (tour.requiredPath instanceof RegExp) {
            return tour.requiredPath.test(pathname);
        }

        return pathname === tour.requiredPath;
    });
}

/**
 * Get tours with auto-start conditions
 * 
 * @returns Array of tours that can auto-start
 */
export function getAutoStartTours(): TourDefinition[] {
    return Object.values(TOUR_REGISTRY).filter(
        (tour) => tour.autoStart && Object.keys(tour.autoStart).length > 0
    );
}

/**
 * Get all registered tours
 * 
 * @returns Array of all tour definitions
 */
export function getAllTours(): TourDefinition[] {
    return Object.values(TOUR_REGISTRY);
}

/**
 * Check if a tour exists
 * 
 * @param tourId - Tour ID to check
 * @returns boolean
 */
export function hasTour(tourId: string): boolean {
    return tourId in TOUR_REGISTRY;
}

/**
 * Get tour IDs for the Help menu
 * 
 * @returns Array of tour IDs that should appear in Help menu
 */
export function getHelpMenuTours(): TourDefinition[] {
    // Filter out admin tours and return public tours
    return Object.values(TOUR_REGISTRY).filter(
        (tour) => tour.category !== 'admin'
    );
}

/**
 * Get tour by hash (for URL-based tour launching)
 * 
 * @param hash - URL hash (e.g., '#tour-dashboard-v1')
 * @returns Tour definition or undefined
 */
export function getTourByHash(hash: string): TourDefinition | undefined {
    // Remove leading # and 'tour-' prefix
    const tourId = hash.replace(/^#?tour-/, '');
    return getTour(tourId);
}
