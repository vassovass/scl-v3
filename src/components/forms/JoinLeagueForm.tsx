"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { analytics } from "@/lib/analytics";

interface JoinLeagueFormProps {
    prefilledCode?: string;
}

export function JoinLeagueForm({ prefilledCode = "" }: JoinLeagueFormProps) {
    const router = useRouter();
    const { session } = useAuth();

    const [inviteCode, setInviteCode] = useState(prefilledCode);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) {
            // If not logged in, redirect to login with callback
            // This is simplified; invite page might handle auth differently
            router.push(`/sign-in?redirect=/invite/${inviteCode}`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/invite/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ invite_code: inviteCode.toUpperCase() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to join league");
                setLoading(false);
                return;
            }

            analytics.leagueJoined(data.league_id, 'invite');
            router.push(`/league/${data.league_id}`);
        } catch {
            setError("Something went wrong");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-300 sr-only">
                    Invite Code
                </label>
                <input
                    id="code"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    required
                    placeholder="ABC123"
                    className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-center text-2xl font-mono tracking-widest text-slate-50 uppercase placeholder:text-slate-600 focus:border-sky-500 focus:outline-none"
                    maxLength={10}
                />
            </div>

            <button
                type="submit"
                disabled={loading || inviteCode.length < 4}
                className="w-full rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
            >
                {loading ? "Joining..." : prefilledCode ? "Join League" : "Join League"}
            </button>
        </form>
    );
}
