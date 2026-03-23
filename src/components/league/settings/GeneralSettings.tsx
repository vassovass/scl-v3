"use client";

import { League } from "@/types/database";
import { SettingsSection } from "@/components/settings";

interface GeneralSettingsProps {
    league: League;
    onChange: (updates: Partial<League>) => void;
    disabled?: boolean;
}

export function GeneralSettings({ league, onChange, disabled }: GeneralSettingsProps) {
    return (
        <SettingsSection
            title="General Information"
            description="Basic details about your league that members will see."
        >
            {/* League Name */}
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">
                    League Name
                </label>
                <input
                    id="name"
                    type="text"
                    value={league.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    disabled={disabled}
                    maxLength={100}
                    className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 transition"
                />
            </div>

            {/* Description */}
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-muted-foreground">
                    Description
                </label>
                <textarea
                    id="description"
                    value={league.description || ""}
                    onChange={(e) => onChange({ description: e.target.value })}
                    disabled={disabled}
                    maxLength={500}
                    rows={3}
                    placeholder="What is this league about?"
                    className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 transition resize-none"
                />
                <p className="mt-1 text-xs text-muted-foreground text-right">
                    {(league.description?.length || 0)}/500
                </p>
            </div>

            {/* Category */}
            <div>
                <label htmlFor="category" className="block text-sm font-medium text-muted-foreground">
                    Category
                </label>
                <select
                    id="category"
                    value={league.category || "general"}
                    onChange={(e) => onChange({ category: e.target.value })}
                    disabled={disabled}
                    className="mt-2 block w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 transition"
                >
                    <option value="general">General</option>
                    <option value="corporate">Corporate / Office</option>
                    <option value="friends">Friends & Family</option>
                    <option value="running">Running Club</option>
                    <option value="walking">Walking Group</option>
                    <option value="competitive">Competitive</option>
                    <option value="health">Health & Wellness</option>
                </select>
            </div>


        </SettingsSection>
    );
}

