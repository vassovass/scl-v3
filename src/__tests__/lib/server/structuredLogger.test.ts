import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    log,
    logDebug,
    logInfo,
    logWarn,
    logError,
    getRecentLogs,
    type LogEntry,
} from "@/lib/server/logger";

describe("Structured Logger", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe("log()", () => {
        it("outputs JSON-structured log to console", () => {
            const spy = vi.spyOn(console, "info").mockImplementation(() => {});

            log("info", "test_message", { path: "/api/test" }, "user123", "req-abc");

            expect(spy).toHaveBeenCalledOnce();
            const output = spy.mock.calls[0][0] as string;
            const parsed = JSON.parse(output);

            expect(parsed.level).toBe("info");
            expect(parsed.message).toBe("test_message");
            expect(parsed.path).toBe("/api/test");
            expect(parsed.userId).toBe("user123");
            expect(parsed.requestId).toBe("req-abc");
            expect(parsed.timestamp).toBeDefined();
        });

        it("spreads context fields to top level for flat querying", () => {
            const spy = vi.spyOn(console, "info").mockImplementation(() => {});

            log("info", "request_completed", {
                path: "/api/health",
                method: "GET",
                status: 200,
                duration_ms: 42,
            });

            const parsed = JSON.parse(spy.mock.calls[0][0] as string);
            expect(parsed.path).toBe("/api/health");
            expect(parsed.method).toBe("GET");
            expect(parsed.status).toBe(200);
            expect(parsed.duration_ms).toBe(42);
        });

        it("uses console.error for error level", () => {
            const spy = vi.spyOn(console, "error").mockImplementation(() => {});

            log("error", "request_failed", { code: "DB_ERROR" });

            expect(spy).toHaveBeenCalledOnce();
            const parsed = JSON.parse(spy.mock.calls[0][0] as string);
            expect(parsed.level).toBe("error");
            expect(parsed.code).toBe("DB_ERROR");
        });

        it("uses console.warn for warn level", () => {
            const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
            log("warn", "rate_limit_near");
            expect(spy).toHaveBeenCalledOnce();
        });

        it("uses console.debug for debug level", () => {
            const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
            log("debug", "cache_miss");
            expect(spy).toHaveBeenCalledOnce();
        });

        it("omits optional fields when not provided", () => {
            const spy = vi.spyOn(console, "info").mockImplementation(() => {});

            log("info", "simple_log");

            const parsed = JSON.parse(spy.mock.calls[0][0] as string);
            expect(parsed.userId).toBeUndefined();
            expect(parsed.requestId).toBeUndefined();
        });
    });

    describe("convenience methods", () => {
        it("logDebug writes debug level", () => {
            const spy = vi.spyOn(console, "debug").mockImplementation(() => {});
            logDebug("debug_msg");
            const parsed = JSON.parse(spy.mock.calls[0][0] as string);
            expect(parsed.level).toBe("debug");
        });

        it("logInfo writes info level", () => {
            const spy = vi.spyOn(console, "info").mockImplementation(() => {});
            logInfo("info_msg");
            const parsed = JSON.parse(spy.mock.calls[0][0] as string);
            expect(parsed.level).toBe("info");
        });

        it("logWarn writes warn level", () => {
            const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
            logWarn("warn_msg");
            const parsed = JSON.parse(spy.mock.calls[0][0] as string);
            expect(parsed.level).toBe("warn");
        });

        it("logError writes error level", () => {
            const spy = vi.spyOn(console, "error").mockImplementation(() => {});
            logError("error_msg");
            const parsed = JSON.parse(spy.mock.calls[0][0] as string);
            expect(parsed.level).toBe("error");
        });
    });

    describe("getRecentLogs()", () => {
        it("returns recent log entries", () => {
            vi.spyOn(console, "info").mockImplementation(() => {});
            vi.spyOn(console, "error").mockImplementation(() => {});

            log("info", "first_log");
            log("error", "second_log");

            const logs = getRecentLogs(10);
            const lastTwo = logs.slice(-2);
            expect(lastTwo).toHaveLength(2);
            expect(lastTwo[0].message).toBe("first_log");
            expect(lastTwo[1].message).toBe("second_log");
        });

        it("respects limit parameter", () => {
            vi.spyOn(console, "info").mockImplementation(() => {});

            for (let i = 0; i < 10; i++) {
                log("info", `log_${i}`);
            }

            const logs = getRecentLogs(3);
            expect(logs.length).toBeLessThanOrEqual(3);
        });
    });

    describe("JSON output format", () => {
        it("produces valid JSON output", () => {
            const spy = vi.spyOn(console, "info").mockImplementation(() => {});

            log("info", "valid_json_test", {
                nested: { value: 123 },
                array: [1, 2, 3],
            });

            const output = spy.mock.calls[0][0] as string;
            expect(() => JSON.parse(output)).not.toThrow();
        });

        it("includes ISO timestamp", () => {
            const spy = vi.spyOn(console, "info").mockImplementation(() => {});

            log("info", "timestamp_test");

            const parsed = JSON.parse(spy.mock.calls[0][0] as string);
            expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });
    });
});
