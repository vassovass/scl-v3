"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export interface ConflictData {
    date: string;
    existing: {
        id: string;
        steps: number;
        verified: boolean | null;
        proof_path: string | null;
        created_at: string;
    };
    incoming: {
        steps: number;
        proof_path: string | null;
    };
}

interface ConflictResolutionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conflict: ConflictData | null;
    onResolve: (action: "keep_existing" | "use_incoming") => void;
    isLoading?: boolean;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
    });
}

function getRecommendation(conflict: ConflictData): {
    action: "keep_existing" | "use_incoming";
    reason: string;
} {
    const existingHasProof = !!conflict.existing.proof_path;
    const existingVerified = conflict.existing.verified === true;
    const incomingHasProof = !!conflict.incoming.proof_path;

    // Screenshot + Verified > everything
    if (existingVerified && existingHasProof) {
        if (!incomingHasProof) {
            return {
                action: "keep_existing",
                reason: "The existing submission has a verified screenshot and is likely more accurate.",
            };
        }
        // Both have screenshots
        return {
            action: "keep_existing",
            reason: "Both have screenshots. The existing entry is already verified.",
        };
    }

    // Incoming has screenshot, existing doesn't
    if (incomingHasProof && !existingHasProof) {
        return {
            action: "use_incoming",
            reason: "The new submission has a screenshot which is likely more accurate than the manual entry.",
        };
    }

    // Both manual or existing has unverified screenshot
    if (existingHasProof) {
        return {
            action: "keep_existing",
            reason: "The existing submission has a screenshot (pending verification).",
        };
    }

    // Both manual - keep existing by default
    return {
        action: "keep_existing",
        reason: "Consider submitting a screenshot for better accuracy.",
    };
}

export function ConflictResolutionDialog({
    open,
    onOpenChange,
    conflict,
    onResolve,
    isLoading = false,
}: ConflictResolutionDialogProps) {
    if (!conflict) return null;

    const recommendation = getRecommendation(conflict);
    const existingHasProof = !!conflict.existing.proof_path;
    const existingVerified = conflict.existing.verified === true;
    const incomingHasProof = !!conflict.incoming.proof_path;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-400">
                        <span>⚠️</span>
                        Submission Already Exists for {formatDate(conflict.date)}
                    </DialogTitle>
                    <DialogDescription>
                        You already have a submission for this date. Please choose which data to keep.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    {/* Existing Entry */}
                    <div className={`rounded-lg border p-4 ${recommendation.action === "keep_existing"
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "border-slate-700 bg-slate-800/50"
                        }`}>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium uppercase text-slate-400">
                                Existing
                            </span>
                            {recommendation.action === "keep_existing" && (
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                                    Recommended
                                </span>
                            )}
                        </div>
                        <div className="text-2xl font-bold text-slate-100">
                            {conflict.existing.steps.toLocaleString()}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {existingVerified ? (
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                                    ✓ Verified
                                </span>
                            ) : conflict.existing.verified === false ? (
                                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-400">
                                    ✗ Failed
                                </span>
                            ) : (
                                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                                    ⏳ Unverified
                                </span>
                            )}
                            {existingHasProof ? (
                                <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-400">
                                    📷 Screenshot
                                </span>
                            ) : (
                                <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-400">
                                    ✎ Manual
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Incoming Entry */}
                    <div className={`rounded-lg border p-4 ${recommendation.action === "use_incoming"
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "border-slate-700 bg-slate-800/50"
                        }`}>
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium uppercase text-slate-400">
                                New Entry
                            </span>
                            {recommendation.action === "use_incoming" && (
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                                    Recommended
                                </span>
                            )}
                        </div>
                        <div className="text-2xl font-bold text-slate-100">
                            {conflict.incoming.steps.toLocaleString()}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                                ⏳ Pending
                            </span>
                            {incomingHasProof ? (
                                <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-400">
                                    📷 Screenshot
                                </span>
                            ) : (
                                <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-400">
                                    ✎ Manual
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recommendation */}
                <div className="mt-4 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
                    <div className="flex items-start gap-2">
                        <span className="text-sky-400">💡</span>
                        <p className="text-sm text-sky-200">{recommendation.reason}</p>
                    </div>
                </div>

                <DialogFooter className="mt-6 flex gap-3 sm:justify-between">
                    <button
                        onClick={() => onResolve("keep_existing")}
                        disabled={isLoading}
                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${recommendation.action === "keep_existing"
                                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                        Keep Existing
                        {recommendation.action === "keep_existing" && (
                            <span className="ml-1 text-xs opacity-75">(Recommended)</span>
                        )}
                    </button>
                    <button
                        onClick={() => onResolve("use_incoming")}
                        disabled={isLoading}
                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${recommendation.action === "use_incoming"
                                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                        {isLoading ? "Saving..." : "Use New Entry"}
                        {recommendation.action === "use_incoming" && !isLoading && (
                            <span className="ml-1 text-xs opacity-75">(Recommended)</span>
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
