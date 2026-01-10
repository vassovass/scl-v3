"use client";

import React, { useState, useMemo } from "react";

export interface BatchConflict {
    date: string;
    existing: {
        id: string;
        steps: number;
        verified: boolean | null;
        proof_path: string | null;
    };
    incoming: {
        steps: number;
        proof_path: string | null;
    };
}

export type ConflictAction = "keep_existing" | "use_incoming" | "skip";

export interface ConflictResolution {
    date: string;
    action: ConflictAction;
    incoming_data?: {
        steps: number;
        proof_path: string | null;
    };
}

interface BatchConflictTableProps {
    conflicts: BatchConflict[];
    onResolve: (resolutions: ConflictResolution[]) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });
}

function getSmartDefault(conflict: BatchConflict): ConflictAction {
    const existingHasProof = !!conflict.existing.proof_path;
    const existingVerified = conflict.existing.verified === true;
    const incomingHasProof = !!conflict.incoming.proof_path;

    // Incoming has screenshot but existing doesn't → use incoming
    if (incomingHasProof && !existingHasProof) {
        return "use_incoming";
    }

    // Existing is verified → keep existing
    if (existingVerified) {
        return "keep_existing";
    }

    // Default to keeping existing
    return "keep_existing";
}

export function BatchConflictTable({
    conflicts,
    onResolve,
    onCancel,
    isLoading = false,
}: BatchConflictTableProps) {
    // Initialize selections with smart defaults
    const [selections, setSelections] = useState<Record<string, ConflictAction>>(() => {
        const initial: Record<string, ConflictAction> = {};
        conflicts.forEach(c => {
            initial[c.date] = getSmartDefault(c);
        });
        return initial;
    });

    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    const allSelected = selectedRows.size === conflicts.length;
    const someSelected = selectedRows.size > 0;

    const toggleRow = (date: string) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (next.has(date)) {
                next.delete(date);
            } else {
                next.add(date);
            }
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(conflicts.map(c => c.date)));
        }
    };

    const applyBulkAction = (action: ConflictAction) => {
        setSelections(prev => {
            const next = { ...prev };
            selectedRows.forEach(date => {
                next[date] = action;
            });
            return next;
        });
    };

    const handleSubmit = () => {
        const resolutions: ConflictResolution[] = conflicts.map(c => ({
            date: c.date,
            action: selections[c.date],
            incoming_data: selections[c.date] === "use_incoming"
                ? { steps: c.incoming.steps, proof_path: c.incoming.proof_path }
                : undefined,
        }));
        onResolve(resolutions);
    };

    // Count by action for summary
    const summary = useMemo(() => {
        const counts = { keep_existing: 0, use_incoming: 0, skip: 0 };
        Object.values(selections).forEach(action => {
            counts[action]++;
        });
        return counts;
    }, [selections]);

    return (
        <div className="rounded-lg border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.05)] p-4">
            {/* Header */}
            <div className="mb-4 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <h3 className="font-semibold text-[hsl(var(--warning))]">
                    {conflicts.length} {conflicts.length === 1 ? "Conflict" : "Conflicts"} Found
                </h3>
            </div>
            <p className="mb-4 text-sm text-slate-400">
                Select which data to keep for each date. Rows with new screenshots are pre-selected to use the new value.
            </p>

            {/* Bulk Actions - shown when rows selected */}
            {someSelected && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 p-2">
                    <span className="text-sm text-slate-400">
                        {selectedRows.size} selected:
                    </span>
                    <button
                        onClick={() => applyBulkAction("keep_existing")}
                        className="rounded-md bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-600"
                    >
                        Keep All Existing
                    </button>
                    <button
                        onClick={() => applyBulkAction("use_incoming")}
                        className="rounded-md bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-600"
                    >
                        Use All New
                    </button>
                    <button
                        onClick={() => applyBulkAction("skip")}
                        className="rounded-md bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-600"
                    >
                        Skip All
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-slate-700">
                <table className="w-full text-sm">
                    <thead className="bg-slate-800">
                        <tr>
                            <th className="w-10 px-3 py-2">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="rounded border-slate-600 bg-slate-700 text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-slate-400">Date</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-400">Existing</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-400">New</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-400">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {conflicts.map(conflict => {
                            const existingHasProof = !!conflict.existing.proof_path;
                            const existingVerified = conflict.existing.verified === true;
                            const incomingHasProof = !!conflict.incoming.proof_path;
                            const action = selections[conflict.date];

                            return (
                                <tr
                                    key={conflict.date}
                                    className={`transition ${selectedRows.has(conflict.date)
                                            ? "bg-primary/10"
                                            : "hover:bg-slate-800/50"
                                        }`}
                                >
                                    <td className="px-3 py-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.has(conflict.date)}
                                            onChange={() => toggleRow(conflict.date)}
                                            className="rounded border-slate-600 bg-slate-700 text-primary focus:ring-primary"
                                        />
                                    </td>
                                    <td className="px-3 py-2 font-medium text-slate-200">
                                        {formatDate(conflict.date)}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <span className={`font-mono ${action === "keep_existing"
                                                    ? "text-emerald-400"
                                                    : "text-slate-400"
                                                }`}>
                                                {conflict.existing.steps.toLocaleString()}
                                            </span>
                                            {existingVerified && (
                                                <span className="text-emerald-400" title="Verified">✓</span>
                                            )}
                                            {existingHasProof && (
                                                <span className="text-[hsl(var(--info))]" title="Has Screenshot">📷</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <span className={`font-mono ${action === "use_incoming"
                                                    ? "text-emerald-400"
                                                    : "text-slate-400"
                                                }`}>
                                                {conflict.incoming.steps.toLocaleString()}
                                            </span>
                                            {incomingHasProof && (
                                                <span className="text-[hsl(var(--info))]" title="Has Screenshot">📷</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <select
                                            value={action}
                                            onChange={(e) => setSelections(prev => ({
                                                ...prev,
                                                [conflict.date]: e.target.value as ConflictAction,
                                            }))}
                                            className="rounded-md border border-slate-600 bg-slate-700 px-2 py-1 text-xs text-slate-200 focus:border-primary focus:outline-none"
                                        >
                                            <option value="keep_existing">Keep Existing</option>
                                            <option value="use_incoming">Use New</option>
                                            <option value="skip">Skip</option>
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span><span className="text-emerald-400">✓</span> = Verified</span>
                <span><span className="text-[hsl(var(--info))]">📷</span> = Has Screenshot</span>
            </div>

            {/* Summary */}
            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-sm">
                <span className="text-slate-400">Summary: </span>
                {summary.keep_existing > 0 && (
                    <span className="text-slate-300">
                        {summary.keep_existing} keep existing
                    </span>
                )}
                {summary.use_incoming > 0 && (
                    <span className="text-slate-300">
                        {summary.keep_existing > 0 ? ", " : ""}
                        {summary.use_incoming} use new
                    </span>
                )}
                {summary.skip > 0 && (
                    <span className="text-slate-300">
                        {(summary.keep_existing > 0 || summary.use_incoming > 0) ? ", " : ""}
                        {summary.skip} skip
                    </span>
                )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-end gap-3">
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
                >
                    {isLoading ? "Applying..." : "Apply Selections"}
                </button>
            </div>
        </div>
    );
}
