import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout } from '../fetchWithTimeout';
import { AppError, ErrorCode } from '../errors';

// Mock analytics (avoids side effects)
vi.mock('@/lib/analytics', () => ({
    analytics: {
        error: { occurred: vi.fn() },
        performance: { apiCall: vi.fn() },
    },
}));

describe('fetchWithTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('returns response on successful fetch within timeout', async () => {
        const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
        vi.mocked(fetch).mockResolvedValue(mockResponse);

        const promise = fetchWithTimeout('/api/test');
        const response = await promise;

        expect(response).toBe(mockResponse);
        expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
            signal: expect.any(AbortSignal),
        }));
    });

    it('throws AppError with TIMEOUT_ERROR after timeout', async () => {
        // Never-resolving fetch to simulate timeout
        vi.mocked(fetch).mockImplementation((_url, opts) => {
            return new Promise((_resolve, reject) => {
                (opts?.signal as AbortSignal)?.addEventListener('abort', () => {
                    reject(new DOMException('The operation was aborted', 'AbortError'));
                });
            });
        });

        const promise = fetchWithTimeout('/api/test', { timeout: 1000 });
        vi.advanceTimersByTime(1000);

        await expect(promise).rejects.toThrow(AppError);
        await expect(promise).rejects.toMatchObject({
            code: ErrorCode.TIMEOUT_ERROR,
        });
    });

    it('respects custom timeout', async () => {
        vi.mocked(fetch).mockImplementation((_url, opts) => {
            return new Promise((_resolve, reject) => {
                (opts?.signal as AbortSignal)?.addEventListener('abort', () => {
                    reject(new DOMException('The operation was aborted', 'AbortError'));
                });
            });
        });

        const promise = fetchWithTimeout('/api/test', { timeout: 5000 });

        // Should not abort at 4s
        vi.advanceTimersByTime(4000);
        // Fetch should still be pending

        // Should abort at 5s
        vi.advanceTimersByTime(1000);
        await expect(promise).rejects.toThrow(AppError);
    });

    it('propagates external signal abort without wrapping as AppError', async () => {
        const externalController = new AbortController();

        vi.mocked(fetch).mockImplementation((_url, opts) => {
            return new Promise((_resolve, reject) => {
                (opts?.signal as AbortSignal)?.addEventListener('abort', () => {
                    reject(new DOMException('The operation was aborted', 'AbortError'));
                });
            });
        });

        const promise = fetchWithTimeout('/api/test', { signal: externalController.signal });
        externalController.abort();

        // External abort should throw raw DOMException, not AppError
        await expect(promise).rejects.toThrow(DOMException);
        await expect(promise).rejects.not.toThrow(AppError);
    });

    it('wraps network errors as NETWORK_ERROR AppError', async () => {
        vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

        const promise = fetchWithTimeout('/api/test');
        await expect(promise).rejects.toThrow(AppError);
        await expect(promise).rejects.toMatchObject({
            code: ErrorCode.NETWORK_ERROR,
        });
    });

    it('passes through fetch options', async () => {
        vi.mocked(fetch).mockResolvedValue(new Response('ok'));

        await fetchWithTimeout('/api/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
        });

        expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
        }));
    });

    it('clears timeout on successful response', async () => {
        const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
        vi.mocked(fetch).mockResolvedValue(new Response('ok'));

        await fetchWithTimeout('/api/test');

        expect(clearSpy).toHaveBeenCalled();
    });
});
