'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWithTimeout, type FetchWithTimeoutOptions } from '@/lib/fetchWithTimeout';
import { normalizeError, type AppError, ErrorCode } from '@/lib/errors';

export interface UseFetchWithTimeoutOptions extends Omit<FetchWithTimeoutOptions, 'signal'> {
    /** Delay before showing "slow request" feedback. Default: 5000ms. */
    slowThreshold?: number;
    /** Auto-fetch on mount. Default: true. */
    enabled?: boolean;
}

export interface UseFetchWithTimeoutResult<T> {
    data: T | null;
    loading: boolean;
    error: AppError | null;
    /** True when request exceeds slowThreshold (still loading). */
    isSlow: boolean;
    /** True when request timed out. */
    isTimeout: boolean;
    /** Retry the request. */
    retry: () => Promise<void>;
}

export function useFetchWithTimeout<T = unknown>(
    url: string | null,
    options: UseFetchWithTimeoutOptions = {},
): UseFetchWithTimeoutResult<T> {
    const { slowThreshold = 5000, timeout = 15000, enabled = true, ...fetchOptions } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AppError | null>(null);
    const [isSlow, setIsSlow] = useState(false);
    const [isTimeout, setIsTimeout] = useState(false);

    const abortRef = useRef<AbortController | null>(null);
    const slowTimerRef = useRef<ReturnType<typeof setTimeout>>();

    const doFetch = useCallback(async () => {
        if (!url) return;

        // Abort previous request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        setIsSlow(false);
        setIsTimeout(false);

        // Start slow detection timer
        slowTimerRef.current = setTimeout(() => setIsSlow(true), slowThreshold);

        try {
            const response = await fetchWithTimeout(url, {
                ...fetchOptions,
                timeout,
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const json = await response.json();
            setData(json);
        } catch (err: unknown) {
            // Ignore unmount aborts
            if (err instanceof DOMException && err.name === 'AbortError') return;

            const appError = normalizeError(err);
            setError(appError);
            if (appError.code === ErrorCode.TIMEOUT_ERROR) {
                setIsTimeout(true);
            }
        } finally {
            clearTimeout(slowTimerRef.current);
            setLoading(false);
            setIsSlow(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, timeout, slowThreshold, enabled]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortRef.current?.abort();
            clearTimeout(slowTimerRef.current);
        };
    }, []);

    // Auto-fetch on URL change
    useEffect(() => {
        if (url && enabled) doFetch();
    }, [url, enabled, doFetch]);

    return { data, loading, error, isSlow, isTimeout, retry: doFetch };
}
