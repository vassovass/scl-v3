import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase clients
vi.mock("@/lib/supabase/server", () => ({
    createServerSupabaseClient: vi.fn().mockResolvedValue({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: "test-user-id", email: "test@example.com" } },
            }),
        },
    }),
    createAdminClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: { is_superadmin: false },
                    }),
                })),
            })),
        })),
    })),
}));

// Mock logger to capture structured log output
const mockLog = vi.fn();
vi.mock("@/lib/server/logger", () => ({
    log: (...args: unknown[]) => mockLog(...args),
}));

// Mock rate limiter
vi.mock("@/lib/api/rateLimit", () => ({
    checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 10, limit: 20, retryAfterMs: 0 }),
    getRateLimitKey: vi.fn().mockReturnValue("test-key"),
}));

import { withApiHandler } from "@/lib/api/handler";

describe("API Handler — Request ID & Structured Logging (PRD 65)", () => {
    beforeEach(() => {
        mockLog.mockClear();
    });

    it("adds X-Request-ID header to successful responses", async () => {
        const handler = withApiHandler(
            { auth: "required" },
            async () => ({ ok: true })
        );

        const request = new Request("http://localhost:3000/api/test", {
            method: "GET",
        });

        const response = await handler(request);
        const requestId = response.headers.get("X-Request-ID");

        expect(requestId).toBeDefined();
        expect(requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
    });

    it("adds X-Request-ID header to error responses", async () => {
        const handler = withApiHandler(
            { auth: "required" },
            async () => {
                throw new Error("Test error");
            }
        );

        const request = new Request("http://localhost:3000/api/test", {
            method: "GET",
        });

        const response = await handler(request);
        const requestId = response.headers.get("X-Request-ID");

        expect(requestId).toBeDefined();
        expect(requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
        expect(response.status).toBe(500);
    });

    it("logs request_completed with duration_ms on success", async () => {
        const handler = withApiHandler(
            { auth: "required" },
            async () => ({ ok: true })
        );

        const request = new Request("http://localhost:3000/api/test", {
            method: "GET",
        });

        await handler(request);

        // Find the request_completed log call
        const completedCall = mockLog.mock.calls.find(
            (call: unknown[]) => call[1] === "request_completed"
        );
        expect(completedCall).toBeDefined();

        const [level, message, context, userId, requestId] = completedCall!;
        expect(level).toBe("info");
        expect(message).toBe("request_completed");
        expect(context.path).toBe("/api/test");
        expect(context.method).toBe("GET");
        expect(context.status).toBe(200);
        expect(typeof context.duration_ms).toBe("number");
        expect(context.duration_ms).toBeGreaterThanOrEqual(0);
        expect(userId).toBe("test-user-id");
        expect(requestId).toBeDefined();
    });

    it("logs request_failed with error details on error", async () => {
        const handler = withApiHandler(
            { auth: "required" },
            async () => {
                throw new Error("Something broke");
            }
        );

        const request = new Request("http://localhost:3000/api/broken", {
            method: "POST",
        });

        await handler(request);

        const failedCall = mockLog.mock.calls.find(
            (call: unknown[]) => call[1] === "request_failed"
        );
        expect(failedCall).toBeDefined();

        const [level, message, context] = failedCall!;
        expect(level).toBe("error");
        expect(message).toBe("request_failed");
        expect(context.path).toBe("/api/broken");
        expect(context.method).toBe("POST");
        expect(context.status).toBe(500);
        expect(context.error).toBe("Something broke");
        expect(typeof context.duration_ms).toBe("number");
    });

    it("generates unique request IDs for each request", async () => {
        const handler = withApiHandler(
            { auth: "required" },
            async () => ({ ok: true })
        );

        const r1 = await handler(
            new Request("http://localhost:3000/api/test1", { method: "GET" })
        );
        const r2 = await handler(
            new Request("http://localhost:3000/api/test2", { method: "GET" })
        );

        const id1 = r1.headers.get("X-Request-ID");
        const id2 = r2.headers.get("X-Request-ID");

        expect(id1).not.toBe(id2);
    });
});
