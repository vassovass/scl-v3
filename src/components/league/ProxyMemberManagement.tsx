"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";
import { Copy, Plus, Trash2, Users } from "lucide-react";

interface ProxyUser {
    id: string;
    display_name: string | null;
    invite_code: string | null;
    created_at: string;
    // We might want to fetch submission count if possible, but the new API might not return it yet.
    // For now, let's assume we can add it to the API or just skip it.
    // The previous API had it. Let's see if we can get it.
}

export function ProxyMemberManagement() {
    const { session } = useAuth();
    const [proxies, setProxies] = useState<ProxyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProxyName, setNewProxyName] = useState("");
    const [creating, setCreating] = useState(false);

    // Delete confirmation state
    const [deletingProxyId, setDeletingProxyId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchProxies = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/proxies`);
            if (res.ok) {
                const data = await res.json();
                setProxies(data.proxies || []);
            } else {
                setError("Failed to load proxies");
            }
        } catch (err) {
            setError("Failed to load proxies");
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchProxies();
    }, [fetchProxies]);

    const handleCreate = async () => {
        if (!newProxyName.trim()) return;

        setCreating(true);
        setError(null);

        try {
            const res = await fetch(`/api/proxies`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ display_name: newProxyName.trim() }),
            });

            if (res.ok) {
                setNewProxyName("");
                setShowCreateModal(false);
                fetchProxies();
                toast({
                    title: "Proxy Created",
                    description: "You can now act as this user or share their invite code.",
                });
            } else {
                const errData = await res.json();
                setError(errData.error || "Failed to create proxy");
            }
        } catch (err) {
            setError("Failed to create proxy");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingProxyId) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/proxies?id=${deletingProxyId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                fetchProxies();
                toast({
                    title: "Proxy deleted",
                    description: "Proxy user has been removed.",
                });
            } else {
                const errData = await res.json();
                setError(errData.error || "Failed to delete proxy");
            }
        } catch (err) {
            setError("Failed to delete proxy");
        } finally {
            setDeleting(false);
            setDeletingProxyId(null);
        }
    };

    const copyInviteCode = (code: string | null) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        toast({
            title: "Copied!",
            description: "Invite code copied to clipboard. Share it with the user to claim this account.",
        });
    };

    if (loading && proxies.length === 0) {
        return (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="animate-pulse text-slate-400">Loading managed profiles...</div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6" data-tour="proxy-management">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-100">Managed Profiles</h3>
                    <p className="text-sm text-slate-400">
                        Create shadow accounts to manage steps for others until they sign up.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Profile</span>
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
                    {error}
                </div>
            )}

            {proxies.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No managed profiles yet.</p>
                    <p className="text-sm mt-1">Create one to get started.</p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {proxies.map((proxy) => (
                        <div
                            key={proxy.id}
                            className="flex flex-col justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4 hover:bg-slate-800 transition"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium shadow-sm">
                                        {proxy.display_name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="font-medium text-slate-100 truncate" title={proxy.display_name || ""}>
                                            {proxy.display_name}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(proxy.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDeletingProxyId(proxy.id)}
                                    className="text-slate-500 hover:text-rose-400 transition p-1"
                                    title="Delete profile"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-2 pt-3 border-t border-slate-700/50">
                                <div className="text-xs text-slate-400 mb-1">Invite Code</div>
                                <button
                                    onClick={() => copyInviteCode(proxy.invite_code)}
                                    className="flex items-center justify-between w-full rounded bg-slate-900/50 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition group border border-transparent hover:border-slate-700"
                                    title="Click to copy"
                                >
                                    <span className="font-mono tracking-wider">{proxy.invite_code || "Generating..."}</span>
                                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4">Create Managed Profile</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            You will control this profile until the user claims it with their invite code.
                        </p>
                        <input
                            type="text"
                            value={newProxyName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Display Name (e.g. John Doe)"
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition"
                            autoFocus
                        />
                        <div className="mt-6 flex gap-3 justify-end">
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
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
                            >
                                {creating ? "Creating..." : "Create Profile"}
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
                title="Delete Profile?"
                description="This will permanently delete this profile and all its data. This action cannot be undone."
                confirmText="Delete Profile"
                variant="destructive"
                onConfirm={handleDeleteConfirm}
                isLoading={deleting}
            />
        </div>
    );
}

