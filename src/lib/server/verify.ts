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

// Default to "verify" to match the Supabase Edge Function deployed from SCL v2
const VERIFY_FUNCTION_NAME = process.env.VERIFY_FUNCTION_NAME ?? "verify";
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
        const functionUrl = getSupabaseFunctionUrl(VERIFY_FUNCTION_NAME);
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
            return { status: 500, ok: false, data: { error: "server_misconfigured", message: "Service role key not configured" } };
        }

        const response = await fetch(functionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${serviceRoleKey}`,
                ...(payload.token ? { "X-Client-Authorization": `Bearer ${payload.token}` } : {}),
            },
            body: JSON.stringify(payload),
            signal: abortController.signal,
        });

        const data = await safeJson(response);
        return { status: response.status, ok: response.ok, data };
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            return { status: 504, ok: false, data: { error: "verification_timeout", message: "Verification request timed out" } };
        }
        // Return structured error instead of throwing
        const errorMessage = error instanceof Error ? error.message : "Unknown fetch error";
        console.error("Verification function fetch error:", errorMessage);
        return { status: 502, ok: false, data: { error: "edge_function_unreachable", message: errorMessage } };
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
