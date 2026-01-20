"use client";

import { useState, useCallback } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";

export interface ExistingSubmission {
    id: string;
    for_date: string;
    steps: number;
    verified: boolean | null;
    proof_path: string | null;
    created_at: string;
}

export interface ConflictInfo {
    date: string;
    existing: ExistingSubmission;
    source: "screenshot" | "manual";
}

interface CheckConflictResponse {
    has_conflicts: boolean;
    conflicts: ConflictInfo[];
    conflict_dates: string[];
}

interface ResolutionResult {
    date: string;
    action: string;
    success: boolean;
    message?: string;
    submission_id?: string;
}

interface ResolveResponse {
    resolved: number;
    total: number;
    results: ResolutionResult[];
}

export interface ConflictResolution {
    date: string;
    action: "keep_existing" | "use_incoming" | "skip";
    incoming_data?: {
        steps: number;
        proof_path: string | null;
    };
}

/**
 * Hook for checking and resolving submission conflicts.
 * Provides a modular, reusable interface for conflict detection.
 */
export function useConflictCheck() {
    const [isChecking, setIsChecking] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
    const [error, setError] = useState<string | null>(null);

    /**
     * Check if submissions already exist for the given dates.
     */
    const checkConflicts = useCallback(async (
        dates: string[],
        leagueId?: string | null
    ): Promise<ConflictInfo[]> => {
        if (dates.length === 0) return [];

        setIsChecking(true);
        setError(null);

        try {
            const response = await apiRequest<CheckConflictResponse>(
                "/api/submissions/check-conflict",
                {
                    method: "POST",
                    body: JSON.stringify({
                        dates,
                        league_id: leagueId || null,
                    }),
                }
            );

            setConflicts(response.conflicts);
            return response.conflicts;
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to check conflicts";
            setError(message);
            console.error("[useConflictCheck] Check failed:", err);
            return [];
        } finally {
            setIsChecking(false);
        }
    }, []);

    /**
     * Resolve conflicts with user's decisions.
     */
    const resolveConflicts = useCallback(async (
        resolutions: ConflictResolution[],
        leagueId?: string | null
    ): Promise<ResolveResponse | null> => {
        if (resolutions.length === 0) return null;

        setIsResolving(true);
        setError(null);

        try {
            const response = await apiRequest<ResolveResponse>(
                "/api/submissions/resolve",
                {
                    method: "POST",
                    body: JSON.stringify({
                        resolutions,
                        league_id: leagueId || null,
                    }),
                }
            );

            // Clear conflicts after resolution
            setConflicts([]);
            return response;
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to resolve conflicts";
            setError(message);
            console.error("[useConflictCheck] Resolve failed:", err);
            return null;
        } finally {
            setIsResolving(false);
        }
    }, []);

    /**
     * Clear state (useful when user cancels or form resets).
     */
    const clearConflicts = useCallback(() => {
        setConflicts([]);
        setError(null);
    }, []);

    return {
        // State
        isChecking,
        isResolving,
        conflicts,
        hasConflicts: conflicts.length > 0,
        error,

        // Actions
        checkConflicts,
        resolveConflicts,
        clearConflicts,
    };
}

/**
 * Get smart default action for a conflict based on verification status.
 */
export function getSmartDefault(
    existing: { verified: boolean | null; proof_path: string | null },
    incoming: { proof_path: string | null }
): "keep_existing" | "use_incoming" {
    const existingHasProof = !!existing.proof_path;
    const existingVerified = existing.verified === true;
    const incomingHasProof = !!incoming.proof_path;

    // Incoming has screenshot but existing doesn't → use incoming
    if (incomingHasProof && !existingHasProof) {
        return "use_incoming";
    }

    // Existing is verified → keep existing
    if (existingVerified) {
        return "keep_existing";
    }

    // Default to keeping existing
    return "keep_existing";
}

/**
 * Get recommendation message for a conflict.
 */
export function getRecommendationMessage(
    existing: { verified: boolean | null; proof_path: string | null },
    incoming: { proof_path: string | null }
): string {
    const existingHasProof = !!existing.proof_path;
    const existingVerified = existing.verified === true;
    const incomingHasProof = !!incoming.proof_path;

    if (existingVerified && existingHasProof) {
        if (!incomingHasProof) {
            return "The existing submission has a verified screenshot and is likely more accurate.";
        }
        return "Both have screenshots. The existing entry is already verified.";
    }

    if (incomingHasProof && !existingHasProof) {
        return "The new submission has a screenshot which is likely more accurate than the manual entry.";
    }

    if (existingHasProof) {
        return "The existing submission has a screenshot (pending verification).";
    }

    return "Consider submitting a screenshot for better accuracy.";
}

