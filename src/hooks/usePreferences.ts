/**
 * usePreferences Hook
 * Manages user preferences with optimistic updates and caching
 *
 * Features:
 * - Automatic fetching on mount
 * - Optimistic UI updates
 * - Error handling with toast notifications
 * - Type-safe preference keys
 */

import { useState, useEffect, useCallback } from "react";
import { UserPreferences } from "@/types/database";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { UserPreferenceKey } from "@/lib/settings/types";

interface UsePreferencesReturn {
    preferences: UserPreferences | null;
    isLoading: boolean;
    error: Error | null;
    updatePreference: <K extends UserPreferenceKey>(
        key: K,
        value: UserPreferences[K]
    ) => Promise<void>;
    updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
    refetch: () => Promise<void>;
}

/**
 * Hook for managing user preferences
 * Provides optimistic updates and automatic error handling
 */
export function usePreferences(): UsePreferencesReturn {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Fetch preferences
    const fetchPreferences = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch("/api/user/preferences");

            if (!res.ok) {
                throw new Error("Failed to fetch preferences");
            }

            const data = await res.json();
            setPreferences(data);
            setError(null);
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Unknown error");
            setError(error);
            toast({
                title: "Error",
                description: "Failed to load preferences",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Initial fetch
    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    // Update single preference
    const updatePreference = useCallback(
        async <K extends UserPreferenceKey>(
            key: K,
            value: UserPreferences[K]
        ) => {
            if (!preferences) return;

            // Optimistic update
            const previous = preferences;
            setPreferences({ ...preferences, [key]: value });

            try {
                const res = await fetch("/api/user/preferences", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ [key]: value }),
                });

                if (!res.ok) {
                    throw new Error("Failed to update preference");
                }

                const { preferences: updated } = await res.json();
                setPreferences(updated);

                toast({
                    title: "Saved",
                    description: "Preference updated successfully",
                });
            } catch (err) {
                // Rollback on error
                setPreferences(previous);
                toast({
                    title: "Error",
                    description: "Failed to save preference",
                    variant: "destructive",
                });
            }
        },
        [preferences]
    );

    // Update multiple preferences at once
    const updatePreferences = useCallback(
        async (updates: Partial<UserPreferences>) => {
            if (!preferences) return;

            // Optimistic update
            const previous = preferences;
            setPreferences({ ...preferences, ...updates });

            try {
                const res = await fetch("/api/user/preferences", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updates),
                });

                if (!res.ok) {
                    throw new Error("Failed to update preferences");
                }

                const { preferences: updated } = await res.json();
                setPreferences(updated);

                toast({
                    title: "Saved",
                    description: "Preferences updated successfully",
                });
            } catch (err) {
                // Rollback on error
                setPreferences(previous);
                toast({
                    title: "Error",
                    description: "Failed to save preferences",
                    variant: "destructive",
                });
            }
        },
        [preferences]
    );

    return {
        preferences,
        isLoading,
        error,
        updatePreference,
        updatePreferences,
        refetch: fetchPreferences,
    };
}

