"use client";

import { useState, useEffect, useRef } from "react";
import { IDENTITY_LABEL, IDENTITY_FALLBACK } from "@/lib/identity";

interface DayData {
    steps: number;
    verified: boolean;
}

interface MemberBreakdown {
    user_id: string;
    display_name: string | null;
    total_steps: number;
    days_submitted: number;
    avg_per_day: number;
    consistency_pct: number;
    days: Record<string, DayData | null>;
}

interface BreakdownData {
    start_date: string;
    end_date: string;
    total_days: number;
    group_by: string;
    dates: string[];
    members: MemberBreakdown[];
}

interface DailyBreakdownTableProps {
    leagueId: string;
    startDate?: string;
    endDate?: string;
    groupBy?: "day" | "3days" | "5days" | "week";
}

type SortBy = "total" | "average" | "consistency" | "name";

const GROUP_OPTIONS = [
    { value: "day", label: "Daily" },
    { value: "3days", label: "3-Day" },
    { value: "5days", label: "5-Day" },
    { value: "week", label: "Weekly" },
];

function getStepsColor(steps: number | null): string {
    if (steps === null) return "bg-muted text-muted-foreground";
    if (steps < 3000) return "bg-muted text-muted-foreground";
    if (steps < 6000) return "bg-[hsl(var(--info)/0.2)] text-[hsl(var(--info))]";
    if (steps < 10000) return "bg-[hsl(var(--info)/0.3)] text-[hsl(var(--info))]";
    if (steps < 15000) return "bg-[hsl(var(--success)/0.2)] text-[hsl(var(--success))]";
    return "bg-[hsl(var(--success)/0.3)] text-[hsl(var(--success))]";
}

function formatSteps(steps: number | null): string {
    if (steps === null) return "--";
    if (steps >= 1000) return `${Math.round(steps / 1000)} k`;
    return String(steps);
}

function formatDateLabel(dateStr: string): string {
    if (dateStr.includes("~")) {
        // Range format: "2024-12-01~2024-12-07"
        const [start, end] = dateStr.split("~");
        const s = new Date(start + "T00:00:00");
        const e = new Date(end + "T00:00:00");
        return `${s.getDate()} -${e.getDate()} `;
    }
    // Single date
    return String(new Date(dateStr + "T00:00:00").getDate());
}

export function DailyBreakdownTable({
    leagueId,
    startDate,
    endDate,
    groupBy: initialGroupBy = "day",
}: DailyBreakdownTableProps) {
    const [data, setData] = useState<BreakdownData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortBy>("total");
    const [groupBy, setGroupBy] = useState(initialGroupBy);
    const tableRef = useRef<HTMLDivElement>(null);

    // Default to current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const defaultStart = startDate || `${year} -${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const defaultEnd = endDate || `${year} -${String(month + 1).padStart(2, "0")} -${String(lastDay).padStart(2, "0")} `;

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    start_date: defaultStart,
                    end_date: defaultEnd,
                    group_by: groupBy,
                    sort_by: sortBy,
                });
                const res = await fetch(`/ api / leagues / ${leagueId}/daily-breakdown?${params}`);
                if (!res.ok) throw new Error("Failed to fetch breakdown");
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [leagueId, defaultStart, defaultEnd, groupBy, sortBy]);

    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-muted-foreground">
                Loading breakdown...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
                {error}
            </div>
        );
    }

    if (!data || data.members.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-muted-foreground">
                No data for this period.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card/50">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 p-4 border-b border-border">
                {/* Group By */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Group:</span>
                    <div className="flex gap-1">
                        {GROUP_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setGroupBy(opt.value as typeof groupBy)}
                                className={`px-2 py-1 text-xs rounded transition ${groupBy === opt.value
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                        className="rounded bg-secondary border border-input px-2 py-1 text-xs text-foreground"
                    >
                        <option value="total">Total Steps</option>
                        <option value="average">Average</option>
                        <option value="consistency">Consistency</option>
                        <option value="name">Name</option>
                    </select>
                </div>
            </div>

            {/* Table with horizontal scroll */}
            <div ref={tableRef} className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead className="bg-card sticky top-0">
                        <tr>
                            <th className="px-3 py-3 text-left font-medium sticky left-0 z-20 bg-card min-w-[120px]">
                                {IDENTITY_LABEL}
                            </th>
                            {data.dates.map((dateStr) => (
                                <th key={dateStr} className="px-1 py-2 text-center text-muted-foreground font-medium min-w-[40px]">
                                    {formatDateLabel(dateStr)}
                                </th>
                            ))}
                            <th className="px-3 py-2 text-right text-muted-foreground font-medium min-w-[70px]">
                                Total
                            </th>
                            <th className="px-3 py-2 text-right text-muted-foreground font-medium min-w-[50px]">
                                Avg
                            </th>
                            <th className="px-3 py-2 text-center text-muted-foreground font-medium min-w-[40px]">
                                %
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.members.map((member, idx) => (
                            <tr key={member.user_id} className="hover:bg-muted/50">
                                {/* Member name - sticky */}
                                <td className="sticky left-0 z-10 bg-background px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground w-4">{idx + 1}.</span>
                                        <span className="text-foreground truncate max-w-[100px]">
                                            {member.display_name || IDENTITY_FALLBACK}
                                        </span>
                                    </div>
                                </td>

                                {/* Day cells */}
                                {data.dates.map((dateStr) => {
                                    const dayData = member.days[dateStr];
                                    return (
                                        <td
                                            key={dateStr}
                                            className={`px-1 py-2 text-center font-mono ${getStepsColor(dayData?.steps ?? null)}`}
                                            title={dayData ? `${dayData.steps.toLocaleString()} steps${dayData.verified ? " ✓" : ""}` : "No data"}
                                        >
                                            {formatSteps(dayData?.steps ?? null)}
                                            {dayData?.verified && <span className="text-[hsl(var(--success))] ml-0.5">✓</span>}
                                        </td>
                                    );
                                })}

                                {/* Totals */}
                                <td className="px-3 py-2 text-right font-mono text-foreground">
                                    {member.total_steps.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                                    {member.avg_per_day.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <span className={`${member.consistency_pct >= 80 ? "text-[hsl(var(--success))]" : member.consistency_pct >= 50 ? "text-[hsl(var(--info))]" : "text-muted-foreground"}`}>
                                        {member.consistency_pct}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
