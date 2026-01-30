/**
 * Share Message Builder Tests (PRD-57)
 *
 * Tests for the dynamic share message builder.
 * Covers message construction, formatting, truncation, and platform optimization.
 *
 * Systems Thinking:
 * - Messages must work across platforms (WhatsApp, Twitter, generic)
 * - Character limits must be respected
 * - Blocks should render correctly and gracefully handle missing data
 *
 * Design Patterns:
 * - Builder pattern for constructing messages from blocks
 * - Strategy pattern for platform-specific formatting
 */

import { describe, it, expect } from "vitest";
import {
    buildShareMessage,
    buildBatchSubmissionMessage,
    buildLeagueShareMessage,
    buildComparisonMessage,
    buildDailyBreakdownMessage,
    getRecommendedMaxLength,
    isOptimalLength,
    type BuildMessageOptions,
    type BuildMessageResult,
} from "../shareMessageBuilder";
import { type ShareContentBlock, type ShareMessageData } from "../shareContentConfig";

// ============================================================================
// Test Data Factories
// ============================================================================

const createBasicData = (overrides: Partial<ShareMessageData> = {}): ShareMessageData => ({
    totalSteps: 10000,
    dayCount: 5,
    startDate: "2026-01-15",
    endDate: "2026-01-19",
    averageSteps: 2000,
    ...overrides,
});

const createFullData = (overrides: Partial<ShareMessageData> = {}): ShareMessageData => ({
    totalSteps: 50000,
    dayCount: 7,
    startDate: "2026-01-15",
    endDate: "2026-01-21",
    averageSteps: 7142,
    dailyBreakdown: [
        { date: "2026-01-15", steps: 8000 },
        { date: "2026-01-16", steps: 9000, isBestDay: true },
        { date: "2026-01-17", steps: 7500 },
        { date: "2026-01-18", steps: 6000 },
        { date: "2026-01-19", steps: 7000 },
        { date: "2026-01-20", steps: 6500 },
        { date: "2026-01-21", steps: 6000 },
    ],
    bestDaySteps: 9000,
    bestDayDate: "2026-01-16",
    currentStreak: 14,
    rank: 3,
    totalMembers: 10,
    leagueName: "Family Steps",
    leagueAverage: 6000,
    previousPeriodSteps: 40000,
    improvementPercent: 25,
    ...overrides,
});

// ============================================================================
// buildShareMessage Tests
// ============================================================================

describe("buildShareMessage", () => {
    describe("basic functionality", () => {
        it("builds message with total_steps block", () => {
            const data = createBasicData();
            const result = buildShareMessage(["total_steps"], data);

            // Locale-agnostic: check for digits with optional separators
            expect(result.message).toMatch(/10.?000/);
            expect(result.message).toContain("steps");
            expect(result.includedBlocks).toContain("total_steps");
        });

        it("builds message with multiple blocks", () => {
            const data = createBasicData();
            const result = buildShareMessage(
                ["total_steps", "day_count", "average"],
                data
            );

            // Locale-agnostic: check for digits with optional separators
            expect(result.message).toMatch(/10.?000/);
            expect(result.message).toContain("5 day");
            expect(result.message).toMatch(/2.?000/);
            expect(result.includedBlocks).toHaveLength(3);
        });

        it("includes hashtag by default", () => {
            const data = createBasicData();
            const result = buildShareMessage(["total_steps"], data);

            expect(result.message).toContain("#StepLeague");
        });

        it("excludes URL by default (URL added by useShare hook)", () => {
            const data = createBasicData();
            const result = buildShareMessage(["total_steps"], data);

            // URL is now added by useShare hook, not in message text
            expect(result.message).not.toContain("stepleague.app");
        });

        it("includes URL when explicitly requested", () => {
            const data = createBasicData();
            const result = buildShareMessage(["total_steps"], data, { includeUrl: true });

            expect(result.message).toContain("stepleague");
        });

        it("returns correct message length", () => {
            const data = createBasicData();
            const result = buildShareMessage(["total_steps"], data);

            expect(result.length).toBe(result.message.length);
        });
    });

    describe("block rendering", () => {
        it("renders total_steps with formatted number", () => {
            const data = createBasicData({ totalSteps: 1234567 });
            const result = buildShareMessage(["total_steps"], data);

            expect(result.message).toMatch(/1.?234.?567/);
        });

        it("renders day_count with emoji and proper pluralization", () => {
            const data = createBasicData({ dayCount: 1 });
            const result = buildShareMessage(["day_count"], data);
            expect(result.message).toContain("📅 1 day");

            const data2 = createBasicData({ dayCount: 5 });
            const result2 = buildShareMessage(["day_count"], data2);
            expect(result2.message).toContain("📅 5 days");
        });

        it("renders date_range in readable format", () => {
            const data = createBasicData();
            const result = buildShareMessage(["date_range"], data);

            // Should contain formatted date
            expect(result.message).toContain("Jan");
        });

        it("renders average with emoji", () => {
            const data = createBasicData({ averageSteps: 12345 });
            const result = buildShareMessage(["average"], data);

            expect(result.message).toContain("📊");
            expect(result.message).toContain("Avg");
            expect(result.message).toMatch(/12.?345/);
        });

        it("renders streak with emoji", () => {
            const data = createFullData();
            const result = buildShareMessage(["streak"], data);

            expect(result.message).toContain("🔥");
            expect(result.message).toContain("14 day");
            expect(result.message).toContain("streak");
        });

        it("renders rank with emoji", () => {
            const data = createFullData();
            const result = buildShareMessage(["rank"], data);

            expect(result.message).toContain("🏆");
            expect(result.message).toContain("#3");
        });

        it("renders rank with total members", () => {
            const data = createFullData({ rank: 5, totalMembers: 20 });
            const result = buildShareMessage(["rank"], data);

            expect(result.message).toContain("#5");
            expect(result.message).toContain("of 20");
        });

        it("renders league_name", () => {
            const data = createFullData();
            const result = buildShareMessage(["league_name"], data);

            expect(result.message).toContain("Family Steps");
        });

        it("renders improvement with sign", () => {
            const data = createFullData({ improvementPercent: 25 });
            const result = buildShareMessage(["improvement"], data);

            expect(result.message).toContain("+25%");
            expect(result.message).toContain("📈");
        });

        it("renders negative improvement with downward emoji", () => {
            const data = createFullData({ improvementPercent: -15 });
            const result = buildShareMessage(["improvement"], data);

            expect(result.message).toContain("-15%");
            expect(result.message).toContain("📉");
        });

        it("renders best_day with star", () => {
            const data = createFullData();
            const result = buildShareMessage(["best_day"], data);

            expect(result.message).toContain("⭐");
            // Locale-agnostic
            expect(result.message).toMatch(/9.?000/);
        });

        it("renders comparison_self showing before and after", () => {
            const data = createFullData();
            const result = buildShareMessage(["comparison_self"], data);

            expect(result.message).toContain("Before");
            expect(result.message).toContain("Now");
            // Locale-agnostic
            expect(result.message).toMatch(/40.?000/);
            expect(result.message).toMatch(/50.?000/);
        });

        it("renders comparison_league with league average", () => {
            const data = createFullData();
            const result = buildShareMessage(["comparison_league"], data);

            expect(result.message).toContain("League avg");
            // Locale-agnostic
            expect(result.message).toMatch(/6.?000/);
        });
    });

    describe("individual_days block", () => {
        it("renders daily breakdown with day names", () => {
            const data = createFullData();
            const result = buildShareMessage(["individual_days"], data);

            // Day name can vary based on locale, just check for day format
            expect(result.message).toMatch(/\w{3} \d+ \w+:/);
            // Locale-agnostic
            expect(result.message).toMatch(/8.?000/);
        });

        it("marks best day with star", () => {
            const data = createFullData();
            const result = buildShareMessage(["individual_days"], data);

            expect(result.message).toContain("⭐");
        });
    });

    describe("skipped blocks", () => {
        it("skips blocks when data is missing", () => {
            const data: ShareMessageData = { totalSteps: 10000 };
            const result = buildShareMessage(
                ["total_steps", "streak", "rank"],
                data
            );

            expect(result.includedBlocks).toContain("total_steps");
            expect(result.skippedBlocks).toContain("streak");
            expect(result.skippedBlocks).toContain("rank");
        });

        it("reports skipped blocks correctly", () => {
            const data: ShareMessageData = {};
            const result = buildShareMessage(
                ["total_steps", "day_count", "average"],
                data
            );

            expect(result.skippedBlocks).toHaveLength(3);
        });
    });

    describe("options", () => {
        it("excludes hashtag when includeHashtag is false", () => {
            const data = createBasicData();
            const result = buildShareMessage(["total_steps"], data, {
                includeHashtag: false,
            });

            expect(result.message).not.toContain("#StepLeague");
        });

        it("excludes URL when includeUrl is false", () => {
            const data = createBasicData();
            const result = buildShareMessage(["total_steps"], data, {
                includeUrl: false,
            });

            expect(result.message).not.toContain("stepleague.app");
        });

        it("uses custom intro when provided", () => {
            const data = createBasicData();
            const result = buildShareMessage(["total_steps"], data, {
                customIntro: "Check this out!",
            });

            expect(result.message).toContain("Check this out!");
        });
    });

    describe("truncation", () => {
        it("truncates long messages", () => {
            const data = createFullData();
            const result = buildShareMessage(
                ["total_steps", "individual_days", "comparison_self"],
                data,
                { maxLength: 100 }
            );

            expect(result.length).toBeLessThanOrEqual(100);
            expect(result.truncated).toBe(true);
        });

        it("does not truncate short messages", () => {
            const data = createBasicData();
            const result = buildShareMessage(["total_steps"], data, {
                maxLength: 500,
            });

            expect(result.truncated).toBe(false);
        });

        it("preserves hashtag when truncating", () => {
            const data = createFullData();
            const result = buildShareMessage(
                ["total_steps", "individual_days"],
                data,
                { maxLength: 150 }
            );

            expect(result.message).toContain("#StepLeague");
        });

        it("preserves hashtag and URL when truncating with includeUrl", () => {
            const data = createFullData();
            const result = buildShareMessage(
                ["total_steps", "individual_days"],
                data,
                { maxLength: 200, includeUrl: true }
            );

            expect(result.message).toContain("#StepLeague");
            expect(result.message).toContain("stepleague");
        });

        it("adds ellipsis when truncating", () => {
            const data = createFullData();
            const result = buildShareMessage(
                ["total_steps", "individual_days"],
                data,
                { maxLength: 100 }
            );

            expect(result.message).toContain("...");
        });
    });
});

// ============================================================================
// Preset Builder Tests
// ============================================================================

describe("buildBatchSubmissionMessage", () => {
    it("builds message with default blocks", () => {
        const data = createBasicData();
        const result = buildBatchSubmissionMessage(data);

        // Locale-agnostic
        expect(result.message).toMatch(/10.?000/);
        expect(result.includedBlocks).toContain("total_steps");
    });

    it("uses provided blocks when specified", () => {
        const data = createBasicData();
        const result = buildBatchSubmissionMessage(data, ["total_steps"]);

        expect(result.includedBlocks).toEqual(["total_steps"]);
    });
});

describe("buildLeagueShareMessage", () => {
    it("builds message with rank info", () => {
        const data = createFullData();
        const result = buildLeagueShareMessage(data);

        expect(result.message).toContain("#3");
    });

    it("uses custom intro for #1 rank", () => {
        const data = createFullData({ rank: 1 });
        const result = buildLeagueShareMessage(data);

        expect(result.message).toContain("Leading the pack");
    });

    it("uses climbing message for positive improvement", () => {
        const data = createFullData({ rank: 5, improvementPercent: 20 });
        const result = buildLeagueShareMessage(data);

        expect(result.message).toContain("Climbing");
    });
});

describe("buildComparisonMessage", () => {
    it("builds comparison message", () => {
        const data = createFullData();
        const result = buildComparisonMessage(data);

        expect(result.message).toContain("Progress check");
    });

    it("includes comparison_self block by default", () => {
        const data = createFullData();
        const result = buildComparisonMessage(data);

        expect(result.includedBlocks).toContain("comparison_self");
    });
});

describe("buildDailyBreakdownMessage", () => {
    it("builds daily breakdown message", () => {
        const data = createFullData();
        const result = buildDailyBreakdownMessage(data);

        expect(result.message).toContain("My week in steps");
    });

    it("includes individual_days block", () => {
        const data = createFullData();
        const result = buildDailyBreakdownMessage(data);

        expect(result.includedBlocks).toContain("individual_days");
    });
});

// ============================================================================
// Character Count Helper Tests
// ============================================================================

describe("getRecommendedMaxLength", () => {
    it("returns 500 for WhatsApp", () => {
        expect(getRecommendedMaxLength("whatsapp")).toBe(500);
    });

    it("returns 280 for X/Twitter", () => {
        expect(getRecommendedMaxLength("x")).toBe(280);
    });

    it("returns 500 for generic", () => {
        expect(getRecommendedMaxLength("generic")).toBe(500);
    });
});

describe("isOptimalLength", () => {
    describe("WhatsApp thresholds", () => {
        it("returns short for very short messages", () => {
            const result = isOptimalLength(30, "whatsapp");
            expect(result.status).toBe("short");
            expect(result.optimal).toBe(false);
        });

        it("returns optimal for medium messages", () => {
            const result = isOptimalLength(100, "whatsapp");
            expect(result.status).toBe("optimal");
            expect(result.optimal).toBe(true);
        });

        it("returns optimal for messages up to 300 chars", () => {
            const result = isOptimalLength(250, "whatsapp");
            expect(result.status).toBe("optimal");
            expect(result.optimal).toBe(true);
        });

        it("returns long for very long messages", () => {
            const result = isOptimalLength(400, "whatsapp");
            expect(result.status).toBe("long");
            expect(result.optimal).toBe(false);
        });
    });

    describe("X/Twitter thresholds", () => {
        it("returns short for very short messages", () => {
            const result = isOptimalLength(30, "x");
            expect(result.status).toBe("short");
        });

        it("returns optimal for medium messages", () => {
            const result = isOptimalLength(150, "x");
            expect(result.status).toBe("optimal");
        });

        it("returns long for messages over 280", () => {
            const result = isOptimalLength(300, "x");
            expect(result.status).toBe("long");
        });
    });
});

// ============================================================================
// Negative Tests
// ============================================================================

describe("Negative Tests", () => {
    describe("missing data handling", () => {
        it("handles completely empty data", () => {
            const data: ShareMessageData = {};
            const result = buildShareMessage(["total_steps", "day_count"], data);

            expect(result.includedBlocks).toHaveLength(0);
            expect(result.skippedBlocks).toHaveLength(2);
        });

        it("handles undefined totalSteps", () => {
            const data: ShareMessageData = { dayCount: 5 };
            const result = buildShareMessage(["total_steps"], data);

            expect(result.skippedBlocks).toContain("total_steps");
        });

        it("handles partial date range (only startDate)", () => {
            const data: ShareMessageData = { startDate: "2026-01-01" };
            const result = buildShareMessage(["date_range"], data);

            expect(result.skippedBlocks).toContain("date_range");
        });

        it("handles empty dailyBreakdown array", () => {
            const data: ShareMessageData = { dailyBreakdown: [] };
            const result = buildShareMessage(["individual_days"], data);

            // Empty array should produce empty breakdown
            expect(result.message).not.toContain("Mon");
            expect(result.message).not.toContain("Tue");
        });
    });

    describe("edge cases", () => {
        it("handles zero totalSteps", () => {
            const data: ShareMessageData = { totalSteps: 0 };
            const result = buildShareMessage(["total_steps"], data);

            expect(result.message).toContain("0");
        });

        it("handles zero improvement", () => {
            const data: ShareMessageData = { improvementPercent: 0 };
            const result = buildShareMessage(["improvement"], data);

            expect(result.message).toContain("+0%");
        });

        it("handles single day period", () => {
            const data: ShareMessageData = {
                startDate: "2026-01-15",
                endDate: "2026-01-15",
            };
            const result = buildShareMessage(["date_range"], data);

            // Should show single date, not range
            expect(result.message).toContain("15 Jan 2026");
        });

        it("handles very large numbers", () => {
            const data: ShareMessageData = { totalSteps: 999999999 };
            const result = buildShareMessage(["total_steps"], data);

            expect(result.message).toContain("999");
        });

        it("handles negative streak (should still render)", () => {
            const data: ShareMessageData = { currentStreak: -1 };
            const result = buildShareMessage(["streak"], data);

            expect(result.message).toContain("-1");
        });
    });

    describe("empty block selection", () => {
        it("handles empty blocks array", () => {
            const data = createBasicData();
            const result = buildShareMessage([], data);

            // Should still have footer
            expect(result.message).toContain("#StepLeague");
        });

        it("handles single block that gets skipped", () => {
            const data: ShareMessageData = {};
            const result = buildShareMessage(["total_steps"], data);

            expect(result.skippedBlocks).toHaveLength(1);
            // Should have footer only
            expect(result.message).toContain("#StepLeague");
        });
    });
});

// ============================================================================
// Message Format Tests
// ============================================================================

describe("Message Format", () => {
    it("uses consistent line spacing", () => {
        const data = createBasicData();
        const result = buildShareMessage(
            ["total_steps", "day_count", "average"],
            data
        );

        // Should have proper newlines, not multiple consecutive empty lines
        expect(result.message).not.toMatch(/\n\n\n+/);
    });

    it("formats large numbers with separators", () => {
        const data = createBasicData({ totalSteps: 1234567 });
        const result = buildShareMessage(["total_steps"], data);

        expect(result.message).toMatch(/1.?234.?567/);
    });

    it("uses correct date format (day month)", () => {
        const data = createBasicData({
            startDate: "2026-01-15",
            endDate: "2026-01-21",
        });
        const result = buildShareMessage(["date_range"], data);

        expect(result.message).toContain("Jan");
    });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("Integration Tests", () => {
    it("builds complete batch submission message", () => {
        const data = createBasicData();
        const result = buildBatchSubmissionMessage(data);

        // Locale-agnostic
        expect(result.message).toMatch(/10.?000.*steps/);
        expect(result.message).toContain("5 day");
        expect(result.message).toContain("#StepLeague");
        expect(result.length).toBeLessThan(500);
    });

    it("builds complete league message", () => {
        const data = createFullData();
        const result = buildLeagueShareMessage(data);

        expect(result.message).toContain("Family Steps");
        expect(result.message).toContain("#3");
        expect(result.length).toBeLessThan(500);
    });

    it("message stays within WhatsApp optimal length", () => {
        const data = createBasicData();
        const result = buildBatchSubmissionMessage(data);

        const lengthStatus = isOptimalLength(result.length, "whatsapp");
        expect(lengthStatus.optimal).toBe(true);
    });
});
