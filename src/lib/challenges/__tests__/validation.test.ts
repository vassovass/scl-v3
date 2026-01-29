/**
 * Challenge Validation Tests (PRD-54)
 */

import { describe, it, expect } from "vitest";
import {
    validateCreateChallenge,
    canCreateChallengeWith,
    validateChallengeAction,
    formatValidationErrors,
    MAX_MESSAGE_LENGTH,
    MAX_CHALLENGE_DURATION_DAYS,
} from "../validation";
import type { CreateChallengeRequest } from "../types";

// ============================================================================
// Helper Functions
// ============================================================================

function getTomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDateYMD(d);
}

function getNextWeek(): string {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDateYMD(d);
}

function formatDateYMD(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// ============================================================================
// validateCreateChallenge Tests
// ============================================================================

describe("validateCreateChallenge", () => {
    const challengerId = "user-challenger";

    it("validates a valid challenge request", () => {
        const request: CreateChallengeRequest = {
            target_id: "user-target",
            period_start: getTomorrow(),
            period_end: getNextWeek(),
        };

        const result = validateCreateChallenge(request, challengerId);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("rejects missing target_id", () => {
        const request: CreateChallengeRequest = {
            target_id: "",
            period_start: getTomorrow(),
            period_end: getNextWeek(),
        };

        const result = validateCreateChallenge(request, challengerId);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === "target_id")).toBe(true);
    });

    it("rejects self-challenge", () => {
        const request: CreateChallengeRequest = {
            target_id: challengerId,
            period_start: getTomorrow(),
            period_end: getNextWeek(),
        };

        const result = validateCreateChallenge(request, challengerId);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "SELF_CHALLENGE")).toBe(true);
    });

    it("rejects missing dates", () => {
        const request: CreateChallengeRequest = {
            target_id: "user-target",
            period_start: "",
            period_end: "",
        };

        const result = validateCreateChallenge(request, challengerId);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === "period_start")).toBe(true);
        expect(result.errors.some((e) => e.field === "period_end")).toBe(true);
    });

    it("rejects end date before start date", () => {
        const tomorrow = getTomorrow();
        const yesterday = formatDateYMD(new Date(Date.now() - 86400000));

        const request: CreateChallengeRequest = {
            target_id: "user-target",
            period_start: tomorrow,
            period_end: yesterday,
        };

        const result = validateCreateChallenge(request, challengerId);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "INVALID_RANGE")).toBe(true);
    });

    it("rejects challenge too long", () => {
        const start = getTomorrow();
        const farFuture = new Date();
        farFuture.setDate(farFuture.getDate() + MAX_CHALLENGE_DURATION_DAYS + 10);

        const request: CreateChallengeRequest = {
            target_id: "user-target",
            period_start: start,
            period_end: formatDateYMD(farFuture),
        };

        const result = validateCreateChallenge(request, challengerId);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "TOO_LONG")).toBe(true);
    });

    it("rejects invalid metric type", () => {
        const request: CreateChallengeRequest = {
            target_id: "user-target",
            period_start: getTomorrow(),
            period_end: getNextWeek(),
            metric_type: "invalid" as any,
        };

        const result = validateCreateChallenge(request, challengerId);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "INVALID_METRIC")).toBe(true);
    });

    it("accepts valid metric types", () => {
        const validTypes = ["steps", "calories", "distance"];

        for (const metric of validTypes) {
            const request: CreateChallengeRequest = {
                target_id: "user-target",
                period_start: getTomorrow(),
                period_end: getNextWeek(),
                metric_type: metric as any,
            };

            const result = validateCreateChallenge(request, challengerId);
            expect(result.errors.some((e) => e.field === "metric_type")).toBe(false);
        }
    });

    it("rejects message too long", () => {
        const request: CreateChallengeRequest = {
            target_id: "user-target",
            period_start: getTomorrow(),
            period_end: getNextWeek(),
            message: "x".repeat(MAX_MESSAGE_LENGTH + 1),
        };

        const result = validateCreateChallenge(request, challengerId);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === "message")).toBe(true);
    });

    it("accepts valid message", () => {
        const request: CreateChallengeRequest = {
            target_id: "user-target",
            period_start: getTomorrow(),
            period_end: getNextWeek(),
            message: "Let's see who can walk more!",
        };

        const result = validateCreateChallenge(request, challengerId);
        expect(result.errors.some((e) => e.field === "message")).toBe(false);
    });

    it("rejects invalid template_id", () => {
        const request: CreateChallengeRequest = {
            target_id: "user-target",
            period_start: getTomorrow(),
            period_end: getNextWeek(),
            template_id: "nonexistent_template",
        };

        const result = validateCreateChallenge(request, challengerId);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "INVALID_TEMPLATE")).toBe(true);
    });

    it("accepts valid template_id", () => {
        const request: CreateChallengeRequest = {
            target_id: "user-target",
            period_start: getTomorrow(),
            period_end: getNextWeek(),
            template_id: "week_sprint",
        };

        const result = validateCreateChallenge(request, challengerId);
        expect(result.errors.some((e) => e.field === "template_id")).toBe(false);
    });
});

// ============================================================================
// canCreateChallengeWith Tests
// ============================================================================

describe("canCreateChallengeWith", () => {
    it("allows when no existing challenge", () => {
        const result = canCreateChallengeWith(null);
        expect(result.valid).toBe(true);
    });

    it("rejects when pending challenge exists", () => {
        const result = canCreateChallengeWith("pending");
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "DUPLICATE_PENDING")).toBe(true);
    });

    it("rejects when active challenge exists", () => {
        const result = canCreateChallengeWith("accepted");
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "DUPLICATE_ACTIVE")).toBe(true);
    });

    it("allows when previous challenge is completed", () => {
        const result = canCreateChallengeWith("completed");
        expect(result.valid).toBe(true);
    });

    it("allows when previous challenge was declined", () => {
        const result = canCreateChallengeWith("declined");
        expect(result.valid).toBe(true);
    });
});

// ============================================================================
// validateChallengeAction Tests
// ============================================================================

describe("validateChallengeAction", () => {
    const challenger = "user-1";
    const target = "user-2";
    const other = "user-3";

    it("allows target to accept pending challenge", () => {
        const result = validateChallengeAction("accept", "pending", target, challenger, target);
        expect(result.valid).toBe(true);
    });

    it("rejects challenger accepting their own challenge", () => {
        const result = validateChallengeAction("accept", "pending", challenger, challenger, target);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "NOT_TARGET")).toBe(true);
    });

    it("rejects accepting non-pending challenge", () => {
        const result = validateChallengeAction("accept", "accepted", target, challenger, target);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "INVALID_STATUS")).toBe(true);
    });

    it("allows target to decline pending challenge", () => {
        const result = validateChallengeAction("decline", "pending", target, challenger, target);
        expect(result.valid).toBe(true);
    });

    it("allows challenger to cancel pending challenge", () => {
        const result = validateChallengeAction("cancel", "pending", challenger, challenger, target);
        expect(result.valid).toBe(true);
    });

    it("allows target to cancel pending challenge", () => {
        const result = validateChallengeAction("cancel", "pending", target, challenger, target);
        expect(result.valid).toBe(true);
    });

    it("allows either party to cancel accepted challenge", () => {
        expect(validateChallengeAction("cancel", "accepted", challenger, challenger, target).valid).toBe(true);
        expect(validateChallengeAction("cancel", "accepted", target, challenger, target).valid).toBe(true);
    });

    it("rejects cancel on completed challenge", () => {
        const result = validateChallengeAction("cancel", "completed", challenger, challenger, target);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "INVALID_STATUS")).toBe(true);
    });

    it("rejects unrelated user actions", () => {
        const result = validateChallengeAction("accept", "pending", other, challenger, target);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "NOT_AUTHORIZED")).toBe(true);
    });

    it("rejects invalid action", () => {
        const result = validateChallengeAction("invalid" as any, "pending", target, challenger, target);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.code === "INVALID_ACTION")).toBe(true);
    });
});

// ============================================================================
// formatValidationErrors Tests
// ============================================================================

describe("formatValidationErrors", () => {
    it("formats multiple errors", () => {
        const errors = [
            { field: "target_id", message: "Target required", code: "REQUIRED" },
            { field: "period_start", message: "Start date required", code: "REQUIRED" },
        ];

        const result = formatValidationErrors(errors);
        expect(result).toBe("Target required; Start date required");
    });

    it("handles single error", () => {
        const errors = [{ field: "target_id", message: "Target required", code: "REQUIRED" }];
        const result = formatValidationErrors(errors);
        expect(result).toBe("Target required");
    });

    it("handles empty errors", () => {
        const result = formatValidationErrors([]);
        expect(result).toBe("");
    });
});
