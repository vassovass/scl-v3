/**
 * Share Content Configuration Tests (PRD-57)
 *
 * Tests for the share content configuration system.
 * Covers type definitions, registry, and utility functions.
 *
 * Systems Thinking:
 * - Configuration must be consistent and complete
 * - All blocks must have valid categories
 * - Dependencies must be properly validated
 *
 * Design Patterns:
 * - Registry pattern for content blocks
 * - Factory pattern for defaults by context
 */

import { describe, it, expect } from "vitest";
import {
    type ShareContentBlock,
    type ShareContentCategory,
    type ShareMessageData,
    type ShareContext,
    SHARE_CONTENT_BLOCKS,
    SHARE_CONTENT_CATEGORIES,
    CONTEXT_DEFAULTS,
    getContentBlockConfig,
    getBlocksByCategory,
    getDefaultBlocks,
    isBlockAvailable,
    getAvailableBlocks,
    validateBlockSelection,
    getBlocksGroupedByCategory,
} from "../shareContentConfig";

// ============================================================================
// Registry Tests
// ============================================================================

describe("SHARE_CONTENT_BLOCKS Registry", () => {
    const allBlocks = Object.keys(SHARE_CONTENT_BLOCKS) as ShareContentBlock[];

    describe("structure validation", () => {
        it("has all required block types", () => {
            expect(allBlocks).toContain("total_steps");
            expect(allBlocks).toContain("day_count");
            expect(allBlocks).toContain("date_range");
            expect(allBlocks).toContain("average");
            expect(allBlocks).toContain("individual_days");
            expect(allBlocks).toContain("best_day");
            expect(allBlocks).toContain("streak");
            expect(allBlocks).toContain("rank");
            expect(allBlocks).toContain("league_name");
            expect(allBlocks).toContain("improvement");
            expect(allBlocks).toContain("comparison_self");
            expect(allBlocks).toContain("comparison_league");
        });

        it("each block has required fields", () => {
            allBlocks.forEach((block) => {
                const config = SHARE_CONTENT_BLOCKS[block];
                expect(config.id).toBe(block);
                expect(config.label).toBeTruthy();
                expect(config.description).toBeTruthy();
                expect(config.emoji).toBeTruthy();
                expect(typeof config.defaultEnabled).toBe("boolean");
                expect(["basic", "detailed", "comparison"]).toContain(config.category);
            });
        });

        it("each block has valid emoji", () => {
            allBlocks.forEach((block) => {
                const config = SHARE_CONTENT_BLOCKS[block];
                // Check emoji is present and is a string
                expect(config.emoji).toBeTruthy();
                expect(typeof config.emoji).toBe("string");
            });
        });

        it("basic blocks are enabled by default", () => {
            const basicBlocks = allBlocks.filter(
                (b) => SHARE_CONTENT_BLOCKS[b].category === "basic"
            );

            // At least some basic blocks should be enabled by default
            const defaultEnabledCount = basicBlocks.filter(
                (b) => SHARE_CONTENT_BLOCKS[b].defaultEnabled
            ).length;

            expect(defaultEnabledCount).toBeGreaterThan(0);
        });
    });

    describe("category assignment", () => {
        it("basic category has total_steps, day_count, date_range, average", () => {
            expect(SHARE_CONTENT_BLOCKS.total_steps.category).toBe("basic");
            expect(SHARE_CONTENT_BLOCKS.day_count.category).toBe("basic");
            expect(SHARE_CONTENT_BLOCKS.date_range.category).toBe("basic");
            expect(SHARE_CONTENT_BLOCKS.average.category).toBe("basic");
        });

        it("detailed category has individual_days, best_day, streak", () => {
            expect(SHARE_CONTENT_BLOCKS.individual_days.category).toBe("detailed");
            expect(SHARE_CONTENT_BLOCKS.best_day.category).toBe("detailed");
            expect(SHARE_CONTENT_BLOCKS.streak.category).toBe("detailed");
        });

        it("comparison category has rank, league_name, improvement, comparisons", () => {
            expect(SHARE_CONTENT_BLOCKS.rank.category).toBe("comparison");
            expect(SHARE_CONTENT_BLOCKS.league_name.category).toBe("comparison");
            expect(SHARE_CONTENT_BLOCKS.improvement.category).toBe("comparison");
            expect(SHARE_CONTENT_BLOCKS.comparison_self.category).toBe("comparison");
            expect(SHARE_CONTENT_BLOCKS.comparison_league.category).toBe("comparison");
        });
    });

    describe("dependencies", () => {
        it("league_name requires rank", () => {
            expect(SHARE_CONTENT_BLOCKS.league_name.requires).toContain("rank");
        });

        it("blocks without dependencies have undefined requires", () => {
            expect(SHARE_CONTENT_BLOCKS.total_steps.requires).toBeUndefined();
            expect(SHARE_CONTENT_BLOCKS.average.requires).toBeUndefined();
        });
    });
});

// ============================================================================
// SHARE_CONTENT_CATEGORIES Tests
// ============================================================================

describe("SHARE_CONTENT_CATEGORIES", () => {
    it("has all three categories", () => {
        expect(Object.keys(SHARE_CONTENT_CATEGORIES)).toHaveLength(3);
        expect(SHARE_CONTENT_CATEGORIES).toHaveProperty("basic");
        expect(SHARE_CONTENT_CATEGORIES).toHaveProperty("detailed");
        expect(SHARE_CONTENT_CATEGORIES).toHaveProperty("comparison");
    });

    it("each category has required fields", () => {
        Object.values(SHARE_CONTENT_CATEGORIES).forEach((category) => {
            expect(category.id).toBeTruthy();
            expect(category.label).toBeTruthy();
            expect(category.description).toBeTruthy();
        });
    });
});

// ============================================================================
// CONTEXT_DEFAULTS Tests
// ============================================================================

describe("CONTEXT_DEFAULTS", () => {
    const allContexts: ShareContext[] = [
        "batch_submission",
        "daily_stats",
        "weekly_stats",
        "personal_best",
        "league_rank",
        "comparison",
        "custom",
    ];

    it("has defaults for all contexts", () => {
        allContexts.forEach((context) => {
            expect(CONTEXT_DEFAULTS[context]).toBeDefined();
            expect(Array.isArray(CONTEXT_DEFAULTS[context])).toBe(true);
        });
    });

    it("all context defaults contain only valid block IDs", () => {
        const validBlocks = Object.keys(SHARE_CONTENT_BLOCKS) as ShareContentBlock[];

        Object.values(CONTEXT_DEFAULTS).forEach((blocks) => {
            blocks.forEach((block) => {
                expect(validBlocks).toContain(block);
            });
        });
    });

    it("batch_submission defaults include essential stats", () => {
        const defaults = CONTEXT_DEFAULTS.batch_submission;
        expect(defaults).toContain("total_steps");
        expect(defaults).toContain("day_count");
    });

    it("league_rank defaults include rank and league info", () => {
        const defaults = CONTEXT_DEFAULTS.league_rank;
        expect(defaults).toContain("rank");
        expect(defaults).toContain("league_name");
    });

    it("comparison defaults include comparison blocks", () => {
        const defaults = CONTEXT_DEFAULTS.comparison;
        expect(defaults).toContain("comparison_self");
        expect(defaults).toContain("improvement");
    });
});

// ============================================================================
// getContentBlockConfig Tests
// ============================================================================

describe("getContentBlockConfig", () => {
    it("returns correct config for valid block", () => {
        const config = getContentBlockConfig("total_steps");
        expect(config.id).toBe("total_steps");
        expect(config.label).toBe("Total Steps");
        expect(config.emoji).toBe("👟");
    });

    it("returns correct config for each block type", () => {
        const blocks: ShareContentBlock[] = [
            "total_steps",
            "day_count",
            "date_range",
            "average",
            "streak",
            "rank",
        ];

        blocks.forEach((block) => {
            const config = getContentBlockConfig(block);
            expect(config.id).toBe(block);
        });
    });
});

// ============================================================================
// getBlocksByCategory Tests
// ============================================================================

describe("getBlocksByCategory", () => {
    it("returns basic category blocks", () => {
        const basicBlocks = getBlocksByCategory("basic");
        expect(basicBlocks.length).toBeGreaterThan(0);
        expect(basicBlocks.every((b) => b.category === "basic")).toBe(true);
    });

    it("returns detailed category blocks", () => {
        const detailedBlocks = getBlocksByCategory("detailed");
        expect(detailedBlocks.length).toBeGreaterThan(0);
        expect(detailedBlocks.every((b) => b.category === "detailed")).toBe(true);
    });

    it("returns comparison category blocks", () => {
        const comparisonBlocks = getBlocksByCategory("comparison");
        expect(comparisonBlocks.length).toBeGreaterThan(0);
        expect(comparisonBlocks.every((b) => b.category === "comparison")).toBe(true);
    });

    it("total blocks across categories equals all blocks", () => {
        const basic = getBlocksByCategory("basic");
        const detailed = getBlocksByCategory("detailed");
        const comparison = getBlocksByCategory("comparison");

        const totalFromCategories = basic.length + detailed.length + comparison.length;
        const totalBlocks = Object.keys(SHARE_CONTENT_BLOCKS).length;

        expect(totalFromCategories).toBe(totalBlocks);
    });
});

// ============================================================================
// getDefaultBlocks Tests
// ============================================================================

describe("getDefaultBlocks", () => {
    it("returns correct defaults for batch_submission", () => {
        const defaults = getDefaultBlocks("batch_submission");
        expect(defaults).toEqual(CONTEXT_DEFAULTS.batch_submission);
    });

    it("returns correct defaults for league_rank", () => {
        const defaults = getDefaultBlocks("league_rank");
        expect(defaults).toContain("rank");
        expect(defaults).toContain("total_steps");
    });

    it("falls back to custom defaults for unknown context", () => {
        // TypeScript would catch this, but testing runtime behavior
        const defaults = getDefaultBlocks("unknown" as ShareContext);
        expect(defaults).toEqual(CONTEXT_DEFAULTS.custom);
    });
});

// ============================================================================
// isBlockAvailable Tests
// ============================================================================

describe("isBlockAvailable", () => {
    describe("positive cases - data available", () => {
        it("returns true when totalSteps is available for total_steps block", () => {
            const data: ShareMessageData = { totalSteps: 10000 };
            expect(isBlockAvailable("total_steps", data)).toBe(true);
        });

        it("returns true when date range is available", () => {
            const data: ShareMessageData = {
                startDate: "2026-01-01",
                endDate: "2026-01-15",
            };
            expect(isBlockAvailable("date_range", data)).toBe(true);
        });

        it("returns true when streak data is available", () => {
            const data: ShareMessageData = { currentStreak: 7 };
            expect(isBlockAvailable("streak", data)).toBe(true);
        });

        it("returns true when all data is available", () => {
            const data: ShareMessageData = {
                totalSteps: 50000,
                dayCount: 7,
                startDate: "2026-01-01",
                endDate: "2026-01-07",
                averageSteps: 7142,
                currentStreak: 14,
                rank: 3,
                leagueName: "Test League",
            };

            expect(isBlockAvailable("total_steps", data)).toBe(true);
            expect(isBlockAvailable("day_count", data)).toBe(true);
            expect(isBlockAvailable("date_range", data)).toBe(true);
            expect(isBlockAvailable("average", data)).toBe(true);
            expect(isBlockAvailable("streak", data)).toBe(true);
            expect(isBlockAvailable("rank", data)).toBe(true);
            expect(isBlockAvailable("league_name", data)).toBe(true);
        });
    });

    describe("negative cases - data not available", () => {
        it("returns false when totalSteps is missing for total_steps block", () => {
            const data: ShareMessageData = {};
            expect(isBlockAvailable("total_steps", data)).toBe(false);
        });

        it("returns false when only startDate is provided for date_range", () => {
            const data: ShareMessageData = { startDate: "2026-01-01" };
            expect(isBlockAvailable("date_range", data)).toBe(false);
        });

        it("returns false when streak is undefined", () => {
            const data: ShareMessageData = { totalSteps: 10000 };
            expect(isBlockAvailable("streak", data)).toBe(false);
        });

        it("returns false when rank is missing for rank block", () => {
            const data: ShareMessageData = { totalSteps: 10000 };
            expect(isBlockAvailable("rank", data)).toBe(false);
        });

        it("returns false when leagueName is missing for league_name block", () => {
            const data: ShareMessageData = { rank: 3 };
            expect(isBlockAvailable("league_name", data)).toBe(false);
        });

        it("returns false when dailyBreakdown is missing for individual_days", () => {
            const data: ShareMessageData = { totalSteps: 10000 };
            expect(isBlockAvailable("individual_days", data)).toBe(false);
        });
    });

    describe("edge cases", () => {
        it("handles zero values correctly (0 is valid data)", () => {
            const data: ShareMessageData = { totalSteps: 0 };
            expect(isBlockAvailable("total_steps", data)).toBe(true);
        });

        it("handles null values as unavailable", () => {
            const data: ShareMessageData = { totalSteps: null as unknown as number };
            expect(isBlockAvailable("total_steps", data)).toBe(false);
        });

        it("handles empty string as available", () => {
            // Empty string is truthy in our check (value !== undefined && value !== null)
            const data: ShareMessageData = { leagueName: "" };
            expect(isBlockAvailable("league_name", data)).toBe(true);
        });
    });
});

// ============================================================================
// getAvailableBlocks Tests
// ============================================================================

describe("getAvailableBlocks", () => {
    it("returns empty array when no data provided", () => {
        const data: ShareMessageData = {};
        const available = getAvailableBlocks(data);
        expect(available).toEqual([]);
    });

    it("returns only blocks with available data", () => {
        const data: ShareMessageData = {
            totalSteps: 10000,
            dayCount: 5,
        };

        const available = getAvailableBlocks(data);
        expect(available).toContain("total_steps");
        expect(available).toContain("day_count");
        expect(available).not.toContain("date_range");
        expect(available).not.toContain("streak");
    });

    it("returns all blocks when full data provided", () => {
        const data: ShareMessageData = {
            totalSteps: 50000,
            dayCount: 7,
            startDate: "2026-01-01",
            endDate: "2026-01-07",
            averageSteps: 7142,
            dailyBreakdown: [
                { date: "2026-01-01", steps: 8000 },
                { date: "2026-01-02", steps: 9000 },
            ],
            bestDaySteps: 9000,
            bestDayDate: "2026-01-02",
            currentStreak: 14,
            rank: 3,
            totalMembers: 10,
            leagueName: "Test League",
            leagueAverage: 6000,
            previousPeriodSteps: 40000,
            improvementPercent: 25,
        };

        const available = getAvailableBlocks(data);
        expect(available.length).toBe(Object.keys(SHARE_CONTENT_BLOCKS).length);
    });
});

// ============================================================================
// validateBlockSelection Tests
// ============================================================================

describe("validateBlockSelection", () => {
    describe("valid selections", () => {
        it("validates selection with available data", () => {
            const data: ShareMessageData = {
                totalSteps: 10000,
                dayCount: 5,
            };

            const result = validateBlockSelection(["total_steps", "day_count"], data);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("validates selection with dependencies met", () => {
            const data: ShareMessageData = {
                rank: 3,
                leagueName: "Test League",
            };

            const result = validateBlockSelection(["rank", "league_name"], data);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("validates empty selection", () => {
            const data: ShareMessageData = {};
            const result = validateBlockSelection([], data);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe("invalid selections", () => {
        it("fails when required data is missing", () => {
            const data: ShareMessageData = {};

            const result = validateBlockSelection(["total_steps"], data);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain("Total Steps");
        });

        it("fails when dependency is not selected", () => {
            const data: ShareMessageData = {
                rank: 3,
                leagueName: "Test League",
            };

            // league_name requires rank, but rank is not selected
            const result = validateBlockSelection(["league_name"], data);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('"League Name" requires "League Rank" to be selected');
        });

        it("returns multiple errors for multiple issues", () => {
            const data: ShareMessageData = {};

            const result = validateBlockSelection(
                ["total_steps", "streak", "rank"],
                data
            );
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBe(3);
        });
    });
});

// ============================================================================
// getBlocksGroupedByCategory Tests
// ============================================================================

describe("getBlocksGroupedByCategory", () => {
    it("returns object with all three categories", () => {
        const grouped = getBlocksGroupedByCategory();
        expect(grouped).toHaveProperty("basic");
        expect(grouped).toHaveProperty("detailed");
        expect(grouped).toHaveProperty("comparison");
    });

    it("each category is an array", () => {
        const grouped = getBlocksGroupedByCategory();
        expect(Array.isArray(grouped.basic)).toBe(true);
        expect(Array.isArray(grouped.detailed)).toBe(true);
        expect(Array.isArray(grouped.comparison)).toBe(true);
    });

    it("blocks in each category have correct category property", () => {
        const grouped = getBlocksGroupedByCategory();

        grouped.basic.forEach((block) => {
            expect(block.category).toBe("basic");
        });

        grouped.detailed.forEach((block) => {
            expect(block.category).toBe("detailed");
        });

        grouped.comparison.forEach((block) => {
            expect(block.category).toBe("comparison");
        });
    });
});

// ============================================================================
// Edge Cases & Negative Tests
// ============================================================================

describe("Edge Cases", () => {
    it("handles ShareMessageData with only partial data", () => {
        const data: ShareMessageData = {
            totalSteps: 10000,
            // Only totalSteps, nothing else
        };

        const available = getAvailableBlocks(data);
        expect(available).toContain("total_steps");
        expect(available).not.toContain("average");
        expect(available).not.toContain("streak");
    });

    it("handles zero-length dailyBreakdown array", () => {
        const data: ShareMessageData = {
            dailyBreakdown: [],
        };

        // Empty array is technically available (not undefined)
        expect(isBlockAvailable("individual_days", data)).toBe(true);
    });

    it("handles very large numbers", () => {
        const data: ShareMessageData = {
            totalSteps: 999999999,
            improvementPercent: 10000,
        };

        expect(isBlockAvailable("total_steps", data)).toBe(true);
        expect(isBlockAvailable("improvement", data)).toBe(true);
    });

    it("handles negative improvement percentage", () => {
        const data: ShareMessageData = {
            improvementPercent: -50,
        };

        expect(isBlockAvailable("improvement", data)).toBe(true);
    });
});

// ============================================================================
// Type Safety Tests (compile-time verified, runtime documentation)
// ============================================================================

describe("Type Safety", () => {
    it("ShareContentBlock type includes all block IDs", () => {
        const blocks: ShareContentBlock[] = [
            "total_steps",
            "day_count",
            "date_range",
            "average",
            "individual_days",
            "best_day",
            "streak",
            "rank",
            "league_name",
            "improvement",
            "comparison_self",
            "comparison_league",
        ];

        blocks.forEach((block) => {
            expect(SHARE_CONTENT_BLOCKS[block]).toBeDefined();
        });
    });

    it("ShareContentCategory type includes all categories", () => {
        const categories: ShareContentCategory[] = ["basic", "detailed", "comparison"];

        categories.forEach((category) => {
            expect(SHARE_CONTENT_CATEGORIES[category]).toBeDefined();
        });
    });
});
