"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { League } from "@/types/database";
import { SettingsSection } from "@/components/settings";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/hooks/use-toast";

interface DangerZoneProps {
    league: League;
    disabled?: boolean;
}

export function DangerZone({ league, disabled }: DangerZoneProps) {
    const router = useRouter();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/leagues/${league.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast({
                    title: "🗑️ League deleted",
                    description: "The league has been moved to trash and will be permanently deleted in 7 days.",
                });
                setShowDeleteConfirm(false);
                // Redirect to dashboard after deletion
                router.push("/dashboard");
            } else {
                const data = await response.json();
                toast({
                    title: "Error",
                    description: data.message || "Failed to delete league",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
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
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={disabled}
                        className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-900/50 hover:text-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Delete League
                    </button>
                </div>
            </SettingsSection>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete League?"
                description={`Are you sure you want to delete "${league.name}"? This will remove all members, submissions, and league data. The league will be moved to trash for 7 days before permanent deletion.`}
                confirmText="Delete League"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </>
    );
}
