"use client";

import { League } from "@/types/database";
import { SettingsSection } from "@/components/settings";
import { DatePicker } from "@/components/ui/DatePicker";

interface CompetitionSettingsProps {
    league: League;
    onChange: (updates: Partial<League>) => void;
    disabled?: boolean;
}

export function CompetitionSettings({ league, onChange, disabled }: CompetitionSettingsProps) {

    // Calculate presets
    const today = new Date();

    // Start of this week (assume Monday start for now, or use league preference if needed)
    // Logic: getDay() returns 0 for Sunday. If today is Sunday (0), we go back 6 days to Monday.
    // If today is Tuesday (2), we go back 1 day.
    // (day + 6) % 7 get us the "days since last monday" effectively?
    // 0 (Sun) -> 6 days ago
    // 1 (Mon) -> 0 days ago
    // ...
    const day = today.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diffToMonday);

    // Start of this month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Start of last month
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const presets = [
        { label: "Today", date: today },
        { label: "This Week (Mon)", date: startOfWeek },
        { label: "This Month", date: startOfMonth },
        { label: "Last Month", date: startOfLastMonth },
    ];

    return (
        <SettingsSection
            title="Competition & Goal Settings"
            description="Configure how the competition works and what goals members should aim for."
        >
            {/* Counting Start Date */}
            <div>
                <div className="mb-2">
                    <DatePicker
                        label="Counting Start Date"
                        value={league.counting_start_date || ""}
                        onChange={(date) => onChange({ counting_start_date: date || null })}
                        required={false}
                        presets={presets}
                    />
                </div>
                <p className="text-xs text-slate-500">
                    select <strong>Custom</strong> by picking a specific date from the calendar.
                    Only steps submitted for dates <strong>on or after</strong> this date will count towards the leaderboard.
                    Steps before this date are excluded from league stats but remain in user history.
                    Leave empty to count all history since league creation.
                </p>
            </div>

            {/* Max Members */}
            <div>
                <label htmlFor="max_members" className="block text-sm font-medium text-slate-300">
                    Max Members
                </label>
                <div className="relative mt-2">
                    <input
                        id="max_members"
                        type="number"
                        min={1}
                        value={league.max_members || 50}
                        onChange={(e) => onChange({ max_members: parseInt(e.target.value) || 50 })}
                        disabled={disabled}
                        className="block w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 transition"
                    />
                    <div className="pointer-events-none absolute inset-y-0 left-[160px] flex items-center pr-4">
                        {/* Adjust positioning or just use text after? Using max-w-xs roughly 320px */}
                    </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                    Limit the number of members who can join.
                </p>
            </div>
        </SettingsSection>
    );
}

