"use client";

import { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { apiRequest, ApiError } from "@/lib/api/client";
import { DatePicker } from "@/components/ui/DatePicker";
import { analytics } from "@/lib/analytics";

interface SubmissionFormProps {
    leagueId: string;
    proxyMemberId?: string;
    proxyDisplayName?: string;
    onSubmitted?: () => void;
}

interface SignUploadResponse {
    upload_url: string;
    path: string;
    token?: string;
}

interface SubmissionResponse {
    submission: {
        id: string;
        verified: boolean | null;
    };
    verification?: {
        verified: boolean;
        extracted_steps?: number | null;
        extracted_date?: string | null;
        difference?: number | null;
        tolerance_used?: number;
        notes?: string;
    };
    verification_error?: {
        error: string;
        message: string;
        retry_after?: number;
        should_retry?: boolean;
    };
}

interface VerificationDetails {
    verified: boolean;
    extractedSteps: number | null;
    extractedDate: string | null;
    claimedSteps: number;
    claimedDate: string;
    difference: number | null;
    tolerance: number | null;
    notes: string | null;
}

interface PendingVerification {
    submissionId: string;
    leagueId: string;
    steps: number;
    forDate: string;
    proofPath: string;
    retryAt: number;
    attempts: number;
}



interface LeagueSettings {
    allow_manual_entry: boolean;
    require_verification_photo: boolean;
}

const MAX_RETRY_ATTEMPTS = 5; // Reduced from 10 - don't spam the API
const BASE_RETRY_SECONDS = 5; // Base for exponential backoff

export function SubmissionForm({ leagueId, proxyMemberId, proxyDisplayName, onSubmitted, settings }: SubmissionFormProps & { settings?: LeagueSettings }) {
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [steps, setSteps] = useState<string>("");
    const [partial, setPartial] = useState<boolean>(false);
    const [flagged, setFlagged] = useState<boolean>(false);
    const [flagReason, setFlagReason] = useState<string>("");
    const [overwrite, setOverwrite] = useState<boolean>(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
    const [estimatedWaitSeconds, setEstimatedWaitSeconds] = useState(0);
    const [showWaitConfirm, setShowWaitConfirm] = useState(false);
    const [verificationDetails, setVerificationDetails] = useState<VerificationDetails | null>(null);

    // Reset overwrite flag when error clears
    useEffect(() => {
        if (!error) {
            setOverwrite(false);
        }
    }, [error]);

    // Process pending verification with retry logic
    useEffect(() => {
        if (!pendingVerification) return;

        const processVerification = async () => {
            const now = Date.now();
            const waitMs = pendingVerification.retryAt - now;

            if (waitMs > 0) {
                setEstimatedWaitSeconds(Math.ceil(waitMs / 1000));
                const timer = setTimeout(() => {
                    setPendingVerification((prev) => prev ? { ...prev } : null);
                }, Math.min(waitMs, 1000));
                return () => clearTimeout(timer);
            }

            setEstimatedWaitSeconds(0);
            setStatus("Verifying submission...");

            try {
                const result = await apiRequest<{ verified: boolean }>("submissions/verify", {
                    method: "POST",
                    body: JSON.stringify({
                        submission_id: pendingVerification.submissionId,
                        league_id: pendingVerification.leagueId,
                        steps: pendingVerification.steps,
                        for_date: pendingVerification.forDate,
                        proof_path: pendingVerification.proofPath,
                    }),
                });

                setPendingVerification(null);
                setStatus(result.verified ? "Verification successful!" : "Verification completed (steps may differ from screenshot).");
                if (onSubmitted) {
                    onSubmitted();
                }
            } catch (err) {
                if (err instanceof ApiError && err.status === 429) {
                    if (pendingVerification.attempts >= MAX_RETRY_ATTEMPTS) {
                        setPendingVerification(null);
                        setError("Verification quota exhausted. Your submission was saved but verification is pending.");
                        setStatus("Submission saved (verification pending due to API limits).");
                        return;
                    }

                    const backoffSeconds = BASE_RETRY_SECONDS * Math.pow(2, pendingVerification.attempts);
                    const cappedBackoff = Math.min(backoffSeconds, 120);

                    setShowWaitConfirm(true);
                    setEstimatedWaitSeconds(cappedBackoff);
                    setStatus(`Rate limited (attempt ${pendingVerification.attempts + 1}/${MAX_RETRY_ATTEMPTS}). Waiting ${cappedBackoff}s...`);
                    setPendingVerification({
                        ...pendingVerification,
                        retryAt: Date.now() + cappedBackoff * 1000,
                        attempts: pendingVerification.attempts + 1,
                    });
                } else {
                    setPendingVerification(null);
                    const errorMsg = err instanceof Error ? err.message : "Verification failed";
                    setError(errorMsg);
                }
            }
        };

        processVerification();
    }, [pendingVerification, onSubmitted]);

    const handleConfirmWait = () => {
        setShowWaitConfirm(false);
        if (pendingVerification) {
            setPendingVerification({
                ...pendingVerification,
                retryAt: Date.now(),
            });
        }
    };

    const handleCancelWait = () => {
        setShowWaitConfirm(false);
        setPendingVerification(null);
        setError(null);
        setStatus("Submission saved. Verification skipped due to API limits - your steps are recorded but not AI-verified.");
        if (onSubmitted) {
            onSubmitted();
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setStatus(null);
        setShowWaitConfirm(false);
        setPendingVerification(null);
        setVerificationDetails(null);

        if (!file && (settings?.require_verification_photo !== false)) {
            // Default to requiring photo if settings are missing or explicitly true
            // If settings.require_verification_photo is explicitly false, we allow no file
            setError("Please attach a screenshot");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setError("File too large");
            return;
        }

        if (flagged && !flagReason.trim()) {
            setError("Please provide a reason for flagging the extraction as incorrect.");
            return;
        }

        setSubmitting(true);

        try {
            let proofPath = null;

            if (file) {
                let fileToUpload = file;
                if (file.size > 2 * 1024 * 1024) {
                    fileToUpload = await imageCompression(file, {
                        maxSizeMB: 2,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    });
                }

                const signed = await apiRequest<SignUploadResponse>("proofs/sign-upload", {
                    method: "POST",
                    body: JSON.stringify({ content_type: fileToUpload.type }),
                });

                await uploadToSignedUrl(signed.upload_url, fileToUpload);
                proofPath = signed.path;
            }

            const stepsNumber = parseInt(steps, 10) || 0;

            const response = await apiRequest<SubmissionResponse>("submissions", {
                method: "POST",
                body: JSON.stringify({
                    league_id: leagueId,
                    date,
                    steps: stepsNumber,
                    partial,
                    proof_path: proofPath,
                    flagged,
                    flag_reason: flagged ? flagReason : null,
                    overwrite,
                    proxy_member_id: proxyMemberId || undefined,
                }),
            });

            // Success - clear form
            analytics.stepsSubmitted(stepsNumber, leagueId);
            setFile(null);
            setFlagged(false);
            setFlagReason("");
            setOverwrite(false);

            // Handle verification response
            if (response.verification_error) {
                const { error: errCode, message, retry_after } = response.verification_error;

                if (errCode === "rate_limited" || retry_after) {
                    const waitTime = retry_after ?? 60;
                    setEstimatedWaitSeconds(waitTime);
                    setShowWaitConfirm(true);
                    setPendingVerification({
                        submissionId: response.submission.id,
                        leagueId,
                        steps: stepsNumber,
                        forDate: date,
                        proofPath: proofPath || "", // This shouldn't happen for rate_limited (implies we called verify, which implies proof exists)
                        retryAt: Date.now() + waitTime * 1000,
                        attempts: 0,
                    });
                } else {
                    setPendingVerification(null);
                    setError(`Verification Failed: ${message}`);
                    setStatus("Submission saved but not verified.");
                }
            } else if (response.verification?.verified !== undefined) {
                // ... handled above ... (existing code, no change needed here actually, just referencing context)
                // actually I need to be careful with the else block below
                const v = response.verification;
                // ...
                setVerificationDetails({
                    verified: v.verified,
                    extractedSteps: v.extracted_steps ?? null,
                    extractedDate: v.extracted_date ?? null,
                    claimedSteps: stepsNumber,
                    claimedDate: date,
                    difference: v.difference ?? null,
                    tolerance: v.tolerance_used ?? null,
                    notes: v.notes ?? null,
                });
                setStatus(v.verified ? "Submission verified successfully!" : null);
                if (onSubmitted) {
                    onSubmitted();
                }
            } else if (proofPath) {
                // Only start pending verification if we actually uploaded a proof
                setStatus("Submission saved! Verification in progress...");
                setPendingVerification({
                    submissionId: response.submission.id,
                    leagueId,
                    steps: stepsNumber,
                    forDate: date,
                    proofPath: proofPath,
                    retryAt: Date.now() + 3000,
                    attempts: 0,
                });
            } else {
                setStatus("Submission saved successfully!");
                if (onSubmitted) {
                    onSubmitted();
                }
            }
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 409) {
                    setError("A submission already exists for this date. Check 'Overwrite existing submission' to update it.");
                } else {
                    setError(parseApiMessage(err.payload) ?? `Request failed (${err.status})`);
                }
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Unexpected error during submission");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
            <div data-tour="date-picker">
                <DatePicker
                    value={date}
                    onChange={setDate}
                    label="Date"
                    required
                />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center" data-tour="steps-input">
                <label className="text-sm font-medium text-slate-300" htmlFor="submission-steps">
                    Steps
                </label>
                <input
                    id="submission-steps"
                    type="number"
                    min={1}
                    value={steps}
                    onChange={(e) => setSteps(e.target.value)}
                    placeholder="Enter the step count from your screenshot"
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                    required
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <input
                        id="submission-partial"
                        type="checkbox"
                        checked={partial}
                        onChange={(e) => setPartial(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
                    />
                    <label htmlFor="submission-partial" className="text-sm text-slate-300">
                        Mark as partial day
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        id="submission-flagged"
                        type="checkbox"
                        checked={flagged}
                        onChange={(e) => setFlagged(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500"
                    />
                    <label htmlFor="submission-flagged" className="text-sm text-rose-300">
                        Image extraction is correct (Flag as incorrect)
                    </label>
                </div>

                {flagged && (
                    <div className="pl-6">
                        <textarea
                            value={flagReason}
                            onChange={(e) => setFlagReason(e.target.value)}
                            placeholder="Describe what is wrong with the extraction..."
                            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
                            rows={2}
                            required={flagged}
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2" data-tour="screenshot-upload">
                <label className="text-sm font-medium text-slate-300" htmlFor="submission-proof">
                    Screenshot (PNG, JPG, HEIC)
                </label>
                <input
                    id="submission-proof"
                    type="file"
                    accept="image/png,image/jpeg,image/heic"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="text-sm text-slate-300"
                    required={(settings?.require_verification_photo !== false)} // Default to true if undefined
                />
                {file && (
                    <span className="text-xs text-slate-500">
                        {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                )}
            </div>

            {error && (
                <div className="rounded-md border border-rose-700 bg-rose-900/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-rose-400 break-all whitespace-pre-wrap font-mono">{error}</p>
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(error);
                            }}
                            className="shrink-0 rounded px-2 py-1 text-xs text-rose-400 hover:bg-rose-800/50 transition"
                            title="Copy error message"
                        >
                            Copy
                        </button>
                    </div>
                    {error.includes("already exists") && (
                        <div className="mt-2 flex items-center gap-2">
                            <input
                                id="submission-overwrite"
                                type="checkbox"
                                checked={overwrite}
                                onChange={(e) => setOverwrite(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
                            />
                            <label htmlFor="submission-overwrite" className="text-sm text-sky-300 font-medium cursor-pointer">
                                Overwrite existing submission
                            </label>
                        </div>
                    )}
                </div>
            )}
            {status && <p className="text-sm text-sky-400">{status}</p>}

            {/* Verification details feedback */}
            {verificationDetails && (
                <div className={`rounded-md border p-4 ${verificationDetails.verified
                    ? "border-emerald-700 bg-emerald-900/30"
                    : "border-rose-700 bg-rose-900/30"
                    }`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                            {verificationDetails.verified ? (
                                <p className="text-sm font-medium text-emerald-400">
                                    ✓ Verification successful
                                </p>
                            ) : (
                                <p className="text-sm font-medium text-rose-400">
                                    ✗ Verification failed
                                </p>
                            )}

                            {/* Step comparison */}
                            <div className="text-sm space-y-1">
                                {verificationDetails.extractedSteps !== null ? (
                                    <p className={verificationDetails.verified ? "text-slate-300" : "text-rose-300"}>
                                        <span className="text-slate-400">Screenshot shows:</span>{" "}
                                        <span className="font-semibold">
                                            {verificationDetails.extractedSteps.toLocaleString()} steps
                                        </span>
                                    </p>
                                ) : (
                                    <p className="text-amber-400">
                                        ⚠ Could not detect step count from screenshot
                                    </p>
                                )}

                                <p className="text-slate-400">
                                    You submitted:{" "}
                                    <span className="text-slate-200 font-semibold">
                                        {verificationDetails.claimedSteps.toLocaleString()} steps
                                    </span>
                                </p>

                                {verificationDetails.difference !== null && verificationDetails.tolerance !== null && (
                                    <p className="text-slate-500 text-xs mt-1">
                                        Difference: {verificationDetails.difference.toLocaleString()}
                                        {" "}(max allowed: {verificationDetails.tolerance.toLocaleString()})
                                    </p>
                                )}
                            </div>

                            {/* Date comparison if different */}
                            {verificationDetails.extractedDate &&
                                verificationDetails.extractedDate !== verificationDetails.claimedDate && (
                                    <div className="text-sm mt-2 pt-2 border-t border-slate-700">
                                        <p className="text-amber-400">
                                            ⚠ Date mismatch detected
                                        </p>
                                        <p className="text-slate-400 mt-1">
                                            Screenshot date: <span className="text-amber-300 font-medium">{verificationDetails.extractedDate}</span>
                                            {" "}• Submitted: <span className="text-slate-300">{verificationDetails.claimedDate}</span>
                                        </p>
                                    </div>
                                )}

                            {/* Notes (collapsed by default) */}
                            {verificationDetails.notes && !verificationDetails.verified && (
                                <details className="mt-2 text-xs">
                                    <summary className="text-slate-500 cursor-pointer hover:text-slate-400">
                                        Technical details
                                    </summary>
                                    <p className="mt-1 text-slate-400 bg-slate-800/50 rounded p-2 font-mono">
                                        {verificationDetails.notes}
                                    </p>
                                </details>
                            )}
                        </div>

                        {/* Report Issue button for failed verifications */}
                        {!verificationDetails.verified && (
                            <button
                                type="button"
                                onClick={() => {
                                    const issueDetails = [
                                        `Verification Issue Report`,
                                        `========================`,
                                        `Date: ${new Date().toISOString()}`,
                                        ``,
                                        `Submitted: ${verificationDetails.claimedSteps} steps on ${verificationDetails.claimedDate}`,
                                        `Detected: ${verificationDetails.extractedSteps ?? 'N/A'} steps`,
                                        `Detected Date: ${verificationDetails.extractedDate ?? 'N/A'}`,
                                        `Difference: ${verificationDetails.difference ?? 'N/A'}`,
                                        `Tolerance: ${verificationDetails.tolerance ?? 'N/A'}`,
                                        ``,
                                        `Notes: ${verificationDetails.notes ?? 'None'}`,
                                    ].join('\n');
                                    navigator.clipboard.writeText(issueDetails);
                                    alert('Issue details copied to clipboard! You can paste this in an email or support ticket.');
                                }}
                                className="shrink-0 rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:border-slate-500"
                            >
                                📋 Report Issue
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Pending verification status */}
            {pendingVerification && !showWaitConfirm && (
                <div className="rounded-md border border-amber-700 bg-amber-900/30 p-3">
                    <p className="text-sm text-amber-300">
                        Verification in progress...
                        {estimatedWaitSeconds > 0 && (
                            <span className="ml-1">
                                (retrying in {formatWaitTime(estimatedWaitSeconds)})
                            </span>
                        )}
                    </p>
                    <p className="mt-1 text-xs text-amber-400/70">
                        Keep this tab open to complete verification.
                    </p>
                </div>
            )}

            {/* Wait confirmation dialog */}
            {showWaitConfirm && (
                <div className="rounded-md border border-amber-700 bg-amber-900/30 p-4">
                    <p className="text-sm font-medium text-amber-300">
                        High traffic detected
                    </p>
                    <p className="mt-1 text-sm text-amber-400/80">
                        Verification is estimated to take {formatWaitTime(estimatedWaitSeconds)}.
                        Would you like to wait? You must keep this tab open.
                    </p>
                    <div className="mt-3 flex gap-2">
                        <button
                            type="button"
                            onClick={handleConfirmWait}
                            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-slate-950 transition hover:bg-amber-500"
                        >
                            Yes, wait
                        </button>
                        <button
                            type="button"
                            onClick={handleCancelWait}
                            className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
                        >
                            Skip verification
                        </button>
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={submitting || !!pendingVerification}
                className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                data-tour="submit-button"
            >
                {submitting ? "Submitting..." : pendingVerification ? "Verifying..." : "Submit Steps"}
            </button>
        </form>
    );
}

async function uploadToSignedUrl(url: string, file: File) {
    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": file.type,
            "x-upsert": "true",
        },
        body: file,
    });

    if (!response.ok) {
        throw new Error("Failed to upload screenshot");
    }
}

function parseApiMessage(payload: unknown): string | null {
    if (payload && typeof payload === "object" && "error" in payload && typeof (payload as { error: unknown }).error === "string") {
        return (payload as { error: string }).error;
    }
    return null;
}

function formatWaitTime(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
        return `${minutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
}
