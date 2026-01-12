/**
 * Server-side verification logic - calls Gemini directly from v3.
 * No dependency on Supabase Edge Functions.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { callGemini, GeminiExtraction } from "./gemini";

const PROOFS_BUCKET = process.env.PROOFS_BUCKET ?? "proofs";
const VERIFY_TIMEOUT_MS = parseInt(process.env.VERIFY_TIMEOUT_MS ?? "30000", 10);

export type VerificationPayload = {
    steps: number;
    for_date?: string;
    proof_path: string;
    requester_id: string;
    league_id?: string;
    submission_id?: string;
    filename?: string; // Original filename for date hints
};

export type VerificationResult = {
    status: number;
    ok: boolean;
    data: {
        verified?: boolean;
        code?: string; // e.g. "rate_limited", "step_mismatch", "extraction_failed"
        message?: string;
        should_retry?: boolean;
        retry_after?: number;

        // Verification details
        tolerance_used?: number;
        difference?: number | null;
        extracted_steps?: number | null;
        extracted_date?: string | null;
        extracted_km?: number | null;
        extracted_calories?: number | null;
        confidence?: "high" | "medium" | "low";
        notes?: string;
    };
};

interface EvaluationResult {
    verified: boolean;
    tolerance: number;
    difference: number | null;
    notes: string;
    extractedKm: number | null;
    extractedCalories: number | null;
}

export async function callVerificationFunction(payload: VerificationPayload): Promise<VerificationResult> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), VERIFY_TIMEOUT_MS);

    try {
        // Fetch proof image from Supabase Storage
        const proof = await fetchProof(payload.proof_path);

        // Call Gemini directly
        const geminiResult = await callGemini({
            stepsClaimed: payload.steps,
            forDate: payload.for_date ?? "", // Pass empty string if undefined to signal "no claim"
            imageBase64: proof.base64,
            mimeType: proof.mimeType,
            filename: payload.filename, // Pass filename for date hints
        });

        // Evaluate the result
        const evaluation = evaluateVerdict({
            claimedSteps: payload.steps,
            claimedDate: payload.for_date,
            extraction: geminiResult.extraction,
        });

        // Persist to database if we have a submission ID
        if (payload.submission_id) {
            await persistVerification({
                submissionId: payload.submission_id,
                leagueId: payload.league_id,
                evaluation,
                extraction: geminiResult.extraction,
            });
        }

        return {
            status: 200,
            ok: true,
            data: {
                verified: evaluation.verified,
                code: evaluation.verified ? "success" : "verification_failed",
                message: evaluation.notes,

                tolerance_used: evaluation.tolerance,
                difference: evaluation.difference,
                extracted_steps: geminiResult.extraction.steps ?? null,
                extracted_date: geminiResult.extraction.date ?? null,
                extracted_km: evaluation.extractedKm,
                extracted_calories: evaluation.extractedCalories,
                confidence: geminiResult.extraction.confidence,
                notes: evaluation.notes,
            },
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Verification error:", errorMessage);

        // Check for rate limit errors from Gemini
        if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
            return {
                status: 429,
                ok: false,
                data: {
                    code: "rate_limited",
                    message: "AI service verification limit reached",
                    should_retry: true,
                    retry_after: 60
                },
            };
        }

        // Check for timeout
        if (error instanceof DOMException && error.name === "AbortError") {
            return {
                status: 504,
                ok: false,
                data: {
                    code: "timeout",
                    message: "Verification timed out",
                    should_retry: true
                },
            };
        }

        return {
            status: 500,
            ok: false,
            data: {
                code: "internal_error",
                message: errorMessage,
                should_retry: false
            },
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchProof(path: string): Promise<{ base64: string; mimeType: string }> {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage.from(PROOFS_BUCKET).download(path);

    if (error || !data) {
        throw new Error(`Unable to download proof: ${path}`);
    }

    const base64 = await blobToBase64(data);
    const mimeType = data.type || guessMimeType(path);

    return { base64, mimeType };
}

async function blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";

    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return Buffer.from(binary, "binary").toString("base64");
}

function guessMimeType(path: string): string {
    const lower = path.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".heic")) return "image/heic";
    return "application/octet-stream";
}

function evaluateVerdict({
    claimedSteps,
    claimedDate,
    extraction,
}: {
    claimedSteps: number;
    claimedDate?: string;
    extraction: GeminiExtraction;
}): EvaluationResult {
    const isAutoExtract = claimedSteps === 0;

    // For auto-extract, we accept whatever is extracted
    if (isAutoExtract) {
        const extractedSteps = extraction.steps ?? null;
        const verified = extractedSteps != null && extractedSteps > 0;

        const notes: string[] = [];
        if (!verified) {
            notes.push("Could not extract step count from screenshot.");
        } else {
            notes.push(`Auto-extracted ${extractedSteps} steps.`);
        }

        return {
            verified,
            tolerance: 0,
            difference: 0,
            notes: notes.join(" "),
            extractedKm: extraction.km ?? null,
            extractedCalories: extraction.calories ?? null,
        };
    }

    const tolerance = Math.max(Math.round(claimedSteps * 0.03), 300);
    const extractedSteps = extraction.steps ?? null;
    const difference = extractedSteps != null ? Math.abs(extractedSteps - claimedSteps) : null;
    const verified = extractedSteps != null && difference !== null && difference <= tolerance;

    const notes: string[] = [];
    if (extractedSteps == null) {
        notes.push("Could not extract step count from screenshot.");
        // Surface AI's explanation for why extraction failed
        if (extraction.notes) {
            notes.push(`AI: ${extraction.notes}`);
        }
    }
    // Only verify date if claimedDate was provided
    if (claimedDate && extraction.date && extraction.date !== claimedDate) {
        notes.push(`Screenshot date ${extraction.date} differs from claimed date ${claimedDate}.`);
    }
    if (!verified && extractedSteps != null && difference !== null) {
        notes.push(`Extracted ${extractedSteps} steps, which differs from claimed ${claimedSteps} by ${difference} (tolerance: ${tolerance}).`);
    }

    // Add confidence warning for low-confidence extractions
    if (extraction.confidence === "low") {
        notes.push(`⚠️ Low confidence extraction. Manual review recommended.`);
    }

    // Include AI notes for context (even on successful extractions)
    if (extraction.notes && extractedSteps != null) {
        notes.push(`AI notes: ${extraction.notes}`);
    }

    return {
        verified,
        tolerance,
        difference,
        notes: notes.length > 0 ? notes.join(" ") : (verified ? "Verification succeeded." : "Verification failed."),
        extractedKm: extraction.km ?? null,
        extractedCalories: extraction.calories ?? null,
    };
}

async function persistVerification({
    submissionId,
    leagueId,
    evaluation,
    extraction,
}: {
    submissionId: string;
    leagueId?: string;
    evaluation: EvaluationResult;
    extraction: GeminiExtraction;
}): Promise<void> {
    const adminClient = createAdminClient();

    const notes = [evaluation.notes];
    if (extraction.steps != null) {
        notes.push(`Extracted: ${extraction.steps} steps`);
    }
    if (extraction.date) {
        notes.push(`Date: ${extraction.date}`);
    }

    const { error } = await adminClient
        .from("submissions")
        .update({
            verified: evaluation.verified,
            tolerance_used: evaluation.tolerance,
            extracted_km: evaluation.extractedKm,
            extracted_calories: evaluation.extractedCalories,
            verification_notes: notes.join(" "),
        })
        .eq("id", submissionId);

    if (error) {
        console.error("Failed to persist verification:", error.message);
        // Don't throw - verification still succeeded, just logging failed
    }

    // Also log to audit if needed (optional - skipped for now)
    if (leagueId) {
        console.log(`Verification persisted for submission ${submissionId} in league ${leagueId}`);
    }
}
