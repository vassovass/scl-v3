/**
 * Challenge Validation (PRD-54)
 *
 * Validation utilities for challenge creation and updates.
 *
 * Systems Thinking:
 * - Centralized validation ensures consistent rules across API routes
 * - Returns structured errors for better client-side handling
 * - Validates business logic, not just schema
 */

import type { CreateChallengeRequest, ChallengeStatus } from "./types";
import type { MetricType } from "@/lib/sharing/metricConfig";
import { METRIC_CONFIGS } from "@/lib/sharing/metricConfig";
import { getTemplateById } from "./templates";

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum days in the future a challenge can start */
export const MAX_FUTURE_START_DAYS = 90;

/** Maximum challenge duration in days */
export const MAX_CHALLENGE_DURATION_DAYS = 90;

/** Minimum challenge duration in days */
export const MIN_CHALLENGE_DURATION_DAYS = 1;

/** Maximum message length */
export const MAX_MESSAGE_LENGTH = 500;

/** Valid metric types for challenges */
export const VALID_METRIC_TYPES = Object.keys(METRIC_CONFIGS) as MetricType[];

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a challenge creation request.
 */
export function validateCreateChallenge(
    data: CreateChallengeRequest,
    challengerId: string
): ValidationResult {
    const errors: ValidationError[] = [];

    // Target ID validation
    if (!data.target_id) {
        errors.push({
            field: "target_id",
            message: "Target user is required",
            code: "REQUIRED",
        });
    } else if (data.target_id === challengerId) {
        errors.push({
            field: "target_id",
            message: "You cannot challenge yourself",
            code: "SELF_CHALLENGE",
        });
    }

    // Period validation
    if (!data.period_start) {
        errors.push({
            field: "period_start",
            message: "Start date is required",
            code: "REQUIRED",
        });
    }

    if (!data.period_end) {
        errors.push({
            field: "period_end",
            message: "End date is required",
            code: "REQUIRED",
        });
    }

    if (data.period_start && data.period_end) {
        const start = new Date(data.period_start + "T00:00:00");
        const end = new Date(data.period_end + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Start date must not be too far in the future
        const maxFutureDate = new Date(today);
        maxFutureDate.setDate(maxFutureDate.getDate() + MAX_FUTURE_START_DAYS);
        if (start > maxFutureDate) {
            errors.push({
                field: "period_start",
                message: `Start date cannot be more than ${MAX_FUTURE_START_DAYS} days in the future`,
                code: "TOO_FAR_FUTURE",
            });
        }

        // End date must be on or after start date
        if (end < start) {
            errors.push({
                field: "period_end",
                message: "End date must be on or after start date",
                code: "INVALID_RANGE",
            });
        }

        // Check duration
        const durationMs = end.getTime() - start.getTime();
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24)) + 1;

        if (durationDays > MAX_CHALLENGE_DURATION_DAYS) {
            errors.push({
                field: "period_end",
                message: `Challenge cannot be longer than ${MAX_CHALLENGE_DURATION_DAYS} days`,
                code: "TOO_LONG",
            });
        }
    }

    // Metric type validation
    if (data.metric_type && !VALID_METRIC_TYPES.includes(data.metric_type)) {
        errors.push({
            field: "metric_type",
            message: `Invalid metric type. Must be one of: ${VALID_METRIC_TYPES.join(", ")}`,
            code: "INVALID_METRIC",
        });
    }

    // Message validation
    if (data.message && data.message.length > MAX_MESSAGE_LENGTH) {
        errors.push({
            field: "message",
            message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`,
            code: "TOO_LONG",
        });
    }

    // Template validation
    if (data.template_id && !getTemplateById(data.template_id)) {
        errors.push({
            field: "template_id",
            message: "Invalid challenge template",
            code: "INVALID_TEMPLATE",
        });
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Check if a user can create a challenge with another user.
 * Checks for existing active challenges between them.
 */
export function canCreateChallengeWith(
    existingChallengeStatus: ChallengeStatus | null
): ValidationResult {
    const errors: ValidationError[] = [];

    if (existingChallengeStatus === "pending") {
        errors.push({
            field: "target_id",
            message: "You already have a pending challenge with this user",
            code: "DUPLICATE_PENDING",
        });
    }

    if (existingChallengeStatus === "accepted") {
        errors.push({
            field: "target_id",
            message: "You already have an active challenge with this user",
            code: "DUPLICATE_ACTIVE",
        });
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate challenge action (accept/decline/cancel).
 */
export function validateChallengeAction(
    action: string,
    currentStatus: ChallengeStatus,
    userId: string,
    challengerId: string,
    targetId: string
): ValidationResult {
    const errors: ValidationError[] = [];

    // Action must be valid
    if (!["accept", "decline", "cancel"].includes(action)) {
        errors.push({
            field: "action",
            message: "Invalid action",
            code: "INVALID_ACTION",
        });
        return { valid: false, errors };
    }

    // User must be involved in the challenge
    const isChallenger = userId === challengerId;
    const isTarget = userId === targetId;

    if (!isChallenger && !isTarget) {
        errors.push({
            field: "user",
            message: "You are not part of this challenge",
            code: "NOT_AUTHORIZED",
        });
        return { valid: false, errors };
    }

    // Check state-specific rules
    switch (action) {
        case "accept":
        case "decline":
            if (!isTarget) {
                errors.push({
                    field: "action",
                    message: "Only the challenged user can accept or decline",
                    code: "NOT_TARGET",
                });
            }
            if (currentStatus !== "pending") {
                errors.push({
                    field: "status",
                    message: `Cannot ${action} a challenge that is ${currentStatus}`,
                    code: "INVALID_STATUS",
                });
            }
            break;

        case "cancel":
            if (currentStatus !== "pending" && currentStatus !== "accepted") {
                errors.push({
                    field: "status",
                    message: `Cannot cancel a challenge that is ${currentStatus}`,
                    code: "INVALID_STATUS",
                });
            }
            break;
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Format validation errors for API response.
 */
export function formatValidationErrors(errors: ValidationError[]): string {
    return errors.map((e) => e.message).join("; ");
}
