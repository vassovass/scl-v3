/**
 * Challenge Types (PRD-54)
 *
 * Type definitions for the challenge system.
 *
 * Systems Thinking:
 * - Clear state definitions enable predictable state machine transitions
 * - Separation of concerns: types, state machine, utilities
 * - Extensible for future metric types
 */

import type { MetricType } from "@/lib/sharing/metricConfig";

// ============================================================================
// Challenge States
// ============================================================================

/**
 * Challenge lifecycle states.
 *
 * State flow:
 *   pending → accepted → completed
 *           → declined
 *           → expired
 *   pending → cancelled (by challenger)
 *   accepted → cancelled (mutual)
 */
export type ChallengeStatus =
    | "pending"    // Awaiting target's response
    | "accepted"   // In progress
    | "declined"   // Target rejected
    | "completed"  // Period ended, winner determined
    | "cancelled"  // Cancelled by either party
    | "expired";   // Target didn't respond in time

/**
 * Events that can trigger state transitions.
 */
export type ChallengeEvent =
    | "accept"
    | "decline"
    | "cancel"
    | "complete"
    | "expire";

// ============================================================================
// Challenge Data Types
// ============================================================================

/**
 * Core challenge data structure (matches DB schema).
 */
export interface Challenge {
    id: string;
    challenger_id: string;
    target_id: string;
    metric_type: MetricType;
    period_start: string;  // YYYY-MM-DD
    period_end: string;    // YYYY-MM-DD
    challenger_value: number;
    target_value: number;
    winner_id: string | null;
    status: ChallengeStatus;
    message: string | null;
    template_id: string | null;
    created_at: string;
    accepted_at: string | null;
    declined_at: string | null;
    cancelled_at: string | null;
    resolved_at: string | null;
}

/**
 * Challenge with denormalized user data for display.
 */
export interface ChallengeWithUsers extends Challenge {
    challenger: {
        id: string;
        display_name: string;
        avatar_url?: string | null;
    };
    target: {
        id: string;
        display_name: string;
        avatar_url?: string | null;
    };
    winner?: {
        id: string;
        display_name: string;
    } | null;
}

/**
 * Challenge creation request.
 */
export interface CreateChallengeRequest {
    target_id: string;
    metric_type?: MetricType;
    period_start: string;  // YYYY-MM-DD
    period_end: string;    // YYYY-MM-DD
    message?: string;
    template_id?: string;
}

/**
 * Challenge update request (for status changes).
 */
export interface UpdateChallengeRequest {
    action: "accept" | "decline" | "cancel";
}

/**
 * Challenge result data.
 */
export interface ChallengeResult {
    challenger_total: number;
    target_total: number;
    winner_id: string | null;
    is_tie: boolean;
    margin: number;  // Absolute difference
    margin_pct: number;  // Percentage difference from loser's perspective
}

// ============================================================================
// Challenge Filters
// ============================================================================

/**
 * Filter options for listing challenges.
 */
export interface ChallengeFilters {
    status?: ChallengeStatus | ChallengeStatus[];
    role?: "challenger" | "target" | "any";
    opponent_id?: string;
    template_id?: string;
    period_start_after?: string;
    period_end_before?: string;
}

/**
 * Pagination options.
 */
export interface ChallengePagination {
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "period_start" | "period_end" | "resolved_at";
    sort_order?: "asc" | "desc";
}

// ============================================================================
// Challenge Statistics
// ============================================================================

/**
 * User's challenge statistics for leaderboard widget.
 */
export interface ChallengeStats {
    total_challenges: number;
    wins: number;
    losses: number;
    ties: number;
    pending_received: number;
    pending_sent: number;
    active: number;
    win_rate: number;  // 0-100
    current_win_streak: number;
    best_win_streak: number;
}

// ============================================================================
// Challenge Templates (P-1)
// ============================================================================

/**
 * Pre-built challenge template configuration.
 */
export interface ChallengeTemplate {
    id: string;
    name: string;
    description: string;
    emoji: string;
    duration_days: number;
    /** Function to calculate period_start based on when challenge is created */
    getPeriodStart: () => string;
    /** Function to calculate period_end based on period_start */
    getPeriodEnd: (periodStart: string) => string;
    /** Optional preset metric type */
    metric_type?: MetricType;
}
