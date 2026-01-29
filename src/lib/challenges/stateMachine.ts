/**
 * Challenge State Machine (PRD-54)
 *
 * Implements deterministic state transitions for challenges.
 *
 * Systems Thinking:
 * - State machine pattern ensures consistent, predictable behavior
 * - All transitions are validated before application
 * - Easy to add new states/events without breaking existing logic
 */

import type { ChallengeStatus, ChallengeEvent } from "./types";

// ============================================================================
// State Transition Map
// ============================================================================

/**
 * Valid state transitions.
 * Key: current state
 * Value: map of event → next state
 */
const STATE_TRANSITIONS: Record<ChallengeStatus, Partial<Record<ChallengeEvent, ChallengeStatus>>> = {
    pending: {
        accept: "accepted",
        decline: "declined",
        cancel: "cancelled",
        expire: "expired",
    },
    accepted: {
        complete: "completed",
        cancel: "cancelled",
    },
    declined: {
        // Terminal state - no transitions
    },
    completed: {
        // Terminal state - no transitions
    },
    cancelled: {
        // Terminal state - no transitions
    },
    expired: {
        // Terminal state - no transitions
    },
};

// ============================================================================
// State Machine Functions
// ============================================================================

/**
 * Check if a transition is valid from the current state.
 *
 * @param current - Current challenge status
 * @param event - Event to trigger
 * @returns true if transition is valid
 */
export function canTransition(current: ChallengeStatus, event: ChallengeEvent): boolean {
    const transitions = STATE_TRANSITIONS[current];
    return transitions !== undefined && event in transitions;
}

/**
 * Get the next state for a given event.
 *
 * @param current - Current challenge status
 * @param event - Event to trigger
 * @returns Next state, or null if transition is invalid
 */
export function getNextState(current: ChallengeStatus, event: ChallengeEvent): ChallengeStatus | null {
    const transitions = STATE_TRANSITIONS[current];
    if (!transitions) return null;
    return transitions[event] ?? null;
}

/**
 * Transition to the next state (throws if invalid).
 *
 * @param current - Current challenge status
 * @param event - Event to trigger
 * @returns Next state
 * @throws Error if transition is invalid
 */
export function transition(current: ChallengeStatus, event: ChallengeEvent): ChallengeStatus {
    const next = getNextState(current, event);
    if (!next) {
        throw new Error(`Invalid transition: cannot ${event} from ${current} state`);
    }
    return next;
}

/**
 * Get all valid events for a given state.
 *
 * @param current - Current challenge status
 * @returns Array of valid events
 */
export function getValidEvents(current: ChallengeStatus): ChallengeEvent[] {
    const transitions = STATE_TRANSITIONS[current];
    if (!transitions) return [];
    return Object.keys(transitions) as ChallengeEvent[];
}

/**
 * Check if a state is terminal (no outgoing transitions).
 *
 * @param status - Challenge status to check
 * @returns true if state is terminal
 */
export function isTerminalState(status: ChallengeStatus): boolean {
    const transitions = STATE_TRANSITIONS[status];
    return !transitions || Object.keys(transitions).length === 0;
}

/**
 * Check if a state is active (challenge is in progress).
 *
 * @param status - Challenge status to check
 * @returns true if challenge is active
 */
export function isActiveState(status: ChallengeStatus): boolean {
    return status === "accepted";
}

/**
 * Check if a state is pending (awaiting response).
 *
 * @param status - Challenge status to check
 * @returns true if challenge is pending
 */
export function isPendingState(status: ChallengeStatus): boolean {
    return status === "pending";
}

// ============================================================================
// Authorization Helpers
// ============================================================================

/**
 * Check if a user can perform an action on a challenge.
 *
 * @param event - Event to check
 * @param userId - User attempting the action
 * @param challengerId - Challenge creator's ID
 * @param targetId - Challenge target's ID
 * @returns true if user can perform the action
 */
export function canUserPerformEvent(
    event: ChallengeEvent,
    userId: string,
    challengerId: string,
    targetId: string
): boolean {
    switch (event) {
        case "accept":
        case "decline":
            // Only target can accept or decline
            return userId === targetId;

        case "cancel":
            // Either party can cancel
            return userId === challengerId || userId === targetId;

        case "complete":
        case "expire":
            // System-only events
            return false;

        default:
            return false;
    }
}

/**
 * Get human-readable action names for UI.
 */
export const EVENT_LABELS: Record<ChallengeEvent, string> = {
    accept: "Accept Challenge",
    decline: "Decline",
    cancel: "Cancel Challenge",
    complete: "Complete",
    expire: "Expire",
};

/**
 * Get human-readable status names for UI.
 */
export const STATUS_LABELS: Record<ChallengeStatus, string> = {
    pending: "Pending",
    accepted: "Active",
    declined: "Declined",
    completed: "Completed",
    cancelled: "Cancelled",
    expired: "Expired",
};

/**
 * Get status colors for UI (semantic variable references).
 */
export const STATUS_COLORS: Record<ChallengeStatus, { text: string; bg: string }> = {
    pending: {
        text: "text-[hsl(var(--warning))]",
        bg: "bg-[hsl(var(--warning)/0.1)]",
    },
    accepted: {
        text: "text-[hsl(var(--success))]",
        bg: "bg-[hsl(var(--success)/0.1)]",
    },
    declined: {
        text: "text-muted-foreground",
        bg: "bg-muted",
    },
    completed: {
        text: "text-primary",
        bg: "bg-primary/10",
    },
    cancelled: {
        text: "text-muted-foreground",
        bg: "bg-muted",
    },
    expired: {
        text: "text-muted-foreground",
        bg: "bg-muted",
    },
};
