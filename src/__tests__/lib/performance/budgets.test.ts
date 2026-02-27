import { describe, it, expect } from "vitest";
import {
    PERFORMANCE_BUDGETS,
    isViolation,
    getViolations,
    type VitalMetric,
} from "@/lib/performance/budgets";

describe("Performance Budgets", () => {
    describe("PERFORMANCE_BUDGETS", () => {
        it("defines all three Core Web Vitals", () => {
            expect(PERFORMANCE_BUDGETS).toHaveProperty("LCP");
            expect(PERFORMANCE_BUDGETS).toHaveProperty("INP");
            expect(PERFORMANCE_BUDGETS).toHaveProperty("CLS");
        });

        it("has numeric thresholds for all metrics", () => {
            expect(typeof PERFORMANCE_BUDGETS.LCP).toBe("number");
            expect(typeof PERFORMANCE_BUDGETS.INP).toBe("number");
            expect(typeof PERFORMANCE_BUDGETS.CLS).toBe("number");
        });

        it("LCP budget is 3500ms (SA mobile allowance)", () => {
            expect(PERFORMANCE_BUDGETS.LCP).toBe(3500);
        });

        it("INP budget is 250ms", () => {
            expect(PERFORMANCE_BUDGETS.INP).toBe(250);
        });

        it("CLS budget is 0.1", () => {
            expect(PERFORMANCE_BUDGETS.CLS).toBe(0.1);
        });
    });

    describe("isViolation", () => {
        it("returns true when value exceeds budget", () => {
            expect(isViolation("LCP", 4000)).toBe(true);
            expect(isViolation("INP", 300)).toBe(true);
            expect(isViolation("CLS", 0.2)).toBe(true);
        });

        it("returns false when value is within budget", () => {
            expect(isViolation("LCP", 2000)).toBe(false);
            expect(isViolation("INP", 100)).toBe(false);
            expect(isViolation("CLS", 0.05)).toBe(false);
        });

        it("returns false when value equals budget exactly", () => {
            expect(isViolation("LCP", 3500)).toBe(false);
            expect(isViolation("INP", 250)).toBe(false);
            expect(isViolation("CLS", 0.1)).toBe(false);
        });
    });

    describe("getViolations", () => {
        it("returns empty array when all metrics within budget", () => {
            const result = getViolations({ LCP: 2000, INP: 100, CLS: 0.05 });
            expect(result).toEqual([]);
        });

        it("returns violations for metrics exceeding budget", () => {
            const result = getViolations({ LCP: 5000, INP: 100, CLS: 0.3 });
            expect(result).toHaveLength(2);
            expect(result).toContainEqual({
                metric: "LCP",
                value: 5000,
                budget: 3500,
            });
            expect(result).toContainEqual({
                metric: "CLS",
                value: 0.3,
                budget: 0.1,
            });
        });

        it("handles partial measurements", () => {
            const result = getViolations({ LCP: 5000 });
            expect(result).toHaveLength(1);
            expect(result[0].metric).toBe("LCP");
        });

        it("handles empty measurements", () => {
            const result = getViolations({});
            expect(result).toEqual([]);
        });
    });
});
