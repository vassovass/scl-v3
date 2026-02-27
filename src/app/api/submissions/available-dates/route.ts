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

import { withApiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = withApiHandler({
    auth: 'required',
}, async ({ user, adminClient, request }) => {
    const url = new URL(request.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    // Validate required params
    if (!start || !end) {
        return badRequest("Missing required parameters: start and end dates");
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start) || !dateRegex.test(end)) {
        return badRequest("Invalid date format. Use YYYY-MM-DD");
    }

    // Query submissions for the date range
    const { data, error } = await adminClient
        .from("submissions")
        .select("for_date, steps")
        .eq("user_id", user!.id)
        .gte("for_date", start)
        .lte("for_date", end)
        .order("for_date", { ascending: true });

    if (error) {
        throw error;
    }

    // Deduplicate by date (take max steps if multiple submissions per day)
    const byDate = new Map<string, number>();
    data?.forEach((submission: { for_date: string; steps: number }) => {
        const existing = byDate.get(submission.for_date) || 0;
        byDate.set(submission.for_date, Math.max(existing, submission.steps || 0));
    });

    // Convert to response format
    const dates = Array.from(byDate.entries()).map(
        ([date, steps]) => ({ date, steps })
    );

    return { dates };
});
