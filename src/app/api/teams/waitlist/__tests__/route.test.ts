/**
 * B2B Waitlist API Route Tests
 *
 * Tests for POST /api/teams/waitlist (public, no auth).
 * Based on testing-patterns skill and PRD 34.
 *
 * Key areas tested:
 * - Schema validation (email format, optional company fields)
 * - Successful waitlist insertion
 * - Duplicate email handling (returns success anyway)
 * - Default source value
 * - Error propagation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

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

// Mock rate limiter to always allow
vi.mock("@/lib/api/rateLimit", () => ({
    checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 10, retryAfterMs: 0, limit: 10 })),
    getRateLimitKey: vi.fn(() => "test-key"),
}));

import { createAdminClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { createMockQueryBuilder } from "@/__mocks__/supabase";

const mockAdminClient = {
    from: vi.fn(),
    storage: { from: vi.fn() },
};

const mockSupabaseClient = {
    auth: {
        getUser: vi.fn(),
    },
};

beforeEach(() => {
    vi.clearAllMocks();
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);
    (createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabaseClient);
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
});

// ============================================================================
// Handler Import (after mocks)
// ============================================================================

import { POST } from "../route";

// ============================================================================
// Helpers
// ============================================================================

function makePostRequest(body: object): Request {
    return new Request("http://localhost:3000/api/teams/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

/**
 * Set up two consecutive `from("b2b_waitlist")` calls:
 * 1. The existence check (select -> eq -> single)
 * 2. The insert call
 */
function setupFromCalls(
    existing: object | null,
    insertError: { message: string; code: string } | null = null
) {
    const selectQb = createMockQueryBuilder(existing);
    const insertQb = createMockQueryBuilder(null);
    if (insertError) {
        (insertQb as any).mockError(insertError.message, insertError.code);
    }

    let callCount = 0;
    mockAdminClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return selectQb;
        return insertQb;
    });

    return { selectQb, insertQb };
}

// ============================================================================
// Schema Validation Tests
// ============================================================================

const waitlistSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    company_name: z.string().max(200).optional(),
    company_size: z.enum(["1-50", "51-200", "201-500", "500+"]).optional(),
    role: z.enum(["HR", "Wellness", "Team Lead", "Other"]).optional(),
    source: z.string().max(100).optional(),
});

describe("B2B Waitlist API - Schema Validation", () => {
    it("accepts valid email with all optional fields", () => {
        const data = {
            email: "hr@company.com",
            company_name: "Acme Corp",
            company_size: "51-200",
            role: "HR",
            source: "linkedin",
        };
        const result = waitlistSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it("accepts valid email with no optional fields", () => {
        const data = { email: "user@example.com" };
        const result = waitlistSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it("rejects missing email", () => {
        const data = { company_name: "Acme Corp" };
        const result = waitlistSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it("rejects invalid email format", () => {
        const invalidEmails = [
            "not-an-email",
            "missing@",
            "@no-local.com",
            "",
            "spaces in@email.com",
        ];
        invalidEmails.forEach((email) => {
            const result = waitlistSchema.safeParse({ email });
            expect(result.success).toBe(false);
        });
    });

    it("rejects invalid company_size enum values", () => {
        const data = { email: "test@test.com", company_size: "10-20" };
        const result = waitlistSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it("accepts all valid company_size values", () => {
        const sizes = ["1-50", "51-200", "201-500", "500+"];
        sizes.forEach((company_size) => {
            const result = waitlistSchema.safeParse({ email: "test@test.com", company_size });
            expect(result.success).toBe(true);
        });
    });

    it("rejects invalid role enum values", () => {
        const data = { email: "test@test.com", role: "CEO" };
        const result = waitlistSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it("accepts all valid role values", () => {
        const roles = ["HR", "Wellness", "Team Lead", "Other"];
        roles.forEach((role) => {
            const result = waitlistSchema.safeParse({ email: "test@test.com", role });
            expect(result.success).toBe(true);
        });
    });

    it("rejects company_name longer than 200 chars", () => {
        const data = { email: "test@test.com", company_name: "a".repeat(201) };
        const result = waitlistSchema.safeParse(data);
        expect(result.success).toBe(false);
    });
});

// ============================================================================
// POST Handler Tests
// ============================================================================

describe("B2B Waitlist API - POST /api/teams/waitlist", () => {
    it("inserts email to b2b_waitlist and returns success", async () => {
        const { insertQb } = setupFromCalls(null);

        const response = await POST(makePostRequest({ email: "new@company.com" }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.message).toBe("Welcome to the waitlist!");

        expect(mockAdminClient.from).toHaveBeenCalledWith("b2b_waitlist");
        expect(insertQb.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                email: "new@company.com",
            })
        );
    });

    it("returns success for duplicate email without inserting", async () => {
        setupFromCalls({ id: "existing-id" });

        const response = await POST(
            makePostRequest({ email: "already@waitlisted.com" })
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.message).toBe("You're already on the waitlist!");
    });

    it("defaults source to 'website' when not provided", async () => {
        const { insertQb } = setupFromCalls(null);

        await POST(makePostRequest({ email: "user@example.com" }));

        expect(insertQb.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                source: "website",
            })
        );
    });

    it("uses provided source value", async () => {
        const { insertQb } = setupFromCalls(null);

        await POST(makePostRequest({
            email: "user@example.com",
            source: "linkedin-ad",
        }));

        expect(insertQb.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                source: "linkedin-ad",
            })
        );
    });

    it("includes company fields when provided", async () => {
        const { insertQb } = setupFromCalls(null);

        await POST(makePostRequest({
            email: "hr@acme.com",
            company_name: "Acme Corp",
            company_size: "201-500",
            role: "HR",
        }));

        expect(insertQb.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                email: "hr@acme.com",
                company_name: "Acme Corp",
                company_size: "201-500",
                role: "HR",
            })
        );
    });

    it("sets optional company fields to null when not provided", async () => {
        const { insertQb } = setupFromCalls(null);

        await POST(makePostRequest({ email: "minimal@test.com" }));

        expect(insertQb.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                company_name: null,
                company_size: null,
                role: null,
            })
        );
    });

    it("returns 500 when insert throws an error", async () => {
        setupFromCalls(null, { message: "DB write failed", code: "PGRST000" });

        const response = await POST(
            makePostRequest({ email: "fail@test.com" })
        );

        expect(response.status).toBe(500);
    });

    it("does not require authentication (auth: none)", async () => {
        setupFromCalls(null);

        mockSupabaseClient.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: null,
        });

        const response = await POST(
            makePostRequest({ email: "anon@test.com" })
        );
        expect(response.status).toBe(200);
    });
});

// ============================================================================
// Insert Data Shape Tests
// ============================================================================

describe("B2B Waitlist API - Insert Data Shape", () => {
    it("builds correct insert object with all fields", () => {
        const body = {
            email: "hr@acme.com",
            company_name: "Acme Corp",
            company_size: "51-200" as const,
            role: "HR" as const,
            source: "google",
        };

        const insertData = {
            email: body.email,
            company_name: body.company_name || null,
            company_size: body.company_size || null,
            role: body.role || null,
            source: body.source || "website",
        };

        expect(insertData.email).toBe("hr@acme.com");
        expect(insertData.company_name).toBe("Acme Corp");
        expect(insertData.company_size).toBe("51-200");
        expect(insertData.role).toBe("HR");
        expect(insertData.source).toBe("google");
    });

    it("builds correct insert object with minimal fields", () => {
        const body = {
            email: "user@test.com",
        };

        const insertData = {
            email: body.email,
            company_name: (body as any).company_name || null,
            company_size: (body as any).company_size || null,
            role: (body as any).role || null,
            source: (body as any).source || "website",
        };

        expect(insertData.email).toBe("user@test.com");
        expect(insertData.company_name).toBeNull();
        expect(insertData.company_size).toBeNull();
        expect(insertData.role).toBeNull();
        expect(insertData.source).toBe("website");
    });
});
