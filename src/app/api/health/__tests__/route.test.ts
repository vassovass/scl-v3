/**
 * Health Check API Route Tests
 *
 * Tests for GET /api/health (public, no auth).
 * Based on testing-patterns skill and PRD 65.
 *
 * Key areas tested:
 * - Healthy status when DB is reachable
 * - Degraded status when DB query fails
 * - Response shape (all required fields present)
 * - Timing / response_time_ms accuracy
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mock Setup
// ============================================================================

vi.mock("@/lib/supabase/server", () => ({
    createServerSupabaseClient: vi.fn(),
    createAdminClient: vi.fn(),
}));

vi.mock("@/lib/server/logger", () => ({
    log: vi.fn(),
}));

import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { createMockQueryBuilder } from "@/__mocks__/supabase";

const mockAdminClient = {
    from: vi.fn(),
    storage: { from: vi.fn() },
};

const mockSupabaseClient = {
    auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
};

beforeEach(() => {
    vi.clearAllMocks();
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);
    (createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabaseClient);
});

// ============================================================================
// Handler Import (after mocks)
// ============================================================================

import { GET } from "../route";

// ============================================================================
// Helper
// ============================================================================

function makeRequest(): Request {
    return new Request("http://localhost:3000/api/health", { method: "GET" });
}

// ============================================================================
// Tests
// ============================================================================

describe("Health Check API - GET /api/health", () => {
    it('returns "healthy" status when DB query succeeds', async () => {
        const qb = createMockQueryBuilder([{ id: "user-1" }]);
        mockAdminClient.from.mockReturnValue(qb);

        const response = await GET(makeRequest());
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.status).toBe("healthy");
        expect(body.database).toBe("up");
    });

    it('returns "degraded" status when DB query fails', async () => {
        const qb = createMockQueryBuilder(null);
        (qb as any).mockError("connection refused", "PGRST000");
        mockAdminClient.from.mockReturnValue(qb);

        const response = await GET(makeRequest());
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.status).toBe("degraded");
        expect(body.database).toBe("down");
    });

    it("always reports auth_service as up", async () => {
        const qb = createMockQueryBuilder([{ id: "user-1" }]);
        mockAdminClient.from.mockReturnValue(qb);

        const response = await GET(makeRequest());
        const body = await response.json();

        expect(body.auth_service).toBe("up");
    });

    it("includes a valid ISO timestamp", async () => {
        const qb = createMockQueryBuilder([{ id: "user-1" }]);
        mockAdminClient.from.mockReturnValue(qb);

        const response = await GET(makeRequest());
        const body = await response.json();

        expect(body.timestamp).toBeDefined();
        const parsed = new Date(body.timestamp);
        expect(parsed.toISOString()).toBe(body.timestamp);
    });

    it("includes response_time_ms as a non-negative number", async () => {
        const qb = createMockQueryBuilder([{ id: "user-1" }]);
        mockAdminClient.from.mockReturnValue(qb);

        const response = await GET(makeRequest());
        const body = await response.json();

        expect(typeof body.response_time_ms).toBe("number");
        expect(body.response_time_ms).toBeGreaterThanOrEqual(0);
    });

    it("queries the users table with limit 1", async () => {
        const qb = createMockQueryBuilder([{ id: "user-1" }]);
        mockAdminClient.from.mockReturnValue(qb);

        await GET(makeRequest());

        expect(mockAdminClient.from).toHaveBeenCalledWith("users");
        expect(qb.select).toHaveBeenCalledWith("id");
        expect(qb.limit).toHaveBeenCalledWith(1);
    });

    it("does not require authentication (auth: none)", async () => {
        const qb = createMockQueryBuilder([{ id: "user-1" }]);
        mockAdminClient.from.mockReturnValue(qb);

        // User is null (unauthenticated) - should still succeed
        mockSupabaseClient.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: null,
        });

        const response = await GET(makeRequest());
        expect(response.status).toBe(200);
    });

    it("includes X-Request-ID header", async () => {
        const qb = createMockQueryBuilder([{ id: "user-1" }]);
        mockAdminClient.from.mockReturnValue(qb);

        const response = await GET(makeRequest());

        expect(response.headers.get("X-Request-ID")).toBeTruthy();
    });
});

// ============================================================================
// Response Shape Tests
// ============================================================================

describe("Health Check API - Response Shape", () => {
    it("response contains all required fields", async () => {
        const qb = createMockQueryBuilder([{ id: "user-1" }]);
        mockAdminClient.from.mockReturnValue(qb);

        const response = await GET(makeRequest());
        const body = await response.json();

        const requiredFields = [
            "status",
            "database",
            "auth_service",
            "response_time_ms",
            "timestamp",
        ];
        requiredFields.forEach((field) => {
            expect(body).toHaveProperty(field);
        });
    });

    it("status is one of healthy or degraded", async () => {
        const qb = createMockQueryBuilder([{ id: "user-1" }]);
        mockAdminClient.from.mockReturnValue(qb);

        const response = await GET(makeRequest());
        const body = await response.json();

        expect(["healthy", "degraded"]).toContain(body.status);
    });

    it("database is one of up or down", async () => {
        const qb = createMockQueryBuilder(null);
        (qb as any).mockError("timeout", "TIMEOUT");
        mockAdminClient.from.mockReturnValue(qb);

        const response = await GET(makeRequest());
        const body = await response.json();

        expect(["up", "down"]).toContain(body.database);
        expect(body.database).toBe("down");
    });
});
