/**
 * Supabase Client Mock Factory
 * 
 * Provides mock implementations for Supabase client, auth, and database operations.
 * Based on testing-patterns skill and StepLeague auth patterns.
 * 
 * @example
 * import { createMockSupabaseClient, mockUser, mockSession } from '@/__mocks__/supabase';
 * 
 * vi.mock('@/lib/supabase/client', () => ({
 *   createClient: () => createMockSupabaseClient(),
 * }));
 */

import { vi, type Mock } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Creates a mock Supabase User
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-123',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    ...overrides,
});

/**
 * Creates a mock Supabase Session
 */
export const createMockSession = (overrides: Partial<Session> = {}): Session => ({
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: createMockUser(),
    ...overrides,
});

/**
 * Creates a mock ActiveProfile (for proxy testing)
 */
export const createMockProfile = (overrides: Partial<{
    id: string;
    display_name: string;
    is_proxy: boolean;
    managed_by: string | null;
    is_superadmin: boolean;
}> = {}) => ({
    id: 'user-123',
    display_name: 'Test User',
    is_proxy: false,
    managed_by: null,
    is_superadmin: false,
    ...overrides,
});

/**
 * Creates a mock proxy profile
 */
export const createMockProxy = (overrides: Partial<{
    id: string;
    display_name: string;
    is_proxy: boolean;
    managed_by: string;
    invite_code: string;
    claims_remaining: number;
}> = {}) => ({
    id: 'proxy-456',
    display_name: 'Proxy User',
    is_proxy: true,
    managed_by: 'user-123',
    invite_code: 'CLAIM123',
    claims_remaining: 1,
    created_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
    ...overrides,
});

// ============================================================================
// Mock Query Builder
// ============================================================================

type QueryResult<T = unknown> = { data: T | null; error: null } | { data: null; error: { message: string; code: string } };

/**
 * Creates a chainable query builder mock
 */
export const createMockQueryBuilder = <T = unknown>(defaultData: T | null = null) => {
    const builder: Record<string, Mock> = {};

    // Store the result that will be returned
    let result: QueryResult<T> = { data: defaultData, error: null };

    // All chainable methods return the builder
    const chainable = ['select', 'insert', 'update', 'delete', 'upsert',
        'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike',
        'is', 'in', 'contains', 'containedBy', 'range', 'textSearch',
        'or', 'not', 'filter', 'match', 'order', 'limit', 'offset',
        'maybeSingle', 'single', 'csv', 'geojson', 'explain',
        'rollback', 'returns', 'count', 'head'];

    chainable.forEach(method => {
        builder[method] = vi.fn(() => builder);
    });

    // Terminal methods return promises
    builder.single = vi.fn(() => Promise.resolve(result));
    builder.maybeSingle = vi.fn(() => Promise.resolve(result));
    builder.then = vi.fn((resolve) => Promise.resolve(result).then(resolve));

    // Helper to set mock data for this query
    (builder as any).mockResolvedData = (data: T) => {
        result = { data, error: null };
        return builder;
    };

    (builder as any).mockError = (message: string, code = 'PGRST116') => {
        result = { data: null, error: { message, code } };
        return builder;
    };

    return builder;
};

// ============================================================================
// Mock Supabase Client
// ============================================================================

export interface MockSupabaseClient {
    from: Mock;
    auth: {
        getUser: Mock;
        getSession: Mock;
        signOut: Mock;
        signInWithPassword: Mock;
        signUp: Mock;
        onAuthStateChange: Mock;
    };
    storage: {
        from: Mock;
    };
}

/**
 * Creates a complete Supabase client mock
 * 
 * @example
 * const mockClient = createMockSupabaseClient();
 * mockClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
 */
export const createMockSupabaseClient = (): MockSupabaseClient => ({
    from: vi.fn((table: string) => createMockQueryBuilder()),
    auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        onAuthStateChange: vi.fn((callback) => ({
            data: {
                subscription: {
                    unsubscribe: vi.fn(),
                },
            },
        })),
    },
    storage: {
        from: vi.fn(() => ({
            upload: vi.fn().mockResolvedValue({ data: { path: 'mock/path' }, error: null }),
            download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
            getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://mock.url/file.png' } })),
            remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
});

// ============================================================================
// Default Exports
// ============================================================================

export const mockUser = createMockUser();
export const mockSession = createMockSession();
export const mockProfile = createMockProfile();
export const mockProxy = createMockProxy();

