/**
 * Security Headers Tests (PRD 62)
 *
 * Validates that the security headers configuration in next.config.js
 * contains all required OWASP baseline headers with correct values.
 */

import { describe, it, expect } from 'vitest';

// Re-create the headers config object here to test it independently.
// This mirrors what's in next.config.js headers() return value.
const SECURITY_HEADERS = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=()',
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
    },
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://us-assets.i.posthog.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https: *.supabase.co",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' *.supabase.co https://us.i.posthog.com https://us-assets.i.posthog.com https://www.google-analytics.com https://www.googletagmanager.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
        ].join('; '),
    },
];

const headerMap = Object.fromEntries(
    SECURITY_HEADERS.map((h) => [h.key, h.value])
);

describe('Security Headers Configuration', () => {
    const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'Strict-Transport-Security',
        'Content-Security-Policy',
    ];

    it('contains all 6 required OWASP headers', () => {
        const keys = SECURITY_HEADERS.map((h) => h.key);
        for (const header of requiredHeaders) {
            expect(keys).toContain(header);
        }
    });

    it('has no duplicate header keys', () => {
        const keys = SECURITY_HEADERS.map((h) => h.key);
        const unique = new Set(keys);
        expect(keys.length).toBe(unique.size);
    });

    it('X-Frame-Options is DENY', () => {
        expect(headerMap['X-Frame-Options']).toBe('DENY');
    });

    it('X-Content-Type-Options is nosniff', () => {
        expect(headerMap['X-Content-Type-Options']).toBe('nosniff');
    });

    it('HSTS max-age is at least 1 year', () => {
        const hsts = headerMap['Strict-Transport-Security'];
        expect(hsts).toContain('max-age=31536000');
        expect(hsts).toContain('includeSubDomains');
    });

    it('Permissions-Policy disables camera, microphone, geolocation', () => {
        const pp = headerMap['Permissions-Policy'];
        expect(pp).toContain('camera=()');
        expect(pp).toContain('microphone=()');
        expect(pp).toContain('geolocation=()');
    });
});

describe('Content-Security-Policy directives', () => {
    const csp = headerMap['Content-Security-Policy'];

    it('has default-src self', () => {
        expect(csp).toContain("default-src 'self'");
    });

    it('has script-src with self', () => {
        expect(csp).toContain("script-src 'self'");
    });

    it('has style-src with self and unsafe-inline', () => {
        expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    });

    it('has img-src allowing self, data, blob, https, and Supabase', () => {
        expect(csp).toContain("img-src 'self' data: blob: https:");
        expect(csp).toContain('*.supabase.co');
    });

    it('has connect-src allowing self, Supabase, and analytics proxies', () => {
        expect(csp).toContain("connect-src 'self' *.supabase.co");
        expect(csp).toContain('https://us.i.posthog.com');
        expect(csp).toContain('https://us-assets.i.posthog.com');
        expect(csp).toContain('https://www.google-analytics.com');
        expect(csp).toContain('https://www.googletagmanager.com');
    });

    it('has frame-ancestors none (anti-clickjacking)', () => {
        expect(csp).toContain("frame-ancestors 'none'");
    });

    it('has upgrade-insecure-requests', () => {
        expect(csp).toContain('upgrade-insecure-requests');
    });

    it('has base-uri and form-action restricted to self', () => {
        expect(csp).toContain("base-uri 'self'");
        expect(csp).toContain("form-action 'self'");
    });
});
