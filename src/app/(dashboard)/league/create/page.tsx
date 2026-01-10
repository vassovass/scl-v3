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
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <p className="text-muted-foreground">Please sign in to create a league</p>
                    <Link href="/sign-in" className="mt-4 text-primary hover:text-primary/80">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Main */}
            <ModuleFeedback moduleId="create-league-form" moduleName="Create League Form">
                <div className="mx-auto max-w-lg px-6 py-12">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground">Create a New League</h1>
                        <p className="mt-2 text-muted-foreground">
                            Set up your step competition and invite friends
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        {/* Error message */}
                        {error && (
                            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {/* League Name */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-foreground"
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
                                className="mt-2 block w-full rounded-lg border border-input bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                                disabled={loading}
                                autoFocus
                            />
                            {nameError && (
                                <p className="mt-2 text-sm text-destructive">{nameError}</p>
                            )}
                            <p className="mt-2 text-xs text-muted-foreground">
                                {formData.name.length}/100 characters
                            </p>
                        </div>

                        {/* Week Start Day */}
                        <div>
                            <label className="block text-sm font-medium text-foreground">
                                Week Starts On
                            </label>
                            <p className="mt-1 text-xs text-muted-foreground">
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
                                        className="h-4 w-4 border-input bg-secondary text-primary focus:ring-primary focus:ring-offset-background"
                                        disabled={loading}
                                    />
                                    <span className="text-foreground group-hover:text-foreground/80 transition">
                                        Monday <span className="text-muted-foreground">(recommended)</span>
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
                                        className="h-4 w-4 border-input bg-secondary text-primary focus:ring-primary focus:ring-offset-background"
                                        disabled={loading}
                                    />
                                    <span className="text-foreground group-hover:text-foreground/80 transition">
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
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                        >
                            {loading && <Spinner size="sm" />}
                            {loading ? "Creating League..." : "Create League"}
                        </button>

                        <p className="text-center text-xs text-muted-foreground">
                            Once created, you&apos;ll get an invite code to share with friends
                        </p>
                    </form>
                </div>
            </ModuleFeedback>
        </div>
    );
}
