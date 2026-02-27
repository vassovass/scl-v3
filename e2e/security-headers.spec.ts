import { test, expect } from '@playwright/test';

/**
 * Security Headers E2E Tests (PRD 62)
 *
 * Verifies that all OWASP baseline security headers are present
 * on page and API responses from the production site.
 */

test.describe('Security Headers', () => {

    test('homepage response includes all 6 security headers', async ({ request }) => {
        const response = await request.get('/');

        // X-Frame-Options
        expect(response.headers()['x-frame-options']).toBe('DENY');

        // X-Content-Type-Options
        expect(response.headers()['x-content-type-options']).toBe('nosniff');

        // Referrer-Policy
        expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');

        // Permissions-Policy
        const pp = response.headers()['permissions-policy'];
        expect(pp).toContain('camera=()');
        expect(pp).toContain('microphone=()');

        // Strict-Transport-Security
        const hsts = response.headers()['strict-transport-security'];
        expect(hsts).toContain('max-age=31536000');

        // Content-Security-Policy
        const csp = response.headers()['content-security-policy'];
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain('*.supabase.co');
    });

    test('CSP contains frame-ancestors none', async ({ request }) => {
        const response = await request.get('/');
        const csp = response.headers()['content-security-policy'];
        expect(csp).toContain("frame-ancestors 'none'");
    });

    test('security headers present on sign-in page', async ({ request }) => {
        const response = await request.get('/sign-in');
        expect(response.headers()['x-frame-options']).toBe('DENY');
        expect(response.headers()['x-content-type-options']).toBe('nosniff');
        expect(response.headers()['content-security-policy']).toBeDefined();
    });
});
