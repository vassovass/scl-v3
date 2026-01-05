"use client";

import { League } from "@/types/database";
import { SettingsSection } from "./SettingsSection";
import { toast } from "@/hooks/use-toast";

interface DangerZoneProps {
    league: League;
    disabled?: boolean;
}

export function DangerZone({ league, disabled }: DangerZoneProps) {
    // Placeholder for delete/archive logic
    const handleDelete = () => {
        toast({
            title: "Coming soon",
            description: "Delete league functionality is not fully implemented yet.",
        });
    };

    return (
        <SettingsSection
            title="Danger Zone"
            description="Irreversible actions for your league."
            danger
        >
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="font-medium text-slate-300">Delete League</p>
                    <p className="text-xs text-slate-500 mt-1">
                        Permanently delete this league and all its data. This action cannot be undone.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={disabled}
                    className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-900/50 hover:text-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    Delete League
                </button>
            </div>
        </SettingsSection>
    );
}
