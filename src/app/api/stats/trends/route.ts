/**
 * Trends API Route (PRD-54)
 *
 * GET: Fetch trend data for a user
 * Returns aggregated submission data by period for trend visualization.
 */

import { z } from "zod";
import { withApiHandler } from "@/lib/api/handler";
import { badRequest } from "@/lib/api";
import {
    generatePeriodRanges,
    aggregateByPeriod,
    calculateTrendSummary,
    formatForChart,
} from "@/lib/trends";
import type { TrendPeriod, TrendMetric } from "@/lib/trends";

const trendQuerySchema = z.object({
    period: z.enum(["daily", "weekly", "monthly"]).optional().default("weekly"),
    metric: z.enum(["steps", "calories", "distance"]).optional().default("steps"),
    count: z.coerce.number().min(2).max(52).optional().default(8),
    includeComparison: z.enum(["true", "false"]).optional().default("false"),
});

export const GET = withApiHandler(
    { auth: "required" },
    async ({ user, request, adminClient }) => {
        const { searchParams } = new URL(request.url);

        // Parse and validate query params
        const parseResult = trendQuerySchema.safeParse({
            period: searchParams.get("period"),
            metric: searchParams.get("metric"),
            count: searchParams.get("count"),
            includeComparison: searchParams.get("includeComparison"),
        });

        if (!parseResult.success) {
            return badRequest("Invalid query parameters");
        }

        const { period, metric, count, includeComparison } = parseResult.data;
        const shouldIncludeComparison = includeComparison === "true";

        // Generate period ranges
        const endDate = new Date();
        const ranges = generatePeriodRanges(period as TrendPeriod, count, endDate);

        // Get date range for query
        const firstPeriodStart = ranges[0].start;
        const lastPeriodEnd = ranges[ranges.length - 1].end;

        // If comparison is requested, we need data from previous periods too
        let comparisonRanges: typeof ranges = [];
        let queryStartDate = firstPeriodStart;

        if (shouldIncludeComparison) {
            // Generate comparison ranges (same count of periods before current)
            const comparisonEndDate = new Date(firstPeriodStart);
            comparisonEndDate.setDate(comparisonEndDate.getDate() - 1);
            comparisonRanges = generatePeriodRanges(
                period as TrendPeriod,
                count,
                comparisonEndDate
            );
            queryStartDate = comparisonRanges[0]?.start || firstPeriodStart;
        }

        // Fetch submissions
        const { data: submissions, error } = await adminClient
            .from("submissions")
            .select("for_date, steps, calories, distance")
            .eq("user_id", user!.id)
            .gte("for_date", queryStartDate.toISOString().slice(0, 10))
            .lte("for_date", lastPeriodEnd.toISOString().slice(0, 10))
            .order("for_date", { ascending: true });

        if (error) {
            console.error("[Trends API] Query error:", error);
            return badRequest("Failed to fetch trend data");
        }

        // Aggregate data by period
        const data = aggregateByPeriod(
            submissions || [],
            ranges,
            metric as TrendMetric
        );

        // Calculate summary
        const summary = calculateTrendSummary(data);

        // Generate comparison data if requested
        let comparison = null;
        if (shouldIncludeComparison && comparisonRanges.length > 0) {
            comparison = aggregateByPeriod(
                submissions || [],
                comparisonRanges,
                metric as TrendMetric
            );
        }

        // Format for chart
        const chartData = formatForChart(data, {
            showComparison: shouldIncludeComparison,
            comparisonData: comparison || undefined,
        });

        return {
            data,
            chartData,
            comparison,
            summary,
            period,
            metric,
            count,
        };
    }
);
