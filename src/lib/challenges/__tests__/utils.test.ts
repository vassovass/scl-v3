/**
 * Challenge Utilities Tests (PRD-54)
 */

import { describe, it, expect } from "vitest";
import {
    calculateChallengeResult,
    calculateChallengeStats,
    calculateChallengeProgress,
    isChallengeInProgress,
    hasChallengePeriodEnded,
    formatChallengePeriod,
    getChallengeOutcomeEmoji,
} from "../utils";
import type { Challenge } from "../types";

// ============================================================================
// calculateChallengeResult Tests
// ============================================================================

describe("calculateChallengeResult", () => {
    const challenger = "user-1";
    const target = "user-2";

    it("identifies challenger as winner", () => {
        const result = calculateChallengeResult(10000, 8000, challenger, target);
        expect(result.winner_id).toBe(challenger);
        expect(result.is_tie).toBe(false);
        expect(result.margin).toBe(2000);
        expect(result.challenger_total).toBe(10000);
        expect(result.target_total).toBe(8000);
    });

    it("identifies target as winner", () => {
        const result = calculateChallengeResult(8000, 10000, challenger, target);
        expect(result.winner_id).toBe(target);
        expect(result.is_tie).toBe(false);
        expect(result.margin).toBe(2000);
    });

    it("identifies tie", () => {
        const result = calculateChallengeResult(10000, 10000, challenger, target);
        expect(result.winner_id).toBeNull();
        expect(result.is_tie).toBe(true);
        expect(result.margin).toBe(0);
    });

    it("calculates margin percentage", () => {
        const result = calculateChallengeResult(12000, 10000, challenger, target);
        // Margin is 2000, loser has 10000, so 20%
        expect(result.margin_pct).toBe(20);
    });

    it("handles zero loser total", () => {
        const result = calculateChallengeResult(10000, 0, challenger, target);
        expect(result.winner_id).toBe(challenger);
        expect(result.margin_pct).toBe(0); // Avoid division by zero
    });
});

// ============================================================================
// calculateChallengeStats Tests
// ============================================================================

describe("calculateChallengeStats", () => {
    const userId = "user-1";
    const opponentId = "user-2";

    function createChallenge(overrides: Partial<Challenge>): Challenge {
        return {
            id: `challenge-${Math.random()}`,
            challenger_id: userId,
            target_id: opponentId,
            metric_type: "steps",
            period_start: "2026-01-01",
            period_end: "2026-01-07",
            challenger_value: 0,
            target_value: 0,
            winner_id: null,
            status: "pending",
            message: null,
            template_id: null,
            created_at: "2026-01-01T00:00:00Z",
            accepted_at: null,
            declined_at: null,
            cancelled_at: null,
            resolved_at: null,
            ...overrides,
        };
    }

    it("counts pending challenges correctly", () => {
        const challenges: Challenge[] = [
            createChallenge({ status: "pending", challenger_id: userId }),
            createChallenge({ status: "pending", challenger_id: opponentId, target_id: userId }),
        ];

        const stats = calculateChallengeStats(challenges, userId);
        expect(stats.pending_sent).toBe(1);
        expect(stats.pending_received).toBe(1);
    });

    it("counts active challenges", () => {
        const challenges: Challenge[] = [
            createChallenge({ status: "accepted" }),
            createChallenge({ status: "accepted" }),
        ];

        const stats = calculateChallengeStats(challenges, userId);
        expect(stats.active).toBe(2);
    });

    it("counts wins, losses, and ties", () => {
        const challenges: Challenge[] = [
            createChallenge({ status: "completed", winner_id: userId }),
            createChallenge({ status: "completed", winner_id: userId }),
            createChallenge({ status: "completed", winner_id: opponentId }),
            createChallenge({ status: "completed", winner_id: null }), // Tie
        ];

        const stats = calculateChallengeStats(challenges, userId);
        expect(stats.wins).toBe(2);
        expect(stats.losses).toBe(1);
        expect(stats.ties).toBe(1);
        expect(stats.total_challenges).toBe(4);
    });

    it("calculates win rate", () => {
        const challenges: Challenge[] = [
            createChallenge({ status: "completed", winner_id: userId }),
            createChallenge({ status: "completed", winner_id: userId }),
            createChallenge({ status: "completed", winner_id: opponentId }),
            createChallenge({ status: "completed", winner_id: opponentId }),
        ];

        const stats = calculateChallengeStats(challenges, userId);
        expect(stats.win_rate).toBe(50);
    });

    it("handles empty challenges", () => {
        const stats = calculateChallengeStats([], userId);
        expect(stats.total_challenges).toBe(0);
        expect(stats.wins).toBe(0);
        expect(stats.win_rate).toBe(0);
    });
});

// ============================================================================
// calculateChallengeProgress Tests
// ============================================================================

describe("calculateChallengeProgress", () => {
    it("calculates progress for active challenge", () => {
        // Create a date range that includes today
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 3);
        const end = new Date(today);
        end.setDate(end.getDate() + 3); // 7 days total: -3 to +3 inclusive

        const periodStart = formatDate(start);
        const periodEnd = formatDate(end);

        const result = calculateChallengeProgress(periodStart, periodEnd);
        expect(result.totalDays).toBe(7); // -3, -2, -1, 0, +1, +2, +3
        expect(result.daysPassed).toBe(4); // -3, -2, -1, 0 (today)
        expect(result.progress).toBeGreaterThan(0);
        expect(result.progress).toBeLessThan(100);
    });

    it("returns 100% for completed challenge", () => {
        const result = calculateChallengeProgress("2025-01-01", "2025-01-07");
        expect(result.progress).toBe(100);
        expect(result.totalDays).toBe(7);
        expect(result.daysPassed).toBe(7); // All days passed (clamped to total)
    });

    it("calculates total days correctly", () => {
        // Single day challenge (same start and end)
        const single = calculateChallengeProgress("2026-06-15", "2026-06-15");
        expect(single.totalDays).toBe(1);

        // Week-long challenge (7 days: 1st to 7th inclusive)
        const week = calculateChallengeProgress("2026-06-01", "2026-06-07");
        expect(week.totalDays).toBe(7);
    });

    it("returns 0 progress for future challenge", () => {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);
        const futureStart = formatDate(future);
        future.setDate(future.getDate() + 6);
        const futureEnd = formatDate(future);

        const result = calculateChallengeProgress(futureStart, futureEnd);
        expect(result.daysPassed).toBe(0);
        expect(result.progress).toBe(0);
    });
});

function formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// ============================================================================
// Period Helpers Tests
// ============================================================================

describe("isChallengeInProgress", () => {
    it("returns true for current period", () => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 3);
        const end = new Date(today);
        end.setDate(end.getDate() + 3);

        expect(isChallengeInProgress(formatDate(start), formatDate(end))).toBe(true);
    });

    it("returns false for past period", () => {
        expect(isChallengeInProgress("2025-01-01", "2025-01-07")).toBe(false);
    });

    it("returns false for future period", () => {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);
        const futureStart = formatDate(future);
        future.setDate(future.getDate() + 7);
        const futureEnd = formatDate(future);

        expect(isChallengeInProgress(futureStart, futureEnd)).toBe(false);
    });
});

describe("hasChallengePeriodEnded", () => {
    it("returns true for past end date", () => {
        expect(hasChallengePeriodEnded("2025-01-07")).toBe(true);
    });

    it("returns false for future end date", () => {
        const future = new Date();
        future.setFullYear(future.getFullYear() + 1);
        expect(hasChallengePeriodEnded(formatDate(future))).toBe(false);
    });
});

// ============================================================================
// Formatting Tests
// ============================================================================

describe("formatChallengePeriod", () => {
    it("formats same-month period", () => {
        const result = formatChallengePeriod("2026-01-15", "2026-01-22");
        expect(result).toContain("Jan");
        expect(result).toContain("15");
        expect(result).toContain("22");
    });

    it("formats cross-month period", () => {
        const result = formatChallengePeriod("2026-01-28", "2026-02-05");
        expect(result).toContain("Jan");
        expect(result).toContain("Feb");
    });

    it("formats single day", () => {
        const result = formatChallengePeriod("2026-01-15", "2026-01-15");
        expect(result).toContain("Jan");
        expect(result).toContain("15");
    });
});

describe("getChallengeOutcomeEmoji", () => {
    const userId = "user-1";

    function createChallenge(overrides: Partial<Challenge>): Challenge {
        return {
            id: "test",
            challenger_id: userId,
            target_id: "user-2",
            metric_type: "steps",
            period_start: "2026-01-01",
            period_end: "2026-01-07",
            challenger_value: 10000,
            target_value: 8000,
            winner_id: null,
            status: "pending",
            message: null,
            template_id: null,
            created_at: "2026-01-01T00:00:00Z",
            accepted_at: null,
            declined_at: null,
            cancelled_at: null,
            resolved_at: null,
            ...overrides,
        };
    }

    it("returns trophy for win", () => {
        const challenge = createChallenge({ status: "completed", winner_id: userId });
        expect(getChallengeOutcomeEmoji(challenge, userId)).toBe("🏆");
    });

    it("returns handshake for tie", () => {
        const challenge = createChallenge({ status: "completed", winner_id: null });
        expect(getChallengeOutcomeEmoji(challenge, userId)).toBe("🤝");
    });

    it("returns applause for loss", () => {
        const challenge = createChallenge({ status: "completed", winner_id: "user-2" });
        expect(getChallengeOutcomeEmoji(challenge, userId)).toBe("👏");
    });

    it("returns empty for non-completed", () => {
        const challenge = createChallenge({ status: "accepted" });
        expect(getChallengeOutcomeEmoji(challenge, userId)).toBe("");
    });
});
