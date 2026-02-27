/**
 * Performance Budget Configuration
 *
 * Defines acceptable thresholds for Core Web Vitals.
 * SA mobile context: higher LCP allowance (200-600ms RTT to London lhr1).
 *
 * @see https://web.dev/vitals/ — Google Web Vitals reference
 * @see PRD 64: Performance Budgets & RUM
 */

export interface PerformanceBudget {
    /** Largest Contentful Paint — how fast main content loads (ms) */
    LCP: number;
    /** Interaction to Next Paint — how responsive interactions feel (ms) */
    INP: number;
    /** Cumulative Layout Shift — how stable the layout is (unitless) */
    CLS: number;
}

/**
 * Production budgets with SA mobile allowance.
 * - LCP 3500ms (Google "needs improvement" is 4000ms, but SA RTT pushes baseline)
 * - INP 250ms (Google threshold, interactions must feel snappy)
 * - CLS 0.1 (Google "good" threshold)
 */
export const PERFORMANCE_BUDGETS: PerformanceBudget = {
    LCP: 3500,
    INP: 250,
    CLS: 0.1,
};

export type VitalMetric = keyof PerformanceBudget;

/**
 * Check if a vital value exceeds the budget threshold.
 */
export function isViolation(metric: VitalMetric, value: number): boolean {
    return value > PERFORMANCE_BUDGETS[metric];
}

/**
 * Get all vitals that exceed their budget from a set of measurements.
 */
export function getViolations(
    measurements: Partial<Record<VitalMetric, number>>
): Array<{ metric: VitalMetric; value: number; budget: number }> {
    const violations: Array<{ metric: VitalMetric; value: number; budget: number }> = [];

    for (const [metric, value] of Object.entries(measurements)) {
        const key = metric as VitalMetric;
        if (value !== undefined && isViolation(key, value)) {
            violations.push({
                metric: key,
                value,
                budget: PERFORMANCE_BUDGETS[key],
            });
        }
    }

    return violations;
}
