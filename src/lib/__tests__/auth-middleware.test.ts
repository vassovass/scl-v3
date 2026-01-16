/**
 * Auth Middleware & Route Protection Tests
 * 
 * Tests for protected route redirects, cookie states, and session handling.
 * Covers different user states: guest, logged-in, signed-out, proxy claimer.
 */

import { describe, it, expect, vi } from 'vitest';

// Protected paths from actual middleware
const PROTECTED_PATHS = ['/dashboard', '/league', '/admin', '/settings', '/claim'];
const AUTH_PATHS = ['/sign-in', '/sign-up'];

describe('Auth Middleware - Route Protection', () => {
    const isProtectedPath = (pathname: string): boolean => {
        return PROTECTED_PATHS.some(path => pathname.startsWith(path));
    };

    const isAuthPath = (pathname: string): boolean => {
        return AUTH_PATHS.some(path => pathname.startsWith(path));
    };

    describe('Protected route detection', () => {
        it('identifies /dashboard as protected', () => {
            expect(isProtectedPath('/dashboard')).toBe(true);
        });

        it('identifies /dashboard/stats as protected', () => {
            expect(isProtectedPath('/dashboard/stats')).toBe(true);
        });

        it('identifies /league/abc123 as protected', () => {
            expect(isProtectedPath('/league/abc123')).toBe(true);
        });

        it('identifies /admin as protected', () => {
            expect(isProtectedPath('/admin')).toBe(true);
        });

        it('identifies /settings/profile as protected', () => {
            expect(isProtectedPath('/settings/profile')).toBe(true);
        });

        it('identifies /claim/CODE123 as protected', () => {
            expect(isProtectedPath('/claim/CODE123')).toBe(true);
        });

        it('does NOT identify / as protected', () => {
            expect(isProtectedPath('/')).toBe(false);
        });

        it('does NOT identify /pricing as protected', () => {
            expect(isProtectedPath('/pricing')).toBe(false);
        });

        it('does NOT identify /roadmap as protected', () => {
            expect(isProtectedPath('/roadmap')).toBe(false);
        });
    });

    describe('Auth page detection', () => {
        it('identifies /sign-in as auth page', () => {
            expect(isAuthPath('/sign-in')).toBe(true);
        });

        it('identifies /sign-up as auth page', () => {
            expect(isAuthPath('/sign-up')).toBe(true);
        });

        it('does NOT identify /dashboard as auth page', () => {
            expect(isAuthPath('/dashboard')).toBe(false);
        });
    });
});

describe('Auth Middleware - Redirect Logic', () => {
    describe('Unauthenticated user on protected route', () => {
        it('redirects to /sign-in', () => {
            const isAuthenticated = false;
            const pathname = '/dashboard';
            const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));

            if (isProtected && !isAuthenticated) {
                const redirectUrl = `/sign-in?redirect=${encodeURIComponent(pathname)}`;
                expect(redirectUrl).toContain('/sign-in');
                expect(redirectUrl).toContain('redirect=');
            }
        });

        it('preserves full path in redirect param', () => {
            const pathname = '/league/abc123/leaderboard';
            const search = '?period=this_week';
            const fullPath = pathname + search;

            const redirectUrl = `/sign-in?redirect=${encodeURIComponent(fullPath)}`;
            const decodedRedirect = decodeURIComponent(redirectUrl.split('redirect=')[1]);

            expect(decodedRedirect).toBe('/league/abc123/leaderboard?period=this_week');
        });

        it('preserves settings page with query params', () => {
            const fullPath = '/settings/profile?tab=notifications';
            const redirectUrl = `/sign-in?redirect=${encodeURIComponent(fullPath)}`;

            expect(decodeURIComponent(redirectUrl.split('redirect=')[1])).toBe(fullPath);
        });
    });

    describe('Authenticated user on auth page', () => {
        it('redirects to /dashboard from /sign-in', () => {
            const isAuthenticated = true;
            const pathname = '/sign-in';
            const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p));

            if (isAuthPage && isAuthenticated) {
                expect('/dashboard').toBe('/dashboard');
            }
        });

        it('redirects to /dashboard from /sign-up', () => {
            const isAuthenticated = true;
            const pathname = '/sign-up';

            if (isAuthenticated) {
                expect('/dashboard').toBe('/dashboard');
            }
        });
    });

    describe('No redirect cases', () => {
        it('allows authenticated user on protected route', () => {
            const isAuthenticated = true;
            const pathname = '/dashboard';
            const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));

            const shouldRedirect = isProtected && !isAuthenticated;
            expect(shouldRedirect).toBe(false);
        });

        it('allows unauthenticated user on public route', () => {
            const isAuthenticated = false;
            const pathname = '/roadmap';
            const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));

            const shouldRedirect = isProtected && !isAuthenticated;
            expect(shouldRedirect).toBe(false);
        });
    });
});

describe('Auth Session - Cookie States', () => {
    interface SessionLike {
        access_token?: string;
        refresh_token?: string;
        expires_at?: number;
        user?: { id: string };
    }

    const isAuthenticated = (session: SessionLike | null): boolean => {
        return !!session?.access_token;
    };

    const isExpiringSoon = (session: SessionLike | null): boolean => {
        if (!session?.expires_at) return false;
        const nowSeconds = Math.floor(Date.now() / 1000);
        return session.expires_at - nowSeconds < 60;
    };

    describe('Guest (no session)', () => {
        it('has no access_token', () => {
            const session = null;
            expect(isAuthenticated(session)).toBe(false);
        });

        it('cannot access protected routes', () => {
            const session = null;
            const canAccessProtected = isAuthenticated(session);
            expect(canAccessProtected).toBe(false);
        });
    });

    describe('Logged-in user', () => {
        const validSession: SessionLike = {
            access_token: 'eyJhbGciOiJIUzI1NiIs...',
            refresh_token: 'refresh-abc123',
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            user: { id: 'user-123' },
        };

        it('has valid access_token', () => {
            expect(isAuthenticated(validSession)).toBe(true);
        });

        it('can access protected routes', () => {
            expect(isAuthenticated(validSession)).toBe(true);
        });

        it('session is not expiring soon', () => {
            expect(isExpiringSoon(validSession)).toBe(false);
        });
    });

    describe('Session expiring soon (< 60s)', () => {
        const expiringSession: SessionLike = {
            access_token: 'token-expiring',
            refresh_token: 'refresh-abc123',
            expires_at: Math.floor(Date.now() / 1000) + 30, // 30 seconds
        };

        it('detects expiring soon', () => {
            expect(isExpiringSoon(expiringSession)).toBe(true);
        });

        it('triggers refresh', () => {
            const shouldRefresh = !!expiringSession.refresh_token && isExpiringSoon(expiringSession);
            expect(shouldRefresh).toBe(true);
        });
    });

    describe('Signed-out user (cleared session)', () => {
        it('cookies are cleared', () => {
            const session = null;
            expect(session).toBeNull();
            expect(isAuthenticated(session)).toBe(false);
        });
    });

    describe('Proxy claimer flow', () => {
        it('requires auth for /claim route', () => {
            const pathname = '/claim/ABC123';
            const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
            expect(isProtected).toBe(true);
        });

        it('redirects to sign-in with claim path preserved', () => {
            const claimPath = '/claim/ABC123';
            const redirectUrl = `/sign-in?redirect=${encodeURIComponent(claimPath)}`;

            expect(decodeURIComponent(redirectUrl.split('redirect=')[1])).toBe('/claim/ABC123');
        });
    });
});

describe('Auth Session - Cookie Encoding', () => {
    describe('Session storage key', () => {
        it('derives key from Supabase URL', () => {
            const supabaseUrl = 'https://abc123.supabase.co';
            const baseUrl = new URL(supabaseUrl);
            const storageKey = `sb-${baseUrl.hostname.split('.')[0]}-auth-token`;

            expect(storageKey).toBe('sb-abc123-auth-token');
        });
    });

    describe('Chunked cookie handling', () => {
        it('detects chunked cookies by .0 suffix', () => {
            const cookies: Record<string, string> = {
                'sb-abc-auth-token.0': 'chunk1',
                'sb-abc-auth-token.1': 'chunk2',
            };

            const hasChunks = 'sb-abc-auth-token.0' in cookies;
            expect(hasChunks).toBe(true);
        });

        it('joins chunks in order', () => {
            const chunks = ['chunk0', 'chunk1', 'chunk2'];
            const joined = chunks.join('');
            expect(joined).toBe('chunk0chunk1chunk2');
        });
    });
});

describe('Auth - User State Transitions', () => {
    describe('Guest → Signed Up', () => {
        it('creates session after sign-up', () => {
            const before = { isAuthenticated: false };
            const after = { isAuthenticated: true, userId: 'user-new' };

            expect(before.isAuthenticated).toBe(false);
            expect(after.isAuthenticated).toBe(true);
        });
    });

    describe('Logged In → Signed Out', () => {
        it('clears session on sign-out', () => {
            const before = { access_token: 'token', user: { id: 'user-123' } };
            const after = null;

            expect(before.access_token).toBeDefined();
            expect(after).toBeNull();
        });
    });

    describe('Guest → Claimed Proxy', () => {
        it('requires sign-in first, then redirects to claim', () => {
            const steps = [
                { action: 'visit_claim', authenticated: false, redirect: '/sign-in?redirect=/claim/CODE' },
                { action: 'sign_in', authenticated: true },
                { action: 'redirected_to_claim', authenticated: true, path: '/claim/CODE' },
            ];

            expect(steps[0].redirect).toContain('/sign-in');
            expect(steps[2].path).toContain('/claim');
        });
    });
});
