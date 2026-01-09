"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { normalizeError, reportErrorClient, errorFromResponse, ErrorCode } from "@/lib/errors";
import { SubmissionForm } from "@/components/forms/SubmissionForm";
import { BatchSubmissionForm } from "@/components/forms/BatchSubmissionForm";
import { BulkUnverifiedForm } from "@/components/forms/BulkUnverifiedForm";
import { ProxySubmissionSection } from "@/components/forms/ProxySubmissionSection";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";

interface League {
    id: string;
    name: string;
    role?: string;
    allow_manual_entry?: boolean;
    require_verification_photo?: boolean;
}

interface Submission {
    id: string;
    for_date: string;
    steps: number;
    verified: boolean | null;
    partial: boolean;
    created_at: string;
    verification_notes?: string | null;
    league_name?: string;
}

/**
 * Submit Steps Page - League-agnostic step submission
 * 
 * This page allows users to submit steps that apply to ALL their leagues.
 * Steps are submitted once and count toward every league the user is part of.
 */
export default function SubmitPage() {
    const { session } = useAuth();
    const { toast } = useToast();

    // State
    const [isOffline, setIsOffline] = useState(false);
    const [leagues, setLeagues] = useState<League[]>([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState<string>(""); // Kept for legacy compatibility/defaults
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [submissionMode, setSubmissionMode] = useState<"single" | "batch" | "bulk-manual">("batch");
    const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

    // Compute admin leagues for proxy submission
    const adminLeagues = leagues.filter(l => l.role === "owner" || l.role === "admin");

    // Online status check
    useEffect(() => {
        setIsOffline(!navigator.onLine);

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => {
            setIsOffline(true);
            toast({
                title: "You are offline",
                description: "Submissions will be queued.",
                duration: 5000,
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [toast]);

    // Fetch user's leagues
    useEffect(() => {
        if (!session) return;

        const fetchLeagues = async () => {
            try {
                const res = await fetch("/api/leagues", {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                });

                if (!res.ok) {
                    throw await errorFromResponse(res);
                }

                const data = await res.json();
                const userLeagues = data.leagues || [];
                setLeagues(userLeagues);

                // Auto-select first league if available (legacy behavior, but still useful for displaying defaults)
                if (userLeagues.length > 0 && !selectedLeagueId) {
                    setSelectedLeagueId(userLeagues[0].id);
                }
            } catch (error) {
                const appError = normalizeError(error, ErrorCode.API_REQUEST_FAILED);
                reportErrorClient(appError);
                toast({
                    variant: "destructive",
                    title: "Failed to load leagues",
                    description: appError.toUserMessage(),
                });
            } finally {
                setLoading(false);
            }
        };

        fetchLeagues();
    }, [session, selectedLeagueId, toast]);

    // Fetch submissions
    const fetchSubmissions = useCallback(async () => {
        if (!session) return;

        try {
            // Fetch global submissions. 
            // We don't filter by league_id anymore to show all user submissions.
            const url = `/api/submissions?user_id=${session.user.id}&limit=20`;

            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (!res.ok) {
                throw await errorFromResponse(res);
            }

            const data = await res.json();
            setSubmissions(data.submissions || []);
        } catch (error) {
            const appError = normalizeError(error, ErrorCode.API_FETCH_FAILED);
            // Silent error for background fetch (common pattern) to avoid noisy toasts on every refresh
            console.error('[FetchSubmissions]', appError);
        }
    }, [session]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleSubmissionComplete = () => {
        fetchSubmissions();
        toast({
            title: "Steps Submitted",
            description: "Your steps have been recorded.",
        });
    };

    const getVerificationBadge = (verified: boolean | null) => {
        if (verified === true) {
            return <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">✓ Verified</span>;
        }
        if (verified === false) {
            return <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-400">✗ Failed</span>;
        }
        return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">⏳ Pending</span>;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateOnly = new Date(dateStr + "T00:00:00");
        if (dateOnly.getTime() === today.getTime()) return "Today";
        if (dateOnly.getTime() === yesterday.getTime()) return "Yesterday";

        return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    };

    const selectedLeague = leagues.find(l => l.id === selectedLeagueId);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-slate-400">
                Loading...
            </div>
        );
    }

    // "No Leagues" check REMOVED to allow leagueless submissions.
    // Instead we can show a specific message inside if user has no leagues, but still allow submission.

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Page Title */}
            <div className="border-b border-slate-800 bg-slate-900/30">
                <div className="mx-auto max-w-3xl px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-slate-50">Submit Steps</h1>
                        <Link
                            href="/dashboard"
                            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main */}
            <main className="mx-auto max-w-3xl px-6 py-12">
                {/* Offline Warning */}
                {isOffline && (
                    <div className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-200">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⚠️</span>
                            <div>
                                <h3 className="font-medium">You are offline</h3>
                                <p className="text-sm opacity-90">Submissions will be saved when you reconnect.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Global Submission Info */}
                <div className="mb-8 rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 text-sky-200">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-lg">🌍</span>
                        <div>
                            <h3 className="font-medium text-sky-100">Global Step Submission</h3>
                            <p className="mt-1 text-sm text-sky-200/80">
                                Steps submitted here are automatically applied to <strong>all your leagues</strong> based on their start dates.
                                You don't need to submit separately for each league.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Proxy Submission Section - For Admins/Owners */}
                <ProxySubmissionSection
                    adminLeagues={adminLeagues}
                    submissionMode={submissionMode}
                    onSubmitted={handleSubmissionComplete}
                />

                {/* Submit Steps Section */}
                <ModuleFeedback moduleId="submission-form" moduleName="Step Submission Form">
                    <section data-tour="submission-form">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-100">Submit Today&apos;s Steps</h2>
                                <p className="mt-2 text-sm text-slate-400">
                                    {submissionMode === "single"
                                        ? "Upload a screenshot to verify your step count."
                                        : submissionMode === "batch"
                                            ? "Upload multiple screenshots to auto-extract data."
                                            : "Manually enter step counts for multiple days (unverified)."}
                                </p>
                            </div>

                            <div className="flex rounded-lg border border-slate-700 bg-slate-800 p-1" data-tour="batch-toggle">
                                <button
                                    onClick={() => setSubmissionMode("single")}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${submissionMode === "single"
                                        ? "bg-sky-600 text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                        }`}
                                >
                                    Single Entry
                                </button>
                                <button
                                    onClick={() => setSubmissionMode("batch")}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${submissionMode === "batch"
                                        ? "bg-sky-600 text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                        }`}
                                >
                                    Batch Upload
                                </button>
                                <button
                                    onClick={() => setSubmissionMode("bulk-manual")}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${submissionMode === "bulk-manual"
                                        ? "bg-amber-600 text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                        }`}
                                >
                                    Bulk Manual
                                </button>
                            </div>
                        </div>

                        <div className="mt-6">
                            {submissionMode === "single" ? (
                                <SubmissionForm
                                    leagueId={selectedLeagueId}
                                    onSubmitted={handleSubmissionComplete}
                                    settings={{
                                        // Use defaults if leagueless or not selected
                                        allow_manual_entry: selectedLeague?.allow_manual_entry ?? true,
                                        require_verification_photo: selectedLeague?.require_verification_photo ?? false
                                    }}
                                />
                            ) : submissionMode === "batch" ? (
                                <BatchSubmissionForm leagueId={selectedLeagueId} onSubmitted={handleSubmissionComplete} />
                            ) : (
                                <BulkUnverifiedForm leagueId={selectedLeagueId} onSubmitted={handleSubmissionComplete} />
                            )}
                        </div>
                    </section>
                </ModuleFeedback>

                {/* Your Recent Submissions */}
                <ModuleFeedback moduleId="recent-submissions" moduleName="Recent Submissions">
                    <section className="mt-12">
                        <h2 className="text-xl font-semibold text-slate-100">Your Recent Submissions</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Your step submissions from the past week.
                        </p>

                        <div className="mt-6">
                            {submissions.length === 0 ? (
                                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-center">
                                    <p className="text-slate-400">No submissions this week yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-lg border border-slate-800">
                                    <table className="w-full">
                                        <thead className="bg-slate-900">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Date</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Steps</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {submissions.map((sub) => {
                                                const isExpanded = expandedSubmissionId === sub.id;
                                                const canExpand = sub.verified === false && sub.verification_notes;

                                                return (
                                                    <React.Fragment key={sub.id}>
                                                        <tr
                                                            className={`hover:bg-slate-900/50 ${canExpand ? 'cursor-pointer' : ''}`}
                                                            onClick={() => {
                                                                if (canExpand) {
                                                                    setExpandedSubmissionId(isExpanded ? null : sub.id);
                                                                }
                                                            }}
                                                        >
                                                            <td className="px-4 py-3 text-slate-100">
                                                                {formatDate(sub.for_date)}
                                                                {sub.partial && (
                                                                    <span className="ml-2 text-xs text-slate-500">(partial)</span>
                                                                )}
                                                                {canExpand && (
                                                                    <span className="ml-2 text-xs text-slate-500">
                                                                        {isExpanded ? '▼' : '▶'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono text-slate-100">
                                                                {sub.steps.toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {getVerificationBadge(sub.verified)}
                                                            </td>
                                                        </tr>
                                                        {/* Expanded verification details */}
                                                        {isExpanded && sub.verification_notes && (
                                                            <tr>
                                                                <td colSpan={3} className="bg-slate-900/80 px-4 py-3">
                                                                    <div className="rounded-md border border-slate-700 bg-slate-800/50 p-3 space-y-2">
                                                                        <p className="text-sm font-medium text-slate-300">Verification Details</p>
                                                                        <p className="text-sm text-slate-400">{sub.verification_notes}</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                </ModuleFeedback>

            </main>
        </div>
    );
}
