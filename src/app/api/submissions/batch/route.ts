import { z } from "zod";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import { json, badRequest, unauthorized, forbidden, serverError, jsonError } from "@/lib/api";
import { callVerificationFunction } from "@/lib/server/verify";
import { normalizeExtractedDate } from "@/lib/utils/date";

const batchSchema = z.object({
    league_id: z.string().uuid(),
    proof_path: z.string().min(3),
    steps: z.number().int().positive().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    overwrite: z.boolean().default(false),
    proxy_member_id: z.string().uuid().optional(),
});

// ... existing code ...

const submissionData = {
    league_id: input.league_id,
    user_id: user.id,
    for_date: forDate,
    steps: extractedSteps,
    partial: false,
    proof_path: input.proof_path,
    verified: (verificationData as Record<string, unknown>).verified ?? true,
    tolerance_used: (verificationData as Record<string, unknown>).tolerance_used,
    extracted_km: (verificationData as Record<string, unknown>).extracted_km,
    extracted_calories: (verificationData as Record<string, unknown>).extracted_calories,
    verification_notes: (verificationData as Record<string, unknown>).notes,
    proxy_member_id: input.proxy_member_id ?? null,
};

let submission;
let insertError;

if (existing && input.overwrite) {
    const result = await adminClient
        .from("submissions")
        .update(submissionData)
        .eq("id", existing.id)
        .select("id, league_id, user_id, for_date, steps, partial, verified, created_at")
        .single();
    submission = result.data;
    insertError = result.error;
} else {
    const result = await adminClient
        .from("submissions")
        .insert(submissionData)
        .select("id, league_id, user_id, for_date, steps, partial, verified, created_at")
        .single();
    submission = result.data;
    insertError = result.error;
}

if (insertError) {
    if (insertError.code === "23505") {
        return jsonError(409, `Submission already exists for ${forDate}`);
    }
    console.error("Batch submission insert error:", insertError);
    return serverError(insertError.message);
}

return json({
    submission,
    verification: {
        verified: true,
        extracted_steps: extractedSteps,
        extracted_date: forDate,
        extracted_km: (verificationData as Record<string, unknown>).extracted_km,
        extracted_calories: (verificationData as Record<string, unknown>).extracted_calories,
    },
}, { status: 201 });
    } catch (error) {
    console.error("Batch submission error:", error);
    return serverError(error instanceof Error ? error.message : "Unknown error");
}
}

function normalizeDate(dateStr: string | null | undefined): string {
    if (!dateStr) return new Date().toISOString().slice(0, 10);
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
}
