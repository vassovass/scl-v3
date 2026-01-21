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

    // Mock from().select() for profile fetch
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'test-user-id',
              display_name: 'Test User',
              is_superadmin: false,
              is_proxy: false,
            },
            error: null,
          }),
        }),
      }),
    });

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
