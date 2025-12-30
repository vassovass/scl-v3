"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { analytics } from "@/lib/analytics";

// Form field configuration - easy to extend for future fields
interface LeagueFormData {
    name: string;
    stepweek_start: "monday" | "sunday";
}

const initialFormData: LeagueFormData = {
    name: "",
    stepweek_start: "monday",
};

export default function CreateLeaguePage() {
    const router = useRouter();
    const { session } = useAuth();

    const [formData, setFormData] = useState<LeagueFormData>(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Validation
    const nameError = formData.name.length > 100
        ? "League name must be 100 characters or less"
        : null;
    const isValid = formData.name.trim().length > 0 && !nameError;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValid || loading) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/leagues", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    stepweek_start: formData.stepweek_start,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create league");
            }

            // Success - redirect to the new league
            analytics.leagueCreated(data.league.id, formData.name.trim());
            router.push(`/league/${data.league.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setLoading(false);
        }
    };

    // Redirect if not logged in
    if (!session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="text-center">
                    <p className="text-slate-400">Please sign in to create a league</p>
                    <Link href="/sign-in" className="mt-4 text-sky-400 hover:text-sky-300">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Main */}
            <ModuleFeedback moduleId="create-league-form" moduleName="Create League Form">
                <div className="mx-auto max-w-lg px-6 py-12">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-slate-50">Create a New League</h1>
                        <p className="mt-2 text-slate-400">
                            Set up your step competition and invite friends
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {/* Error message */}
                        {error && (
                            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                                {error}
                            </div>
                        )}

                        {/* League Name */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-slate-300"
                            >
                                League Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="My Awesome League"
                                maxLength={100}
                                className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                                disabled={loading}
                                autoFocus
                            />
                            {nameError && (
                                <p className="mt-2 text-sm text-rose-400">{nameError}</p>
                            )}
                            <p className="mt-2 text-xs text-slate-500">
                                {formData.name.length}/100 characters
                            </p>
                        </div>

                        {/* Week Start Day */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300">
                                Week Starts On
                            </label>
                            <p className="mt-1 text-xs text-slate-500">
                                This determines when weekly leaderboards reset
                            </p>
                            <div className="mt-3 space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="stepweek_start"
                                        value="monday"
                                        checked={formData.stepweek_start === "monday"}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            stepweek_start: e.target.value as "monday" | "sunday"
                                        }))}
                                        className="h-4 w-4 border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950"
                                        disabled={loading}
                                    />
                                    <span className="text-slate-300 group-hover:text-slate-100 transition">
                                        Monday <span className="text-slate-500">(recommended)</span>
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="stepweek_start"
                                        value="sunday"
                                        checked={formData.stepweek_start === "sunday"}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            stepweek_start: e.target.value as "monday" | "sunday"
                                        }))}
                                        className="h-4 w-4 border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-950"
                                        disabled={loading}
                                    />
                                    <span className="text-slate-300 group-hover:text-slate-100 transition">
                                        Sunday
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Future fields placeholder - uncomment when needed */}
                        {/* 
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What's this league about?"
              className="..."
            />
          </div>
          */}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!isValid || loading}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-500"
                        >
                            {loading && <Spinner size="sm" />}
                            {loading ? "Creating League..." : "Create League"}
                        </button>

                        <p className="text-center text-xs text-slate-500">
                            Once created, you&apos;ll get an invite code to share with friends
                        </p>
                    </form>
                </div>
            </ModuleFeedback>
        </div>
    );
}
