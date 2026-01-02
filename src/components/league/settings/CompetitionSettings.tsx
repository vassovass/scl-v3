"use client";

import { League } from "@/types/database";
import { SettingsSection } from "./SettingsSection";
import { DatePicker } from "@/components/ui/DatePicker";

interface CompetitionSettingsProps {
    league: League;
    onChange: (updates: Partial<League>) => void;
    disabled?: boolean;
}

export function CompetitionSettings({ league, onChange, disabled }: CompetitionSettingsProps) {
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
                    />
                </div>
                <p className="text-xs text-slate-500">
                    Only steps submitted for dates <strong>on or after</strong> this date will count towards the leaderboard.
                    Steps before this date are excluded from league stats but remain in user history.
                    Leave empty to count all history since league creation.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Step Goal */}
                <div>
                    <label htmlFor="daily_step_goal" className="block text-sm font-medium text-slate-300">
                        Daily Step Goal
                    </label>
                    <div className="relative mt-2">
                        <input
                            id="daily_step_goal"
                            type="number"
                            min={1000}
                            step={500}
                            value={league.daily_step_goal || 10000}
                            onChange={(e) => onChange({ daily_step_goal: parseInt(e.target.value) || 10000 })}
                            disabled={disabled}
                            className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 transition"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                            <span className="text-slate-500 text-sm">steps</span>
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Visual target for members to achieve each day.
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
                            className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 transition"
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                            <span className="text-slate-500 text-sm">members</span>
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        Limit the number of members who can join.
                    </p>
                </div>
            </div>
        </SettingsSection>
    );
}
