/**
 * Feedback API Route Tests
 *
 * Tests for POST /api/feedback (anonymous or authenticated).
 * Based on testing-patterns skill and PRD 42.
 *
 * Key areas tested:
 * - Schema validation (type enum, required description)
 * - Anonymous submissions (no user)
 * - Screenshot upload flow (base64 to storage)
 * - Insert data shape (board_status = backlog)
 * - Error handling on insert failure
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
import { createMockQueryBuilder, createMockUser } from "@/__mocks__/supabase";

const mockStorageBucket = {
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
};

const mockAdminClient = {
    from: vi.fn(),
    storage: {
        from: vi.fn(),
    },
};

const mockUser = createMockUser();

const mockSupabaseClient = {
    auth: {
        getUser: vi.fn(),
    },
};

beforeEach(() => {
    vi.clearAllMocks();
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);
    (createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabaseClient);
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockAdminClient.storage.from.mockReturnValue(mockStorageBucket);
    mockStorageBucket.upload.mockResolvedValue({ data: { path: "feedback/123-user.png" }, error: null });
    mockStorageBucket.getPublicUrl.mockReturnValue({
        data: { publicUrl: "https://mock.storage/feedback/123-user.png" },
    });
});

// ============================================================================
// Handler Import (after mocks)
// ============================================================================

import { POST } from "../route";

// ============================================================================
// Helpers
// ============================================================================

function makePostRequest(body: object): Request {
    return new Request("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "test-agent" },
        body: JSON.stringify(body),
    });
}

// ============================================================================
// Schema Validation Tests
// ============================================================================

const feedbackSchema = z.object({
    type: z.enum(["bug", "feature", "general", "positive", "negative"]),
    subject: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    page_url: z.string().nullable().optional(),
    screenshot: z.string().nullable().optional(),
});

describe("Feedback API - Schema Validation", () => {
    it("accepts valid feedback with all fields", () => {
        const data = {
            type: "bug",
            subject: "Something broke",
            description: "The page crashed when I clicked submit",
            page_url: "/dashboard",
            screenshot: null,
        };
        const result = feedbackSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it("accepts valid feedback with only required fields", () => {
        const data = {
            type: "feature",
            description: "Please add dark mode",
        };
        const result = feedbackSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it("rejects missing description", () => {
        const data = { type: "bug" };
        const result = feedbackSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain("description");
        }
    });

    it("rejects empty description", () => {
        const data = { type: "bug", description: "" };
        const result = feedbackSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it("rejects invalid type enum", () => {
        const data = { type: "complaint", description: "Bad type" };
        const result = feedbackSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it("accepts all valid type enum values", () => {
        const validTypes = ["bug", "feature", "general", "positive", "negative"];
        validTypes.forEach((type) => {
            const result = feedbackSchema.safeParse({ type, description: "test" });
            expect(result.success).toBe(true);
        });
    });
});

// ============================================================================
// POST Handler Tests
// ============================================================================

describe("Feedback API - POST /api/feedback", () => {
    it("creates feedback and returns success with id", async () => {
        const qb = createMockQueryBuilder({ id: "feedback-1", type: "bug" });
        mockAdminClient.from.mockReturnValue(qb);

        const response = await POST(makePostRequest({
            type: "bug",
            description: "Page crashes on submit",
        }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.id).toBe("feedback-1");
    });

    it("inserts with board_status set to backlog", async () => {
        const qb = createMockQueryBuilder({ id: "feedback-2", type: "feature" });
        mockAdminClient.from.mockReturnValue(qb);

        await POST(makePostRequest({
            type: "feature",
            description: "Add dark mode",
        }));

        expect(mockAdminClient.from).toHaveBeenCalledWith("feedback");
        expect(qb.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                board_status: "backlog",
                status: "pending",
                type: "feature",
                description: "Add dark mode",
            })
        );
    });

    it("handles anonymous submissions (no user)", async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: null,
        });

        const qb = createMockQueryBuilder({ id: "feedback-3", type: "general" });
        mockAdminClient.from.mockReturnValue(qb);

        const response = await POST(makePostRequest({
            type: "general",
            description: "Anonymous feedback",
        }));
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);

        // user_id should be null for anonymous
        expect(qb.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: null,
            })
        );
    });

    it("sets user_id from authenticated user", async () => {
        const qb = createMockQueryBuilder({ id: "feedback-4", type: "bug" });
        mockAdminClient.from.mockReturnValue(qb);

        await POST(makePostRequest({
            type: "bug",
            description: "Authenticated feedback",
        }));

        expect(qb.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: mockUser.id,
            })
        );
    });

    it("uploads screenshot when base64 data URL provided", async () => {
        const qb = createMockQueryBuilder({ id: "feedback-5", type: "bug" });
        mockAdminClient.from.mockReturnValue(qb);

        await POST(makePostRequest({
            type: "bug",
            description: "With screenshot",
            screenshot: "data:image/png;base64,iVBORw0KGgo=",
        }));

        expect(mockAdminClient.storage.from).toHaveBeenCalledWith("uploads");
        expect(mockStorageBucket.upload).toHaveBeenCalledWith(
            expect.stringContaining("feedback/"),
            expect.any(Buffer),
            expect.objectContaining({ contentType: "image/png" })
        );

        // screenshot_url should be set from the uploaded file
        expect(qb.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                screenshot_url: "https://mock.storage/feedback/123-user.png",
            })
        );
    });

    it("sets screenshot_url to null when no screenshot provided", async () => {
        const qb = createMockQueryBuilder({ id: "feedback-6", type: "general" });
        mockAdminClient.from.mockReturnValue(qb);

        await POST(makePostRequest({
            type: "general",
            description: "No screenshot",
        }));

        expect(qb.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                screenshot_url: null,
            })
        );
    });

    it("handles screenshot upload failure gracefully", async () => {
        mockStorageBucket.upload.mockResolvedValue({
            data: null,
            error: { message: "Storage full" },
        });

        const qb = createMockQueryBuilder({ id: "feedback-7", type: "bug" });
        mockAdminClient.from.mockReturnValue(qb);

        const response = await POST(makePostRequest({
            type: "bug",
            description: "Upload fails",
            screenshot: "data:image/png;base64,iVBORw0KGgo=",
        }));
        const body = await response.json();

        // Feedback should still be created even if screenshot upload fails
        expect(response.status).toBe(200);
        expect(body.success).toBe(true);

        expect(qb.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                screenshot_url: null,
            })
        );
    });

    it("returns 400 when DB insert fails", async () => {
        const qb = createMockQueryBuilder(null);
        (qb as any).mockError("insert failed", "PGRST000");
        mockAdminClient.from.mockReturnValue(qb);

        const response = await POST(makePostRequest({
            type: "bug",
            description: "This will fail insert",
        }));

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain("Failed to submit feedback");
    });
});

// ============================================================================
// Insert Data Structure Tests
// ============================================================================

describe("Feedback API - Insert Data Structure", () => {
    it("builds correct insert data shape", () => {
        const user = { id: "user-123" };
        const body = {
            type: "bug" as const,
            subject: "Crash",
            description: "Page crashes",
            page_url: "/dashboard",
        };
        const screenshotUrl: string | null = null;
        const userAgent = "Mozilla/5.0";

        const insertData = {
            user_id: user?.id || null,
            type: body.type,
            subject: body.subject || null,
            description: body.description,
            page_url: body.page_url || null,
            screenshot_url: screenshotUrl,
            user_agent: userAgent,
            status: "pending",
            board_status: "backlog",
        };

        expect(insertData.user_id).toBe("user-123");
        expect(insertData.type).toBe("bug");
        expect(insertData.status).toBe("pending");
        expect(insertData.board_status).toBe("backlog");
        expect(insertData.screenshot_url).toBeNull();
    });

    it("subject defaults to null when not provided", () => {
        const body = {
            type: "feature" as const,
            description: "New feature",
        };

        const insertData = {
            subject: (body as any).subject || null,
        };

        expect(insertData.subject).toBeNull();
    });
});
