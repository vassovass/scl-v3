/**
 * Trend Calculations Tests (PRD-54)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    generatePeriodRanges,
    aggregateByPeriod,
    calculateTrendSummary,
    generateComparisonData,
    formatForChart,
    getTrendEmoji,
    formatPercentChange,
} from "../calculations";

describe("generatePeriodRanges", () => {
    const fixedDate = new Date("2026-01-15T12:00:00Z");

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(fixedDate);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("generates daily ranges", () => {
        const ranges = generatePeriodRanges("daily", 7, fixedDate);

        expect(ranges).toHaveLength(7);
        expect(ranges[6].label).toBe("Thu"); // Jan 15, 2026 is Thursday
        expect(ranges[0].label).toBe("Fri"); // Jan 9, 2026 is Friday
    });

    it("generates weekly ranges", () => {
        const ranges = generatePeriodRanges("weekly", 4, fixedDate);

        expect(ranges).toHaveLength(4);
        expect(ranges[3].label).toBe("This Week");
        expect(ranges[2].label).toBe("Last Week");
        expect(ranges[1].label).toBe("Week -2");
    });

    it("generates monthly ranges", () => {
        const ranges = generatePeriodRanges("monthly", 3, fixedDate);

        expect(ranges).toHaveLength(3);
        expect(ranges[2].label).toBe("Jan"); // January
        expect(ranges[1].label).toBe("Dec"); // December
        expect(ranges[0].label).toBe("Nov"); // November
    });
});

describe("aggregateByPeriod", () => {
    it("aggregates submissions by period", () => {
        const submissions = [
            { for_date: "2026-01-13", steps: 10000, calories: 500 },
            { for_date: "2026-01-14", steps: 12000, calories: 600 },
            { for_date: "2026-01-15", steps: 8000, calories: 400 },
        ];

        const ranges = [
            {
                start: new Date("2026-01-13"),
                end: new Date("2026-01-15"),
                label: "This Week",
            },
        ];

        const result = aggregateByPeriod(submissions, ranges, "steps");

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(30000); // 10000 + 12000 + 8000
        expect(result[0].daysWithData).toBe(3);
    });

    it("dedupes by date taking highest value", () => {
        const submissions = [
            { for_date: "2026-01-15", steps: 5000 },
            { for_date: "2026-01-15", steps: 8000 }, // Should take this one
            { for_date: "2026-01-15", steps: 6000 },
        ];

        const ranges = [
            {
                start: new Date("2026-01-15"),
                end: new Date("2026-01-15"),
                label: "Today",
            },
        ];

        const result = aggregateByPeriod(submissions, ranges, "steps");

        expect(result[0].value).toBe(8000);
        expect(result[0].daysWithData).toBe(1);
    });

    it("handles empty submissions", () => {
        const ranges = [
            {
                start: new Date("2026-01-15"),
                end: new Date("2026-01-15"),
                label: "Today",
            },
        ];

        const result = aggregateByPeriod([], ranges, "steps");

        expect(result[0].value).toBe(0);
        expect(result[0].daysWithData).toBe(0);
    });

    it("aggregates calories correctly", () => {
        const submissions = [
            { for_date: "2026-01-15", steps: 10000, calories: 500 },
            { for_date: "2026-01-16", steps: 8000, calories: 400 },
        ];

        const ranges = [
            {
                start: new Date("2026-01-15"),
                end: new Date("2026-01-16"),
                label: "Period",
            },
        ];

        const result = aggregateByPeriod(submissions, ranges, "calories");

        expect(result[0].value).toBe(900); // 500 + 400
    });
});

describe("calculateTrendSummary", () => {
    it("calculates summary statistics", () => {
        const data = [
            { label: "Week 1", value: 50000, date: "2026-01-01", periodStart: "2026-01-01", periodEnd: "2026-01-07", daysWithData: 7, totalDays: 7 },
            { label: "Week 2", value: 60000, date: "2026-01-08", periodStart: "2026-01-08", periodEnd: "2026-01-14", daysWithData: 7, totalDays: 7 },
            { label: "Week 3", value: 55000, date: "2026-01-15", periodStart: "2026-01-15", periodEnd: "2026-01-21", daysWithData: 7, totalDays: 7 },
            { label: "Week 4", value: 70000, date: "2026-01-22", periodStart: "2026-01-22", periodEnd: "2026-01-28", daysWithData: 7, totalDays: 7 },
        ];

        const summary = calculateTrendSummary(data);

        expect(summary.total).toBe(235000);
        expect(summary.average).toBe(58750);
        expect(summary.best).toBe(70000);
        expect(summary.bestPeriod).toBe("Week 4");
        expect(summary.worst).toBe(50000);
        expect(summary.worstPeriod).toBe("Week 1");
        expect(summary.trend).toBe("up");
        expect(summary.percentChange).toBe(40); // (70000 - 50000) / 50000 * 100
    });

    it("identifies downward trend", () => {
        const data = [
            { label: "Week 1", value: 70000, date: "2026-01-01", periodStart: "2026-01-01", periodEnd: "2026-01-07", daysWithData: 7, totalDays: 7 },
            { label: "Week 2", value: 50000, date: "2026-01-08", periodStart: "2026-01-08", periodEnd: "2026-01-14", daysWithData: 7, totalDays: 7 },
        ];

        const summary = calculateTrendSummary(data);

        expect(summary.trend).toBe("down");
        expect(summary.percentChange).toBe(-29); // Rounded
    });

    it("identifies stable trend", () => {
        const data = [
            { label: "Week 1", value: 50000, date: "2026-01-01", periodStart: "2026-01-01", periodEnd: "2026-01-07", daysWithData: 7, totalDays: 7 },
            { label: "Week 2", value: 51000, date: "2026-01-08", periodStart: "2026-01-08", periodEnd: "2026-01-14", daysWithData: 7, totalDays: 7 },
        ];

        const summary = calculateTrendSummary(data);

        expect(summary.trend).toBe("stable");
    });

    it("handles empty data", () => {
        const summary = calculateTrendSummary([]);

        expect(summary.total).toBe(0);
        expect(summary.average).toBe(0);
        expect(summary.trend).toBe("stable");
    });
});

describe("generateComparisonData", () => {
    it("generates comparison data with percent change", () => {
        const currentData = [
            { label: "Week 1", value: 60000, date: "2026-01-08", periodStart: "2026-01-08", periodEnd: "2026-01-14", daysWithData: 7, totalDays: 7 },
        ];

        const comparisonData = [
            { label: "Week 1", value: 50000, date: "2026-01-01", periodStart: "2026-01-01", periodEnd: "2026-01-07", daysWithData: 7, totalDays: 7 },
        ];

        const result = generateComparisonData(currentData, comparisonData);

        expect(result[0].comparisonValue).toBe(50000);
        expect(result[0].percentChange).toBe(20); // (60000 - 50000) / 50000 * 100
    });
});

describe("formatForChart", () => {
    it("formats data for chart display", () => {
        const data = [
            { label: "Week 1", value: 50000, date: "2026-01-01", periodStart: "2026-01-01", periodEnd: "2026-01-07", daysWithData: 7, totalDays: 7 },
            { label: "Week 2", value: 60000, date: "2026-01-08", periodStart: "2026-01-08", periodEnd: "2026-01-14", daysWithData: 7, totalDays: 7 },
        ];

        const result = formatForChart(data);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            label: "Week 1",
            value: 50000,
            date: "2026-01-01",
            comparisonValue: undefined,
        });
    });

    it("includes comparison values when requested", () => {
        const data = [
            { label: "Week 1", value: 60000, date: "2026-01-08", periodStart: "2026-01-08", periodEnd: "2026-01-14", daysWithData: 7, totalDays: 7 },
        ];

        const comparisonData = [
            { label: "Week 1", value: 50000, date: "2026-01-01", periodStart: "2026-01-01", periodEnd: "2026-01-07", daysWithData: 7, totalDays: 7 },
        ];

        const result = formatForChart(data, {
            showComparison: true,
            comparisonData,
        });

        expect(result[0].comparisonValue).toBe(50000);
    });
});

describe("getTrendEmoji", () => {
    it("returns correct emoji for each trend", () => {
        expect(getTrendEmoji("up")).toBe("📈");
        expect(getTrendEmoji("down")).toBe("📉");
        expect(getTrendEmoji("stable")).toBe("➡️");
    });
});

describe("formatPercentChange", () => {
    it("formats positive change with plus sign", () => {
        expect(formatPercentChange(25)).toBe("+25%");
    });

    it("formats negative change", () => {
        expect(formatPercentChange(-15)).toBe("-15%");
    });

    it("formats zero change", () => {
        expect(formatPercentChange(0)).toBe("0%");
    });
});
