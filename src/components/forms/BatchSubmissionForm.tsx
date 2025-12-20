"use client";

import React, { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { apiRequest, ApiError } from "@/lib/api/client";

interface BatchSubmissionFormProps {
    leagueId: string;
    onSubmitted?: () => void;
}

interface ImageFile {
    id: string;
    file: File;
    preview: string;
    status: "pending" | "compressing" | "uploading" | "verifying" | "success" | "error";
    error?: string;
    extractedData?: {
        steps?: number;
        date?: string;
        km?: number;
        calories?: number;
    };
}

interface SignUploadResponse {
    upload_url: string;
    path: string;
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
        extracted_km?: number | null;
        extracted_calories?: number | null;
        notes?: string;
    };
    verification_error?: {
        error: string;
        message: string;
    };
}

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const compressionOptions = {
    maxSizeMB: MAX_FILE_SIZE_MB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
};

export function BatchSubmissionForm({ leagueId, onSubmitted }: BatchSubmissionFormProps) {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [processing, setProcessing] = useState(false);
    const [overallStatus, setOverallStatus] = useState<string | null>(null);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const handleFilesSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

        if (images.length + files.length > MAX_FILES) {
            alert(`Maximum ${MAX_FILES} images allowed at a time`);
            return;
        }

        const newImages: ImageFile[] = [];

        for (const file of files) {
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
        event.target.value = ""; // Reset input for re-selection
    }, [images.length]);

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

    const processImage = async (image: ImageFile): Promise<ImageFile> => {
        let updatedImage = { ...image };

        try {
            // Step 1: Compress if needed
            updatedImage.status = "compressing";
            const compressedFile = await compressImage(image.file);
            updatedImage.file = compressedFile;

            // Step 2: Upload
            updatedImage.status = "uploading";
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

            // Step 3: Submit with auto-extraction (no steps/date needed from user)
            updatedImage.status = "verifying";
            const response = await apiRequest<SubmissionResponse>("submissions/batch", {
                method: "POST",
                body: JSON.stringify({
                    league_id: leagueId,
                    proof_path: signed.path,
                    auto_extract: true,
                }),
            });

            if (response.verification?.verified) {
                updatedImage.status = "success";
                updatedImage.extractedData = {
                    steps: response.verification.extracted_steps ?? undefined,
                    date: response.verification.extracted_date ?? undefined,
                    km: response.verification.extracted_km ?? undefined,
                    calories: response.verification.extracted_calories ?? undefined,
                };
            } else if (response.verification_error) {
                updatedImage.status = "error";
                updatedImage.error = response.verification_error.message;
            } else {
                updatedImage.status = "success";
                updatedImage.extractedData = {
                    steps: response.verification?.extracted_steps ?? undefined,
                    date: response.verification?.extracted_date ?? undefined,
                };
            }
        } catch (err) {
            updatedImage.status = "error";
            updatedImage.error = err instanceof ApiError
                ? `Error: ${err.status}`
                : err instanceof Error
                    ? err.message
                    : "Unknown error";
        }

        return updatedImage;
    };

    const handleSubmitAll = async () => {
        if (images.length === 0) return;

        setProcessing(true);
        setOverallStatus("Processing images...");

        // Process images sequentially to avoid rate limits
        const results: ImageFile[] = [];
        for (let i = 0; i < images.length; i++) {
            setOverallStatus(`Processing image ${i + 1} of ${images.length}...`);
            const result = await processImage(images[i]);
            results.push(result);

            // Update UI after each image
            setImages((prev) =>
                prev.map((img) => img.id === result.id ? result : img)
            );

            // Small delay between images to avoid overwhelming the API
            if (i < images.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }

        const successCount = results.filter((r) => r.status === "success").length;
        const errorCount = results.filter((r) => r.status === "error").length;

        setOverallStatus(`Completed: ${successCount} successful, ${errorCount} failed`);
        setProcessing(false);

        if (successCount > 0 && onSubmitted) {
            onSubmitted();
        }
    };

    const getStatusIcon = (status: ImageFile["status"]) => {
        switch (status) {
            case "pending": return "⏳";
            case "compressing": return "🗜️";
            case "uploading": return "⬆️";
            case "verifying": return "🔍";
            case "success": return "✅";
            case "error": return "❌";
        }
    };

    const getStatusText = (status: ImageFile["status"]) => {
        switch (status) {
            case "pending": return "Ready";
            case "compressing": return "Compressing...";
            case "uploading": return "Uploading...";
            case "verifying": return "Verifying...";
            case "success": return "Success";
            case "error": return "Failed";
        }
    };

    return (
        <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-300">
                    Batch Upload (up to {MAX_FILES} images)
                </h3>
                <span className="text-xs text-slate-500">
                    {images.length}/{MAX_FILES} selected
                </span>
            </div>

            {/* File Input */}
            <div className="flex flex-col gap-2">
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/heic"
                    multiple
                    onChange={handleFilesSelected}
                    disabled={processing || images.length >= MAX_FILES}
                    className="text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-sky-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-sky-500 disabled:opacity-50"
                />
                <p className="text-xs text-slate-500">
                    Images will be auto-compressed to {MAX_FILE_SIZE_MB}MB. AI will extract date and steps.
                </p>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {images.map((img) => (
                        <div
                            key={img.id}
                            className={`relative rounded-lg border overflow-hidden ${img.status === "error"
                                    ? "border-rose-600"
                                    : img.status === "success"
                                        ? "border-emerald-600"
                                        : "border-slate-700"
                                }`}
                        >
                            <img
                                src={img.preview}
                                alt="Preview"
                                className="h-24 w-full object-cover"
                            />

                            {/* Status overlay */}
                            <div className={`absolute inset-0 flex items-center justify-center bg-black/50 ${img.status === "pending" ? "opacity-0" : "opacity-100"
                                } transition-opacity`}>
                                <span className="text-lg">{getStatusIcon(img.status)}</span>
                            </div>

                            {/* Remove button */}
                            {!processing && img.status === "pending" && (
                                <button
                                    onClick={() => removeImage(img.id)}
                                    className="absolute right-1 top-1 rounded-full bg-rose-600 p-1 text-xs text-white hover:bg-rose-500"
                                    title="Remove"
                                >
                                    ✕
                                </button>
                            )}

                            {/* Status text */}
                            <div className="bg-slate-800 px-2 py-1 text-center">
                                <p className="text-xs text-slate-400 truncate">
                                    {getStatusText(img.status)}
                                </p>
                                {img.extractedData?.steps && (
                                    <p className="text-xs text-emerald-400 font-medium">
                                        {img.extractedData.steps.toLocaleString()} steps
                                    </p>
                                )}
                                {img.extractedData?.date && (
                                    <p className="text-xs text-slate-500">
                                        {img.extractedData.date}
                                    </p>
                                )}
                                {img.error && (
                                    <p className="text-xs text-rose-400 truncate" title={img.error}>
                                        {img.error}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Overall Status */}
            {overallStatus && (
                <p className="text-sm text-sky-400">{overallStatus}</p>
            )}

            {/* Submit Button */}
            <button
                onClick={handleSubmitAll}
                disabled={processing || images.length === 0 || images.every((i) => i.status !== "pending")}
                className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {processing ? "Processing..." : `Submit ${images.filter((i) => i.status === "pending").length} Image${images.filter((i) => i.status === "pending").length !== 1 ? "s" : ""}`}
            </button>
        </div>
    );
}
