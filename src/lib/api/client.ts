"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Make an authenticated API request to our backend.
 * Automatically includes the user's auth token.
 */
export async function apiRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();

    const headers = new Headers(init.headers ?? {});
    if (data.session?.access_token) {
        headers.set("Authorization", `Bearer ${data.session.access_token}`);
    }

    const isFormData = init.body instanceof FormData;
    if (!headers.has("Content-Type") && !isFormData) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(normalizePath(path), {
        ...init,
        headers,
        credentials: "include",
    });

    const payload = await safeJson(response);
    if (!response.ok) {
        throw new ApiError(response.status, payload);
    }

    return payload as T;
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
