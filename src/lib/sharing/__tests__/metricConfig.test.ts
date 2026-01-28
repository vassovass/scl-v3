/**
 * Metric Configuration Tests (PRD-51)
 *
 * Tests for the metric configuration system that powers share cards.
 * Follows modular design principles - each config is isolated and testable.
 *
 * Design System Thinking:
 * - METRIC_CONFIGS defines the visual language for metrics (colors, emojis, formatting)
 * - CARD_TYPE_CONFIGS defines the share card taxonomy
 * - Utility functions provide consistent formatting across the app
 *
 * Future-Proofing (PRD-48):
 * - Tests cover all metric types, including placeholders for future activities
 * - formatValue is metric-specific to handle different display needs
 */

import { describe, it, expect } from "vitest";
import {
    METRIC_CONFIGS,
    CARD_TYPE_CONFIGS,
    getMetricConfig,
    getCardTypeConfig,
    formatWithUnit,
    getMetricEmoji,
    getMetricGradient,
    getCardTypeOptions,
    getMetricTypeOptions,
    type MetricType,
    type CardType,
} from "../metricConfig";

// ============================================================================
// METRIC_CONFIGS Tests
// ============================================================================

describe("METRIC_CONFIGS", () => {
    it("contains all expected metric types", () => {
        const expectedTypes: MetricType[] = [
            "steps",
            "calories",
            "slp",
            "distance",
            "swimming",
            "cycling",
            "running",
        ];

        expectedTypes.forEach((type) => {
            expect(METRIC_CONFIGS[type]).toBeDefined();
        });
    });

    it("each metric has required fields", () => {
        Object.values(METRIC_CONFIGS).forEach((config) => {
            expect(config.type).toBeTruthy();
            expect(config.displayName).toBeTruthy();
            expect(config.unit).toBeTruthy();
            expect(config.unitPlural).toBeTruthy();
            expect(config.emoji).toBeTruthy();
            expect(config.gradient).toBeTruthy();
            expect(config.gradientDark).toBeTruthy();
            expect(typeof config.formatValue).toBe("function");
        });
    });

    it("steps config has correct values", () => {
        const steps = METRIC_CONFIGS.steps;
        expect(steps.displayName).toBe("Steps");
        expect(steps.unit).toBe("step");
        expect(steps.unitPlural).toBe("steps");
        expect(steps.emoji).toBe("🚶");
    });

    it("formatValue handles different metric types correctly", () => {
        // Steps: locale string (format varies by locale, check it's a string with digits)
        const stepsFormatted = METRIC_CONFIGS.steps.formatValue(12345);
        expect(stepsFormatted).toMatch(/12.?345/); // Allows comma, space, or no separator

        // Distance: fixed decimal (8.5)
        expect(METRIC_CONFIGS.distance.formatValue(8.5)).toBe("8.5");

        // Calories: locale string
        const caloriesFormatted = METRIC_CONFIGS.calories.formatValue(1500);
        expect(caloriesFormatted).toMatch(/1.?500/);
    });
});

// ============================================================================
// CARD_TYPE_CONFIGS Tests
// ============================================================================

describe("CARD_TYPE_CONFIGS", () => {
    it("contains all expected card types", () => {
        const expectedTypes: CardType[] = [
            "daily",
            "weekly",
            "personal_best",
            "streak",
            "rank",
            "challenge",
            "rank_change",
        ];

        expectedTypes.forEach((type) => {
            expect(CARD_TYPE_CONFIGS[type]).toBeDefined();
        });
    });

    it("each card type has required fields", () => {
        Object.values(CARD_TYPE_CONFIGS).forEach((config) => {
            expect(config.type).toBeTruthy();
            expect(config.label).toBeTruthy();
            expect(config.description).toBeTruthy();
            expect(config.emoji).toBeTruthy();
            expect(config.defaultMetric).toBeTruthy();
        });
    });

    it("all card types default to steps metric", () => {
        // Per design decision, all cards default to steps until PRD-48
        Object.values(CARD_TYPE_CONFIGS).forEach((config) => {
            expect(config.defaultMetric).toBe("steps");
        });
    });

    it("challenge card has motivating description", () => {
        expect(CARD_TYPE_CONFIGS.challenge.description).toContain("friends");
    });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe("getMetricConfig", () => {
    it("returns correct config for valid type", () => {
        const config = getMetricConfig("steps");
        expect(config.type).toBe("steps");
        expect(config.displayName).toBe("Steps");
    });

    it("falls back to steps for unknown type", () => {
        // @ts-expect-error Testing invalid input
        const config = getMetricConfig("unknown");
        expect(config.type).toBe("steps");
    });
});

describe("getCardTypeConfig", () => {
    it("returns correct config for valid type", () => {
        const config = getCardTypeConfig("challenge");
        expect(config.type).toBe("challenge");
        expect(config.emoji).toBe("💪");
    });

    it("falls back to daily for unknown type", () => {
        // @ts-expect-error Testing invalid input
        const config = getCardTypeConfig("unknown");
        expect(config.type).toBe("daily");
    });
});

describe("formatWithUnit", () => {
    it("formats steps with correct pluralization", () => {
        expect(formatWithUnit(1, "steps")).toBe("1 step");
        // Locale-agnostic check (comma or space separator)
        expect(formatWithUnit(12345, "steps")).toMatch(/12.?345 steps/);
    });

    it("formats distance with decimal", () => {
        expect(formatWithUnit(8.5, "distance")).toBe("8.5 km");
    });

    it("formats calories", () => {
        expect(formatWithUnit(500, "calories")).toBe("500 kcal");
    });

    it("handles zero values", () => {
        expect(formatWithUnit(0, "steps")).toBe("0 steps");
    });
});

describe("getMetricEmoji", () => {
    it("returns correct emoji for each metric", () => {
        expect(getMetricEmoji("steps")).toBe("🚶");
        expect(getMetricEmoji("calories")).toBe("🔥");
        expect(getMetricEmoji("swimming")).toBe("🏊");
        expect(getMetricEmoji("cycling")).toBe("🚴");
        expect(getMetricEmoji("running")).toBe("🏃");
    });
});

describe("getMetricGradient", () => {
    it("returns light gradient by default", () => {
        const gradient = getMetricGradient("steps");
        expect(gradient).toBe("from-sky-500 to-emerald-500");
    });

    it("returns dark gradient when requested", () => {
        const gradient = getMetricGradient("steps", true);
        expect(gradient).toBe("from-sky-600 to-emerald-600");
    });

    it("returns different gradients for different metrics", () => {
        const stepsGradient = getMetricGradient("steps");
        const caloriesGradient = getMetricGradient("calories");
        expect(stepsGradient).not.toBe(caloriesGradient);
    });
});

// ============================================================================
// Options Generators (for UI selectors)
// ============================================================================

describe("getCardTypeOptions", () => {
    it("returns all card types as options", () => {
        const options = getCardTypeOptions();
        expect(options.length).toBe(Object.keys(CARD_TYPE_CONFIGS).length);
    });

    it("each option has value, label, and emoji", () => {
        const options = getCardTypeOptions();
        options.forEach((option) => {
            expect(option.value).toBeTruthy();
            expect(option.label).toBeTruthy();
            expect(option.emoji).toBeTruthy();
        });
    });

    it("options can be used in a select component", () => {
        const options = getCardTypeOptions();
        const dailyOption = options.find((o) => o.value === "daily");
        expect(dailyOption?.label).toBe("Daily");
    });
});

describe("getMetricTypeOptions", () => {
    it("returns all metric types as options", () => {
        const options = getMetricTypeOptions();
        expect(options.length).toBe(Object.keys(METRIC_CONFIGS).length);
    });

    it("uses displayName as label", () => {
        const options = getMetricTypeOptions();
        const stepsOption = options.find((o) => o.value === "steps");
        expect(stepsOption?.label).toBe("Steps");
    });
});

// ============================================================================
// Design System Consistency Tests
// ============================================================================

describe("Design System Consistency", () => {
    it("all gradients follow Tailwind pattern", () => {
        Object.values(METRIC_CONFIGS).forEach((config) => {
            expect(config.gradient).toMatch(/^from-\w+-\d+ to-\w+-\d+$/);
            expect(config.gradientDark).toMatch(/^from-\w+-\d+ to-\w+-\d+$/);
        });
    });

    it("emojis are single characters or emoji sequences", () => {
        Object.values(METRIC_CONFIGS).forEach((config) => {
            // Emojis should be 1-4 code points
            expect(config.emoji.length).toBeLessThanOrEqual(4);
        });
    });

    it("labels are title case and concise", () => {
        Object.values(CARD_TYPE_CONFIGS).forEach((config) => {
            expect(config.label.length).toBeLessThanOrEqual(20);
            expect(config.label[0]).toBe(config.label[0].toUpperCase());
        });
    });
});
