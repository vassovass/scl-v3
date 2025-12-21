"use client";

import { useState, useEffect, useRef } from "react";

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
    if (steps === null) return "bg-slate-800 text-slate-600";
    if (steps < 3000) return "bg-slate-700 text-slate-400";
    if (steps < 6000) return "bg-sky-900/50 text-sky-300";
    if (steps < 10000) return "bg-sky-700/50 text-sky-200";
    if (steps < 15000) return "bg-emerald-700/50 text-emerald-200";
    return "bg-emerald-500/30 text-emerald-300";
}

function formatSteps(steps: number | null): string {
    if (steps === null) return "--";
    if (steps >= 1000) return `${Math.round(steps / 1000)}k`;
    return String(steps);
}

function formatDateLabel(dateStr: string): string {
    if (dateStr.includes("~")) {
        // Range format: "2024-12-01~2024-12-07"
        const [start, end] = dateStr.split("~");
        const s = new Date(start + "T00:00:00");
        const e = new Date(end + "T00:00:00");
        return `${s.getDate()}-${e.getDate()}`;
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
    const defaultStart = startDate || `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const defaultEnd = endDate || `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

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
                const res = await fetch(`/api/leagues/${leagueId}/daily-breakdown?${params}`);
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
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400">
                Loading breakdown...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-rose-800 bg-rose-900/20 p-6 text-center text-rose-400">
                {error}
            </div>
        );
    }

    if (!data || data.members.length === 0) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400">
                No data for this period.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 p-4 border-b border-slate-800">
                {/* Group By */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Group:</span>
                    <div className="flex gap-1">
                        {GROUP_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setGroupBy(opt.value as typeof groupBy)}
                                className={`px-2 py-1 text-xs rounded transition ${groupBy === opt.value
                                        ? "bg-sky-600 text-white"
                                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Sort:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                        className="rounded bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200"
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
                    <thead className="bg-slate-900 sticky top-0">
                        <tr>
                            <th className="sticky left-0 z-10 bg-slate-900 px-3 py-2 text-left text-slate-400 font-medium min-w-[120px]">
                                Member
                            </th>
                            {data.dates.map((dateStr) => (
                                <th key={dateStr} className="px-1 py-2 text-center text-slate-500 font-medium min-w-[40px]">
                                    {formatDateLabel(dateStr)}
                                </th>
                            ))}
                            <th className="px-3 py-2 text-right text-slate-400 font-medium min-w-[70px]">
                                Total
                            </th>
                            <th className="px-3 py-2 text-right text-slate-400 font-medium min-w-[50px]">
                                Avg
                            </th>
                            <th className="px-3 py-2 text-center text-slate-400 font-medium min-w-[40px]">
                                %
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {data.members.map((member, idx) => (
                            <tr key={member.user_id} className="hover:bg-slate-900/50">
                                {/* Member name - sticky */}
                                <td className="sticky left-0 z-10 bg-slate-950 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-500 w-4">{idx + 1}.</span>
                                        <span className="text-slate-200 truncate max-w-[100px]">
                                            {member.nickname || member.display_name || "Anonymous"}
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
                                            {dayData?.verified && <span className="text-emerald-400 ml-0.5">✓</span>}
                                        </td>
                                    );
                                })}

                                {/* Totals */}
                                <td className="px-3 py-2 text-right font-mono text-slate-200">
                                    {member.total_steps.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-slate-400">
                                    {member.avg_per_day.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <span className={`${member.consistency_pct >= 80 ? "text-emerald-400" : member.consistency_pct >= 50 ? "text-sky-400" : "text-slate-500"}`}>
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
