"use client";

import React, { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { apiRequest, ApiError } from "@/lib/api/client";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";
import { normalizeError, reportErrorClient, ErrorCode } from "@/lib/errors";

interface BatchSubmissionFormProps {
    leagueId: string;
    proxyMemberId?: string;
    onSubmitted?: () => void;
}

interface ImageFile {
    id: string;
    file: File;
    preview: string;
    status: "pending" | "extracting" | "review" | "submitting" | "success" | "error";
    error?: string;
    errorCode?: ErrorCode;
    errorDetails?: string;
    retryable?: boolean;
    extractedData?: {
        steps?: number;
        date?: string;
        km?: number;
        calories?: number;
        confidence?: "high" | "medium" | "low";
        notes?: string;
    };
    // User-edited values (override AI extraction)
    editedSteps?: number;
    editedDate?: string;
    confirmedByUser?: boolean; // User confirmed low-confidence extraction
    proofPath?: string; // Stored after upload
    submissionId?: string;
}

interface SignUploadResponse {
    upload_url: string;
    path: string;
}

interface ExtractResponse {
    extracted_steps?: number;
    extracted_date?: string;
    extracted_km?: number;
    extracted_calories?: number;
    confidence?: "high" | "medium" | "low";
    notes?: string;
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
    };
    verification_error?: {
        error: string;
        message: string;
    };
}

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const compressionOptions = {
    maxSizeMB: MAX_FILE_SIZE_MB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
};

export function BatchSubmissionForm({ leagueId, proxyMemberId, onSubmitted }: BatchSubmissionFormProps) {
    // Get max batch uploads from app settings (SuperAdmin configurable)
    const { getNumericSetting } = useAppSettings();
    const maxFiles = getNumericSetting("max_batch_uploads", 7);
    const { toast } = useToast();

    const [images, setImages] = useState<ImageFile[]>([]);
    const [processing, setProcessing] = useState(false);
    const [overallStatus, setOverallStatus] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null); // For modal
    const [limitWarning, setLimitWarning] = useState<string | null>(null);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const handleFilesSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setLimitWarning(null);

        // Calculate how many we can still add
        const remainingSlots = maxFiles - images.length;

        if (remainingSlots <= 0) {
            setLimitWarning(`Already at maximum ${maxFiles} images. Remove some to add more.`);
            event.target.value = "";
            return;
        }

        // Take only what fits, warn if truncated
        let filesToProcess = files;
        if (files.length > remainingSlots) {
            filesToProcess = files.slice(0, remainingSlots);
            setLimitWarning(`Only first ${remainingSlots} image${remainingSlots !== 1 ? 's' : ''} added (max ${maxFiles} total). ${files.length - remainingSlots} skipped.`);
        }

        const newImages: ImageFile[] = [];

        for (const file of filesToProcess) {
            if (!file.type.startsWith("image/")) {
                continue;
            }

            const preview = URL.createObjectURL(file);
            newImages.push({
                id: generateId(),
                file,
                preview,
                status: "pending",
            });
        }

        setImages((prev) => [...prev, ...newImages]);
        event.target.value = "";
    }, [images.length, maxFiles]);

    const removeImage = useCallback((id: string) => {
        setImages((prev) => {
            const img = prev.find((i) => i.id === id);
            if (img) {
                URL.revokeObjectURL(img.preview);
            }
            return prev.filter((i) => i.id !== id);
        });
    }, []);

    const compressImage = async (file: File): Promise<File> => {
        if (file.size <= MAX_FILE_SIZE_BYTES) {
            return file;
        }
        return await imageCompression(file, compressionOptions);
    };

    // Step 1: Extract data from all images (upload + AI extraction only, no submission yet)
    const handleExtractAll = async () => {
        if (images.length === 0) return;

        setProcessing(true);
        setOverallStatus("Extracting data from images...");

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            if (image.status !== "pending") continue;

            setOverallStatus(`Extracting image ${i + 1} of ${images.length}...`);

            try {
                // Compress
                const compressedFile = await compressImage(image.file);

                // Upload
                const signed = await apiRequest<SignUploadResponse>("proofs/sign-upload", {
                    method: "POST",
                    body: JSON.stringify({ content_type: compressedFile.type }),
                });

                await fetch(signed.upload_url, {
                    method: "PUT",
                    headers: {
                        "Content-Type": compressedFile.type,
                        "x-upsert": "true",
                    },
                    body: compressedFile,
                });

                // Extract data only (no submission)
                const extractResponse = await apiRequest<ExtractResponse>("submissions/extract", {
                    method: "POST",
                    body: JSON.stringify({
                        league_id: leagueId,
                        proof_path: signed.path,
                    }),
                });

                setImages((prev) =>
                    prev.map((img) =>
                        img.id === image.id
                            ? {
                                ...img,
                                status: "review",
                                proofPath: signed.path,
                                extractedData: {
                                    steps: extractResponse.extracted_steps,
                                    date: extractResponse.extracted_date,
                                    km: extractResponse.extracted_km,
                                    calories: extractResponse.extracted_calories,
                                    confidence: extractResponse.confidence,
                                    notes: extractResponse.notes,
                                },
                                editedSteps: extractResponse.extracted_steps,
                                editedDate: extractResponse.extracted_date,
                            }
                            : img
                    )
                );
            } catch (err) {
                const appError = normalizeError(err, ErrorCode.API_REQUEST_FAILED);
                reportErrorClient(appError);

                // Determine if retryable
                const isRetryable =
                    appError.code === ErrorCode.NETWORK_ERROR ||
                    appError.code === ErrorCode.RATE_LIMIT_EXCEEDED ||
                    appError.code === ErrorCode.REQUEST_TIMEOUT;

                setImages((prev) =>
                    prev.map((img) =>
                        img.id === image.id
                            ? {
                                ...img,
                                status: "error",
                                error: appError.toUserMessage(),
                                errorCode: appError.code,
                                errorDetails: JSON.stringify({
                                    message: appError.message,
                                    context: appError.context,
                                    timestamp: new Date().toISOString()
                                }, null, 2),
                                retryable: isRetryable,
                            }
                            : img
                    )
                );
            }

            // Small delay
            if (i < images.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 300));
            }
        }

        setOverallStatus("Review extracted data and submit when ready");
        setProcessing(false);
    };

    // Step 2: Submit reviewed images
    const handleSubmitReviewed = async () => {
        const reviewedImages = images.filter((i) => i.status === "review");
        if (reviewedImages.length === 0) return;

        // BLOCK low-confidence submissions until user confirms
        const lowConfidenceImages = reviewedImages.filter(
            img => img.extractedData?.confidence === "low" && !img.confirmedByUser
        );

        if (lowConfidenceImages.length > 0) {
            toast({
                variant: "destructive",
                title: "Low Confidence Extractions",
                description: `${lowConfidenceImages.length} image(s) have low confidence. Please review and confirm before submitting.`
            });
            return; // Block submission
        }

        setProcessing(true);
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < reviewedImages.length; i++) {
            const image = reviewedImages[i];
            setOverallStatus(`Submitting ${i + 1} of ${reviewedImages.length}...`);

            try {
                const response = await apiRequest<SubmissionResponse>("submissions/batch", {
                    method: "POST",
                    body: JSON.stringify({
                        league_id: leagueId,
                        proof_path: image.proofPath,
                        steps: image.editedSteps,
                        date: image.editedDate,
                        overwrite: true, // Allow overwriting if date already exists
                        proxy_member_id: proxyMemberId || undefined,
                    }),
                });

                setImages((prev) =>
                    prev.map((img) =>
                        img.id === image.id
                            ? {
                                ...img,
                                status: "success",
                                submissionId: response.submission.id,
                            }
                            : img
                    )
                );
                successCount++;
            } catch (err) {
                setImages((prev) =>
                    prev.map((img) =>
                        img.id === image.id
                            ? {
                                ...img,
                                status: "error",
                                error: err instanceof Error ? err.message : "Submission failed",
                            }
                            : img
                    )
                );
                errorCount++;
            }

            if (i < reviewedImages.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 300));
            }
        }

        setOverallStatus(`Completed: ${successCount} successful, ${errorCount} failed`);
        setProcessing(false);

        if (successCount > 0 && onSubmitted) {
            onSubmitted();
        }
    };

    const updateEditedValue = (id: string, field: "editedSteps" | "editedDate", value: string) => {
        setImages((prev) =>
            prev.map((img) =>
                img.id === id
                    ? {
                        ...img,
                        [field]: field === "editedSteps" ? parseInt(value, 10) || 0 : value,
                    }
                    : img
            )
        );
    };

    const getStatusColor = (status: ImageFile["status"]) => {
        switch (status) {
            case "pending": return "border-slate-700";
            case "extracting": return "border-amber-600";
            case "review": return "border-primary";
            case "submitting": return "border-amber-600";
            case "success": return "border-emerald-600";
            case "error": return "border-rose-600";
        }
    };

    const getStatusText = (status: ImageFile["status"]) => {
        switch (status) {
            case "pending": return "Ready";
            case "extracting": return "Extracting...";
            case "review": return "Review";
            case "submitting": return "Submitting...";
            case "success": return "Success";
            case "error": return "Failed";
        }
    };

    const pendingCount = images.filter((i) => i.status === "pending").length;
    const reviewCount = images.filter((i) => i.status === "review").length;
    const completedCount = images.filter((i) => i.status === "success" || i.status === "error").length;
    const allCompleted = images.length > 0 && completedCount === images.length;

    const handleReset = useCallback(() => {
        // Revoke all preview URLs
        images.forEach((img) => URL.revokeObjectURL(img.preview));
        setImages([]);
        setOverallStatus(null);
        setLimitWarning(null);
    }, [images]);

    return (
        <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-300">
                    Batch Upload (up to {maxFiles} images)
                </h3>
                <span className="text-xs text-slate-500">
                    {images.length}/{maxFiles} selected
                </span>
            </div>

            {/* File Input */}
            <div className="flex flex-col gap-2">
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/heic"
                    multiple
                    onChange={handleFilesSelected}
                    disabled={processing || images.length >= maxFiles}
                    className="text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
                />
                <p className="text-xs text-slate-500">
                    Images will be auto-compressed. AI extracts date and steps - you can review and edit before submitting.
                </p>
                {limitWarning && (
                    <p className="text-xs text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.1)] px-3 py-2 rounded-md">
                        ⚠️ {limitWarning}
                    </p>
                )}
            </div>

            {/* Image Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className={`relative rounded-lg border-2 overflow-hidden ${getStatusColor(img.status)}`}
                        >
                            {/* Clickable Image Preview */}
                            <button
                                type="button"
                                onClick={() => setPreviewImage(img.preview)}
                                className="w-full h-32 overflow-hidden cursor-zoom-in"
                                title="Click to expand"
                            >
                                <img
                                    src={img.preview}
                                    alt="Preview"
                                    className="h-full w-full object-cover hover:opacity-80 transition-opacity"
                                />
                            </button>

                            {/* Remove button */}
                            {!processing && (img.status === "pending" || img.status === "review") && (
                                <button
                                    onClick={() => removeImage(img.id)}
                                    className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-xs text-white hover:bg-rose-500"
                                    title="Remove"
                                >
                                    ✕
                                </button>
                            )}

                            {/* Status & Data */}
                            <div className="bg-slate-800 p-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-medium ${img.status === "success" ? "text-emerald-400" :
                                        img.status === "error" ? "text-rose-400" :
                                            img.status === "review" ? "text-primary" :
                                                "text-slate-400"
                                        }`}>
                                        {getStatusText(img.status)}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        Click image to expand
                                    </span>
                                </div>

                                {/* Editable fields (only in review state) */}
                                {img.status === "review" && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-slate-400 w-12">Date:</label>
                                            <input
                                                type="date"
                                                value={img.editedDate || ""}
                                                onChange={(e) => updateEditedValue(img.id, "editedDate", e.target.value)}
                                                className="flex-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-slate-400 w-12">Steps:</label>
                                            <input
                                                type="number"
                                                value={img.editedSteps || ""}
                                                onChange={(e) => updateEditedValue(img.id, "editedSteps", e.target.value)}
                                                className="flex-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
                                            />
                                        </div>

                                        {/* Confidence indicator */}
                                        {img.extractedData?.confidence && (
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs ${
                                                    img.extractedData.confidence === "high" ? "text-emerald-400" :
                                                    img.extractedData.confidence === "medium" ? "text-amber-400" :
                                                    "text-rose-400"
                                                }`}>
                                                    {img.extractedData.confidence === "high" ? "✓ High Confidence" :
                                                     img.extractedData.confidence === "medium" ? "⚠️ Medium Confidence" :
                                                     "⚠️ Low Confidence"}
                                                </span>
                                            </div>
                                        )}

                                        {/* AI notes */}
                                        {img.extractedData?.notes && (
                                            <details className="text-xs">
                                                <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
                                                    AI Notes
                                                </summary>
                                                <p className="mt-1 text-slate-300 bg-slate-950 p-2 rounded">
                                                    {img.extractedData.notes}
                                                </p>
                                            </details>
                                        )}

                                        {img.extractedData?.steps !== img.editedSteps && (
                                            <p className="text-xs text-[hsl(var(--warning))]">
                                                AI detected: {img.extractedData?.steps?.toLocaleString()} steps
                                            </p>
                                        )}
                                        {img.extractedData?.date !== img.editedDate && (
                                            <p className="text-xs text-[hsl(var(--warning))]">
                                                AI detected: {img.extractedData?.date}
                                            </p>
                                        )}

                                        {/* Low confidence confirmation checkbox */}
                                        {img.extractedData?.confidence === "low" && (
                                            <div className="bg-rose-500/10 border border-rose-500/30 rounded p-2">
                                                <label className="flex items-start gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={img.confirmedByUser || false}
                                                        onChange={(e) => {
                                                            setImages((prev) =>
                                                                prev.map((i) =>
                                                                    i.id === img.id
                                                                        ? { ...i, confirmedByUser: e.target.checked }
                                                                        : i
                                                                )
                                                            );
                                                        }}
                                                        className="mt-0.5"
                                                    />
                                                    <span className="text-xs text-rose-300">
                                                        I confirm these values are correct despite low AI confidence
                                                    </span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Success display */}
                                {img.status === "success" && img.editedSteps && (
                                    <p className="text-xs text-emerald-400">
                                        {img.editedSteps.toLocaleString()} steps on {img.editedDate}
                                    </p>
                                )}

                                {/* Error display - ENHANCED */}
                                {img.error && (
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <span className="text-rose-400 text-xs">⚠️</span>
                                            <p className="text-xs text-rose-400 flex-1">
                                                {img.error}
                                            </p>
                                        </div>

                                        {img.errorDetails && (
                                            <details className="text-xs">
                                                <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
                                                    Technical Details
                                                </summary>
                                                <pre className="mt-2 rounded bg-slate-950 p-2 text-xs text-slate-400 overflow-x-auto max-h-32 overflow-y-auto">
                                                    {img.errorDetails}
                                                </pre>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(img.errorDetails!);
                                                        toast({ title: "Copied error details" });
                                                    }}
                                                    className="mt-1 text-xs text-primary hover:underline"
                                                >
                                                    📋 Copy Details
                                                </button>
                                            </details>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Overall Status */}
            {overallStatus && (
                <p className="text-sm text-[hsl(var(--info))]">{overallStatus}</p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row">
                {pendingCount > 0 && (
                    <button
                        onClick={handleExtractAll}
                        disabled={processing}
                        className="flex-1 rounded-md bg-[hsl(var(--warning))] px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-[hsl(var(--warning)/0.9)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? "Extracting..." : `Extract Data (${pendingCount} image${pendingCount !== 1 ? "s" : ""})`}
                    </button>
                )}

                {reviewCount > 0 && (
                    <button
                        onClick={handleSubmitReviewed}
                        disabled={processing}
                        className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? "Submitting..." : `Submit (${reviewCount} image${reviewCount !== 1 ? "s" : ""})`}
                    </button>
                )}

                {allCompleted && (
                    <button
                        onClick={handleReset}
                        className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                        ➕ Submit Another Batch
                    </button>
                )}
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-h-[90vh] max-w-[90vw]">
                        <img
                            src={previewImage}
                            alt="Full preview"
                            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
                        />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-2 -right-2 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
