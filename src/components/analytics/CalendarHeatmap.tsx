"use client";

import { useState, useEffect } from "react";

interface DayData {
    date: string;
    day_of_month: number;
    submitted_count: number;
    total_members: number;
    total_steps: number;
    coverage_pct: number;
}

interface CalendarData {
    month: string;
    total_members: number;
    days: DayData[];
    summary: {
        total_steps: number;
        avg_per_day: number;
        days_with_activity: number;
        coverage_pct: number;
    };
}

interface CalendarHeatmapProps {
    leagueId: string;
    onDayClick?: (day: DayData) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getCoverageColor(pct: number): string {
    if (pct === 0) return "bg-slate-800";
    if (pct < 25) return "bg-slate-700";
    if (pct < 50) return "bg-sky-900";
    if (pct < 75) return "bg-sky-700";
    if (pct < 100) return "bg-emerald-700";
    return "bg-emerald-500";
}

export function CalendarHeatmap({ leagueId, onDayClick }: CalendarHeatmapProps) {
    const [data, setData] = useState<CalendarData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/leagues/${leagueId}/calendar?month=${currentMonth}`);
                if (!res.ok) throw new Error("Failed to fetch calendar");
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [leagueId, currentMonth]);

    const navigateMonth = (delta: number) => {
        const [year, month] = currentMonth.split("-").map(Number);
        const newDate = new Date(year, month - 1 + delta, 1);
        setCurrentMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`);
    };

    const [year, month] = currentMonth.split("-").map(Number);
    const monthName = MONTHS[month - 1];

    // Calculate first day offset (0 = Monday in our grid)
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-400">
                Loading calendar...
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

    if (!data) return null;

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            {/* Header with month navigation */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                    ◀
                </button>
                <h3 className="text-lg font-semibold text-slate-100">
                    {monthName} {year}
                </h3>
                <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                >
                    ▶
                </button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                <div className="p-2 rounded bg-slate-800">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="text-sm font-semibold text-slate-200">{data.summary.total_steps.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded bg-slate-800">
                    <div className="text-xs text-slate-500">Avg/Day</div>
                    <div className="text-sm font-semibold text-slate-200">{data.summary.avg_per_day.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded bg-slate-800">
                    <div className="text-xs text-slate-500">Active Days</div>
                    <div className="text-sm font-semibold text-slate-200">{data.summary.days_with_activity}</div>
                </div>
                <div className="p-2 rounded bg-slate-800">
                    <div className="text-xs text-slate-500">Coverage</div>
                    <div className="text-sm font-semibold text-slate-200">{data.summary.coverage_pct}%</div>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                {WEEKDAYS.map((day) => (
                    <div key={day} className="text-center text-[10px] text-slate-500 py-0.5">
                        {day.charAt(0)}
                    </div>
                ))}
            </div>

            {/* Calendar grid - compact squares */}
            <div className="grid grid-cols-7 gap-0.5">
                {/* Empty cells for offset */}
                {Array.from({ length: offset }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-full h-6 sm:h-8" />
                ))}

                {/* Day cells */}
                {data.days.map((day) => (
                    <button
                        key={day.date}
                        onClick={() => onDayClick?.(day)}
                        title={`${day.date}: ${day.submitted_count}/${day.total_members} submitted (${day.coverage_pct}%)`}
                        className={`h-6 sm:h-8 w-full rounded-sm text-[10px] sm:text-xs transition hover:ring-1 hover:ring-sky-500 flex items-center justify-center ${getCoverageColor(day.coverage_pct)}`}
                    >
                        <span className="text-slate-300 font-medium">{day.day_of_month}</span>
                    </button>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded bg-slate-800" />
                    <div className="w-3 h-3 rounded bg-slate-700" />
                    <div className="w-3 h-3 rounded bg-sky-900" />
                    <div className="w-3 h-3 rounded bg-sky-700" />
                    <div className="w-3 h-3 rounded bg-emerald-700" />
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
