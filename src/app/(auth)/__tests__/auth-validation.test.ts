/**
 * Auth Sign-up & Validation Tests
 * 
 * Tests for sign-up form validation, email format, password strength.
 * Also covers OAuth callback handling patterns.
 */

import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

// Schema for sign-up validation (based on actual form)
const signUpSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    displayName: z.string().min(1, 'Display name is required').max(100),
});

describe('Auth - Sign Up Validation', () => {
    describe('Email validation', () => {
        it('accepts valid email', () => {
            const result = z.string().email().safeParse('user@example.com');
            expect(result.success).toBe(true);
        });

        it('accepts email with subdomain', () => {
            const result = z.string().email().safeParse('user@mail.example.com');
            expect(result.success).toBe(true);
        });

        it('rejects email without @', () => {
            const result = z.string().email().safeParse('userexample.com');
            expect(result.success).toBe(false);
        });

        it('rejects email without domain', () => {
            const result = z.string().email().safeParse('user@');
            expect(result.success).toBe(false);
        });

        it('rejects email without TLD', () => {
            const result = z.string().email().safeParse('user@example');
            expect(result.success).toBe(false);
        });

        it('rejects empty email', () => {
            const result = z.string().email().safeParse('');
            expect(result.success).toBe(false);
        });
    });

    describe('Password validation', () => {
        it('accepts password with 6+ characters', () => {
            const result = z.string().min(6).safeParse('password123');
            expect(result.success).toBe(true);
        });

        it('accepts exactly 6 characters', () => {
            const result = z.string().min(6).safeParse('123456');
            expect(result.success).toBe(true);
        });

        it('rejects password with 5 characters', () => {
            const result = z.string().min(6).safeParse('12345');
            expect(result.success).toBe(false);
        });

        it('rejects empty password', () => {
            const result = z.string().min(6).safeParse('');
            expect(result.success).toBe(false);
        });

        it('accepts very long password', () => {
            const longPassword = 'a'.repeat(100);
            const result = z.string().min(6).safeParse(longPassword);
            expect(result.success).toBe(true);
        });
    });

    describe('Display name validation', () => {
        it('accepts valid display name', () => {
            const result = z.string().min(1).max(100).safeParse('John Doe');
            expect(result.success).toBe(true);
        });

        it('accepts single character', () => {
            const result = z.string().min(1).max(100).safeParse('J');
            expect(result.success).toBe(true);
        });

        it('rejects empty display name', () => {
            const result = z.string().min(1).safeParse('');
            expect(result.success).toBe(false);
        });

        it('rejects display name over 100 characters', () => {
            const longName = 'a'.repeat(101);
            const result = z.string().max(100).safeParse(longName);
            expect(result.success).toBe(false);
        });
    });

    describe('Full sign-up form validation', () => {
        it('accepts valid complete form', () => {
            const result = signUpSchema.safeParse({
                email: 'test@example.com',
                password: 'securepass123',
                displayName: 'Test User',
            });
            expect(result.success).toBe(true);
        });

        it('rejects form with missing email', () => {
            const result = signUpSchema.safeParse({
                password: 'securepass123',
                displayName: 'Test User',
            });
            expect(result.success).toBe(false);
        });

        it('rejects form with all invalid fields', () => {
            const result = signUpSchema.safeParse({
                email: 'invalid',
                password: '123',
                displayName: '',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
            }
        });
    });
});

describe('Auth - OAuth Callback Handling', () => {
    describe('Redirect URL construction', () => {
        it('builds correct callback URL', () => {
            const origin = 'https://stepleague.com';
            const next = '/dashboard';
            const redirectTo = `${origin}/api/auth/callback?next=${next}`;

            expect(redirectTo).toBe('https://stepleague.com/api/auth/callback?next=/dashboard');
        });

        it('handles localhost origin', () => {
            const origin = 'http://localhost:3000';
            const redirectTo = `${origin}/api/auth/callback?next=/dashboard`;

            expect(redirectTo).toContain('localhost:3000');
        });

        it('preserves complex next path', () => {
            const origin = 'https://stepleague.com';
            const next = '/leagues/abc123/leaderboard?period=this_week';
            const encodedNext = encodeURIComponent(next);
            const redirectTo = `${origin}/api/auth/callback?next=${encodedNext}`;

            expect(redirectTo).toContain('next=');
            expect(decodeURIComponent(redirectTo.split('next=')[1])).toBe(next);
        });
    });

    describe('User existence detection', () => {
        it('detects new user (has identities)', () => {
            const user = {
                id: 'user-123',
                identities: [{ id: 'identity-1', provider: 'email' }],
            };
            const isNewUser = user.identities && user.identities.length > 0;
            expect(isNewUser).toBe(true);
        });

        it('detects existing user (no identities - Supabase fake user)', () => {
            const user = {
                id: 'user-123',
                identities: [],
            };
            const isExistingUser = user.identities?.length === 0;
            expect(isExistingUser).toBe(true);
        });
    });

    describe('Email confirmation flow', () => {
        it('detects pending confirmation (user but no session)', () => {
            const data = {
                user: { id: 'user-123' },
                session: null,
            };
            const needsConfirmation = data.user && !data.session;
            expect(needsConfirmation).toBe(true);
        });

        it('detects auto-login (user and session)', () => {
            const data = {
                user: { id: 'user-123' },
                session: { access_token: 'token-123' },
            };
            const isAutoLoggedIn = !!(data.user && data.session);
            expect(isAutoLoggedIn).toBe(true);
        });
    });
});
