/**
 * Challenges Module (PRD-54)
 *
 * Friend-specific challenges for 1v1 competitions.
 *
 * Systems Thinking:
 * - Centralized exports for clean imports
 * - State machine pattern for predictable transitions
 * - Template system for quick challenge creation
 * - Reusable utilities for API and UI
 */

// Types
export type {
    ChallengeStatus,
    ChallengeEvent,
    Challenge,
    ChallengeWithUsers,
    CreateChallengeRequest,
    UpdateChallengeRequest,
    ChallengeResult,
    ChallengeFilters,
    ChallengePagination,
    ChallengeStats,
    ChallengeTemplate,
} from "./types";

// State Machine
export {
    canTransition,
    getNextState,
    transition,
    getValidEvents,
    isTerminalState,
    isActiveState,
    isPendingState,
    canUserPerformEvent,
    EVENT_LABELS,
    STATUS_LABELS,
    STATUS_COLORS,
} from "./stateMachine";

// Templates (P-1)
export {
    CHALLENGE_TEMPLATES,
    getTemplateById,
    applyTemplate,
    getTemplateOptions,
    formatTemplateDuration,
} from "./templates";

// Validation
export {
    validateCreateChallenge,
    canCreateChallengeWith,
    validateChallengeAction,
    formatValidationErrors,
    MAX_FUTURE_START_DAYS,
    MAX_CHALLENGE_DURATION_DAYS,
    MIN_CHALLENGE_DURATION_DAYS,
    MAX_MESSAGE_LENGTH,
    VALID_METRIC_TYPES,
} from "./validation";
export type { ValidationError, ValidationResult } from "./validation";

// Utilities
export {
    calculateChallengeResult,
    calculateChallengeStats,
    calculateChallengeProgress,
    isChallengeInProgress,
    hasChallengePeriodEnded,
    formatChallengePeriod,
    formatChallengeValue,
    getChallengeOutcomeEmoji,
    formatChallengeResultMessage,
    generateChallengeShareMessage,
    generateChallengeNotification,
} from "./utils";
