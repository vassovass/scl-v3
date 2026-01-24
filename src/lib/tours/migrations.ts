/**
 * Tour State Migration System
 * 
 * Handles version-based migrations for tour state, using semver:
 * - Patch (1.0.1): Typo fixes, minor wording → preserve completion
 * - Minor (1.1.0): New steps added → preserve completion
 * - Major (2.0.0): Complete rewrite → reset completion
 * 
 * Also handles localStorage schema migrations from old OnboardingProvider.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import type { TourState, TourMigration } from './types';
import { DEFAULT_TOUR_STATE, TOUR_STATE_SCHEMA_VERSION } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// LOCALSTORAGE SCHEMA MIGRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Old localStorage schema from OnboardingProvider (v1)
 */
interface OldOnboardingState {
    completedTours: string[];  // Array of tour names
    lastSeenVersion: string;
}

/**
 * Mapping from old tour names to new tour IDs
 */
const TOUR_NAME_MAPPING: Record<string, string> = {
    'new-user': 'dashboard-v1',
    'member': 'submit-steps-v1',
    'admin': 'admin-v1',
    'leaderboard': 'leaderboard-v1',
    'navigation': 'settings-v1',
};

/**
 * Migrate from old OnboardingProvider state to new TourState format
 * 
 * @param oldState - State from old localStorage format
 * @returns Migrated TourState
 */
export function migrateFromOldSchema(oldState: unknown): TourState {
    // Already in new format
    if (isNewSchemaState(oldState)) {
        return oldState as TourState;
    }

    // Try to parse as old format
    const old = oldState as OldOnboardingState | null;

    if (!old || !Array.isArray(old.completedTours)) {
        // Invalid state, return fresh state
        return { ...DEFAULT_TOUR_STATE, lastUpdated: Date.now() };
    }

    // Map old tour names to new IDs
    const completedTours: Record<string, string> = {};
    old.completedTours.forEach((oldTourName) => {
        const newId = TOUR_NAME_MAPPING[oldTourName];
        if (newId) {
            completedTours[newId] = '1.0.0'; // Assume v1 completion
        }
    });

    return {
        completedTours,
        skippedTours: {},
        tourProgress: {},
        interactionHistory: [],
        lastUpdated: Date.now(),
        schemaVersion: TOUR_STATE_SCHEMA_VERSION,
    };
}

/**
 * Check if state is in new schema format
 */
function isNewSchemaState(state: unknown): boolean {
    if (!state || typeof state !== 'object') return false;
    const s = state as Record<string, unknown>;
    return (
        typeof s.schemaVersion === 'number' &&
        s.schemaVersion >= 2 &&
        typeof s.completedTours === 'object' &&
        !Array.isArray(s.completedTours)
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOUR VERSION MIGRATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tour-specific migrations registry
 * Add migrations here when tour versions are updated
 */
const TOUR_MIGRATIONS: Record<string, TourMigration[]> = {
    // Example: Dashboard tour migrations
    'dashboard': [
        {
            from: '1.0.0',
            to: '1.1.0',
            migrate: (oldState) => {
                const completedTours = { ...oldState.completedTours };
                // Minor version: preserve completion under new ID
                if (completedTours['dashboard-v1']) {
                    completedTours['dashboard-v1.1'] = completedTours['dashboard-v1'];
                }
                return { ...oldState, completedTours };
            },
        },
        {
            from: '1.1.0',
            to: '2.0.0',
            migrate: (oldState) => {
                const completedTours = { ...oldState.completedTours };
                const skippedTours = { ...oldState.skippedTours };

                // Major version: remove completion (user should retake)
                delete completedTours['dashboard-v2'];

                // But preserve skip status if exists
                if (skippedTours['dashboard-v1']) {
                    skippedTours['dashboard-v2'] = skippedTours['dashboard-v1'];
                }

                return { ...oldState, completedTours, skippedTours };
            },
        },
    ],
};

/**
 * Apply tour version migrations
 * 
 * @param tourId - Base tour ID (without version suffix)
 * @param currentState - Current tour state
 * @param currentVersion - User's last completed version
 * @param targetVersion - Latest tour version
 * @returns Migrated state
 */
export function migrateTourVersion(
    tourId: string,
    currentState: TourState,
    currentVersion: string,
    targetVersion: string
): TourState {
    const migrations = TOUR_MIGRATIONS[tourId] || [];

    let state = currentState;
    let version = currentVersion;

    // Apply migrations in sequence
    for (const migration of migrations) {
        if (version === migration.from) {
            state = migration.migrate(state);
            version = migration.to;
        }

        if (version === targetVersion) break;
    }

    return state;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compare semver versions
 * 
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;

        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
    }

    return 0;
}

/**
 * Check if a tour version update requires migration
 */
export function needsMigration(
    completedVersion: string | undefined,
    currentVersion: string
): boolean {
    if (!completedVersion) return false;
    return compareVersions(completedVersion, currentVersion) < 0;
}

/**
 * Parse version to get major version number
 */
export function getMajorVersion(version: string): number {
    return parseInt(version.split('.')[0], 10) || 0;
}

/**
 * Check if this is a major version upgrade (requires tour reset)
 */
export function isMajorUpgrade(oldVersion: string, newVersion: string): boolean {
    return getMajorVersion(newVersion) > getMajorVersion(oldVersion);
}
