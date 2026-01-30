/**
 * Available Dates API
 *
 * Returns dates with submissions and step counts for a given date range.
 * Used by date picker to show heatmap indicators.
 *
 * GET /api/submissions/available-dates?start=2026-01-01&end=2026-01-31
 *
 * @module api/submissions/available-dates
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ============================================================================
// Types
// ============================================================================

interface SubmissionDateInfo {
    date: string;
    steps: number;
}

interface AvailableDatesResponse {
    dates: SubmissionDateInfo[];
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<AvailableDatesResponse | { error: string }>> {
    const supabase = await createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    // Validate required params
    if (!start || !end) {
        return NextResponse.json(
            { error: "Missing required parameters: start and end dates" },
            { status: 400 }
        );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
        return NextResponse.json(
            { error: "Invalid date format. Use YYYY-MM-DD" },
            { status: 400 }
        );
    }

    const adminClient = createAdminClient();

    try {
        // Query submissions for the date range
        const { data, error } = await adminClient
            .from("submissions")
            .select("for_date, steps")
            .eq("user_id", user.id)
            .gte("for_date", start)
            .lte("for_date", end)
            .order("for_date", { ascending: true });

        if (error) {
            console.error("Error fetching submissions:", error);
            return NextResponse.json(
                { error: "Failed to fetch submissions" },
                { status: 500 }
            );
        }

        // Deduplicate by date (take max steps if multiple submissions per day)
        const byDate = new Map<string, number>();
        data?.forEach((submission: { for_date: string; steps: number }) => {
            const existing = byDate.get(submission.for_date) || 0;
            byDate.set(submission.for_date, Math.max(existing, submission.steps || 0));
        });

        // Convert to response format
        const dates: SubmissionDateInfo[] = Array.from(byDate.entries()).map(
            ([date, steps]) => ({ date, steps })
        );

        return NextResponse.json({ dates });
    } catch (error) {
        console.error("Error in available-dates API:", error);
        return NextResponse.json(
            { error: "Failed to fetch available dates" },
            { status: 500 }
        );
    }
}
