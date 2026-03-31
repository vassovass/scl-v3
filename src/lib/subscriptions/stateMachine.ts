/**
 * Subscription State Machine
 * Pure functions for subscription lifecycle transitions.
 * PRD 76: Subscription Management & Grandfathering
 *
 * States: trialing, active, past_due, paused, canceled, expired
 * All transitions go through this module — no direct status mutations elsewhere.
 *
 * Design:
 * - Pure functions (no side effects, no DB calls)
 * - Guard conditions validate business rules before transitions
 * - Every transition produces an event record for the audit log
 */

import type {
  SubscriptionStatus,
  LeagueSubscription,
  TransitionRequest,
  TransitionResult,
} from "./types";

// ============================================================================
// Valid Transitions Map
// ============================================================================

/**
 * Defines all valid state transitions.
 * Key = from status, Value = set of valid target statuses.
 */
const VALID_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  trialing: ["active", "canceled", "expired"],
  active: ["past_due", "paused", "canceled"],
  past_due: ["active", "canceled", "expired"],
  paused: ["active", "canceled", "expired"],
  canceled: ["active", "expired"],
  expired: [], // Terminal state — no outbound transitions (new subscription needed)
};

// ============================================================================
// Guard Conditions
// ============================================================================

type GuardFn = (sub: LeagueSubscription) => string | null;

/**
 * Guards that run before specific transitions.
 * Return null to allow, or an error message string to block.
 */
const GUARDS: Partial<Record<string, GuardFn>> = {
  // Can only reactivate a canceled subscription before period end
  "canceled->active": (sub) => {
    if (!sub.current_period_end) {
      return "Cannot reactivate: no period end date set";
    }
    const periodEnd = new Date(sub.current_period_end);
    if (periodEnd <= new Date()) {
      return "Cannot reactivate: subscription period has already ended. Create a new subscription instead.";
    }
    return null;
  },

  // Can only pause an active subscription
  "active->paused": (_sub) => {
    // No additional guard beyond the valid transition check
    return null;
  },

  // Cannot cancel an already expired subscription
  "expired->canceled": (_sub) => {
    return "Cannot cancel: subscription has already expired";
  },
};

// ============================================================================
// Core Transition Function
// ============================================================================

/**
 * Validate and execute a subscription state transition.
 * Returns a TransitionResult with the event to be logged.
 *
 * This is a PURE function — it does NOT mutate the database.
 * The caller is responsible for:
 * 1. Updating league_subscriptions.status
 * 2. Inserting the event into subscription_events
 * 3. Executing any side effects (e.g., setting canceled_at)
 */
export function transition(request: TransitionRequest): TransitionResult {
  const { subscription, to, reason, triggered_by, metadata } = request;
  const from = subscription.status;

  // 1. Check if transition is valid
  const validTargets = VALID_TRANSITIONS[from];
  if (!validTargets || !validTargets.includes(to)) {
    return {
      success: false,
      error: `Invalid transition: ${from} -> ${to}. Valid targets from '${from}': ${validTargets?.join(", ") || "none"}`,
    };
  }

  // 2. Run guard condition if one exists
  const guardKey = `${from}->${to}`;
  const guard = GUARDS[guardKey];
  if (guard) {
    const guardError = guard(subscription);
    if (guardError) {
      return {
        success: false,
        error: guardError,
      };
    }
  }

  // 3. Produce the event record
  return {
    success: true,
    event: {
      league_subscription_id: subscription.id,
      from_status: from,
      to_status: to,
      reason,
      metadata: metadata || {},
      triggered_by,
    },
  };
}

// ============================================================================
// Helper Queries
// ============================================================================

/** Check if a specific transition is allowed (without executing it) */
export function canTransition(
  from: SubscriptionStatus,
  to: SubscriptionStatus
): boolean {
  const validTargets = VALID_TRANSITIONS[from];
  return validTargets?.includes(to) ?? false;
}

/** Get all valid target states from the current status */
export function getValidTransitions(from: SubscriptionStatus): SubscriptionStatus[] {
  return VALID_TRANSITIONS[from] || [];
}

/** Check if a status is a terminal state */
export function isTerminalState(status: SubscriptionStatus): boolean {
  return VALID_TRANSITIONS[status]?.length === 0;
}

/** Check if the subscription is in an active-ish state (has access) */
export function hasAccess(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

/** Check if the subscription is in a canceled state but still has access */
export function isCanceledWithAccess(sub: LeagueSubscription): boolean {
  if (sub.status !== "canceled") return false;
  if (!sub.current_period_end) return false;
  return new Date(sub.current_period_end) > new Date();
}
