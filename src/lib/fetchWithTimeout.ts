import { AppError, ErrorCode, normalizeError, reportErrorClient } from '@/lib/errors';

export interface FetchWithTimeoutOptions extends RequestInit {
    /** Timeout in milliseconds. Default: 15000 (15s for SA mobile). */
    timeout?: number;
}

/**
 * Fetch with AbortController-based timeout.
 *
 * - Default 15s aligns with South African mobile (2G/3G) conditions
 * - Maps timeout to AppError with TIMEOUT_ERROR code
 * - Fires analytics error_occurred event on timeout
 * - Supports external AbortSignal for component unmount cleanup
 */
export async function fetchWithTimeout(
    url: string,
    options: FetchWithTimeoutOptions = {},
): Promise<Response> {
    const { timeout = 15000, signal: externalSignal, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Forward external signal (e.g., from component unmount)
    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
        }
    }

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof DOMException && error.name === 'AbortError') {
            // Check if abort came from external signal (component unmount) vs timeout
            if (externalSignal?.aborted) {
                throw error; // Let unmount aborts propagate silently
            }

            const appError = new AppError({
                code: ErrorCode.TIMEOUT_ERROR,
                message: `Request timed out after ${timeout}ms`,
                context: { url, timeout },
                recoverable: true,
            });

            reportErrorClient(appError);
            throw appError;
        }

        throw normalizeError(error, ErrorCode.NETWORK_ERROR);
    }
}
