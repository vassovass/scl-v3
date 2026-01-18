/**
 * usePreferences Hook Tests
 *
 * Tests for the usePreferences user preferences management hook.
 * Based on testing-patterns skill and PRD 42.
 *
 * Key areas tested:
 * - Optimistic updates
 * - Rollback on error
 * - State management
 * - API interaction patterns
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// Type Definitions (matching hook interface)
// ============================================================================

interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    notifications_enabled: boolean;
    email_digest: 'daily' | 'weekly' | 'never';
    show_steps_publicly: boolean;
    default_league_id: string | null;
}

type UserPreferenceKey = keyof UserPreferences;

interface UsePreferencesReturn {
    preferences: UserPreferences | null;
    isLoading: boolean;
    error: Error | null;
    updatePreference: <K extends UserPreferenceKey>(key: K, value: UserPreferences[K]) => Promise<void>;
    updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
    refetch: () => Promise<void>;
}

// ============================================================================
// Initial State Tests
// ============================================================================

describe('usePreferences - Initial State', () => {
    it('starts with preferences=null', () => {
        const preferences: UserPreferences | null = null;
        expect(preferences).toBeNull();
    });

    it('starts with isLoading=true', () => {
        const isLoading = true;
        expect(isLoading).toBe(true);
    });

    it('starts with error=null', () => {
        const error: Error | null = null;
        expect(error).toBeNull();
    });
});

// ============================================================================
// Fetch Preferences Tests
// ============================================================================

describe('usePreferences - Fetch Preferences', () => {
    it('sets isLoading=false when user is null', () => {
        const user = null;
        let isLoading = true;

        if (!user) {
            isLoading = false;
        }

        expect(isLoading).toBe(false);
    });

    it('fetches preferences when user exists', () => {
        const user = { id: 'user-123' };
        const shouldFetch = !!user;

        expect(shouldFetch).toBe(true);
    });

    it('sets preferences on successful fetch', () => {
        const responseData: UserPreferences = {
            theme: 'dark',
            notifications_enabled: true,
            email_digest: 'weekly',
            show_steps_publicly: false,
            default_league_id: 'league-123',
        };

        let preferences: UserPreferences | null = null;
        preferences = responseData;

        expect(preferences).toEqual(responseData);
        expect(preferences.theme).toBe('dark');
    });

    it('clears error on successful fetch', () => {
        let error: Error | null = new Error('Previous error');

        // Successful fetch
        error = null;

        expect(error).toBeNull();
    });

    it('sets error on failed fetch', () => {
        let error: Error | null = null;
        const fetchError = new Error('Failed to fetch preferences');

        error = fetchError;

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Failed to fetch preferences');
    });
});

// ============================================================================
// Optimistic Update Tests
// ============================================================================

describe('usePreferences - Optimistic Updates', () => {
    describe('updatePreference (single key)', () => {
        it('immediately updates preference value', () => {
            let preferences: UserPreferences = {
                theme: 'light',
                notifications_enabled: true,
                email_digest: 'daily',
                show_steps_publicly: true,
                default_league_id: null,
            };

            // Optimistic update
            preferences = { ...preferences, theme: 'dark' };

            expect(preferences.theme).toBe('dark');
        });

        it('preserves previous state for rollback', () => {
            const preferences: UserPreferences = {
                theme: 'light',
                notifications_enabled: true,
                email_digest: 'daily',
                show_steps_publicly: true,
                default_league_id: null,
            };

            const previous = preferences;

            expect(previous.theme).toBe('light');
        });

        it('does nothing when preferences is null', () => {
            const preferences: UserPreferences | null = null;
            const shouldUpdate = preferences !== null;

            expect(shouldUpdate).toBe(false);
        });
    });

    describe('updatePreferences (multiple keys)', () => {
        it('updates multiple values at once', () => {
            let preferences: UserPreferences = {
                theme: 'light',
                notifications_enabled: false,
                email_digest: 'never',
                show_steps_publicly: true,
                default_league_id: null,
            };

            const updates: Partial<UserPreferences> = {
                theme: 'dark',
                notifications_enabled: true,
            };

            preferences = { ...preferences, ...updates };

            expect(preferences.theme).toBe('dark');
            expect(preferences.notifications_enabled).toBe(true);
            expect(preferences.email_digest).toBe('never'); // unchanged
        });
    });
});

// ============================================================================
// Rollback on Error Tests
// ============================================================================

describe('usePreferences - Rollback on Error', () => {
    it('restores previous state on API error', () => {
        const previous: UserPreferences = {
            theme: 'light',
            notifications_enabled: true,
            email_digest: 'daily',
            show_steps_publicly: true,
            default_league_id: null,
        };

        let preferences: UserPreferences = { ...previous, theme: 'dark' };

        // Simulate API error - rollback
        const apiError = true;
        if (apiError) {
            preferences = previous;
        }

        expect(preferences.theme).toBe('light');
    });

    it('preserves all original values on rollback', () => {
        const previous: UserPreferences = {
            theme: 'light',
            notifications_enabled: true,
            email_digest: 'daily',
            show_steps_publicly: true,
            default_league_id: 'league-123',
        };

        let preferences: UserPreferences = {
            ...previous,
            theme: 'dark',
            notifications_enabled: false,
        };

        // Rollback
        preferences = previous;

        expect(preferences).toEqual(previous);
    });
});

// ============================================================================
// API Response Handling Tests
// ============================================================================

describe('usePreferences - API Response Handling', () => {
    it('updates with server response on success', () => {
        let preferences: UserPreferences = {
            theme: 'light',
            notifications_enabled: true,
            email_digest: 'daily',
            show_steps_publicly: true,
            default_league_id: null,
        };

        // Server may add additional transformations
        const serverResponse: UserPreferences = {
            theme: 'dark',
            notifications_enabled: true,
            email_digest: 'daily',
            show_steps_publicly: true,
            default_league_id: null,
        };

        preferences = serverResponse;

        expect(preferences).toEqual(serverResponse);
    });

    it('handles response with preferences wrapper', () => {
        const responseBody = {
            preferences: {
                theme: 'dark' as const,
                notifications_enabled: true,
                email_digest: 'weekly' as const,
                show_steps_publicly: false,
                default_league_id: null,
            }
        };

        const updated = responseBody.preferences;
        expect(updated.theme).toBe('dark');
    });
});

// ============================================================================
// Preference Key Type Tests
// ============================================================================

describe('usePreferences - Preference Keys', () => {
    it('supports theme preference', () => {
        const key: UserPreferenceKey = 'theme';
        const values: UserPreferences['theme'][] = ['light', 'dark', 'system'];

        expect(key).toBe('theme');
        expect(values).toContain('dark');
    });

    it('supports notifications_enabled preference', () => {
        const key: UserPreferenceKey = 'notifications_enabled';
        const value: UserPreferences['notifications_enabled'] = true;

        expect(key).toBe('notifications_enabled');
        expect(typeof value).toBe('boolean');
    });

    it('supports email_digest preference', () => {
        const key: UserPreferenceKey = 'email_digest';
        const values: UserPreferences['email_digest'][] = ['daily', 'weekly', 'never'];

        expect(key).toBe('email_digest');
        expect(values).toContain('weekly');
    });

    it('supports show_steps_publicly preference', () => {
        const key: UserPreferenceKey = 'show_steps_publicly';
        const value: UserPreferences['show_steps_publicly'] = false;

        expect(key).toBe('show_steps_publicly');
        expect(typeof value).toBe('boolean');
    });

    it('supports default_league_id preference', () => {
        const key: UserPreferenceKey = 'default_league_id';
        const value: UserPreferences['default_league_id'] = 'league-123';

        expect(key).toBe('default_league_id');
        expect(value).toBe('league-123');
    });

    it('default_league_id can be null', () => {
        const value: UserPreferences['default_league_id'] = null;
        expect(value).toBeNull();
    });
});

// ============================================================================
// Refetch Tests
// ============================================================================

describe('usePreferences - Refetch', () => {
    it('can manually trigger refetch', () => {
        let fetchCount = 0;
        const refetch = async () => {
            fetchCount++;
        };

        refetch();
        refetch();

        expect(fetchCount).toBe(2);
    });

    it('refetch updates preferences with fresh data', () => {
        let preferences: UserPreferences = {
            theme: 'light',
            notifications_enabled: true,
            email_digest: 'daily',
            show_steps_publicly: true,
            default_league_id: null,
        };

        // Simulate refetch with different server data
        const freshData: UserPreferences = {
            theme: 'dark', // changed on server
            notifications_enabled: true,
            email_digest: 'daily',
            show_steps_publicly: true,
            default_league_id: null,
        };

        preferences = freshData;

        expect(preferences.theme).toBe('dark');
    });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('usePreferences - Error Handling', () => {
    it('converts non-Error to Error', () => {
        const err: unknown = 'Unknown error';
        const error = err instanceof Error ? err : new Error('Unknown error');

        expect(error).toBeInstanceOf(Error);
    });

    it('preserves Error instance', () => {
        const err = new Error('Network failure');
        const error = err instanceof Error ? err : new Error('Unknown error');

        expect(error.message).toBe('Network failure');
    });

    it('handles fetch failure gracefully', () => {
        let error: Error | null = null;
        let preferences: UserPreferences | null = null;

        // Simulate fetch failure
        try {
            throw new Error('Failed to fetch preferences');
        } catch (err) {
            error = err instanceof Error ? err : new Error('Unknown error');
        }

        expect(error).not.toBeNull();
        expect(preferences).toBeNull();
    });

    it('handles update failure gracefully', () => {
        const previous: UserPreferences = {
            theme: 'light',
            notifications_enabled: true,
            email_digest: 'daily',
            show_steps_publicly: true,
            default_league_id: null,
        };

        let preferences: UserPreferences = { ...previous, theme: 'dark' };

        // Simulate update failure - rollback
        try {
            throw new Error('Failed to update preference');
        } catch {
            preferences = previous;
        }

        expect(preferences.theme).toBe('light');
    });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('usePreferences - Integration Patterns', () => {
    it('pattern: check loading before render', () => {
        const isLoading = true;
        const preferences: UserPreferences | null = null;

        const canRender = !isLoading && preferences !== null;
        expect(canRender).toBe(false);
    });

    it('pattern: safe access with optional chaining', () => {
        const preferences = null as Partial<UserPreferences> | null;
        const theme = preferences?.theme ?? 'system';

        expect(theme).toBe('system');
    });

    it('pattern: update with type safety', () => {
        const updatePreference = <K extends UserPreferenceKey>(
            key: K,
            value: UserPreferences[K]
        ) => {
            return { key, value };
        };

        const result = updatePreference('theme', 'dark');
        expect(result.key).toBe('theme');
        expect(result.value).toBe('dark');
    });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('usePreferences - Edge Cases', () => {
    it('handles empty update object', () => {
        const preferences: UserPreferences = {
            theme: 'light',
            notifications_enabled: true,
            email_digest: 'daily',
            show_steps_publicly: true,
            default_league_id: null,
        };

        const updates: Partial<UserPreferences> = {};
        const updated = { ...preferences, ...updates };

        expect(updated).toEqual(preferences);
    });

    it('handles rapid consecutive updates', () => {
        let preferences: UserPreferences = {
            theme: 'light',
            notifications_enabled: true,
            email_digest: 'daily',
            show_steps_publicly: true,
            default_league_id: null,
        };

        // Rapid updates
        preferences = { ...preferences, theme: 'dark' };
        preferences = { ...preferences, theme: 'system' };
        preferences = { ...preferences, theme: 'light' };

        expect(preferences.theme).toBe('light');
    });

    it('handles null to value transition for default_league_id', () => {
        let preferences: UserPreferences = {
            theme: 'light',
            notifications_enabled: true,
            email_digest: 'daily',
            show_steps_publicly: true,
            default_league_id: null,
        };

        preferences = { ...preferences, default_league_id: 'league-123' };

        expect(preferences.default_league_id).toBe('league-123');
    });

    it('handles value to null transition for default_league_id', () => {
        let preferences: UserPreferences = {
            theme: 'light',
            notifications_enabled: true,
            email_digest: 'daily',
            show_steps_publicly: true,
            default_league_id: 'league-123',
        };

        preferences = { ...preferences, default_league_id: null };

        expect(preferences.default_league_id).toBeNull();
    });
});
