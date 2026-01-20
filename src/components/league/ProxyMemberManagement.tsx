"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
    /** 
     * User's role in a league context. Only needed when used in league pages.
     * When used in user settings (no league context), this is optional and 
     * all logged-in users can manage their own proxies.
     */
    userRole?: string;
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

    // If no userRole is provided (settings page context), allow all logged-in users to manage.
    // If userRole IS provided (league context), only allow league admins/owners.
    const canManage = userRole === undefined || userRole === "owner" || userRole === "admin";

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
            <div className="rounded-xl border border-border bg-card/50 p-6">
                <div className="animate-pulse text-muted-foreground">Loading proxy members...</div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card/50 p-6" data-tour="proxy-members">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Proxy Members</h3>
                    <p className="text-sm text-muted-foreground">
                        Create placeholder profiles for people who haven&apos;t signed up yet
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    + Add Proxy
                </Button>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {proxyMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No proxy members yet.</p>
                    <p className="text-sm mt-1">Create one to track steps for someone before they join.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {proxyMembers.map((proxy) => (
                        <div
                            key={proxy.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 p-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--warning))] to-orange-600 flex items-center justify-center text-white font-medium">
                                    {proxy.display_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-medium text-foreground">{proxy.display_name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {proxy.submission_count} submission{proxy.submission_count !== 1 ? "s" : ""}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopyClaimLink(proxy)}
                                    className="border-[hsl(var(--success)/0.5)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.1)]"
                                    title="Copy claim link to share with this person"
                                >
                                    🔗 Copy Claim Link
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeletingProxyId(proxy.id)}
                                    className="hover:border-destructive hover:text-destructive"
                                    title={proxy.submission_count > 0 ? "Cannot delete proxy with submissions" : "Delete proxy"}
                                >
                                    🗑️
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal - Using shadcn Dialog */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Proxy Member</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            type="text"
                            value={newProxyName}
                            onChange={(e) => setNewProxyName(e.target.value)}
                            placeholder="Enter display name (e.g., Joe Soap)"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreate();
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCreateModal(false);
                                setNewProxyName("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={creating || !newProxyName.trim()}
                        >
                            {creating ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


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

