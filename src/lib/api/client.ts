"use client";

import { createClient } from "@/lib/supabase/client";

// Storage key must match AuthProvider
const ACTIVE_PROFILE_KEY = "stepleague_active_profile_id";
const SESSION_TIMEOUT_MS = 8000; // Increased to handle slow auth responses

/**
 * Options for API requests
 */
export interface ApiRequestOptions extends RequestInit {
    /** Explicit user ID to act as (overrides localStorage). For proxy submissions. */
    actingAs?: string;
}

/**
 * Get session with timeout to prevent indefinite hangs.
 */
async function getSessionWithTimeout(supabase: ReturnType<typeof createClient>) {
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Session timeout after 5s")), SESSION_TIMEOUT_MS)
    );
    return Promise.race([sessionPromise, timeoutPromise]);
}

/**
 * Make an authenticated API request to our backend.
 * Automatically includes the user's auth token and X-Acting-As header for proxy submissions.
 * @param path - API path (e.g., "submissions/batch")
 * @param options - Fetch options plus optional `actingAs` for proxy submissions
 */
export async function apiRequest<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { actingAs, ...init } = options;
    const startTime = Date.now();
    const method = init.method || 'GET';
    const normalizedPath = normalizePath(path);

    console.log(`[API] ${method} ${path} → Starting...`);


    console.log(`[API] ${method} ${path} → Getting session...`);
    const supabase = createClient();

    let sessionData;
    let sessionAttempts = 0;
    const maxSessionAttempts = 2;

    while (sessionAttempts < maxSessionAttempts) {
        try {
            sessionAttempts++;
            const result = await getSessionWithTimeout(supabase);
            sessionData = result.data;
            break; // Success, exit loop
        } catch (err) {
            console.error(`[API] ${method} ${path} ✗ Session attempt ${sessionAttempts}/${maxSessionAttempts} failed:`, err);

            if (sessionAttempts >= maxSessionAttempts) {
                throw new Error("Failed to get session. Please refresh the page and try again.");
            }

            // Wait briefly before retry
            await new Promise(r => setTimeout(r, 500));
            console.log(`[API] ${method} ${path} → Retrying session...`);
        }
    }

    console.log(`[API] ${method} ${path} → Session obtained, hasToken: ${!!sessionData.session?.access_token}`);

    const headers = new Headers(init.headers ?? {});
    if (sessionData.session?.access_token) {
        headers.set("Authorization", `Bearer ${sessionData.session.access_token}`);
    }

    // PRD 41: Include X-Acting-As header if currently acting as a proxy
    // Priority: explicit actingAs param > localStorage > none
    const activeProfileId = actingAs ?? (
        typeof window !== "undefined" ? localStorage.getItem(ACTIVE_PROFILE_KEY) : null
    );
    const currentUserId = sessionData.session?.user?.id;

    if (activeProfileId && activeProfileId !== currentUserId) {
        headers.set("X-Acting-As", activeProfileId);
        console.log(`[API] ${method} ${path} → Acting as proxy: ${activeProfileId}`);
    }

    const isFormData = init.body instanceof FormData;
    if (!headers.has("Content-Type") && !isFormData) {
        headers.set("Content-Type", "application/json");
    }

    console.log(`[API] ${method} ${path} → Calling fetch...`);
    try {
        const response = await fetch(normalizedPath, {
            ...init,
            headers,
            credentials: "include",
        });

        const elapsed = Date.now() - startTime;
        const payload = await safeJson(response);

        if (!response.ok) {
            console.error(`[API] ${method} ${path} ✗ ${response.status} in ${elapsed}ms`, payload);
            throw new ApiError(response.status, payload);
        }

        console.log(`[API] ${method} ${path} ✓ ${response.status} in ${elapsed}ms`);
        return payload as T;
    } catch (err) {
        const elapsed = Date.now() - startTime;
        if (err instanceof ApiError) {
            throw err; // Already logged above
        }
        console.error(`[API] ${method} ${path} ✗ NETWORK ERROR in ${elapsed}ms:`, err);
        throw err;
    }
}


/**
 * Error class for API request failures.
 */
export class ApiError extends Error {
    status: number;
    payload: unknown;

    constructor(status: number, payload: unknown) {
        // Extract meaningful error message from payload
        const errorMessage = extractErrorMessage(payload, status);
        super(errorMessage);
        this.status = status;
        this.payload = payload;
    }
}

/**
 * Extract a human-readable error message from various payload formats.
 */
function extractErrorMessage(payload: unknown, status: number): string {
    if (!payload) {
        return `Request failed (${status})`;
    }

    if (typeof payload === 'string') {
        return payload;
    }

    if (typeof payload === 'object') {
        const obj = payload as Record<string, unknown>;

        // Try common error message field names
        if (typeof obj.error === 'string') {
            // Include details if available
            if (obj.details && typeof obj.details === 'object') {
                const details = obj.details as Record<string, unknown>;
                if (typeof details.message === 'string') {
                    return `${obj.error}: ${details.message}`;
                }
                if (typeof details.error === 'string') {
                    return `${obj.error}: ${details.error}`;
                }
            }
            return obj.error;
        }
        if (typeof obj.message === 'string') {
            return obj.message;
        }
        if (typeof obj.detail === 'string') {
            return obj.detail;
        }

        // Fallback: stringify the object
        try {
            return JSON.stringify(payload);
        } catch {
            return `Request failed (${status})`;
        }
    }

    return `Request failed (${status})`;
}

function normalizePath(path: string): string {
    if (path.startsWith("http")) return path;
    if (path.startsWith("/")) return path;
    return `/api/${path}`;
}

async function safeJson(response: Response): Promise<unknown> {
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }
    return response.text();
}
