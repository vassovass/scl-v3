/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, AuthProvider } from '../AuthProvider';
import type { Session } from '@supabase/supabase-js';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
  resetClient: vi.fn(),
}));

// Mock analytics
vi.mock('@/lib/analytics', () => ({
  analytics: {
    track: vi.fn(),
  },
  identifyUser: vi.fn(),
  clearUser: vi.fn(),
}));

// Mock session cache
vi.mock('@/lib/auth/sessionCache', () => ({
  setCachedSession: vi.fn(),
  clearCachedSession: vi.fn(),
}));

// Chainable Supabase query mock — supports deep chains like .select().eq().eq().is().eq().order()
// singleValue: returned by .single() (profile fetch)
// awaitValue: returned when chain is awaited without .single() (proxy list fetch)
function createChainableMock(
  singleValue: { data: any; error: any } = { data: null, error: null },
  awaitValue?: { data: any; error: any },
) {
  const listResult = awaitValue ?? { data: [], error: null };
  const mock: any = {};
  const chainMethods = ['select', 'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like',
    'ilike', 'is', 'in', 'contains', 'order', 'limit', 'range'];

  for (const m of chainMethods) mock[m] = vi.fn().mockReturnValue(mock);
  mock.single = vi.fn().mockResolvedValue(singleValue);
  mock.maybeSingle = vi.fn().mockResolvedValue(singleValue);
  // When awaited directly (without .single()), resolve with list result
  mock.then = vi.fn().mockImplementation((resolve: any) => resolve(listResult));
  return mock;
}

// Mock clearAllAppState
vi.mock('@/lib/utils/clearAppState', () => ({
  clearAllAppState: vi.fn().mockResolvedValue(undefined),
}));

describe('AuthProvider - Cookie Parsing', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Clear document.cookie
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  });

  it('should parse initial session from cookie on mount', () => {
    // Set up a valid session cookie
    const mockSession: Session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    };

    // Set cookie (simulating what Supabase SSR would do)
    const cookieName = 'sb-test-auth-token';
    const cookieValue = encodeURIComponent(JSON.stringify(mockSession));
    document.cookie = `${cookieName}=${cookieValue}; path=/`;

    // Mock environment variable
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');

    // Mock onAuthStateChange to return a subscription
    const mockUnsubscribe = vi.fn();
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: mockUnsubscribe },
      },
    });

    // Render the hook
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    // ✅ EXPECTED: Session should be initialized from cookie immediately
    expect(result.current.session).toBeDefined();
    expect(result.current.session?.user.id).toBe('test-user-id');
    expect(result.current.session?.access_token).toBe('test-access-token');
  });

  it('should handle missing cookie gracefully', () => {
    // Don't set any cookie

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');

    const mockUnsubscribe = vi.fn();
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: mockUnsubscribe },
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    // ✅ EXPECTED: Session should be null (no error)
    expect(result.current.session).toBeNull();
  });

  it('should handle malformed cookie gracefully', () => {
    // Set invalid JSON in cookie
    const cookieName = 'sb-test-auth-token';
    document.cookie = `${cookieName}=invalid-json-data; path=/`;

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');

    const mockUnsubscribe = vi.fn();
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: mockUnsubscribe },
      },
    });

    // Should not throw error
    expect(() => {
      renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      });
    }).not.toThrow();
  });
});

describe('AuthProvider - Sign Out State', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  it('should set isSigningOut to true immediately on signOut', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');

    const mockUnsubscribe = vi.fn();
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: mockUnsubscribe },
      },
    });

    mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    // ✅ EXPECTED: isSigningOut should be false initially
    expect(result.current.isSigningOut).toBe(false);

    // Call signOut
    act(() => {
      result.current.signOut();
    });

    // ✅ EXPECTED: isSigningOut should be true immediately
    // (before async operations complete)
    await waitFor(() => {
      expect(result.current.isSigningOut).toBe(true);
    });

    // ✅ EXPECTED: Session should be cleared immediately
    await waitFor(() => {
      expect(result.current.session).toBeNull();
    });
  });

  it('should use window.location.href for hard redirect on signOut', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');

    const mockUnsubscribe = vi.fn();
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: mockUnsubscribe },
      },
    });

    mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    // Call signOut
    await act(async () => {
      await result.current.signOut('/sign-in?test=true');
    });

    // ✅ EXPECTED: window.location.href should be set (hard redirect)
    await waitFor(() => {
      expect(window.location.href).toBe('/sign-in?test=true');
    });
  });
});

describe('AuthProvider - Session Expiry Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should clear session if token is expired in INITIAL_SESSION', async () => {
    // Create an expired session
    const expiredSession: Session = {
      access_token: 'expired-token',
      refresh_token: 'test-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    };

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');

    // Mock onAuthStateChange to fire INITIAL_SESSION with expired session
    const mockCallback = vi.fn();
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      mockCallback.mockImplementation(callback);

      // Simulate INITIAL_SESSION event with expired session
      setTimeout(() => {
        callback('INITIAL_SESSION', expiredSession);
      }, 0);

      return {
        data: {
          subscription: { unsubscribe: vi.fn() },
        },
      };
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    // Wait for INITIAL_SESSION to be processed
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // ✅ EXPECTED: Session should be cleared (expired token rejected)
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('should accept session if token is not expired', async () => {
    // Create a valid (not expired) session
    const validSession: Session = {
      access_token: 'valid-token',
      refresh_token: 'test-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    };

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');

    // Mock onAuthStateChange
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      setTimeout(() => {
        callback('INITIAL_SESSION', validSession);
      }, 0);

      return {
        data: {
          subscription: { unsubscribe: vi.fn() },
        },
      };
    });

    // Mock from().select()...chain for profile fetch + refreshProxies
    mockSupabaseClient.from.mockReturnValue(
      createChainableMock({
        data: {
          id: 'test-user-id',
          display_name: 'Test User',
          is_superadmin: false,
          is_proxy: false,
        },
        error: null,
      })
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    // Wait for INITIAL_SESSION to be processed
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });

    // ✅ EXPECTED: Session should be accepted (valid token)
    expect(result.current.session).toBeDefined();
    expect(result.current.session?.user.id).toBe('test-user-id');
    expect(result.current.user).toBeDefined();
  });
});

// ============================================================================
// PRD 61: Auth Failure Resilience Tests
// ============================================================================

describe('AuthProvider - Auth Failure Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves loading when onAuthStateChange fires an error event', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');

    // Simulate onAuthStateChange calling back with no session (error scenario)
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      // Fire INITIAL_SESSION with null session (auth error)
      setTimeout(() => {
        callback('INITIAL_SESSION', null);
      }, 0);

      return {
        data: {
          subscription: { unsubscribe: vi.fn() },
        },
      };
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    // Wait for loading to resolve
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // ✅ EXPECTED: No crash, session is null, no user
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('handles blocked localStorage gracefully during auth init', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');

    // Block localStorage (mimicking Safari private browsing / in-app browser)
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('The operation is insecure', 'SecurityError');
    });

    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      setTimeout(() => callback('INITIAL_SESSION', null), 0);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Should not crash even though localStorage is blocked
    expect(() => {
      renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      });
    }).not.toThrow();

    spy.mockRestore();
  });
});
