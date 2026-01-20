/**
 * Filter Storage Utilities
 * 
 * Provides localStorage persistence for filter preferences.
 * Used as fallback when URL params aren't present.
 * 
 * @module lib/filters/filterStorage
 */

const STORAGE_KEY = 'stepleague:filter-prefs';

interface StoredPrefs {
    [pageKey: string]: {
        [contextId: string]: Record<string, string>;
    };
}

/**
 * Get stored filter preferences for a page/context
 */
export function getStoredFilters<T extends Record<string, string>>(
    pageKey: string,
    contextId: string = 'default'
): Partial<T> | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const prefs: StoredPrefs = JSON.parse(stored);
        return (prefs[pageKey]?.[contextId] as Partial<T>) || null;
    } catch (error) {
        console.error('Error reading filter preferences:', error);
        return null;
    }
}

/**
 * Save filter preferences for a page/context
 */
export function setStoredFilters<T extends Record<string, string>>(
    pageKey: string,
    filters: Partial<T>,
    contextId: string = 'default'
): void {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const prefs: StoredPrefs = stored ? JSON.parse(stored) : {};

        if (!prefs[pageKey]) {
            prefs[pageKey] = {};
        }

        // Only store non-empty values
        const cleanFilters: Record<string, string> = {};
        Object.entries(filters).forEach(([key, value]) => {
            if (value) cleanFilters[key] = value;
        });

        prefs[pageKey][contextId] = cleanFilters;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded for filter preferences');
        } else {
            console.error('Error saving filter preferences:', error);
        }
    }
}

/**
 * Clear stored filters for a page/context
 */
export function clearStoredFilters(
    pageKey: string,
    contextId: string = 'default'
): void {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        const prefs: StoredPrefs = JSON.parse(stored);
        if (prefs[pageKey]?.[contextId]) {
            delete prefs[pageKey][contextId];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
        }
    } catch (error) {
        console.error('Error clearing filter preferences:', error);
    }
}

