import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFetchWithTimeout } from '../useFetchWithTimeout';

// Mock fetchWithTimeout
vi.mock('@/lib/fetchWithTimeout', () => ({
    fetchWithTimeout: vi.fn(),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
    analytics: {
        error: { occurred: vi.fn() },
        performance: { apiCall: vi.fn() },
    },
}));

// Mock errors module
vi.mock('@/lib/errors', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/errors')>();
    return {
        ...actual,
        reportErrorClient: vi.fn(),
    };
});

import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { AppError, ErrorCode } from '@/lib/errors';

describe('useFetchWithTimeout', () => {
    beforeEach(() => {
        vi.mocked(fetchWithTimeout).mockReset();
    });

    it('fetches data on mount when URL is provided', async () => {
        vi.mocked(fetchWithTimeout).mockResolvedValue(
            new Response(JSON.stringify({ result: 'ok' }), { status: 200 }),
        );

        const { result } = renderHook(() => useFetchWithTimeout('/api/test'));

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.data).toEqual({ result: 'ok' });
        expect(result.current.error).toBeNull();
    });

    it('does not fetch when URL is null', () => {
        const { result } = renderHook(() => useFetchWithTimeout(null));

        expect(result.current.loading).toBe(false);
        expect(result.current.data).toBeNull();
        expect(fetchWithTimeout).not.toHaveBeenCalled();
    });

    it('does not fetch when enabled is false', () => {
        const { result } = renderHook(() =>
            useFetchWithTimeout('/api/test', { enabled: false }),
        );

        expect(result.current.loading).toBe(false);
        expect(fetchWithTimeout).not.toHaveBeenCalled();
    });

    it('sets isTimeout on TIMEOUT_ERROR', async () => {
        vi.mocked(fetchWithTimeout).mockRejectedValue(
            new AppError({
                code: ErrorCode.TIMEOUT_ERROR,
                message: 'Request timed out',
                recoverable: true,
            }),
        );

        const { result } = renderHook(() => useFetchWithTimeout('/api/test'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.isTimeout).toBe(true);
        expect(result.current.error?.code).toBe(ErrorCode.TIMEOUT_ERROR);
    });

    it('retry re-fires the fetch', async () => {
        let callCount = 0;
        vi.mocked(fetchWithTimeout).mockImplementation(async () => {
            callCount++;
            if (callCount === 1) {
                throw new AppError({
                    code: ErrorCode.TIMEOUT_ERROR,
                    message: 'Request timed out',
                    recoverable: true,
                });
            }
            return new Response(JSON.stringify({ retried: true }));
        });

        const { result } = renderHook(() => useFetchWithTimeout('/api/test'));

        // Wait for first (failing) fetch
        await waitFor(() => {
            expect(result.current.isTimeout).toBe(true);
        });

        // Retry
        await act(async () => {
            await result.current.retry();
        });

        expect(result.current.data).toEqual({ retried: true });
        expect(result.current.isTimeout).toBe(false);
    });

    it('sets error on non-ok response', async () => {
        vi.mocked(fetchWithTimeout).mockResolvedValue(
            new Response(null, { status: 500, statusText: 'Internal Server Error' }),
        );

        const { result } = renderHook(() => useFetchWithTimeout('/api/test'));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBeTruthy();
        expect(result.current.data).toBeNull();
    });
});
