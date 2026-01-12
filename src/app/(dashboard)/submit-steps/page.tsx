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
import { SubmissionEditPanel } from "@/components/forms/SubmissionEditPanel";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { SystemBadge } from "@/components/ui/SystemBadge";
import { ProofThumbnail } from "@/components/ui/ProofThumbnail";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAppSettings } from "@/hooks/useAppSettings";

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
    proof_path?: string | null;
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
    const [submissionsTotal, setSubmissionsTotal] = useState(0);
    const [submissionsPage, setSubmissionsPage] = useState(0);
    const SUBMISSIONS_PER_PAGE = 10;
    const [loading, setLoading] = useState(true);
    const [submissionMode, setSubmissionMode] = useState<"single" | "batch" | "bulk-manual">("batch");
    const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
    const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showBulkDateEdit, setShowBulkDateEdit] = useState(false);
    const [bulkDate, setBulkDate] = useState("");

    // New Feature State
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [proxyMembers, setProxyMembers] = useState<{ id: string, display_name: string }[]>([]);
    const [selectedProxyId, setSelectedProxyId] = useState<string | "all_proxy">("all_proxy"); // Only used if context is proxy
    const [viewContext, setViewContext] = useState<"me" | "proxy">("me");
    const [selectAllGlobal, setSelectAllGlobal] = useState(false);

    const { getNumericSetting } = useAppSettings();
    const maxBatchUploads = getNumericSetting("max_batch_uploads", 7);

    // Compute admin leagues for proxy submission (and viewing permissions)
    const adminLeagues = leagues.filter(l => l.role === "owner" || l.role === "admin");

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === submissions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(submissions.map(s => s.id)));
        }
    };

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        try {
            if (selectAllGlobal) {
                // Use Bulk API with filter logic (for now, fetch all IDs if feasible or implement filter-based bulk OP)
                // For safety/simplicity in this step, we'll fetch all IDs first
                // Note: In a real large-scale app, we'd pass filters to the DELETE endpoint.
                // My Bulk API takes IDs.
                let allIds: string[] = [];
                if (viewContext === "me") {
                    // Fetch all IDs for me
                    const res = await fetch(`/api/submissions?league_id=${selectedLeagueId}&user_id=${session.user.id}&exclude_proxy=true&limit=${submissionsTotal}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
                    const data = await res.json();
                    allIds = data.submissions.map((s: any) => s.id);
                } else if (selectedProxyId && selectedProxyId !== "all_proxy") {
                    const res = await fetch(`/api/submissions?league_id=${selectedLeagueId}&proxy_member_id=${selectedProxyId}&limit=${submissionsTotal}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
                    const data = await res.json();
                    allIds = data.submissions.map((s: any) => s.id);
                }

                if (allIds.length > 0) {
                    const res = await fetch("/api/submissions/bulk", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: allIds }),
                    });
                    if (!res.ok) throw new Error("Bulk delete failed");
                }
            } else {
                // IDs are in selectedIds
                const ids = Array.from(selectedIds);
                const res = await fetch("/api/submissions/bulk", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids }),
                });
                if (!res.ok) throw new Error("Bulk delete failed");
            }

            toast({
                title: "Bulk Delete Complete",
                description: `Deleted selected submissions.`,
            });

            setSelectedIds(new Set());
            setSelectAllGlobal(false);
            fetchSubmissions(submissionsPage); // Refresh current page
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete some submissions.",
            });
        } finally {
            setIsBulkDeleting(false);
            setShowBulkDeleteConfirm(false);
        }
    };

    const handleBulkDateEdit = async () => {
        if (!bulkDate) return;

        setIsBulkDeleting(true); // Reuse loading state
        try {
            // Client-side validation
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            const newDate = new Date(bulkDate + "T00:00:00");
            if (newDate > today) {
                toast({ variant: "destructive", title: "Invalid Date", description: "Cannot set future dates." });
                return;
            }

            const promises = Array.from(selectedIds).map(id =>
                fetch(`/api/submissions/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        for_date: bulkDate,
                        reason: "Bulk date update"
                    })
                })
            );

            await Promise.all(promises);

            toast({
                title: "Bulk Update Complete",
                description: `Updated date for ${selectedIds.size} submissions.`,
            });

            setSelectedIds(new Set());
            setShowBulkDateEdit(false);
            setSelectedIds(new Set());
            fetchSubmissions(submissionsPage);
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete some submissions.",
            });
        } finally {
            setIsBulkDeleting(false);
            setShowBulkDateEdit(false);
        }
    };

    const handleBulkResubmit = async () => {
        setIsBulkDeleting(true); // Reuse loading state
        try {
            // Limit check
            if (selectedIds.size > maxBatchUploads && !selectAllGlobal) {
                toast({ variant: "destructive", title: "Limit Exceeded", description: `You can only re-analyze up to ${maxBatchUploads} items at a time.` });
                setIsBulkDeleting(false);
                return;
            }

            let ids = Array.from(selectedIds);

            // If global, we should check total count
            if (selectAllGlobal) {
                if (submissionsTotal > maxBatchUploads) {
                    toast({ variant: "destructive", title: "Limit Exceeded", description: `You can only re-analyze up to ${maxBatchUploads} items at a time. Total: ${submissionsTotal}` });
                    setIsBulkDeleting(false);
                    return;
                }
                // Fetch IDs
                // (Simplified repetition of fetch logic above - refactor ideally)
                let allIds: string[] = [];
                if (viewContext === "me") {
                    const res = await fetch(`/api/submissions?league_id=${selectedLeagueId}&user_id=${session.user.id}&exclude_proxy=true&limit=${submissionsTotal}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
                    const data = await res.json();
                    allIds = data.submissions.map((s: any) => s.id);
                } else if (selectedProxyId && selectedProxyId !== "all_proxy") {
                    const res = await fetch(`/api/submissions?league_id=${selectedLeagueId}&proxy_member_id=${selectedProxyId}&limit=${submissionsTotal}`, { headers: { Authorization: `Bearer ${session.access_token}` } });
                    const data = await res.json();
                    allIds = data.submissions.map((s: any) => s.id);
                }
                ids = allIds;
            }

            const res = await fetch("/api/submissions/bulk/reanalyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
            });

            if (!res.ok) throw new Error("Re-analysis failed");

            const data = await res.json();

            toast({
                title: "Re-analysis Complete",
                description: `Processed ${data.updated} submissions.`,
            });

            setSelectedIds(new Set());
            setSelectAllGlobal(false);
            fetchSubmissions(submissionsPage);
        } catch (err) {
            toast({ variant: "destructive", title: "Error", description: "Failed to re-analyze." });
        } finally {
            setIsBulkDeleting(false);
        }
    };

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

    // Fetch proxy members for admin leagues
    useEffect(() => {
        if (!session || adminLeagues.length === 0) return;

        const loadProxies = async () => {
            // For simplicity, we'll fetch only for the SELECTED league if it's an admin league
            // Or fetch for all? Fetching for selected is better for context switching.
            const currentLeague = leagues.find(l => l.id === selectedLeagueId);
            if (currentLeague && (currentLeague.role === "owner" || currentLeague.role === "admin")) {
                try {
                    const res = await fetch(`/api/leagues/${selectedLeagueId}/proxy-members`, {
                        headers: { Authorization: `Bearer ${session.access_token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setProxyMembers(data.proxy_members || []);
                    }
                } catch (e) {
                    console.error("Failed to load proxies", e);
                }
            } else {
                setProxyMembers([]);
            }
        };
        loadProxies();
    }, [session, selectedLeagueId, leagues]);

    // Fetch submissions
    const fetchSubmissions = useCallback(async (page = 0) => {
        if (!session || !selectedLeagueId) return;

        try {
            const offset = page * itemsPerPage;
            let url = `/api/submissions?league_id=${selectedLeagueId}&limit=${itemsPerPage}&offset=${offset}&order_by=created_at`;

            if (viewContext === "me") {
                url += `&user_id=${session.user.id}&exclude_proxy=true`;
            } else if (selectedProxyId && selectedProxyId !== "all_proxy") {
                url += `&proxy_member_id=${selectedProxyId}`;
            } else {
                // If "all_proxy" but filter not supported, roughly fall back to league (includes me + proxy) 
                // but usually we want to exclude ME.
                // For safety, defaulting to ME if invalid state
                if (viewContext === "proxy" && selectedProxyId === "all_proxy") {
                    // Currently not strictly supported by API in one go without mix.
                    // We'll skip for now or rely on specific selection.
                    // Ideally we'd enable a filter.
                }
            }

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
            setSubmissionsTotal(data.total || 0);
            setSubmissionsPage(page);

            // Reset selection on page change if not global
            if (!selectAllGlobal) {
                setSelectedIds(new Set());
            }
        } catch (error) {
            const appError = normalizeError(error, ErrorCode.API_FETCH_FAILED);
            console.error('[FetchSubmissions]', appError);
        }
    }, [session, selectedLeagueId, itemsPerPage, viewContext, selectedProxyId, selectAllGlobal]);

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
            return <SystemBadge category="status" value="verified" size="sm" />;
        }
        if (verified === false) {
            return <SystemBadge category="status" value="failed" size="sm" />;
        }
        return <SystemBadge category="status" value="pending" size="sm" />;
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
            <div className="flex min-h-screen items-center justify-center text-muted-foreground">
                Loading...
            </div>
        );
    }

    // "No Leagues" check REMOVED to allow leagueless submissions.
    // Instead we can show a specific message inside if user has no leagues, but still allow submission.

    return (
        <div className="min-h-screen bg-background">
            {/* Page Title */}
            <div className="border-b border-border bg-card/30">
                <div className="mx-auto max-w-3xl px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-foreground">Submit Steps</h1>
                        <Link
                            href="/dashboard"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                    <div className="mb-6 rounded-lg border border-[hsl(var(--warning)/.5)] bg-[hsl(var(--warning)/.1)] p-4 text-[hsl(var(--warning))]">
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
                <div className="mb-8 rounded-lg border border-[hsl(var(--info)/.3)] bg-[hsl(var(--info)/.1)] p-4 text-[hsl(var(--info))]">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-lg">🌍</span>
                        <div>
                            <h3 className="font-medium">Global Step Submission</h3>
                            <p className="mt-1 text-sm opacity-80">
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
                                <h2 className="text-xl font-semibold text-foreground">Submit Today&apos;s Steps</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {submissionMode === "single"
                                        ? "Upload a screenshot to verify your step count."
                                        : submissionMode === "batch"
                                            ? "Upload multiple screenshots to auto-extract data."
                                            : "Manually enter step counts for multiple days (unverified)."}
                                </p>
                            </div>

                            <div className="flex rounded-lg border border-border bg-secondary p-1" data-tour="batch-toggle">
                                <button
                                    onClick={() => setSubmissionMode("single")}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${submissionMode === "single"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    Single Entry
                                </button>
                                <button
                                    onClick={() => setSubmissionMode("batch")}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${submissionMode === "batch"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    Batch Upload
                                </button>
                                <button
                                    onClick={() => setSubmissionMode("bulk-manual")}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${submissionMode === "bulk-manual"
                                        ? "bg-[hsl(var(--warning))] text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
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
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Your Recent Submissions</h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Your most recently uploaded steps, ordered by upload time.
                                </p>
                            </div>
                            {submissionsTotal > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    {submissionsTotal} total
                                </span>
                            )}
                        </div>

                        <div className="mt-6">
                            <div className="mt-6">
                                {/* Toolbar (Pagination + Context) */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        {/* Pagination Size */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">Show</span>
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                            >
                                                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>

                                        {/* Admin Context Switch */}
                                        {adminLeagues.length > 0 && proxyMembers.length > 0 && (
                                            <div className="flex items-center gap-2 border-l border-border pl-3 ml-1">
                                                <span className="text-xs text-muted-foreground">View as:</span>
                                                <select
                                                    value={viewContext === "me" ? "me" : selectedProxyId}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === "me") {
                                                            setViewContext("me");
                                                            setSelectedProxyId("all_proxy");
                                                        } else {
                                                            setViewContext("proxy");
                                                            setSelectedProxyId(val);
                                                        }
                                                    }}
                                                    className="h-8 max-w-[200px] rounded-md border border-input bg-background px-2 text-xs"
                                                >
                                                    <option value="me">My Submissions</option>
                                                    <option disabled className="text-muted-foreground font-semibold">-- Proxies --</option>
                                                    {proxyMembers.map(p => (
                                                        <option key={p.id} value={p.id}>{p.display_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bulk Actions Bar */}
                                {selectedIds.size > 0 && (
                                    <div className="mb-4 space-y-2">
                                        {/* Global Selection Banner */}
                                        {selectedIds.size === submissions.length && submissionsTotal > submissions.length && !selectAllGlobal && (
                                            <div className="bg-primary/10 border border-primary/20 p-2 rounded-md text-xs flex justify-center gap-2 items-center">
                                                <span>All {selectedIds.size} on this page are selected.</span>
                                                <button
                                                    onClick={() => setSelectAllGlobal(true)}
                                                    className="font-semibold text-primary hover:underline focus:outline-none"
                                                >
                                                    Select all {submissionsTotal} submissions
                                                </button>
                                            </div>
                                        )}
                                        {selectAllGlobal && (
                                            <div className="bg-primary/10 border border-primary/20 p-2 rounded-md text-xs flex justify-center gap-2 items-center">
                                                <span>All {submissionsTotal} submissions are selected.</span>
                                                <button
                                                    onClick={() => { setSelectedIds(new Set()); setSelectAllGlobal(false); }}
                                                    className="font-semibold text-primary hover:underline focus:outline-none"
                                                >
                                                    Clear selection
                                                </button>
                                            </div>
                                        )}

                                        <div className="p-2 bg-muted/40 border border-border rounded-md flex items-center justify-between">
                                            <span className="text-xs font-medium ml-2">
                                                {selectAllGlobal ? submissionsTotal : selectedIds.size} selected
                                                {viewContext === "proxy" && selectedProxyId !== "all_proxy" && (
                                                    <span className="ml-1 text-muted-foreground">
                                                        (for {proxyMembers.find(p => p.id === selectedProxyId)?.display_name || "Proxy"})
                                                    </span>
                                                )}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleBulkResubmit}
                                                    disabled={isBulkDeleting}
                                                    className="px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground border border-border rounded hover:bg-secondary/80 transition-colors disabled:opacity-50"
                                                    title={`Re-run AI verification (Max ${maxBatchUploads})`}
                                                >
                                                    Resubmit to AI
                                                </button>
                                                <button
                                                    onClick={() => setShowBulkDateEdit(true)}
                                                    className="px-3 py-1.5 text-xs font-medium bg-background border border-border rounded hover:bg-muted transition-colors"
                                                >
                                                    Change Date
                                                </button>
                                                <button
                                                    onClick={() => setShowBulkDeleteConfirm(true)}
                                                    className="px-3 py-1.5 text-xs font-medium bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                                                >
                                                    Delete Selected
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {submissions.length === 0 ? (
                                    <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
                                        <p className="text-muted-foreground">No submissions yet.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-hidden rounded-lg border border-border">
                                            <table className="w-full">
                                                <thead className="bg-card">
                                                    <tr>
                                                        <th className="px-4 py-3 w-10">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.size === submissions.length && submissions.length > 0}
                                                                onChange={toggleSelectAll}
                                                                className="rounded border-border"
                                                            />
                                                        </th>
                                                        <th className="px-2 py-3 text-left text-sm font-medium text-muted-foreground w-12">📷</th>
                                                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                                                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Steps</th>
                                                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Submitted</th>
                                                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {submissions.map((sub) => {
                                                        const isExpanded = expandedSubmissionId === sub.id;
                                                        const isEditing = editingSubmissionId === sub.id;
                                                        const canExpand = sub.verified === false && sub.verification_notes;
                                                        const submittedDate = new Date(sub.created_at);
                                                        const submittedStr = submittedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

                                                        return (
                                                            <React.Fragment key={sub.id}>
                                                                <tr
                                                                    className={`hover:bg-muted/50 cursor-pointer ${isEditing ? 'bg-muted/30' : ''}`}
                                                                    onClick={() => {
                                                                        if (isEditing) {
                                                                            // Already editing, don't toggle
                                                                        } else if (canExpand && !isEditing) {
                                                                            setExpandedSubmissionId(isExpanded ? null : sub.id);
                                                                            setEditingSubmissionId(null);
                                                                        } else {
                                                                            // Toggle edit mode
                                                                            setEditingSubmissionId(isEditing ? null : sub.id);
                                                                            setExpandedSubmissionId(null);
                                                                        }
                                                                    }}
                                                                >
                                                                    {/* Checkbox */}
                                                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedIds.has(sub.id)}
                                                                            onChange={() => toggleSelection(sub.id)}
                                                                            className="rounded border-border"
                                                                        />
                                                                    </td>
                                                                    {/* Proof Image */}
                                                                    <td className="px-2 py-3">
                                                                        {sub.proof_path ? (
                                                                            <ProofThumbnail proofPath={sub.proof_path} size={36} />
                                                                        ) : (
                                                                            <div className="w-9 h-9 flex items-center justify-center text-muted-foreground text-xs">—</div>
                                                                        )}
                                                                    </td>
                                                                    {/* Date */}
                                                                    <td className="px-4 py-3 text-foreground">
                                                                        {formatDate(sub.for_date)}
                                                                        {sub.partial && (
                                                                            <span className="ml-2 text-xs text-muted-foreground">(partial)</span>
                                                                        )}
                                                                        {canExpand && (
                                                                            <span className="ml-2 text-xs text-muted-foreground">
                                                                                {isExpanded ? '▼' : '▶'}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    {/* Steps */}
                                                                    <td className="px-4 py-3 text-right font-mono text-foreground">
                                                                        {sub.steps.toLocaleString()}
                                                                    </td>
                                                                    {/* Submitted */}
                                                                    <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                                                                        {submittedStr}
                                                                    </td>
                                                                    {/* Status */}
                                                                    <td className="px-4 py-3 text-right">
                                                                        {getVerificationBadge(sub.verified)}
                                                                    </td>
                                                                </tr>
                                                                {/* Expanded verification details */}
                                                                {isExpanded && sub.verification_notes && (
                                                                    <tr>
                                                                        <td colSpan={5} className="bg-muted/50 px-4 py-3">
                                                                            <div className="rounded-md border border-border bg-card/50 p-3 space-y-2">
                                                                                <p className="text-sm font-medium text-foreground">Verification Details</p>
                                                                                <p className="text-sm text-muted-foreground">{sub.verification_notes}</p>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setEditingSubmissionId(sub.id);
                                                                                        setExpandedSubmissionId(null);
                                                                                    }}
                                                                                    className="text-sm text-primary hover:underline"
                                                                                >
                                                                                    Edit this submission
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                {/* Edit Panel */}
                                                                {isEditing && (
                                                                    <tr>
                                                                        <td colSpan={5} onClick={(e) => e.stopPropagation()}>
                                                                            <SubmissionEditPanel
                                                                                submission={sub}
                                                                                onUpdate={() => fetchSubmissions(submissionsPage)}
                                                                                onClose={() => setEditingSubmissionId(null)}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        {submissionsTotal > SUBMISSIONS_PER_PAGE && (
                                            <div className="mt-4 flex items-center justify-between">
                                                <p className="text-sm text-muted-foreground">
                                                    Showing {submissionsPage * SUBMISSIONS_PER_PAGE + 1}-{Math.min((submissionsPage + 1) * SUBMISSIONS_PER_PAGE, submissionsTotal)} of {submissionsTotal}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => fetchSubmissions(submissionsPage - 1)}
                                                        disabled={submissionsPage === 0}
                                                        className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        ← Previous
                                                    </button>
                                                    <button
                                                        onClick={() => fetchSubmissions(submissionsPage + 1)}
                                                        disabled={(submissionsPage + 1) * SUBMISSIONS_PER_PAGE >= submissionsTotal}
                                                        className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Next →
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Bulk Delete Confirm */}
                            <div className="fixed">
                                {showBulkDeleteConfirm && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                        <div className="bg-background p-6 rounded-lg max-w-md w-full border border-border shadow-lg">
                                            <h3 className="text-lg font-semibold mb-2">Delete {selectedIds.size} Submissions?</h3>
                                            <p className="text-muted-foreground mb-4">This action cannot be undone.</p>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setShowBulkDeleteConfirm(false)}
                                                    className="px-4 py-2 text-sm hover:bg-muted rounded"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleBulkDelete}
                                                    disabled={isBulkDeleting}
                                                    className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
                                                >
                                                    {isBulkDeleting ? "Deleting..." : "Delete"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Bulk Date Edit Dialog */}
                                {showBulkDateEdit && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                        <div className="bg-background p-6 rounded-lg max-w-md w-full border border-border shadow-lg">
                                            <h3 className="text-lg font-semibold mb-2">Change Date for {selectedIds.size} Submissions</h3>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-1">New Date</label>
                                                <input
                                                    type="date"
                                                    value={bulkDate}
                                                    onChange={(e) => setBulkDate(e.target.value)}
                                                    max={new Date().toISOString().split("T")[0]}
                                                    className="w-full rounded border border-border bg-background px-3 py-2"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setShowBulkDateEdit(false)}
                                                    className="px-4 py-2 text-sm hover:bg-muted rounded"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleBulkDateEdit}
                                                    disabled={isBulkDeleting || !bulkDate}
                                                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                                                >
                                                    {isBulkDeleting ? "Updating..." : "Update Date"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                    </section>
                </ModuleFeedback>

            </main>
        </div>
    );
}
