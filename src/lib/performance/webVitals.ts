"use client";

import { PERFORMANCE_BUDGETS, isViolation, type VitalMetric } from "./budgets";

/**
 * Connection context for performance events.
 * SA mobile users often on 3G/4G with high latency.
 */
function getConnectionContext() {
    if (typeof navigator === "undefined") return {};

    const conn = (navigator as Navigator & {
        connection?: {
            effectiveType?: string;
            rtt?: number;
            downlink?: number;
        };
    }).connection;

    return {
        connection_type: conn?.effectiveType || "unknown",
        connection_rtt: conn?.rtt,
        connection_downlink: conn?.downlink,
        device_memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    };
}

/**
 * Get the current page name from pathname.
 */
function getPageName(): string {
    if (typeof window === "undefined") return "unknown";
    return window.location.pathname;
}

/**
 * Report a Web Vital metric to analytics (PostHog + GA4).
 */
function reportVital(metric: VitalMetric, value: number) {
    const context = getConnectionContext();
    const page = getPageName();

    // Dynamically import analytics to avoid circular dependencies
    import("@/lib/analytics").then(({ trackEvent }) => {
        // Report the vital measurement
        trackEvent("web_vital", {
            category: "performance",
            action: "measure",
            metric,
            value: Math.round(metric === "CLS" ? value * 1000 : value), // CLS: multiply by 1000 for readability
            raw_value: value,
            page,
            budget: PERFORMANCE_BUDGETS[metric],
            ...context,
        });

        // Report budget violations separately for alerting
        if (isViolation(metric, value)) {
            trackEvent("perf_budget_violation", {
                category: "performance",
                action: "violation",
                metric,
                value: Math.round(metric === "CLS" ? value * 1000 : value),
                raw_value: value,
                budget: PERFORMANCE_BUDGETS[metric],
                page,
                ...context,
            });
        }
    }).catch(() => {
        // Analytics not available — fail silently
    });
}

/**
 * Initialize Web Vitals collection using PerformanceObserver.
 * Reports LCP, INP, and CLS to PostHog via trackEvent.
 *
 * Uses requestIdleCallback to avoid impacting INP.
 * Should be called once from the root layout or a global provider.
 *
 * @see PRD 64: Performance Budgets & RUM
 */
export function initWebVitals() {
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

    const schedule = (fn: () => void) => {
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(fn, { timeout: 10000 });
        } else {
            setTimeout(fn, 1000);
        }
    };

    // LCP — Largest Contentful Paint
    try {
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                schedule(() => reportVital("LCP", lastEntry.startTime));
            }
        });
        lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
        // LCP not supported in this browser
    }

    // INP — Interaction to Next Paint (approximated via event timing)
    try {
        let maxINP = 0;
        const inpObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                const duration = (entry as PerformanceEntry & { duration: number }).duration;
                if (duration > maxINP) {
                    maxINP = duration;
                }
            }
        });
        inpObserver.observe({ type: "event", buffered: true });

        // Report INP on page hide (captures the worst interaction)
        const reportINP = () => {
            if (maxINP > 0) {
                schedule(() => reportVital("INP", maxINP));
            }
        };
        window.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") reportINP();
        });
    } catch {
        // Event timing not supported
    }

    // CLS — Cumulative Layout Shift
    try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                const layoutShift = entry as PerformanceEntry & {
                    hadRecentInput: boolean;
                    value: number;
                };
                if (!layoutShift.hadRecentInput) {
                    clsValue += layoutShift.value;
                }
            }
        });
        clsObserver.observe({ type: "layout-shift", buffered: true });

        // Report CLS on page hide
        const reportCLS = () => {
            schedule(() => reportVital("CLS", clsValue));
        };
        window.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") reportCLS();
        });
    } catch {
        // Layout shift not supported
    }
}
