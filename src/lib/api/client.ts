"use client";

import { createClient, resetClient } from "@/lib/supabase/client";

// Storage key must match AuthProvider
const ACTIVE_PROFILE_KEY = "stepleague_active_profile_id";
const SESSION_TIMEOUT_MS = 5000; // 5s per attempt

// Supabase storage key pattern for @supabase/ssr
const SUPABASE_STORAGE_KEY = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0]}-auth-token`;

/**
 * Options for API requests
 */
export interface ApiRequestOptions extends RequestInit {
    /** Explicit user ID to act as (overrides localStorage). For proxy submissions. */
    actingAs?: string;
}

/**
 * Try to get access token directly from localStorage (fast, no network).
 * Supabase stores session in localStorage with a predictable key.
 */
function getStoredAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(SUPABASE_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed?.access_token ?? null;
        }
    } catch {
        // Ignore parse errors
    }
    return null;
}

/**
 * Get user info with timeout. Uses getUser which is more reliable than getSession.
 */
async function getUserWithTimeout(supabase: ReturnType<typeof createClient>) {
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Session timeout after ${SESSION_TIMEOUT_MS / 1000}s`)), SESSION_TIMEOUT_MS)
    );
    return Promise.race([userPromise, timeoutPromise]);
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

    // Step 1: Try to get token from localStorage first (instant, no network)
    let accessToken = getStoredAccessToken();
    let currentUserId: string | null = null;

    if (accessToken) {
        console.log(`[API] ${method} ${path} → Found stored token`);
        // Decode user ID from JWT if possible (simple base64 decode of payload)
        try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            currentUserId = payload.sub ?? null;
        } catch {
            // If token decode fails, we'll still try to use it
        }
    } else {
        // Step 2: No stored token, must call getUser (with retries)
        console.log(`[API] ${method} ${path} → No stored token, getting user...`);

        let userAttempts = 0;
        const maxAttempts = 2;

        while (userAttempts < maxAttempts) {
            try {
                userAttempts++;
                const forceNew = userAttempts > 1;
                if (forceNew) {
                    console.log(`[API] ${method} ${path} → Resetting client...`);
                    resetClient();
                }
                const supabase = createClient(forceNew);
                const result = await getUserWithTimeout(supabase);

                if (result.data.user) {
                    currentUserId = result.data.user.id;
                    // Get session to extract token
                    const { data: sessionData } = await supabase.auth.getSession();
                    accessToken = sessionData.session?.access_token ?? null;
                    if (accessToken) {
                        console.log(`[API] ${method} ${path} → Got token from getUser`);
                    }
                }
                break; // Success
            } catch (err) {
                console.error(`[API] ${method} ${path} ✗ getUser attempt ${userAttempts}/${maxAttempts} failed:`, err);
                if (userAttempts >= maxAttempts) {
                    throw new Error("Failed to get session. Please refresh the page and try again.");
                }
                await new Promise(r => setTimeout(r, 200));
            }
        }
    }

    if (!accessToken) {
        console.error(`[API] ${method} ${path} ✗ No access token available`);
        throw new Error("Not authenticated. Please sign in and try again.");
    }

    console.log(`[API] ${method} ${path} → Using token, userId: ${currentUserId || '(decoded from token)'}`);

    const headers = new Headers(init.headers ?? {});
    headers.set("Authorization", `Bearer ${accessToken}`);

    // PRD 41: Include X-Acting-As header if currently acting as a proxy
    // Priority: explicit actingAs param > localStorage > none
    const activeProfileId = actingAs ?? (
        typeof window !== "undefined" ? localStorage.getItem(ACTIVE_PROFILE_KEY) : null
    );

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
