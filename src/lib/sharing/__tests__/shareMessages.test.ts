/**
 * Share Messages Tests (PRD-51)
 *
 * Tests for the share message generation system.
 * Messages are designed for WhatsApp optimization (<100 chars, emoji, hashtag).
 *
 * Systems Thinking:
 * - Messages must work across platforms (WhatsApp, Twitter, SMS)
 * - Character limits are enforced to prevent truncation
 * - Custom messages are safely truncated
 *
 * Design Patterns:
 * - Strategy pattern: each card type has its own message template
 * - Builder pattern: generateShareMessage composes text + hashtag
 */

import { describe, it, expect } from "vitest";
import {
    generateShareMessage,
    dailyMessage,
    weeklyMessage,
    personalBestMessage,
    streakMessage,
    rankMessage,
    challengeMessage,
    rankChangeMessage,
    getStreakMilestoneMessage,
    getPersonalBestMessage,
    getRankChangeMessage,
    type ShareData,
} from "../shareMessages";

// ============================================================================
// generateShareMessage Tests
// ============================================================================

describe("generateShareMessage", () => {
    describe("daily card", () => {
        it("generates correct message for daily steps", () => {
            const result = generateShareMessage("daily", {
                metricType: "steps",
                value: 12345,
            });

            // Locale-agnostic: check for digits (with possible separator)
            expect(result.text).toMatch(/12.?345/);
            expect(result.text).toContain("today");
            expect(result.text).toContain("🚶");
            expect(result.hashtag).toBe("#StepLeague");
            expect(result.fullMessage).toContain("#StepLeague");
        });
    });

    describe("weekly card", () => {
        it("generates basic weekly message", () => {
            const result = generateShareMessage("weekly", {
                metricType: "steps",
                value: 87000,
            });

            expect(result.text).toMatch(/87.?000/);
            expect(result.text).toContain("week");
        });

        it("includes average when provided", () => {
            const result = generateShareMessage("weekly", {
                metricType: "steps",
                value: 70000,
                average: 10000,
            });

            expect(result.text).toMatch(/avg 10.?000\/day/);
        });
    });

    describe("personal_best card", () => {
        it("generates celebratory message", () => {
            const result = generateShareMessage("personal_best", {
                metricType: "steps",
                value: 25000,
            });

            expect(result.text).toContain("NEW PERSONAL BEST");
            expect(result.text).toMatch(/25.?000/);
        });
    });

    describe("streak card", () => {
        it("includes streak days when provided", () => {
            const result = generateShareMessage("streak", {
                metricType: "steps",
                value: 0,
                streakDays: 14,
            });

            expect(result.text).toContain("14 days in a row");
        });

        it("falls back to generic message without streak days", () => {
            const result = generateShareMessage("streak", {
                metricType: "steps",
                value: 0,
            });

            expect(result.text).toContain("On a streak");
        });
    });

    describe("rank card", () => {
        it("includes rank and league name", () => {
            const result = generateShareMessage("rank", {
                metricType: "steps",
                value: 15000,
                rank: 3,
                leagueName: "Family Steps",
            });

            expect(result.text).toContain("#3");
            expect(result.text).toContain("Family Steps");
        });

        it("works with just rank", () => {
            const result = generateShareMessage("rank", {
                metricType: "steps",
                value: 15000,
                rank: 5,
            });

            expect(result.text).toContain("Ranked #5");
        });
    });

    describe("challenge card", () => {
        it("generates challenge message", () => {
            const result = generateShareMessage("challenge", {
                metricType: "steps",
                value: 10000,
            });

            expect(result.text).toContain("Can you beat");
            expect(result.text).toMatch(/10.?000/);
        });
    });

    describe("rank_change card", () => {
        it("shows rank movement", () => {
            const result = generateShareMessage("rank_change", {
                metricType: "steps",
                value: 0,
                oldRank: 10,
                newRank: 5,
            });

            expect(result.text).toContain("#10");
            expect(result.text).toContain("#5");
        });

        it("shows improvement percentage when no ranks", () => {
            const result = generateShareMessage("rank_change", {
                metricType: "steps",
                value: 0,
                improvementPct: 25,
            });

            expect(result.text).toContain("25%");
        });
    });

    describe("custom message handling", () => {
        it("prepends custom message", () => {
            const result = generateShareMessage("daily", {
                metricType: "steps",
                value: 10000,
                customMessage: "Morning walk!",
            });

            expect(result.text).toContain("Morning walk!");
        });

        it("truncates long custom messages", () => {
            const longMessage = "A".repeat(100);
            const result = generateShareMessage("daily", {
                metricType: "steps",
                value: 10000,
                customMessage: longMessage,
            });

            expect(result.text.length).toBeLessThan(200);
            expect(result.text).toContain("...");
        });
    });

    describe("different metric types", () => {
        it("works with calories", () => {
            const result = generateShareMessage("daily", {
                metricType: "calories",
                value: 2500,
            });

            expect(result.text).toMatch(/2.?500/);
            expect(result.text).toContain("🔥");
        });

        it("works with distance", () => {
            const result = generateShareMessage("daily", {
                metricType: "distance",
                value: 8.5,
            });

            expect(result.text).toContain("8.5");
        });
    });
});

// ============================================================================
// Quick Message Generator Tests
// ============================================================================

describe("Quick Message Generators", () => {
    describe("dailyMessage", () => {
        it("returns full message with hashtag", () => {
            const msg = dailyMessage(10000);
            expect(msg).toMatch(/10.?000/);
            expect(msg).toContain("#StepLeague");
        });
    });

    describe("weeklyMessage", () => {
        it("works without average", () => {
            const msg = weeklyMessage(70000);
            expect(msg).toMatch(/70.?000/);
        });

        it("works with average", () => {
            const msg = weeklyMessage(70000, 10000);
            expect(msg).toContain("avg");
        });
    });

    describe("personalBestMessage", () => {
        it("generates personal best message", () => {
            const msg = personalBestMessage(25000);
            expect(msg).toContain("PERSONAL BEST");
        });
    });

    describe("streakMessage", () => {
        it("includes streak days", () => {
            const msg = streakMessage(7);
            expect(msg).toContain("7 days");
        });
    });

    describe("rankMessage", () => {
        it("includes league name when provided", () => {
            const msg = rankMessage(1, 20000, "Champions");
            expect(msg).toContain("#1");
            expect(msg).toContain("Champions");
        });
    });

    describe("challengeMessage", () => {
        it("creates challenge message", () => {
            const msg = challengeMessage(15000);
            expect(msg).toContain("beat");
            expect(msg).toMatch(/15.?000/);
        });
    });

    describe("rankChangeMessage", () => {
        it("shows both ranks", () => {
            const msg = rankChangeMessage(8, 3);
            expect(msg).toContain("#8");
            expect(msg).toContain("#3");
        });
    });
});

// ============================================================================
// Milestone Message Tests
// ============================================================================

describe("Milestone Messages", () => {
    describe("getStreakMilestoneMessage", () => {
        it("returns message for 7-day streak", () => {
            const milestone = getStreakMilestoneMessage(7);
            expect(milestone).not.toBeNull();
            expect(milestone?.title).toContain("Week");
            expect(milestone?.emoji).toBe("🔥");
        });

        it("returns message for 14-day streak", () => {
            const milestone = getStreakMilestoneMessage(14);
            expect(milestone?.title).toContain("2 Week");
        });

        it("returns message for 30-day streak", () => {
            const milestone = getStreakMilestoneMessage(30);
            expect(milestone?.title).toContain("30 Day");
        });

        it("returns message for 100-day streak (centurion)", () => {
            const milestone = getStreakMilestoneMessage(100);
            expect(milestone?.title).toContain("Centurion");
            expect(milestone?.emoji).toBe("💯");
        });

        it("returns null for non-milestone days", () => {
            expect(getStreakMilestoneMessage(5)).toBeNull();
            expect(getStreakMilestoneMessage(15)).toBeNull();
            expect(getStreakMilestoneMessage(50)).toBeNull();
        });
    });

    describe("getPersonalBestMessage", () => {
        it("calculates improvement", () => {
            const milestone = getPersonalBestMessage(15000, 12000);
            expect(milestone.type).toBe("personal_best");
            expect(milestone.message).toMatch(/3.?000/);
            expect(milestone.emoji).toBe("🏆");
        });

        it("works with different metrics", () => {
            const milestone = getPersonalBestMessage(10.5, 9.0, "distance");
            expect(milestone.message).toContain("1.5");
        });
    });

    describe("getRankChangeMessage", () => {
        it("celebrates 2+ position jumps", () => {
            const milestone = getRankChangeMessage(10, 5);
            expect(milestone).not.toBeNull();
            expect(milestone?.message).toContain("5 positions");
        });

        it("returns null for single position change", () => {
            const milestone = getRankChangeMessage(5, 4);
            expect(milestone).toBeNull();
        });

        it("includes league name when provided", () => {
            const milestone = getRankChangeMessage(10, 5, "World League");
            expect(milestone?.message).toContain("World League");
        });
    });
});

// ============================================================================
// Message Constraints Tests (WhatsApp Optimization)
// ============================================================================

describe("Message Constraints", () => {
    const cardTypes = [
        "daily",
        "weekly",
        "personal_best",
        "streak",
        "rank",
        "challenge",
        "rank_change",
    ] as const;

    cardTypes.forEach((cardType) => {
        it(`${cardType} message is under 150 chars (WhatsApp preview)`, () => {
            const data: ShareData = {
                metricType: "steps",
                value: 99999,
                rank: 1,
                leagueName: "Test League",
                streakDays: 100,
            };

            const result = generateShareMessage(cardType, data);
            expect(result.fullMessage.length).toBeLessThan(150);
        });
    });

    it("includes emoji in all messages", () => {
        cardTypes.forEach((cardType) => {
            const result = generateShareMessage(cardType, {
                metricType: "steps",
                value: 10000,
            });

            // Check for emoji presence (simplified check)
            expect(result.text).toMatch(/[\u{1F300}-\u{1F9FF}]/u);
        });
    });

    it("always includes hashtag in full message", () => {
        cardTypes.forEach((cardType) => {
            const result = generateShareMessage(cardType, {
                metricType: "steps",
                value: 10000,
            });

            expect(result.fullMessage).toContain("#");
        });
    });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe("Edge Cases", () => {
    it("handles zero value", () => {
        const result = generateShareMessage("daily", {
            metricType: "steps",
            value: 0,
        });

        expect(result.text).toContain("0");
    });

    it("handles very large numbers", () => {
        const result = generateShareMessage("daily", {
            metricType: "steps",
            value: 1000000,
        });

        // Locale-agnostic: 1000000 with optional separators
        expect(result.text).toMatch(/1.?000.?000/);
    });

    it("handles decimal values for distance", () => {
        const result = generateShareMessage("daily", {
            metricType: "distance",
            value: 0.5,
        });

        expect(result.text).toContain("0.5");
    });

    it("handles missing optional fields gracefully", () => {
        // Rank without league name
        const rankResult = generateShareMessage("rank", {
            metricType: "steps",
            value: 10000,
        });
        expect(rankResult.text).toBeTruthy();

        // Rank change without old/new rank
        const changeResult = generateShareMessage("rank_change", {
            metricType: "steps",
            value: 0,
        });
        expect(changeResult.text).toContain("Climbing");
    });
});
