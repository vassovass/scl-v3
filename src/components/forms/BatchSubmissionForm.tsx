"use client";

import React, { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { apiRequest, ApiError } from "@/lib/api/client";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";
import { normalizeError, reportErrorClient, ErrorCode } from "@/lib/errors";
import { useFeedback } from "@/components/feedback/FeedbackContext";

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
    // Retry state
    retryCount?: number;     // Number of retry attempts
    nextRetryAt?: Date;      // When to retry next
    autoRetrying?: boolean;  // Currently in auto-retry
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

// Retry configuration
const AUTO_RETRY_DELAYS = [5000, 10000, 20000]; // 5s, 10s, 20s
const MAX_AUTO_RETRIES = 3;

export function BatchSubmissionForm({ leagueId, proxyMemberId, onSubmitted }: BatchSubmissionFormProps) {
    // Get max batch uploads from app settings (SuperAdmin configurable)
    const { getNumericSetting } = useAppSettings();
    const maxFiles = getNumericSetting("max_batch_uploads", 7);
    const maxFiles = getNumericSetting("max_batch_uploads", 7);
    const { toast } = useToast();
    const { openFeedback } = useFeedback();

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

    // Reusable extraction logic for both initial extraction and retries
    const performExtraction = async (image: ImageFile): Promise<{ success: boolean; data?: ExtractResponse; error?: any }> => {
        console.log(`[Batch] Starting extraction for ${image.id} (${image.file.name})`);
        try {
            // Compress
            console.log(`[Batch] Compressing ${image.file.name}...`);
            const compressedFile = await compressImage(image.file);
            console.log(`[Batch] Compression complete. Size: ${compressedFile.size}`);

            // Upload
            console.log(`[Batch] Requesting upload URL for ${image.file.name}...`);
            const signed = await apiRequest<SignUploadResponse>("proofs/sign-upload", {
                method: "POST",
                body: JSON.stringify({ content_type: compressedFile.type }),
            });

            console.log(`[Batch] Uploading to bucket: ${signed.path}...`);
            await fetch(signed.upload_url, {
                method: "PUT",
                headers: {
                    "Content-Type": compressedFile.type,
                    "x-upsert": "true",
                },
                body: compressedFile,
            });
            console.log(`[Batch] Upload complete.`);

            // Extract data only (no submission)
            console.log(`[Batch] Sending to Gemini for extraction...`);
            const extractResponse = await apiRequest<ExtractResponse>("submissions/extract", {
                method: "POST",
                body: JSON.stringify({
                    league_id: leagueId,
                    proof_path: signed.path,
                    filename: image.file.name, // Pass original filename for date hints
                }),
            }); // Note: extractResponse is potentially partial

            // Safe parsing of extracting response to ensure fields exist
            console.log(`[Batch] Extraction received for ${image.id}:`, extractResponse);

            return {
                success: true,
                data: {
                    ...extractResponse,
                    // Store proofPath in the response so we can use it later
                    proofPath: signed.path
                } as any
            };
        } catch (err) {
            console.error(`[Batch] Extraction failed for ${image.id}:`, err);
            return { success: false, error: err };
        }
    };

    // Auto-retry logic with exponential backoff
    const scheduleAutoRetry = useCallback((imageId: string, retryCount: number) => {
        if (retryCount >= MAX_AUTO_RETRIES) {
            // Max retries reached - show manual retry option
            setImages((prev) =>
                prev.map((img) =>
                    img.id === imageId
                        ? { ...img, autoRetrying: false, retryable: true }
                        : img
                )
            );
            return;
        }

        const delay = AUTO_RETRY_DELAYS[Math.min(retryCount, AUTO_RETRY_DELAYS.length - 1)];
        const nextRetryAt = new Date(Date.now() + delay);

        setImages((prev) =>
            prev.map((img) =>
                img.id === imageId
                    ? { ...img, autoRetrying: true, nextRetryAt, retryCount: retryCount + 1 }
                    : img
            )
        );

        setTimeout(() => {
            retryImageAuto(imageId);
        }, delay);
    }, []);

    // Auto-retry execution
    const retryImageAuto = useCallback(async (id: string) => {
        const image = images.find(i => i.id === id);
        if (!image || !image.autoRetrying) return;

        setImages((prev) =>
            prev.map((img) =>
                img.id === id ? { ...img, status: "extracting" } : img
            )
        );

        const result = await performExtraction(image);

        if (result.success && result.data) {
            // Success!
            const extractResponse = result.data as any;
            setImages((prev) =>
                prev.map((img) =>
                    img.id === id
                        ? {
                            ...img,
                            status: "review",
                            proofPath: extractResponse.proofPath,
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
                            autoRetrying: false,
                            retryCount: 0,
                            error: undefined,
                            errorDetails: undefined,
                        }
                        : img
                )
            );
            toast({ title: "Retry successful!", description: "Image extracted successfully" });
        } else {
            // Failed - schedule next retry or give up
            const appError = normalizeError(result.error, ErrorCode.API_REQUEST_FAILED);
            const isRetryable =
                appError.code === ErrorCode.NETWORK_ERROR ||
                appError.code === ErrorCode.RATE_LIMIT_EXCEEDED ||
                appError.code === ErrorCode.REQUEST_TIMEOUT;

            if (isRetryable && (image.retryCount || 0) < MAX_AUTO_RETRIES) {
                // Schedule next retry
                scheduleAutoRetry(id, image.retryCount || 0);
            } else {
                // Give up
                setImages((prev) =>
                    prev.map((img) =>
                        img.id === id
                            ? {
                                ...img,
                                status: "error",
                                autoRetrying: false,
                                retryable: isRetryable,
                                error: appError.toUserMessage(),
                                errorCode: appError.code,
                                errorDetails: JSON.stringify({
                                    message: appError.message,
                                    context: appError.context,
                                    timestamp: new Date().toISOString(),
                                    retriesAttempted: image.retryCount || 0
                                }, null, 2),
                            }
                            : img
                    )
                );
            }
        }
    }, [images, scheduleAutoRetry, toast]);

    // Manual retry for single image
    const retryImage = useCallback(async (id: string, forceExtract = false) => {
        const image = images.find(i => i.id === id);
        if (!image || image.status !== "error") return;

        console.log(`[Batch] Retrying image ${id}. ForceExtract: ${forceExtract}. HasData: ${!!image.extractedData}`);

        // OPTIMIZATION: If we already have extracted data and proofPath, just move back to review
        // unless we strictly want to re-extract (e.g. if the user thinks the data is wrong)
        if (!forceExtract && image.extractedData && image.proofPath) {
            console.log(`[Batch] Restoring to review state (skipping re-extraction)`);
            setImages((prev) =>
                prev.map((img) =>
                    img.id === id
                        ? { ...img, status: "review", error: undefined, errorDetails: undefined, retryCount: 0 }
                        : img
                )
            );
            return;
        }

        // Reset to extracting
        setImages((prev) =>
            prev.map((img) =>
                img.id === id
                    ? { ...img, status: "extracting", error: undefined, errorDetails: undefined, retryCount: 0 }
                    : img
            )
        );

        const result = await performExtraction(image);

        if (result.success && result.data) {
            const extractResponse = result.data as any;
            setImages((prev) =>
                prev.map((img) =>
                    img.id === id
                        ? {
                            ...img,
                            status: "review",
                            proofPath: extractResponse.proofPath,
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
            toast({ title: "Extraction successful" });
        } else {
            const appError = normalizeError(result.error, ErrorCode.API_REQUEST_FAILED);
            reportErrorClient(appError);

            const isRetryable =
                appError.code === ErrorCode.NETWORK_ERROR ||
                appError.code === ErrorCode.RATE_LIMIT_EXCEEDED ||
                appError.code === ErrorCode.REQUEST_TIMEOUT;

            setImages((prev) =>
                prev.map((img) =>
                    img.id === id
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

            toast({
                variant: "destructive",
                title: "Retry failed",
                description: appError.toUserMessage()
            });
        }
    }, [images, toast]);

    // Retry all failed images
    const handleRetryAllFailed = useCallback(async () => {
        const failedImages = images.filter(i => i.status === "error" && i.retryable);
        if (failedImages.length === 0) return;

        setProcessing(true);
        setOverallStatus(`Retrying ${failedImages.length} failed image${failedImages.length !== 1 ? 's' : ''}...`);

        for (let i = 0; i < failedImages.length; i++) {
            await retryImage(failedImages[i].id);
            if (i < failedImages.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 300));
            }
        }

        setOverallStatus(null);
        setProcessing(false);
    }, [images, retryImage]);

    // Step 1: Extract data from all images (upload + AI extraction only, no submission yet)
    const handleExtractAll = async () => {
        if (images.length === 0) return;

        setProcessing(true);
        setOverallStatus("Extracting data from images...");

        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            if (image.status !== "pending") continue;

            setOverallStatus(`Extracting image ${i + 1} of ${images.length}...`);

            // Update status to extracting
            setImages((prev) =>
                prev.map((img) =>
                    img.id === image.id ? { ...img, status: "extracting" } : img
                )
            );

            const result = await performExtraction(image);

            if (result.success && result.data) {
                const extractResponse = result.data as any;
                setImages((prev) =>
                    prev.map((img) =>
                        img.id === image.id
                            ? {
                                ...img,
                                status: "review",
                                proofPath: extractResponse.proofPath,
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
            } else {
                const appError = normalizeError(result.error, ErrorCode.API_REQUEST_FAILED);
                reportErrorClient(appError);

                // Determine if retryable
                const isRetryable =
                    appError.code === ErrorCode.NETWORK_ERROR ||
                    appError.code === ErrorCode.RATE_LIMIT_EXCEEDED ||
                    appError.code === ErrorCode.REQUEST_TIMEOUT;

                if (isRetryable) {
                    // Start auto-retry
                    scheduleAutoRetry(image.id, 0);
                } else {
                    // Non-retryable error
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
                                    retryable: false,
                                }
                                : img
                        )
                    );
                }
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
                                errorDetails: JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
                            }
                            : img
                    )
                );
                errorCount++;
                console.error(`[Batch] Submission failed for ${image.id}:`, err);
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
                                                <span className={`text-xs ${img.extractedData.confidence === "high" ? "text-emerald-400" :
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

                                {/* Auto-retry countdown display */}
                                {img.autoRetrying && img.nextRetryAt && (
                                    <div className="text-xs text-amber-400 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded p-2">
                                        <span className="animate-spin">⟳</span>
                                        Retrying in {Math.max(0, Math.ceil((img.nextRetryAt.getTime() - Date.now()) / 1000))}s
                                        (Attempt {img.retryCount}/{MAX_AUTO_RETRIES})
                                    </div>
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

                                        {/* Manual retry button */}
                                        {img.retryable && !img.autoRetrying && (
                                            {/* Manual retry button */ }
                                        {img.retryable && !img.autoRetrying && (
                                            <div className="flex gap-2">
                                                {img.extractedData && img.proofPath ? (
                                                    <button
                                                        onClick={() => retryImage(img.id, false)}
                                                        disabled={processing}
                                                        className="flex-1 text-xs py-1.5 rounded bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                    >
                                                        ↪ Retry Submit
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => retryImage(img.id, true)}
                                                        disabled={processing}
                                                        className="flex-1 text-xs py-1.5 rounded bg-amber-600/20 text-amber-400 border border-amber-600/50 hover:bg-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                    >
                                                        🔄 Retry Extraction
                                                    </button>
                                                )}
                                            </div>
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

                {/* Retry All Failed Button */}
                {images.filter(i => i.status === "error" && i.retryable).length > 0 && (
                    <button
                        onClick={handleRetryAllFailed}
                        disabled={processing}
                        className="flex-1 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        🔄 Retry All Failed ({images.filter(i => i.status === "error" && i.retryable).length})
                    </button>
                )}

                {/* Report Issues Button */}
                {images.some(i => i.status === "error") && (
                    <button
                        onClick={() => {
                            const errors = images
                                .filter(i => i.status === "error")
                                .map(i => ({
                                    file: i.file.name,
                                    error: i.error,
                                    details: i.errorDetails ? JSON.parse(i.errorDetails || "{}") : undefined
                                }));

                            openFeedback({
                                type: "bug",
                                subject: "Batch Upload Errors",
                                description: `I encountered errors while uploading ${errors.length} images.\n\nSee attached metadata per user request.`,
                                metadata: {
                                    total_images: images.length,
                                    failed_count: errors.length,
                                    errors
                                }
                            });
                        }}
                        disabled={processing}
                        className="flex-1 rounded-md bg-rose-600/20 border border-rose-600/50 px-4 py-2 text-sm font-semibold text-rose-400 transition hover:bg-rose-600/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        🐞 Report Issues
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
