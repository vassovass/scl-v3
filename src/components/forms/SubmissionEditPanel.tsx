"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSubmissionHistory } from "@/hooks/useSubmissionHistory";
import { ProofThumbnail } from "@/components/ui/ProofThumbnail";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Submission {
    id: string;
    for_date: string;
    steps: number;
    proof_path?: string | null;
    verified: boolean | null;
    created_at: string;
}

interface SubmissionEditPanelProps {
    submission: Submission;
    onUpdate: () => void;
    onClose: () => void;
}

/**
 * SubmissionEditPanel - Inline editing form for submissions
 * 
 * Features:
 * - Edit date (with future date prevention)
 * - Edit steps count
 * - Remove proof image
 * - Add comment/reason for changes
 * - View change history
 * - Delete submission
 */
export function SubmissionEditPanel({
    submission,
    onUpdate,
    onClose,
}: SubmissionEditPanelProps) {
    const { toast } = useToast();

    // Edit state
    const [forDate, setForDate] = useState(submission.for_date);
    const [steps, setSteps] = useState(submission.steps);
    const [reason, setReason] = useState("");
    const [removeProof, setRemoveProof] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch history when expanded
    const { changes, isLoading: historyLoading } = useSubmissionHistory({
        submissionId: submission.id,
        enabled: showHistory,
    });

    // Calculate today's date for max constraint
    const today = new Date().toISOString().split("T")[0];

    // Check if there are changes to save
    const hasChanges =
        forDate !== submission.for_date ||
        steps !== submission.steps ||
        removeProof;

    const handleSave = async () => {
        if (!hasChanges) return;

        setIsSaving(true);
        try {
            const body: Record<string, unknown> = {};

            if (forDate !== submission.for_date) {
                body.for_date = forDate;
            }
            if (steps !== submission.steps) {
                body.steps = steps;
            }
            if (removeProof) {
                body.proof_path = null;
            }
            if (reason.trim()) {
                body.reason = reason.trim();
            }

            const res = await fetch(`/api/submissions/${submission.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to update");
            }

            toast({
                title: "Submission Updated",
                description: "Your changes have been saved.",
            });

            onUpdate();
            onClose();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: err instanceof Error ? err.message : "Unknown error",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const reasonParam = reason.trim() ? `?reason=${encodeURIComponent(reason.trim())}` : "";
            const res = await fetch(`/api/submissions/${submission.id}${reasonParam}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to delete");
            }

            toast({
                title: "Submission Deleted",
                description: "The submission has been removed.",
            });

            onUpdate();
            onClose();
        } catch (err) {
            toast({
                variant: "destructive",
                title: "Delete Failed",
                description: err instanceof Error ? err.message : "Unknown error",
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const formatChangeDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    return (
        <div className="bg-muted/50 px-4 py-4 space-y-4">
            {/* Edit Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Date
                    </label>
                    <input
                        type="date"
                        value={forDate}
                        onChange={(e) => setForDate(e.target.value)}
                        max={today}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                </div>

                {/* Steps */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Steps
                    </label>
                    <input
                        type="number"
                        value={steps}
                        onChange={(e) => setSteps(Math.min(150000, Math.max(0, parseInt(e.target.value) || 0)))}
                        min={0}
                        max={150000}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground font-mono"
                    />
                </div>
            </div>

            {/* Proof Image */}
            {submission.proof_path && (
                <div className="flex items-center gap-3">
                    <ProofThumbnail proofPath={submission.proof_path} size={40} />
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {submission.proof_path.split("/").pop()}
                        </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={removeProof}
                            onChange={(e) => setRemoveProof(e.target.checked)}
                            className="rounded border-border"
                        />
                        <span className="text-destructive">Remove proof</span>
                    </label>
                </div>
            )}

            {/* Reason/Comment */}
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Reason for change (optional)
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why are you making this change?"
                    rows={2}
                    maxLength={500}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showHistory ? "▼ Hide History" : "▶ View History"}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                        Delete
                    </button>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* History Panel */}
            {showHistory && (
                <div className="mt-4 p-3 rounded-md border border-border bg-card/50">
                    <h4 className="text-sm font-medium text-foreground mb-2">Change History</h4>
                    {historyLoading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : changes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {changes.map((change) => (
                                <div key={change.id} className="text-xs border-b border-border/50 pb-2 last:border-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-foreground capitalize">
                                            {change.field_name.replace("_", " ")}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {formatChangeDate(change.created_at)}
                                        </span>
                                    </div>
                                    <div className="text-muted-foreground mt-0.5">
                                        {change.old_value || "(empty)"} → {change.new_value || "(removed)"}
                                    </div>
                                    {change.reason && (
                                        <div className="mt-1 text-muted-foreground italic">
                                            &quot;{change.reason}&quot;
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title="Delete Submission?"
                description={`This will permanently remove the submission for ${forDate} (${steps.toLocaleString()} steps). This action is logged but cannot be undone.`}
                variant="destructive"
                confirmText="Delete"
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </div>
    );
}

