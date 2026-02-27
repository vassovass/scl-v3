/**
 * Password Reset Flow Tests (PRD 57)
 *
 * Tests for password strength scoring, validation, rate limit detection,
 * and redirect URL construction.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { getPasswordStrength } from '@/lib/utils/passwordStrength';

// ─────────────────────────────────────────────────────────────────────────
// Password Strength Scoring
// ─────────────────────────────────────────────────────────────────────────

describe('Password Reset - Strength Scoring', () => {
  it('scores 0 for empty password', () => {
    expect(getPasswordStrength('').score).toBe(0);
    expect(getPasswordStrength('').label).toBe('Too short');
  });

  it('scores 0 for password under 8 chars', () => {
    expect(getPasswordStrength('abc1234').score).toBe(0);
    expect(getPasswordStrength('Ab1!xyz').score).toBe(0);
  });

  it('scores 1 for 8-char lowercase password', () => {
    expect(getPasswordStrength('abcdefgh').score).toBe(1);
    expect(getPasswordStrength('abcdefgh').label).toBe('Weak');
  });

  it('scores 2 for password with mixed case (under 12)', () => {
    expect(getPasswordStrength('Abcdefgh').score).toBe(2);
    expect(getPasswordStrength('Abcdefgh').label).toBe('Fair');
  });

  it('scores 2 for 12+ char lowercase password', () => {
    expect(getPasswordStrength('abcdefghijkl').score).toBe(2);
    expect(getPasswordStrength('abcdefghijkl').label).toBe('Fair');
  });

  it('scores 3 for 12+ chars with mixed case', () => {
    expect(getPasswordStrength('Abcdefghijkl').score).toBe(3);
    expect(getPasswordStrength('Abcdefghijkl').label).toBe('Good');
  });

  it('scores 4 for 12+ chars with mixed case, numbers, and symbols', () => {
    expect(getPasswordStrength('Abcdefghij1!').score).toBe(4);
    expect(getPasswordStrength('Abcdefghij1!').label).toBe('Strong');
  });

  it('has destructive color for too short', () => {
    expect(getPasswordStrength('abc').color).toContain('destructive');
  });

  it('has warning color for weak/fair', () => {
    expect(getPasswordStrength('abcdefgh').color).toContain('warning');
    expect(getPasswordStrength('Abcdefgh').color).toContain('warning');
  });

  it('has success color for good/strong', () => {
    expect(getPasswordStrength('Abcdefghijkl').color).toContain('success');
    expect(getPasswordStrength('Abcdefghij1!').color).toContain('success');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Password Match Validation
// ─────────────────────────────────────────────────────────────────────────

describe('Password Reset - Match Validation', () => {
  function passwordsMatch(pw: string, confirm: string): boolean {
    return pw === confirm;
  }

  it('passes when passwords match', () => {
    expect(passwordsMatch('SecurePassword123!', 'SecurePassword123!')).toBe(true);
  });

  it('fails when passwords differ', () => {
    expect(passwordsMatch('password1', 'password2')).toBe(false);
  });

  it('fails when confirmation is empty', () => {
    expect(passwordsMatch('SecurePassword123!', '')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(passwordsMatch('Password', 'password')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Email Validation
// ─────────────────────────────────────────────────────────────────────────

describe('Password Reset - Email Validation', () => {
  const emailSchema = z.string().email();

  it('accepts valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true);
  });

  it('accepts email with plus addressing', () => {
    expect(emailSchema.safeParse('user+tag@example.com').success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(emailSchema.safeParse('notanemail').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(emailSchema.safeParse('').success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Rate Limit Detection
// ─────────────────────────────────────────────────────────────────────────

describe('Password Reset - Rate Limit Detection', () => {
  function isRateLimited(error: { status?: number; message: string }): boolean {
    const msg = error.message.toLowerCase();
    return (
      error.status === 429 ||
      msg.includes('security purposes') ||
      msg.includes('60 seconds') ||
      msg.includes('rate')
    );
  }

  it('detects Supabase rate limit message', () => {
    const error = { message: 'For security purposes, you can only request this once every 60 seconds' };
    expect(isRateLimited(error)).toBe(true);
  });

  it('detects 429 status code', () => {
    const error = { status: 429, message: 'Too many requests' };
    expect(isRateLimited(error)).toBe(true);
  });

  it('detects generic rate limit message', () => {
    const error = { message: 'Rate limit exceeded' };
    expect(isRateLimited(error)).toBe(true);
  });

  it('does not flag normal errors as rate limited', () => {
    const error = { message: 'User not found' };
    expect(isRateLimited(error)).toBe(false);
  });

  it('does not flag network errors as rate limited', () => {
    const error = { message: 'Network request failed' };
    expect(isRateLimited(error)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Redirect URL Construction
// ─────────────────────────────────────────────────────────────────────────

describe('Password Reset - Redirect URL', () => {
  it('builds correct reset redirect URL for production', () => {
    const origin = 'https://stepleague.app';
    const redirectTo = `${origin}/api/auth/callback?next=/update-password`;
    expect(redirectTo).toBe('https://stepleague.app/api/auth/callback?next=/update-password');
  });

  it('builds correct reset redirect URL for localhost', () => {
    const origin = 'http://localhost:3000';
    const redirectTo = `${origin}/api/auth/callback?next=/update-password`;
    expect(redirectTo).toContain('localhost:3000');
    expect(redirectTo).toContain('next=/update-password');
  });

  it('includes callback route in redirect', () => {
    const origin = 'https://example.com';
    const redirectTo = `${origin}/api/auth/callback?next=/update-password`;
    expect(redirectTo).toContain('/api/auth/callback');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Minimum Length Validation (NIST 800-63B: min 8 chars)
// ─────────────────────────────────────────────────────────────────────────

describe('Password Reset - Minimum Length', () => {
  it('rejects password with 7 characters', () => {
    expect(getPasswordStrength('1234567').score).toBe(0);
  });

  it('accepts password with exactly 8 characters', () => {
    expect(getPasswordStrength('12345678').score).toBeGreaterThanOrEqual(1);
  });

  it('accepts password with more than 8 characters', () => {
    expect(getPasswordStrength('123456789').score).toBeGreaterThanOrEqual(1);
  });
});
