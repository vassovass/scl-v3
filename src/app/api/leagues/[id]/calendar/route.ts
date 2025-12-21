import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";

const querySchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/), // Format: YYYY-MM
});

// GET /api/leagues/{id}/calendar?month=2024-12
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: leagueId } = await params;
        const url = new URL(request.url);
        const rawParams = Object.fromEntries(url.searchParams.entries());

        // Default to current month if not provided
        const now = new Date();
        const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const parsed = querySchema.safeParse({ month: rawParams.month || defaultMonth });

        if (!parsed.success) {
            return badRequest("Invalid month format (YYYY-MM)");
        }

        const { month } = parsed.data;

        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const adminClient = createAdminClient();

        // Check membership
        const { data: membership } = await adminClient
            .from("memberships")
            .select("role")
            .eq("league_id", leagueId)
            .eq("user_id", user.id)
            .single();

        // Check for super admin status
        const { data: userProfile } = await adminClient
            .from("users")
            .select("is_superadmin")
            .eq("id", user.id)
            .single();

        const isSuperAdmin = userProfile?.is_superadmin ?? false;

        if (!membership && !isSuperAdmin) {
            return forbidden("You are not a member of this league");
        }

        // Get total members
        const { count: totalMembers } = await adminClient
            .from("memberships")
            .select("*", { count: "exact", head: true })
            .eq("league_id", leagueId);

        // Calculate date range for the month
        const [year, monthNum] = month.split("-").map(Number);
        const startDate = `${month}-01`;
        const lastDay = new Date(year, monthNum, 0).getDate();
        const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

        // Fetch all submissions for the month
        const { data: submissions, error: subError } = await adminClient
            .from("submissions")
            .select("for_date, steps, user_id")
            .eq("league_id", leagueId)
            .gte("for_date", startDate)
            .lte("for_date", endDate);

        if (subError) {
            console.error("Calendar fetch error:", subError);
            throw subError;
        }

        // Aggregate by day
        const dayMap = new Map<string, { steps: number; users: Set<string> }>();

        for (const sub of submissions || []) {
            if (!dayMap.has(sub.for_date)) {
                dayMap.set(sub.for_date, { steps: 0, users: new Set() });
            }
            const day = dayMap.get(sub.for_date)!;
            day.steps += sub.steps || 0;
            day.users.add(sub.user_id);
        }

        // Build days array for entire month
        const days = [];
        let totalSteps = 0;
        let daysWithSubmissions = 0;

        for (let d = 1; d <= lastDay; d++) {
            const dateStr = `${month}-${String(d).padStart(2, "0")}`;
            const dayData = dayMap.get(dateStr);
            const submittedCount = dayData?.users.size || 0;
            const daySteps = dayData?.steps || 0;

            if (submittedCount > 0) daysWithSubmissions++;
            totalSteps += daySteps;

            days.push({
                date: dateStr,
                day_of_month: d,
                submitted_count: submittedCount,
                total_members: totalMembers || 0,
                total_steps: daySteps,
                coverage_pct: totalMembers ? Math.round((submittedCount / totalMembers) * 100) : 0,
            });
        }

        return json({
            month,
            total_members: totalMembers || 0,
            days,
            summary: {
                total_steps: totalSteps,
                avg_per_day: daysWithSubmissions > 0 ? Math.round(totalSteps / daysWithSubmissions) : 0,
                days_with_activity: daysWithSubmissions,
                coverage_pct: lastDay > 0 ? Math.round((daysWithSubmissions / lastDay) * 100) : 0,
            },
        });
    } catch (error) {
        console.error("Calendar error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}
