/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavHeader } from '../NavHeader';
import type { Session } from '@supabase/supabase-js';

// Mock useAuth hook
const mockUseAuth = vi.fn();

vi.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock other components
vi.mock('../ShadcnMenuRenderer', () => ({
  ShadcnMenuRenderer: () => <div data-testid="menu-renderer" />,
}));

vi.mock('../MobileMenu', () => ({
  MobileMenu: () => <div data-testid="mobile-menu" />,
}));

vi.mock('@/components/mode-toggle', () => ({
  ModeToggle: () => <div data-testid="mode-toggle" />,
}));

vi.mock('@/components/ui/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

vi.mock('@/components/pwa/InstallPrompt', () => ({
  InstallPrompt: () => null,
}));

vi.mock('@/components/ui/Logo', () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

vi.mock('@/components/auth/ProfileSwitcher', () => ({
  ProfileSwitcher: () => null,
}));

vi.mock('@/hooks/useMenuConfig', () => ({
  useMenuConfig: () => ({
    menus: {
      public: {
        items: [
          { id: '1', label: 'Home', href: '/' },
          { id: '2', label: 'About', href: '/about' },
        ],
      },
    },
    locations: {
      public_header: {
        showSignIn: true,
        showMobileMenu: true,
      },
    },
  }),
}));

describe('NavHeader - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading skeleton when loading=true and session=null', () => {
    // Mock auth state: loading
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      userProfile: null,
      isSigningOut: false,
    });

    render(<NavHeader />);

    // ✅ EXPECTED: Loading skeleton should be visible
    const skeleton = screen.queryByRole('status') || document.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();

    // ✅ EXPECTED: "Sign in" button should NOT be visible
    const signInButton = screen.queryByText('Sign in');
    expect(signInButton).toBeNull();

    console.log('[Test] ✅ Loading skeleton shown, Sign in button hidden');
  });

  it('should show "Sign in" button when loading=false and session=null', () => {
    // Mock auth state: not loading, no session (signed out)
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signOut: vi.fn(),
      userProfile: null,
      isSigningOut: false,
    });

    render(<NavHeader />);

    // ✅ EXPECTED: "Sign in" button should be visible
    const signInButton = screen.getByText('Sign in');
    expect(signInButton).toBeInTheDocument();

    // ✅ EXPECTED: Loading skeleton should NOT be visible
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeNull();

    console.log('[Test] ✅ Sign in button shown after loading completes');
  });

  it('should NOT show "Sign in" button when session exists (authenticated)', () => {
    // Mock auth state: authenticated
    const mockSession: Session = {
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    };

    mockUseAuth.mockReturnValue({
      user: mockSession.user,
      session: mockSession,
      loading: false,
      signOut: vi.fn(),
      userProfile: {
        id: 'user-123',
        display_name: 'Test User',
        is_superadmin: false,
        is_proxy: false,
      },
      isSigningOut: false,
    });

    render(<NavHeader />);

    // ✅ EXPECTED: "Sign in" button should NOT be visible
    const signInButton = screen.queryByText('Sign in');
    expect(signInButton).toBeNull();

    console.log('[Test] ✅ Sign in button hidden when authenticated');
  });

  it('should NOT show "Sign in" button flash during auth initialization', () => {
    // Start with loading state
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      userProfile: null,
      isSigningOut: false,
    });

    const { rerender } = render(<NavHeader />);

    // ✅ EXPECTED: "Sign in" should not be visible during loading
    let signInButton = screen.queryByText('Sign in');
    expect(signInButton).toBeNull();

    // Simulate session loading (user is authenticated)
    const mockSession: Session = {
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    };

    mockUseAuth.mockReturnValue({
      user: mockSession.user,
      session: mockSession,
      loading: false,
      signOut: vi.fn(),
      userProfile: {
        id: 'user-123',
        display_name: 'Test User',
        is_superadmin: false,
        is_proxy: false,
      },
      isSigningOut: false,
    });

    rerender(<NavHeader />);

    // ✅ EXPECTED: "Sign in" should STILL not be visible (user is authenticated)
    signInButton = screen.queryByText('Sign in');
    expect(signInButton).toBeNull();

    console.log('[Test] ✅ No "Sign in" flash during auth init for authenticated user');
  });

  it('should show loading skeleton then "Sign in" for unauthenticated user', () => {
    // Start with loading state
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signOut: vi.fn(),
      userProfile: null,
      isSigningOut: false,
    });

    const { rerender } = render(<NavHeader />);

    // ✅ EXPECTED: Loading skeleton visible
    let skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();

    // Simulate auth init complete (no session - unauthenticated)
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signOut: vi.fn(),
      userProfile: null,
      isSigningOut: false,
    });

    rerender(<NavHeader />);

    // ✅ EXPECTED: "Sign in" button now visible
    const signInButton = screen.getByText('Sign in');
    expect(signInButton).toBeInTheDocument();

    // ✅ EXPECTED: Loading skeleton gone
    skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeNull();

    console.log('[Test] ✅ Smooth transition from loading to "Sign in" for unauthenticated user');
  });
});

describe('NavHeader - Sign Out State', () => {
  it('should handle isSigningOut state (future enhancement)', () => {
    // Mock auth state: signing out
    mockUseAuth.mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signOut: vi.fn(),
      userProfile: null,
      isSigningOut: true,
    });

    render(<NavHeader />);

    // Note: Current implementation doesn't use isSigningOut in NavHeader
    // This test documents the expected behavior for future enhancement

    // The NavHeader could show a loading state during sign-out
    // to prevent flashing authenticated menu during transition

    console.log('[Test] isSigningOut state available for future enhancement');
  });
});
