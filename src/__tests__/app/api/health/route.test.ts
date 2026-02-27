import { describe, it, expect, vi } from "vitest";

// Mock Supabase clients
vi.mock("@/lib/supabase/server", () => ({
    createServerSupabaseClient: vi.fn().mockResolvedValue({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: null }, // No auth required
            }),
        },
    }),
    createAdminClient: vi.fn(() => ({
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: null }),
                })),
            })),
        })),
    })),
}));

// Mock logger
vi.mock("@/lib/server/logger", () => ({
    log: vi.fn(),
}));

// Mock rate limiter
vi.mock("@/lib/api/rateLimit", () => ({
    checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 10, limit: 20, retryAfterMs: 0 }),
    getRateLimitKey: vi.fn().mockReturnValue("test-key"),
}));

import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
    it("returns 200 with health status", async () => {
        const request = new Request("http://localhost:3000/api/health", {
            method: "GET",
        });

        const response = await GET(request);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.status).toBeDefined();
        expect(data.database).toBeDefined();
        expect(data.auth_service).toBe("up");
        expect(typeof data.response_time_ms).toBe("number");
        expect(data.timestamp).toBeDefined();
    });

    it("returns healthy status when database is reachable", async () => {
        const request = new Request("http://localhost:3000/api/health", {
            method: "GET",
        });

        const response = await GET(request);
        const data = await response.json();

        expect(data.status).toBe("healthy");
        expect(data.database).toBe("up");
    });

    it("includes X-Request-ID header", async () => {
        const request = new Request("http://localhost:3000/api/health", {
            method: "GET",
        });

        const response = await GET(request);
        const requestId = response.headers.get("X-Request-ID");

        expect(requestId).toBeDefined();
        expect(requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
    });

    it("returns ISO timestamp", async () => {
        const request = new Request("http://localhost:3000/api/health", {
            method: "GET",
        });

        const response = await GET(request);
        const data = await response.json();

        expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("requires no authentication", async () => {
        const request = new Request("http://localhost:3000/api/health", {
            method: "GET",
        });

        // User is null (no auth) — should still succeed
        const response = await GET(request);
        expect(response.status).toBe(200);
    });
});
