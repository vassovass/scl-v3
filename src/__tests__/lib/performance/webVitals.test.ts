import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";

// Mock analytics module — persistent factory forwards to our spy
const mockTrackEvent = vi.fn();
vi.mock("@/lib/analytics", () => ({
    trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}));

/** Flush promise queue so dynamic import().then() inside reportVital resolves */
const flush = () => new Promise((r) => setTimeout(r, 50));

describe("initWebVitals", () => {
    let observers: Array<{
        type: string;
        callback: (entryList: { getEntries: () => unknown[] }) => void;
    }>;

    // Pre-warm the dynamic import chain that webVitals.ts uses internally.
    // Without this, the first test that triggers reportVital() faces cold-start latency.
    beforeAll(async () => {
        await import("@/lib/analytics");
    });

    beforeEach(() => {
        observers = [];
        mockTrackEvent.mockClear();

        // Mock PerformanceObserver as a proper class
        class MockPerformanceObserver {
            private cb: (entryList: { getEntries: () => unknown[] }) => void;
            constructor(cb: (entryList: { getEntries: () => unknown[] }) => void) {
                this.cb = cb;
            }
            observe({ type }: { type: string }) {
                observers.push({ type, callback: this.cb });
            }
            disconnect() {}
        }

        vi.stubGlobal("PerformanceObserver", MockPerformanceObserver);

        // Mock requestIdleCallback — execute immediately
        vi.stubGlobal("requestIdleCallback", (fn: () => void) => {
            fn();
            return 1;
        });

        // Mock navigator.connection for SA mobile context
        Object.defineProperty(navigator, "connection", {
            value: { effectiveType: "4g", rtt: 50, downlink: 10 },
            configurable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("creates observers for LCP, INP (event), and CLS", async () => {
        const { initWebVitals } = await import("@/lib/performance/webVitals");
        initWebVitals();

        const types = observers.map((o) => o.type);
        expect(types).toContain("largest-contentful-paint");
        expect(types).toContain("event");
        expect(types).toContain("layout-shift");
    });

    it("does nothing when PerformanceObserver is undefined", async () => {
        vi.stubGlobal("PerformanceObserver", undefined);
        const { initWebVitals } = await import("@/lib/performance/webVitals");
        expect(() => initWebVitals()).not.toThrow();
    });

    it("reports LCP metric via trackEvent when entries arrive", async () => {
        const { initWebVitals } = await import("@/lib/performance/webVitals");
        initWebVitals();

        const lcpObserver = observers.find(
            (o) => o.type === "largest-contentful-paint"
        );
        expect(lcpObserver).toBeDefined();

        lcpObserver!.callback({
            getEntries: () => [{ startTime: 2500 }],
        });

        await flush();

        expect(mockTrackEvent).toHaveBeenCalledWith(
            "web_vital",
            expect.objectContaining({
                metric: "LCP",
                value: 2500,
                raw_value: 2500,
            })
        );
    });

    it("reports budget violations when LCP exceeds threshold", async () => {
        const { initWebVitals } = await import("@/lib/performance/webVitals");
        initWebVitals();

        const lcpObserver = observers.find(
            (o) => o.type === "largest-contentful-paint"
        );

        lcpObserver!.callback({
            getEntries: () => [{ startTime: 5000 }],
        });

        await flush();

        expect(mockTrackEvent).toHaveBeenCalledWith(
            "perf_budget_violation",
            expect.objectContaining({
                metric: "LCP",
                value: 5000,
                budget: 3500,
            })
        );
    });

    it("tracks CLS entries via layout-shift observer", async () => {
        const { initWebVitals } = await import("@/lib/performance/webVitals");
        initWebVitals();

        const clsObserver = observers.find((o) => o.type === "layout-shift");
        expect(clsObserver).toBeDefined();

        clsObserver!.callback({
            getEntries: () => [
                { hadRecentInput: false, value: 0.05 },
                { hadRecentInput: true, value: 0.1 }, // excluded
                { hadRecentInput: false, value: 0.03 },
            ],
        });

        Object.defineProperty(document, "visibilityState", {
            value: "hidden",
            configurable: true,
        });
        window.dispatchEvent(new Event("visibilitychange"));

        await flush();

        const clsCalls = mockTrackEvent.mock.calls.filter(
            (call: unknown[]) => call[0] === "web_vital" && (call[1] as Record<string, unknown>)?.metric === "CLS"
        );
        expect(clsCalls.length).toBeGreaterThanOrEqual(1);
    });

    it("includes connection context in metric reports", async () => {
        const { initWebVitals } = await import("@/lib/performance/webVitals");
        initWebVitals();

        const lcpObserver = observers.find(
            (o) => o.type === "largest-contentful-paint"
        );
        lcpObserver!.callback({
            getEntries: () => [{ startTime: 2000 }],
        });

        await flush();

        expect(mockTrackEvent).toHaveBeenCalledWith(
            "web_vital",
            expect.objectContaining({
                connection_type: "4g",
                connection_rtt: 50,
                connection_downlink: 10,
            })
        );
    });

    it("uses last LCP entry when multiple entries arrive", async () => {
        const { initWebVitals } = await import("@/lib/performance/webVitals");
        initWebVitals();

        const lcpObserver = observers.find(
            (o) => o.type === "largest-contentful-paint"
        );

        lcpObserver!.callback({
            getEntries: () => [{ startTime: 1000 }, { startTime: 2500 }],
        });

        await flush();

        expect(mockTrackEvent).toHaveBeenCalledWith(
            "web_vital",
            expect.objectContaining({
                metric: "LCP",
                value: 2500,
            })
        );
    });
});
