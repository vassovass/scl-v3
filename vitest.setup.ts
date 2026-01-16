/**
 * Vitest Global Setup
 * 
 * Mocks Next.js modules and sets up testing environment for StepLeague.
 * Based on testing-patterns skill and Next.js App Router best practices.
 */

import '@testing-library/jest-dom/vitest';
import { vi, beforeAll, afterAll } from 'vitest';

// ============================================================================
// Mock: next/navigation
// ============================================================================
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
}));

// ============================================================================
// Mock: next/headers
// Required for server-side Supabase client instantiation
// ============================================================================
vi.mock('next/headers', () => ({
    cookies: () => ({
        get: vi.fn(),
        getAll: vi.fn(() => []),
        set: vi.fn(),
        delete: vi.fn(),
    }),
    headers: () => new Map(),
}));

// ============================================================================
// Mock: window.matchMedia (for theme detection)
// ============================================================================
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// ============================================================================
// Mock: ResizeObserver (for UI components)
// ============================================================================
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// ============================================================================
// Mock: IntersectionObserver (for lazy loading)
// ============================================================================
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// ============================================================================
// Suppress console noise in tests
// ============================================================================
beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
});

afterAll(() => {
    vi.restoreAllMocks();
});
