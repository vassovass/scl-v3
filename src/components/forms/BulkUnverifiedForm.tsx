"use client";

import React, { useState } from "react";
import { apiRequest, ApiError } from "@/lib/api/client";

interface BulkUnverifiedFormProps {
    leagueId: string;
    proxyMemberId?: string;
    onSubmitted?: () => void;
}

interface Entry {
    id: string;
    date: string;
    steps: string;
}

interface Conflict {
    date: string;
    existing_steps: number;
    verified: boolean;
}

interface EntryError {
    date: string;
    reason: string;
}

interface BulkResponse {
    inserted: number;
    skipped: number;
    conflicts: Conflict[];
    errors: EntryError[];
    inserted_dates: string[];
}

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

function getDefaultDate() {
    return new Date().toISOString().split("T")[0];
}

export function BulkUnverifiedForm({ leagueId, proxyMemberId, onSubmitted }: BulkUnverifiedFormProps) {
    const [reason, setReason] = useState("");
    const [entries, setEntries] = useState<Entry[]>([
        { id: generateId(), date: getDefaultDate(), steps: "" },
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<BulkResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const addRow = () => {
        // Default to yesterday for new rows
        const lastDate = entries.length > 0 ? entries[entries.length - 1].date : getDefaultDate();
        const prevDate = new Date(lastDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const newDate = prevDate.toISOString().split("T")[0];

        setEntries([...entries, { id: generateId(), date: newDate, steps: "" }]);
    };

    const removeRow = (id: string) => {
        if (entries.length <= 1) return;
        setEntries(entries.filter(e => e.id !== id));
    };

    const updateEntry = (id: string, field: "date" | "steps", value: string) => {
        setEntries(entries.map(e =>
            e.id === id ? { ...e, [field]: value } : e
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResult(null);

        // Validate entries
        const validEntries = entries
            .filter(e => e.date && e.steps && parseInt(e.steps) > 0)
            .map(e => ({
                date: e.date,
                steps: parseInt(e.steps),
            }));

        if (validEntries.length === 0) {
            setError("Please add at least one valid entry with date and steps");
            return;
        }

        if (reason.trim().length < 10) {
            setError("Please provide a reason with at least 10 characters");
            return;
        }

        setSubmitting(true);

        try {
            const response = await apiRequest<BulkResponse>("/api/submissions/bulk-unverified", {
                method: "POST",
                body: JSON.stringify({
                    league_id: leagueId,
                    reason: reason.trim(),
                    entries: validEntries,
                    proxy_member_id: proxyMemberId,
                }),
            });

            setResult(response);

            if (response.inserted > 0 && onSubmitted) {
                onSubmitted();
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setResult(null);
        setError(null);
        setReason("");
        setEntries([{ id: generateId(), date: getDefaultDate(), steps: "" }]);
    };

    // Show results view after submission
    if (result) {
        return (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
                <h3 className="text-lg font-semibold text-slate-100">Submission Complete</h3>

                <div className="mt-4 space-y-3">
                    {/* Success count */}
                    {result.inserted > 0 && (
                        <div className="flex items-center gap-2 text-emerald-400">
                            <span className="text-lg">✓</span>
                            <span>
                                {result.inserted} {result.inserted === 1 ? "entry" : "entries"} submitted successfully
                            </span>
                        </div>
                    )}

                    {/* Skipped count */}
                    {result.skipped > 0 && (
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-lg">○</span>
                            <span>
                                {result.skipped} {result.skipped === 1 ? "entry" : "entries"} skipped (already exists)
                            </span>
                        </div>
                    )}

                    {/* Conflicts with verified submissions */}
                    {result.conflicts.length > 0 && (
                        <div className="mt-4 rounded-md border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.1)] p-4">
                            <h4 className="flex items-center gap-2 font-medium text-[hsl(var(--warning))]">
                                <span>⚠️</span>
                                Conflicts with Verified Submissions
                            </h4>
                            <p className="mt-1 text-sm text-slate-300">
                                The following dates already have verified submissions and were not overwritten:
                            </p>
                            <ul className="mt-2 space-y-1 text-sm text-slate-400">
                                {result.conflicts.map((c, i) => (
                                    <li key={i}>
                                        <span className="font-mono">{c.date}</span>
                                        <span className="text-slate-500"> — existing: </span>
                                        <span className="font-medium text-emerald-400">{c.existing_steps.toLocaleString()} steps (verified)</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Errors */}
                    {result.errors.length > 0 && (
                        <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 p-4">
                            <h4 className="flex items-center gap-2 font-medium text-rose-400">
                                <span>✗</span>
                                Some entries could not be submitted
                            </h4>
                            <ul className="mt-2 space-y-1 text-sm text-slate-400">
                                {result.errors.map((e, i) => (
                                    <li key={i}>
                                        <span className="font-mono">{e.date}</span>
                                        <span className="text-slate-500"> — </span>
                                        <span className="text-rose-300">{e.reason}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <button
                    onClick={resetForm}
                    className="mt-6 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                >
                    Submit More
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            {/* Reason field */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300">
                    Reason for Manual Entry <span className="text-rose-400">*</span>
                </label>
                <p className="mt-1 text-xs text-slate-500">
                    This will be visible to league administrators.
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Forgot to submit last week, tracking app was broken, etc."
                    className="mt-2 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    rows={2}
                    required
                />
            </div>

            {/* Entries table */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-300">Step Entries</label>
                    <button
                        type="button"
                        onClick={addRow}
                        className="rounded-md bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-600"
                    >
                        + Add Row
                    </button>
                </div>

                <div className="mt-3 space-y-2">
                    {entries.map((entry, index) => (
                        <div key={entry.id} className="flex items-center gap-3">
                            <span className="w-6 text-center text-sm text-slate-500">{index + 1}.</span>
                            <input
                                type="date"
                                value={entry.date}
                                onChange={(e) => updateEntry(entry.id, "date", e.target.value)}
                                className="rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                required
                            />
                            <input
                                type="number"
                                value={entry.steps}
                                onChange={(e) => updateEntry(entry.id, "steps", e.target.value)}
                                placeholder="Steps"
                                min={1}
                                className="w-32 rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => removeRow(entry.id)}
                                disabled={entries.length <= 1}
                                className="rounded-md px-2 py-1 text-sm text-slate-500 transition hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Error display */}
            {error && (
                <div className="mb-4 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
                    {error}
                </div>
            )}

            {/* Info banner */}
            <div className="mb-4 rounded-md border border-[hsl(var(--warning)/0.3)] bg-[hsl(var(--warning)/0.1)] p-3 text-sm text-[hsl(var(--warning))]">
                <strong>Note:</strong> These entries will be marked as unverified since no proof image is provided.
            </div>

            {/* Submit button */}
            <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? "Submitting..." : `Submit ${entries.filter(e => e.date && e.steps).length} Entries`}
            </button>
        </form>
    );
}
