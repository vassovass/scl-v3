/**
 * Server-side helper to call the Supabase Edge Function for AI screenshot verification.
 */

export type VerificationPayload = {
    steps: number;
    for_date: string;
    proof_path: string;
    requester_id: string;
    league_id?: string;
    submission_id?: string;
    token?: string | null;
};

export type VerificationResult = {
    status: number;
    ok: boolean;
    data: unknown;
};

const VERIFY_FUNCTION_NAME = process.env.VERIFY_FUNCTION_NAME ?? "verify-steps";
const VERIFY_TIMEOUT_MS = parseInt(process.env.VERIFY_TIMEOUT_MS ?? "30000", 10);

function getSupabaseFunctionUrl(functionName: string): string {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Supabase Edge Functions URL format: https://<project-ref>.supabase.co/functions/v1/<function-name>
    return `${supabaseUrl}/functions/v1/${functionName}`;
}

export async function callVerificationFunction(payload: VerificationPayload): Promise<VerificationResult> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), VERIFY_TIMEOUT_MS);

    try {
        const response = await fetch(getSupabaseFunctionUrl(VERIFY_FUNCTION_NAME), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                ...(payload.token ? { "X-Client-Authorization": `Bearer ${payload.token}` } : {}),
            },
            body: JSON.stringify(payload),
            signal: abortController.signal,
        });

        const data = await safeJson(response);
        return { status: response.status, ok: response.ok, data };
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            return { status: 504, ok: false, data: { error: "verification_timeout" } };
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function safeJson(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return null;
    }
}
