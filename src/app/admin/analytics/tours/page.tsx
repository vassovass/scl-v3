"use client";

import { useEffect, useState } from "react";
import { KPICard, TourCompletionChart, TourFeedbackSummary, StepDropoffFunnel } from "@/components/admin/analytics";
import { FormSelect } from "@/components/ui/form-fields";
import { BarChart3, CheckCircle, XCircle, MessageSquare } from "lucide-react";

/**
 * Tour Analytics Page
 * 
 * PRD 50 Phase 5 - Admin Tour Analytics
 * 
 * Displays:
 * - Overall tour completion KPIs
 * - Per-tour completion rates
 * - Step drop-off funnel
 * - Feedback summary
 */

interface TourStats {
    tourId: string;
    totalStarts: number;
    totalCompletions: number;
    completionRate: number;
    avgDuration: number | null;
}

interface StepDropoff {
    tourId: string;
    stepIndex: number;
    stepId: string;
    views: number;
    dropoffRate: number;
}

interface FeedbackSummary {
    totalFeedback: number;
    ratings: Record<string, number>;
    averageRating: number;
}

interface TourAnalyticsData {
    tourStats: TourStats[];
    stepDropoff: StepDropoff[];
    feedbackSummary: FeedbackSummary;
    totalCompletions: number;
    totalStarts: number;
    overallCompletionRate: number;
}

export default function TourAnalyticsPage() {
    const [data, setData] = useState<TourAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTour, setSelectedTour] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/admin/analytics/tours");
                if (!res.ok) {
                    throw new Error(res.status === 403 ? "Access denied" : "Failed to fetch");
                }
                const json = await res.json();
                setData(json);

                // Select first tour for drop-off view
                if (json.tourStats && json.tourStats.length > 0) {
                    setSelectedTour(json.tourStats[0].tourId);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load data");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center h-[300px] text-destructive">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-tour="admin-analytics-kpis">
                <KPICard
                    label="Total Starts"
                    value={loading ? "—" : (data?.totalStarts || 0)}
                    icon={<BarChart3 className="h-4 w-4" />}
                    loading={loading}
                />
                <KPICard
                    label="Completions"
                    value={loading ? "—" : (data?.totalCompletions || 0)}
                    icon={<CheckCircle className="h-4 w-4" />}
                    variant={data && data.totalCompletions > 0 ? "success" : "default"}
                    loading={loading}
                />
                <KPICard
                    label="Completion Rate"
                    value={loading ? "—" : `${(data?.overallCompletionRate || 0).toFixed(1)}%`}
                    icon={<XCircle className="h-4 w-4" />}
                    variant={
                        data && data.overallCompletionRate >= 60
                            ? "success"
                            : data && data.overallCompletionRate >= 30
                                ? "warning"
                                : "default"
                    }
                    loading={loading}
                />
                <KPICard
                    label="Feedback Count"
                    value={loading ? "—" : (data?.feedbackSummary?.totalFeedback || 0)}
                    icon={<MessageSquare className="h-4 w-4" />}
                    loading={loading}
                />
            </div>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Tour Completion Rates */}
                <div data-tour="admin-analytics-completion">
                    <TourCompletionChart
                        data={data?.tourStats || []}
                        loading={loading}
                    />
                </div>

                {/* Feedback Summary */}
                <div data-tour="admin-analytics-feedback">
                    <TourFeedbackSummary
                        data={data?.feedbackSummary || null}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Step Drop-off Section */}
            {data?.tourStats && data.tourStats.length > 0 && (
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <h3 className="font-medium">Step Drop-off Analysis</h3>
                        <FormSelect
                            fieldName="tour-selection"
                            value={selectedTour || ""}
                            onChange={(e) => setSelectedTour(e.target.value)}
                            className="text-sm border rounded px-2 py-1 bg-background"
                        >
                            {data.tourStats.map((tour) => (
                                <option key={tour.tourId} value={tour.tourId}>
                                    {tour.tourId}
                                </option>
                            ))}
                        </FormSelect>
                    </div>

                    {selectedTour && (
                        <div data-tour="admin-analytics-dropoff">
                            <StepDropoffFunnel
                                data={data.stepDropoff}
                                tourId={selectedTour}
                                loading={loading}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!loading && (!data || data.totalStarts === 0) && (
                <div className="bg-muted/30 border border-dashed rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">
                        No tour analytics data yet. Data will appear here once users interact with tours.
                    </p>
                </div>
            )}
        </div>
    );
}
