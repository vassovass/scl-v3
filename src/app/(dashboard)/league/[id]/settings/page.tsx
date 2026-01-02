"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { League } from "@/types/database";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { Spinner } from "@/components/ui/Spinner";
import { GeneralSettings } from "@/components/league/settings/GeneralSettings";
import { CompetitionSettings } from "@/components/league/settings/CompetitionSettings";
import { RulesSettings } from "@/components/league/settings/RulesSettings";
import { DangerZone } from "@/components/league/settings/DangerZone";
import Link from "next/link";
import { analytics, trackEvent } from "@/lib/analytics";

export default function LeagueSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { session } = useAuth();
    const leagueId = params?.id as string;

    const [league, setLeague] = useState<League | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch league data
    useEffect(() => {
        if (!leagueId || !session) return;

        async function fetchLeague() {
            try {
                const res = await fetch(`/api/leagues/${leagueId}`);
                if (!res.ok) {
                    if (res.status === 403) throw new Error("Access Denied");
                    if (res.status === 404) throw new Error("League not found");
                    throw new Error("Failed to load league");
                }
                const data = await res.json();

                // Simple permission check: must be owner or superadmin to edit
                // The API GET returns role. But strictly speaking only owners can edit via API.
                // We'll let the UI render, but save will fail if not authorized.
                // ideally we check data.league.role

                setLeague(data.league);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
                if (err instanceof Error && err.message === "Access Denied") {
                    setTimeout(() => router.push(`/league/${leagueId}`), 2000);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchLeague();
    }, [leagueId, session, router]);

    const handleUpdate = (updates: Partial<League>) => {
        if (!league) return;
        setLeague({ ...league, ...updates });
        // Clear success message on edit so user knows they have unsaved changes visually (optional, or rely on Save button state?)
        // For now, simple state update.
        setSuccessMessage(null);
    };

    const handleSave = async () => {
        if (!league) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await fetch(`/api/leagues/${leagueId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: league.name,
                    stepweek_start: league.stepweek_start,
                    counting_start_date: league.counting_start_date,
                    description: league.description,
                    category: league.category,
                    is_public: league.is_public,
                    allow_manual_entry: league.allow_manual_entry,
                    require_verification_photo: league.require_verification_photo,
                    daily_step_goal: league.daily_step_goal,
                    max_members: league.max_members,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update settings");
            }

            setLeague(data.league);
            setSuccessMessage("Settings saved successfully");
            trackEvent("league_settings_updated", { league_id: leagueId, category: "settings", action: "update" });

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!league) {
        return (
            <div className="p-8 text-center">
                <p className="text-rose-400">{error || "League not found"}</p>
                <Link href="/dashboard" className="mt-4 inline-block text-sky-400 hover:text-sky-300">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <ModuleFeedback moduleId="league-settings" moduleName="League Settings">
            <div className="mx-auto max-w-4xl space-y-8 px-4 pb-20 pt-8">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Link href={`/league/${leagueId}`} className="hover:text-sky-400 transition">
                                {league.name}
                            </Link>
                            <span>/</span>
                            <span>Settings</span>
                        </div>
                        <h1 className="mt-1 text-3xl font-bold text-slate-50">League Settings</h1>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href={`/league/${leagueId}`}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition"
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-2 text-sm font-bold text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        >
                            {saving && <Spinner size="sm" />}
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-rose-400">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-400">
                        {successMessage}
                    </div>
                )}

                <div className="grid gap-8">
                    <GeneralSettings league={league} onChange={handleUpdate} disabled={saving} />
                    <CompetitionSettings league={league} onChange={handleUpdate} disabled={saving} />
                    <RulesSettings league={league} onChange={handleUpdate} disabled={saving} />
                    <DangerZone league={league} disabled={saving} />
                </div>
            </div>
        </ModuleFeedback>
    );
}
