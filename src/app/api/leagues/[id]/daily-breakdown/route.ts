import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError } from "@/lib/api";

const querySchema = z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    group_by: z.enum(["day", "3days", "5days", "week", "month"]).default("day"),
    sort_by: z.enum(["total", "average", "consistency", "name"]).default("total"),
});

interface DayData {
    steps: number;
    verified: boolean;
}

interface MemberBreakdown {
    user_id: string;
    nickname: string | null;
    display_name: string | null;
    total_steps: number;
    days_submitted: number;
    avg_per_day: number;
    consistency_pct: number;
    days: Record<string, DayData | null>;
}

// GET /api/leagues/{id}/daily-breakdown
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: leagueId } = await params;
        const url = new URL(request.url);
        const rawParams = Object.fromEntries(url.searchParams.entries());

        // Default to current month
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const defaultStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const defaultEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

        const parsed = querySchema.safeParse({
            start_date: rawParams.start_date || defaultStart,
            end_date: rawParams.end_date || defaultEnd,
            group_by: rawParams.group_by || "day",
            sort_by: rawParams.sort_by || "total",
        });

        if (!parsed.success) {
            return badRequest("Invalid parameters");
        }

        const { start_date, end_date, group_by, sort_by } = parsed.data;

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

        // Get all members
        const { data: members } = await adminClient
            .from("memberships")
            .select("user_id, users:user_id (display_name, nickname)")
            .eq("league_id", leagueId);

        // Fetch all submissions in range
        const { data: submissions, error: subError } = await adminClient
            .from("submissions")
            .select("user_id, for_date, steps, verified")
            .eq("league_id", leagueId)
            .gte("for_date", start_date)
            .lte("for_date", end_date);

        if (subError) {
            console.error("Breakdown fetch error:", subError);
            throw subError;
        }

        // Calculate total days in range
        const startD = new Date(start_date + "T00:00:00");
        const endD = new Date(end_date + "T00:00:00");
        const totalDays = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Build all dates in range
        const allDates: string[] = [];
        const current = new Date(startD);
        while (current <= endD) {
            allDates.push(current.toISOString().split("T")[0]);
            current.setDate(current.getDate() + 1);
        }

        // Build member breakdown
        const memberMap = new Map<string, MemberBreakdown>();

        // Initialize all members
        for (const m of members || []) {
            const userInfo = m.users as unknown as { display_name: string | null; nickname: string | null } | null;
            memberMap.set(m.user_id, {
                user_id: m.user_id,
                nickname: userInfo?.nickname || null,
                display_name: userInfo?.display_name || null,
                total_steps: 0,
                days_submitted: 0,
                avg_per_day: 0,
                consistency_pct: 0,
                days: {},
            });

            // Initialize all days as null
            for (const date of allDates) {
                memberMap.get(m.user_id)!.days[date] = null;
            }
        }

        // Populate with submission data
        for (const sub of submissions || []) {
            const member = memberMap.get(sub.user_id);
            if (member) {
                member.days[sub.for_date] = {
                    steps: sub.steps || 0,
                    verified: sub.verified || false,
                };
                member.total_steps += sub.steps || 0;
                member.days_submitted += 1;
            }
        }

        // Calculate averages and consistency
        for (const member of Array.from(memberMap.values())) {
            member.avg_per_day = member.days_submitted > 0
                ? Math.round(member.total_steps / member.days_submitted)
                : 0;
            member.consistency_pct = totalDays > 0
                ? Math.round((member.days_submitted / totalDays) * 100)
                : 0;
        }

        // Convert to array and sort
        let result = Array.from(memberMap.values());

        switch (sort_by) {
            case "average":
                result.sort((a, b) => b.avg_per_day - a.avg_per_day);
                break;
            case "consistency":
                result.sort((a, b) => b.consistency_pct - a.consistency_pct);
                break;
            case "name":
                result.sort((a, b) => (a.nickname || a.display_name || "").localeCompare(b.nickname || b.display_name || ""));
                break;
            case "total":
            default:
                result.sort((a, b) => b.total_steps - a.total_steps);
        }

        // Group dates if needed
        let groupedDates = allDates;
        if (group_by !== "day") {
            groupedDates = groupDates(allDates, group_by);
            // Aggregate member data by groups
            result = result.map(member => ({
                ...member,
                days: aggregateDaysByGroup(member.days, allDates, group_by),
            }));
        }

        return json({
            start_date,
            end_date,
            total_days: totalDays,
            group_by,
            dates: groupedDates,
            members: result,
        });
    } catch (error) {
        console.error("Breakdown error:", error);
        return serverError(error instanceof Error ? error.message : "Unknown error");
    }
}

function groupDates(dates: string[], groupBy: string): string[] {
    if (groupBy === "week") {
        // Group by week (7 days)
        const groups: string[] = [];
        for (let i = 0; i < dates.length; i += 7) {
            const end = Math.min(i + 6, dates.length - 1);
            groups.push(`${dates[i]}~${dates[end]}`);
        }
        return groups;
    } else if (groupBy === "3days") {
        const groups: string[] = [];
        for (let i = 0; i < dates.length; i += 3) {
            const end = Math.min(i + 2, dates.length - 1);
            groups.push(`${dates[i]}~${dates[end]}`);
        }
        return groups;
    } else if (groupBy === "5days") {
        const groups: string[] = [];
        for (let i = 0; i < dates.length; i += 5) {
            const end = Math.min(i + 4, dates.length - 1);
            groups.push(`${dates[i]}~${dates[end]}`);
        }
        return groups;
    }
    return dates;
}

function aggregateDaysByGroup(
    days: Record<string, DayData | null>,
    allDates: string[],
    groupBy: string
): Record<string, DayData | null> {
    const groupSize = groupBy === "week" ? 7 : groupBy === "3days" ? 3 : groupBy === "5days" ? 5 : 1;
    const result: Record<string, DayData | null> = {};

    for (let i = 0; i < allDates.length; i += groupSize) {
        const groupDates = allDates.slice(i, i + groupSize);
        const groupKey = `${groupDates[0]}~${groupDates[groupDates.length - 1]}`;

        let totalSteps = 0;
        let hasData = false;
        let allVerified = true;

        for (const date of groupDates) {
            const dayData = days[date];
            if (dayData) {
                hasData = true;
                totalSteps += dayData.steps;
                if (!dayData.verified) allVerified = false;
            }
        }

        result[groupKey] = hasData
            ? { steps: totalSteps, verified: allVerified }
            : null;
    }

    return result;
}
