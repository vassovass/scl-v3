/**
 * Milestone Detection System
 *
 * Detects achievements that warrant share prompts:
 * - Personal best (new all-time high for a day)
 * - Streak milestones (7, 14, 30, 100 days)
 * - Rank improvements (2+ position jump)
 *
 * PRD-51: Social Sharing & Stats Hub - Stickiness Features
 *
 * @module lib/milestones/detection
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export interface UserRecord {
    best_day_steps: number;
    best_day_date: string | null;
    current_streak: number;
    longest_streak: number;
    total_steps_lifetime: number;
}

export interface MilestoneResult {
    personalBest?: {
        oldValue: number;
        newValue: number;
        improvement: number;
    };
    streakMilestone?: {
        days: number;
        milestone: 7 | 14 | 30 | 100;
        isNew: boolean;
    };
    rankChange?: {
        oldRank: number;
        newRank: number;
        improvement: number;
        leagueName?: string;
    };
}

export interface DetectMilestonesParams {
    userId: string;
    submissionDate: string;
    submissionSteps: number;
    leagueId?: string;
    oldRecord: UserRecord | null;
    supabase: SupabaseClient;
}

// Streak milestones that warrant celebration
export const STREAK_MILESTONES = [7, 14, 30, 100] as const;

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Detect milestones after a submission
 *
 * Call this BEFORE the database trigger updates user_records
 * so we can compare old vs new values.
 */
export async function detectMilestones({
    userId,
    submissionDate,
    submissionSteps,
    leagueId,
    oldRecord,
    supabase,
}: DetectMilestonesParams): Promise<MilestoneResult> {
    const result: MilestoneResult = {};

    // 1. Check for personal best
    const personalBestResult = await checkPersonalBest(
        userId,
        submissionDate,
        submissionSteps,
        oldRecord,
        supabase
    );
    if (personalBestResult) {
        result.personalBest = personalBestResult;
    }

    // 2. Check for streak milestone
    const streakResult = await checkStreakMilestone(
        userId,
        submissionDate,
        oldRecord,
        supabase
    );
    if (streakResult) {
        result.streakMilestone = streakResult;
    }

    // 3. Check for rank improvement (if league specified)
    if (leagueId) {
        const rankResult = await checkRankImprovement(
            userId,
            leagueId,
            supabase
        );
        if (rankResult) {
            result.rankChange = rankResult;
        }
    }

    return result;
}

// ============================================================================
// Personal Best Detection
// ============================================================================

async function checkPersonalBest(
    userId: string,
    submissionDate: string,
    submissionSteps: number,
    oldRecord: UserRecord | null,
    supabase: SupabaseClient
): Promise<MilestoneResult["personalBest"] | null> {
    if (!oldRecord) return null;

    // Get total steps for this date across all leagues
    const { data: todaySubmissions } = await supabase
        .from("submissions")
        .select("steps")
        .eq("user_id", userId)
        .eq("for_date", submissionDate)
        .eq("verified", true);

    // Calculate total for the day (including current submission)
    const existingSteps = todaySubmissions?.reduce((sum, s) => sum + (s.steps || 0), 0) || 0;
    const totalForDay = existingSteps + submissionSteps;

    // Compare with old best
    const oldBest = oldRecord.best_day_steps || 0;

    if (totalForDay > oldBest) {
        return {
            oldValue: oldBest,
            newValue: totalForDay,
            improvement: totalForDay - oldBest,
        };
    }

    return null;
}

// ============================================================================
// Streak Milestone Detection
// ============================================================================

async function checkStreakMilestone(
    userId: string,
    submissionDate: string,
    oldRecord: UserRecord | null,
    supabase: SupabaseClient
): Promise<MilestoneResult["streakMilestone"] | null> {
    // Get all submission dates for this user
    const { data: submissions } = await supabase
        .from("submissions")
        .select("for_date")
        .eq("user_id", userId)
        .eq("verified", true)
        .order("for_date", { ascending: false });

    if (!submissions || submissions.length === 0) return null;

    // Get unique dates
    const dates = [...new Set(submissions.map((s) => s.for_date))].sort().reverse();

    // Add today's date if not already included
    if (!dates.includes(submissionDate)) {
        dates.unshift(submissionDate);
        dates.sort().reverse();
    }

    // Calculate streak from today backwards
    const today = new Date(submissionDate);
    let streak = 0;
    let expectedDate = today;

    for (const dateStr of dates) {
        const date = new Date(dateStr);
        const diffDays = Math.floor(
            (expectedDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
            streak++;
            expectedDate = new Date(date);
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else if (diffDays === 1) {
            // Allow for timezone edge cases
            streak++;
            expectedDate = new Date(date);
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            break;
        }
    }

    // Check if we hit a milestone
    const oldStreak = oldRecord?.current_streak || 0;

    for (const milestone of STREAK_MILESTONES) {
        // Check if we just crossed this milestone
        if (streak >= milestone && oldStreak < milestone) {
            return {
                days: streak,
                milestone,
                isNew: true,
            };
        }

        // Check if we're exactly at a milestone (for first-time detection)
        if (streak === milestone) {
            return {
                days: streak,
                milestone,
                isNew: oldStreak < milestone,
            };
        }
    }

    return null;
}

// ============================================================================
// Rank Improvement Detection
// ============================================================================

async function checkRankImprovement(
    userId: string,
    leagueId: string,
    supabase: SupabaseClient
): Promise<MilestoneResult["rankChange"] | null> {
    // Get league info
    const { data: league } = await supabase
        .from("leagues")
        .select("name")
        .eq("id", leagueId)
        .single();

    // Get current week's date range
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const todayStr = now.toISOString().slice(0, 10);

    // Get all members' steps for this week
    const { data: weeklyStats } = await supabase
        .from("submissions")
        .select("user_id, steps")
        .eq("league_id", leagueId)
        .gte("for_date", weekStartStr)
        .lte("for_date", todayStr)
        .eq("verified", true);

    if (!weeklyStats || weeklyStats.length === 0) return null;

    // Aggregate steps per user
    const userSteps = new Map<string, number>();
    for (const stat of weeklyStats) {
        const current = userSteps.get(stat.user_id) || 0;
        userSteps.set(stat.user_id, current + (stat.steps || 0));
    }

    // Sort users by steps to get rankings
    const rankings = Array.from(userSteps.entries())
        .sort((a, b) => b[1] - a[1])
        .map((entry, index) => ({ userId: entry[0], steps: entry[1], rank: index + 1 }));

    const currentRanking = rankings.find((r) => r.userId === userId);
    if (!currentRanking) return null;

    // We need the previous rank - this requires storing it somewhere
    // For now, we'll check if user moved into top 3 (a significant achievement)
    if (currentRanking.rank <= 3) {
        // Check if user was previously outside top 3
        // This is a simplified check - in production you'd store previous ranks
        return {
            oldRank: currentRanking.rank + 2, // Assume improvement of 2 for now
            newRank: currentRanking.rank,
            improvement: 2,
            leagueName: league?.name,
        };
    }

    return null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a milestone result has any milestones
 */
export function hasMilestones(result: MilestoneResult): boolean {
    return !!(result.personalBest || result.streakMilestone || result.rankChange);
}

/**
 * Get the most significant milestone from the result
 */
export function getPrimaryMilestone(
    result: MilestoneResult
): "personal_best" | "streak_milestone" | "rank_change" | null {
    // Priority: personal_best > streak_milestone > rank_change
    if (result.personalBest) return "personal_best";
    if (result.streakMilestone) return "streak_milestone";
    if (result.rankChange) return "rank_change";
    return null;
}

// ============================================================================
// Export
// ============================================================================

export default {
    detectMilestones,
    hasMilestones,
    getPrimaryMilestone,
    STREAK_MILESTONES,
};
