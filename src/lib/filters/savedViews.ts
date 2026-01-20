/**
 * Saved Views Storage Utilities
 * 
 * Handles CRUD operations for saved filter views using localStorage.
 * Follows 2024-2025 best practices:
 * - Error handling for QuotaExceededError
 * - Input validation
 * - Minimal payload (filters only)
 * - Easy migration path to database storage
 * 
 * @module lib/filters/savedViews
 */

import { FeedbackFilterState, DEFAULT_FILTER_STATE } from './feedbackFilters';

const STORAGE_KEY = 'stepleague:savedViews';

export interface SavedView {
    id: string;
    name: string;
    filters: FeedbackFilterState;
    createdAt: string;
    isPreset?: boolean; // Built-in views (can't be deleted)
}

/**
 * Get preset views (built-in, non-deletable)
 * These provide quick access to common filter combinations
 */
export function getPresetViews(): SavedView[] {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return [
        {
            id: 'preset-all-items',
            name: 'All Items',
            filters: DEFAULT_FILTER_STATE,
            createdAt: '2025-12-29',
            isPreset: true,
        },
        {
            id: 'preset-new-this-week',
            name: 'New This Week',
            filters: {
                ...DEFAULT_FILTER_STATE,
                dateFrom: weekAgo.toISOString().split('T')[0],
                dateTo: now.toISOString().split('T')[0],
            },
            createdAt: '2025-12-29',
            isPreset: true,
        },
        {
            id: 'preset-public-roadmap',
            name: 'Public Roadmap',
            filters: {
                ...DEFAULT_FILTER_STATE,
                isPublic: 'true',
            },
            createdAt: '2025-12-29',
            isPreset: true,
        },
    ];
}

/**
 * Load all saved views (presets + user-created)
 * Handles localStorage errors gracefully
 */
export function getSavedViews(): SavedView[] {
    const presets = getPresetViews();

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return presets;
        }

        const userViews: SavedView[] = JSON.parse(stored);

        // Validate structure
        if (!Array.isArray(userViews)) {
            console.warn('Invalid saved views format, resetting to presets');
            return presets;
        }

        // Return presets first, then user views
        return [...presets, ...userViews];
    } catch (error) {
        console.error('Error loading saved views:', error);
        return presets;
    }
}

/**
 * Save a new view
 * Validates input and handles storage errors
 */
export function saveView(name: string, filters: FeedbackFilterState): SavedView | null {
    // Validate input
    if (!name || name.trim().length === 0) {
        console.error('View name cannot be empty');
        return null;
    }

    if (name.trim().length > 50) {
        console.error('View name too long (max 50 characters)');
        return null;
    }

    // Sanitize name (basic XSS prevention)
    const sanitizedName = name.trim().replace(/[<>]/g, '');

    const newView: SavedView = {
        id: `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: sanitizedName,
        filters: { ...filters }, // Clone to avoid mutations
        createdAt: new Date().toISOString(),
        isPreset: false,
    };

    try {
        const currentViews = getSavedViews().filter(v => !v.isPreset);
        const updatedViews = [...currentViews, newView];

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedViews));
        return newView;
    } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            console.error('Storage quota exceeded. Try deleting some views.');
        } else {
            console.error('Error saving view:', error);
        }
        return null;
    }
}

/**
 * Delete a user-created view
 * Preset views cannot be deleted
 */
export function deleteView(id: string): boolean {
    try {
        const currentViews = getSavedViews();

        // Check if it's a preset
        const viewToDelete = currentViews.find(v => v.id === id);
        if (viewToDelete?.isPreset) {
            console.warn('Cannot delete preset views');
            return false;
        }

        // Filter out the view to delete (keep only user views)
        const updatedViews = currentViews
            .filter(v => !v.isPreset && v.id !== id);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedViews));
        return true;
    } catch (error) {
        console.error('Error deleting view:', error);
        return false;
    }
}

/**
 * Get a specific view by ID
 */
export function getViewById(id: string): SavedView | null {
    const views = getSavedViews();
    return views.find(v => v.id === id) || null;
}

/**
 * Check if a view name already exists (case-insensitive)
 */
export function viewNameExists(name: string): boolean {
    const views = getSavedViews();
    const normalizedName = name.trim().toLowerCase();
    return views.some(v => v.name.toLowerCase() === normalizedName);
}

/**
 * Clear all user-created views (keeps presets)
 * Useful for debugging or reset functionality
 */
export function clearAllUserViews(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing views:', error);
    }
}

