import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseFetchOptions<T> {
    /** Conditionally disable the fetch. Default: true */
    enabled?: boolean;
    /** Refetch when the component mounts. Default: true */
    refetchOnMount?: boolean;
    /** Auto-refresh interval in milliseconds. Default: disabled */
    refetchInterval?: number;
    /** Transform the response data before setting state */
    transform?: (data: any) => T;
}

export interface UseFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    /** Optimistic update or manual data set */
    mutate: (newData: T) => void;
}

interface FetchError {
    status: number;
    message: string;
    details?: unknown;
}

export function useFetch<T>(
    url: string,
    options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
    const {
        enabled = true,
        refetchOnMount = true,
        refetchInterval,
        transform,
    } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(enabled && refetchOnMount);
    const [error, setError] = useState<Error | null>(null);

    // Use refs to keep track of latest options to avoid unnecessary effect re-runs
    // but still use the latest values inside the fetch function.
    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const fetchData = useCallback(async () => {
        if (!enabled && !loading) return; // Don't fetch if disabled, unless triggered by manual refetch (which might set loading)

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(url, {
                credentials: 'include',
                // We can add more flexibility here if needed (headers, method, etc.)
                // For now, PRD implies simple GET requests primarily.
            });

            if (!response.ok) {
                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    if (errorData.message) errorMessage = errorData.message;
                    if (errorData.error) errorMessage = errorData.error;
                } catch {
                    // ignore json parse error on error response
                }

                throw new Error(errorMessage);
            }

            const json = await response.json();

            const resultingData = optionsRef.current.transform
                ? optionsRef.current.transform(json)
                : json;

            setData(resultingData);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            if (optionsRef.current.enabled !== false) {
                // Only unset loading if we were supposed to be fetching. 
                // If enabled switched to false mid-flight, we still finish this request.
            }
            setLoading(false);
        }
    }, [url, enabled]); // Re-create if url or enabled changes

    // Initial fetch effect
    useEffect(() => {
        if (enabled) {
            fetchData();
        }
    }, [fetchData, enabled]);

    // Interval effect
    useEffect(() => {
        if (!enabled || !refetchInterval) return;

        const intervalId = setInterval(fetchData, refetchInterval);
        return () => clearInterval(intervalId);
    }, [fetchData, enabled, refetchInterval]);

    const mutate = useCallback((newData: T) => {
        setData(newData);
    }, []);

    return {
        data,
        loading,
        error,
        refetch: fetchData,
        mutate,
    };
}

