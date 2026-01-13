"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";

interface ProxyMember {
    id: string;
    display_name: string;
    invite_code?: string;
    created_at: string;
    submission_count: number;
}

interface ProxyMemberManagementProps {
    // PRD 41: leagueId is optional - proxies are user-level, not league-specific
    leagueId?: string;
    userRole: string;
}

export function ProxyMemberManagement({ userRole }: ProxyMemberManagementProps) {
    const { session } = useAuth();
    const [proxyMembers, setProxyMembers] = useState<ProxyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProxyName, setNewProxyName] = useState("");
    const [creating, setCreating] = useState(false);


    // Delete confirmation state
    const [deletingProxyId, setDeletingProxyId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const canManage = userRole === "owner" || userRole === "admin";

    const fetchProxyMembers = useCallback(async () => {
        if (!session) return;

        try {
            // PRD 41: Proxies are user-level, not league-specific.
            // Fetch ALL proxies managed by current user.
            const res = await fetch(`/api/proxies`);
            if (res.ok) {
                const data = await res.json();
                setProxyMembers(data.proxies || []);
            } else {
                const errData = await res.json();
                setError(errData.error || "Failed to load proxy members");
            }
        } catch (err) {
            setError("Failed to load proxy members");
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchProxyMembers();
    }, [fetchProxyMembers]);

    const handleCreate = async () => {
        if (!newProxyName.trim()) return;

        setCreating(true);
        setError(null);

        try {
            // PRD 41: Proxies are user-level. No league_id needed.
            const res = await fetch(`/api/proxies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ display_name: newProxyName.trim() }),
            });

            if (res.ok) {
                setNewProxyName("");
                setShowCreateModal(false);
                fetchProxyMembers();
                toast({
                    title: "Proxy created",
                    description: "Proxy member has been created.",
                });
            } else {
                const errData = await res.json();
                setError(errData.error || "Failed to create proxy member");
            }
        } catch (err) {
            setError("Failed to create proxy member");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingProxyId) return;

        setDeleting(true);
        try {
            // PRD 41: Use unified /api/proxies endpoint
            const res = await fetch(`/api/proxies?proxy_id=${deletingProxyId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                fetchProxyMembers();
                toast({
                    title: "Proxy deleted",
                    description: "Proxy member has been removed.",
                });
            } else {
                const errData = await res.json();
                setError(errData.error || "Failed to delete proxy member");
            }
        } catch (err) {
            setError("Failed to delete proxy member");
        } finally {
            setDeleting(false);
            setDeletingProxyId(null);
        }
    };

    const handleCopyClaimLink = (proxy: ProxyMember) => {
        if (!proxy.invite_code) {
            toast({
                title: "No claim link",
                description: "This proxy doesn't have a claim code.",
                variant: "destructive",
            });
            return;
        }
        const claimUrl = `${window.location.origin}/claim/${proxy.invite_code}`;
        navigator.clipboard.writeText(claimUrl);
        toast({
            title: "Claim link copied!",
            description: "Share this link with the person to let them claim this profile.",
        });
    };

    if (!canManage) {
        return null; // Hide for regular members
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="animate-pulse text-slate-400">Loading proxy members...</div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6" data-tour="proxy-members">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-100">Proxy Members</h3>
                    <p className="text-sm text-slate-400">
                        Create placeholder profiles for people who haven&apos;t signed up yet
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 transition"
                >
                    + Add Proxy
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
                    {error}
                </div>
            )}

            {proxyMembers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <p>No proxy members yet.</p>
                    <p className="text-sm mt-1">Create one to track steps for someone before they join.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {proxyMembers.map((proxy) => (
                        <div
                            key={proxy.id}
                            className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium">
                                    {proxy.display_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-medium text-slate-100">{proxy.display_name}</div>
                                    <div className="text-xs text-slate-500">
                                        {proxy.submission_count} submission{proxy.submission_count !== 1 ? "s" : ""}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleCopyClaimLink(proxy)}
                                    className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-600/20 transition"
                                    title="Copy claim link to share with this person"
                                >
                                    🔗 Copy Claim Link
                                </button>
                                <button
                                    onClick={() => setDeletingProxyId(proxy.id)}
                                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-rose-500 hover:text-rose-400 transition"
                                    title={proxy.submission_count > 0 ? "Cannot delete proxy with submissions" : "Delete proxy"}
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4">Create Proxy Member</h3>
                        <input
                            type="text"
                            value={newProxyName}
                            onChange={(e) => setNewProxyName(e.target.value)}
                            placeholder="Enter display name (e.g., Joe Soap)"
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                            autoFocus
                        />
                        <div className="mt-4 flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewProxyName("");
                                }}
                                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating || !newProxyName.trim()}
                                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50 transition"
                            >
                                {creating ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={!!deletingProxyId}
                onOpenChange={(open) => {
                    if (!open) setDeletingProxyId(null);
                }}
                title="Delete Proxy Member?"
                description="This will permanently delete this proxy member. This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDeleteConfirm}
                isLoading={deleting}
            />
        </div>
    );
}
