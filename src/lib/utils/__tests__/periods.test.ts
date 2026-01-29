/**
 * Period Utilities Tests (PRD-54)
 *
 * Tests for date period calculations, custom ranges, and day type filtering.
 * These utilities power the custom date range sharing feature.
 *
 * Design Principles:
 * - All date handling uses YYYY-MM-DD string format for consistency
 * - Week starts on Monday (ISO 8601)
 * - Day type filtering enables weekend vs weekday comparisons
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    presetToDateRange,
    customRangeToDateRange,
    formatCustomPeriodLabel,
    calculateDaysBetween,
    getDatesBetween,
    isWeekend,
    isWeekday,
    filterByDayType,
    getDayOfWeekName,
    getDayOfWeekShort,
    getPresetLabel,
    RELATIVE_DATE_SHORTCUTS,
    calculateStreak,
    type PeriodPreset,
    type DayType,
} from "../periods";

// ============================================================================
// Custom Range Utilities (PRD-54)
// ============================================================================

describe("customRangeToDateRange", () => {
    it("returns valid DateRange for correct inputs", () => {
        const result = customRangeToDateRange("2026-01-01", "2026-01-31");
        expect(result).toEqual({ start: "2026-01-01", end: "2026-01-31" });
    });

    it("returns null for invalid date format", () => {
        expect(customRangeToDateRange("01-01-2026", "2026-01-31")).toBeNull();
        expect(customRangeToDateRange("2026/01/01", "2026/01/31")).toBeNull();
        expect(customRangeToDateRange("invalid", "2026-01-31")).toBeNull();
    });

    it("returns null when start is after end", () => {
        expect(customRangeToDateRange("2026-01-31", "2026-01-01")).toBeNull();
    });

    it("accepts same day for start and end", () => {
        const result = customRangeToDateRange("2026-01-15", "2026-01-15");
        expect(result).toEqual({ start: "2026-01-15", end: "2026-01-15" });
    });
});

describe("formatCustomPeriodLabel", () => {
    it("formats same day as single date", () => {
        expect(formatCustomPeriodLabel("2026-01-15", "2026-01-15")).toBe("Jan 15");
    });

    it("formats same month with day range", () => {
        expect(formatCustomPeriodLabel("2026-01-15", "2026-01-22")).toBe("Jan 15-22");
    });

    it("formats different months in same year", () => {
        expect(formatCustomPeriodLabel("2026-01-15", "2026-02-10")).toBe("Jan 15 - Feb 10");
    });

    it("formats different years with full dates", () => {
        expect(formatCustomPeriodLabel("2025-12-28", "2026-01-05")).toBe(
            "Dec 28, 2025 - Jan 5, 2026"
        );
    });

    it("accepts Date objects", () => {
        const start = new Date("2026-01-15");
        const end = new Date("2026-01-22");
        expect(formatCustomPeriodLabel(start, end)).toBe("Jan 15-22");
    });
});

describe("calculateDaysBetween", () => {
    it("returns 1 for same day", () => {
        expect(calculateDaysBetween("2026-01-15", "2026-01-15")).toBe(1);
    });

    it("calculates days inclusive of both ends", () => {
        expect(calculateDaysBetween("2026-01-01", "2026-01-07")).toBe(7);
        expect(calculateDaysBetween("2026-01-01", "2026-01-31")).toBe(31);
    });

    it("handles month boundaries", () => {
        expect(calculateDaysBetween("2026-01-28", "2026-02-03")).toBe(7);
    });
});

describe("getDatesBetween", () => {
    it("returns single date for same start and end", () => {
        expect(getDatesBetween("2026-01-15", "2026-01-15")).toEqual(["2026-01-15"]);
    });

    it("returns all dates inclusive", () => {
        const dates = getDatesBetween("2026-01-01", "2026-01-05");
        expect(dates).toEqual([
            "2026-01-01",
            "2026-01-02",
            "2026-01-03",
            "2026-01-04",
            "2026-01-05",
        ]);
    });

    it("handles month boundaries", () => {
        const dates = getDatesBetween("2026-01-30", "2026-02-02");
        expect(dates).toEqual(["2026-01-30", "2026-01-31", "2026-02-01", "2026-02-02"]);
    });
});

// ============================================================================
// Day Type Filtering (PRD-54 P-5)
// ============================================================================

describe("isWeekend", () => {
    it("returns true for Saturday", () => {
        // 2026-01-03 is a Saturday
        expect(isWeekend("2026-01-03")).toBe(true);
    });

    it("returns true for Sunday", () => {
        // 2026-01-04 is a Sunday
        expect(isWeekend("2026-01-04")).toBe(true);
    });

    it("returns false for weekdays", () => {
        // 2026-01-05 is Monday
        expect(isWeekend("2026-01-05")).toBe(false);
        // 2026-01-09 is Friday
        expect(isWeekend("2026-01-09")).toBe(false);
    });
});

describe("isWeekday", () => {
    it("returns true for Monday through Friday", () => {
        // 2026-01-05 is Monday
        expect(isWeekday("2026-01-05")).toBe(true);
        // 2026-01-06 is Tuesday
        expect(isWeekday("2026-01-06")).toBe(true);
        // 2026-01-07 is Wednesday
        expect(isWeekday("2026-01-07")).toBe(true);
        // 2026-01-08 is Thursday
        expect(isWeekday("2026-01-08")).toBe(true);
        // 2026-01-09 is Friday
        expect(isWeekday("2026-01-09")).toBe(true);
    });

    it("returns false for weekends", () => {
        expect(isWeekday("2026-01-03")).toBe(false); // Saturday
        expect(isWeekday("2026-01-04")).toBe(false); // Sunday
    });
});

describe("filterByDayType", () => {
    const testDates = [
        "2026-01-03", // Saturday
        "2026-01-04", // Sunday
        "2026-01-05", // Monday
        "2026-01-06", // Tuesday
        "2026-01-09", // Friday
        "2026-01-10", // Saturday
    ];

    it("returns all dates for 'all' type", () => {
        expect(filterByDayType(testDates, "all")).toEqual(testDates);
    });

    it("returns only weekends for 'weekend' type", () => {
        expect(filterByDayType(testDates, "weekend")).toEqual([
            "2026-01-03",
            "2026-01-04",
            "2026-01-10",
        ]);
    });

    it("returns only weekdays for 'weekday' type", () => {
        expect(filterByDayType(testDates, "weekday")).toEqual([
            "2026-01-05",
            "2026-01-06",
            "2026-01-09",
        ]);
    });

    it("handles empty array", () => {
        expect(filterByDayType([], "weekday")).toEqual([]);
    });
});

describe("getDayOfWeekName", () => {
    it("returns full day names", () => {
        expect(getDayOfWeekName("2026-01-05")).toBe("Monday");
        expect(getDayOfWeekName("2026-01-03")).toBe("Saturday");
        expect(getDayOfWeekName("2026-01-04")).toBe("Sunday");
    });
});

describe("getDayOfWeekShort", () => {
    it("returns short day names", () => {
        expect(getDayOfWeekShort("2026-01-05")).toBe("Mon");
        expect(getDayOfWeekShort("2026-01-03")).toBe("Sat");
        expect(getDayOfWeekShort("2026-01-04")).toBe("Sun");
    });
});

// ============================================================================
// Preset Date Ranges
// ============================================================================

describe("presetToDateRange", () => {
    // Use a fixed reference date for consistent tests
    const referenceDate = new Date("2026-01-15T12:00:00");

    it("returns correct range for 'today'", () => {
        const result = presetToDateRange("today", referenceDate);
        expect(result).toEqual({ start: "2026-01-15", end: "2026-01-15" });
    });

    it("returns correct range for 'yesterday'", () => {
        const result = presetToDateRange("yesterday", referenceDate);
        expect(result).toEqual({ start: "2026-01-14", end: "2026-01-14" });
    });

    it("returns correct range for 'last_3_days'", () => {
        const result = presetToDateRange("last_3_days", referenceDate);
        expect(result).toEqual({ start: "2026-01-13", end: "2026-01-15" });
    });

    it("returns correct range for 'last_7_days'", () => {
        const result = presetToDateRange("last_7_days", referenceDate);
        expect(result).toEqual({ start: "2026-01-09", end: "2026-01-15" });
    });

    it("returns correct range for 'last_2_weeks'", () => {
        const result = presetToDateRange("last_2_weeks", referenceDate);
        expect(result).toEqual({ start: "2026-01-02", end: "2026-01-15" });
    });

    it("returns correct range for 'this_week' (Monday-based)", () => {
        // 2026-01-15 is Thursday, so week starts Monday 2026-01-12
        const result = presetToDateRange("this_week", referenceDate);
        expect(result?.start).toBe("2026-01-12"); // Monday
        expect(result?.end).toBe("2026-01-15"); // Up to reference date
    });

    it("returns correct range for 'this_month'", () => {
        const result = presetToDateRange("this_month", referenceDate);
        expect(result?.start).toBe("2026-01-01");
        expect(result?.end).toBe("2026-01-15");
    });

    it("returns null for 'all_time'", () => {
        expect(presetToDateRange("all_time", referenceDate)).toBeNull();
    });

    it("returns null for 'custom'", () => {
        expect(presetToDateRange("custom", referenceDate)).toBeNull();
    });
});

describe("getPresetLabel", () => {
    it("returns human-readable labels", () => {
        expect(getPresetLabel("today")).toBe("Today");
        expect(getPresetLabel("yesterday")).toBe("Yesterday");
        expect(getPresetLabel("this_week")).toBe("This Week");
        expect(getPresetLabel("last_3_days")).toBe("Last 3 Days");
        expect(getPresetLabel("last_2_weeks")).toBe("Last 2 Weeks");
        expect(getPresetLabel("custom")).toBe("Custom");
    });
});

// ============================================================================
// Relative Date Shortcuts
// ============================================================================

describe("RELATIVE_DATE_SHORTCUTS", () => {
    it("contains expected presets for share modal", () => {
        const presets = RELATIVE_DATE_SHORTCUTS.map((s) => s.preset);
        expect(presets).toContain("today");
        expect(presets).toContain("yesterday");
        expect(presets).toContain("last_3_days");
        expect(presets).toContain("this_week");
        expect(presets).toContain("last_week");
        expect(presets).toContain("last_2_weeks");
    });

    it("each shortcut has label and preset", () => {
        RELATIVE_DATE_SHORTCUTS.forEach((shortcut) => {
            expect(shortcut.label).toBeTruthy();
            expect(shortcut.preset).toBeTruthy();
        });
    });
});

// ============================================================================
// Streak Calculation
// ============================================================================

describe("calculateStreak", () => {
    const referenceDate = new Date("2026-01-15T12:00:00");

    it("returns 0 for empty submissions", () => {
        expect(calculateStreak([], referenceDate)).toBe(0);
    });

    it("returns 0 if most recent is not today or yesterday", () => {
        expect(calculateStreak(["2026-01-10", "2026-01-09"], referenceDate)).toBe(0);
    });

    it("counts streak starting from today", () => {
        const dates = ["2026-01-15", "2026-01-14", "2026-01-13"];
        expect(calculateStreak(dates, referenceDate)).toBe(3);
    });

    it("counts streak starting from yesterday", () => {
        const dates = ["2026-01-14", "2026-01-13", "2026-01-12"];
        expect(calculateStreak(dates, referenceDate)).toBe(3);
    });

    it("stops streak on gap", () => {
        const dates = ["2026-01-15", "2026-01-14", "2026-01-12"]; // Gap on 13th
        expect(calculateStreak(dates, referenceDate)).toBe(2);
    });

    it("handles duplicate dates", () => {
        const dates = ["2026-01-15", "2026-01-15", "2026-01-14", "2026-01-13"];
        expect(calculateStreak(dates, referenceDate)).toBe(3);
    });
});
