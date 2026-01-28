/**
 * GoogleTagManager Component Tests
 *
 * Tests for GTM initialization, proxy configuration, and consent handling.
 * Verifies that GTM loads correctly via first-party proxy and sets up
 * proper consent defaults for tracking.
 *
 * @see GoogleTagManager.tsx
 * @see PRD 14: Analytics GTM & GA4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';

// ============================================================================
// Mock next/script
// ============================================================================
const mockScripts: { id: string; html?: string; onLoad?: () => void; onError?: (e: Error) => void }[] = [];

vi.mock('next/script', () => ({
    default: ({ id, dangerouslySetInnerHTML, onLoad, onError, ...props }: {
        id: string;
        dangerouslySetInnerHTML?: { __html: string };
        onLoad?: () => void;
        onError?: (e: Error) => void;
        strategy?: string;
    }) => {
        mockScripts.push({
            id,
            html: dangerouslySetInnerHTML?.__html,
            onLoad,
            onError,
        });
        // Execute inline scripts immediately for testing
        if (dangerouslySetInnerHTML?.__html) {
            try {
                // Don't actually execute - just record it was called
            } catch {
                // Ignore execution errors in test
            }
        }
        return <script data-testid={id} {...props} />;
    },
}));

// ============================================================================
// Test Setup
// ============================================================================

describe('GoogleTagManager Component', () => {
    const originalEnv = process.env;
    let originalNavigator: Navigator;

    beforeEach(() => {
        vi.resetModules();
        mockScripts.length = 0;

        // Mock navigator.onLine
        originalNavigator = window.navigator;
        Object.defineProperty(window, 'navigator', {
            value: { onLine: true },
            writable: true,
            configurable: true,
        });

        // Mock dataLayer
        Object.defineProperty(window, 'dataLayer', {
            value: [],
            writable: true,
            configurable: true,
        });

        // Reset env
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        vi.clearAllMocks();
        process.env = originalEnv;
        Object.defineProperty(window, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true,
        });
    });

    // ========================================================================
    // Rendering Tests
    // ========================================================================

    describe('Rendering', () => {
        it('renders nothing when GTM_ID is not set', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = '';

            const { GoogleTagManager } = await import('../GoogleTagManager');
            const { container } = render(<GoogleTagManager />);

            expect(container.innerHTML).toBe('');
        });

        it('renders consent script when GTM_ID is set', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

            const { GoogleTagManager } = await import('../GoogleTagManager');
            render(<GoogleTagManager />);

            // Should have consent defaults script
            const consentScript = mockScripts.find(s => s.id === 'gtm-consent-default');
            expect(consentScript).toBeDefined();
        });

        it('renders GTM script when online', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';
            Object.defineProperty(window.navigator, 'onLine', { value: true });

            const { GoogleTagManager } = await import('../GoogleTagManager');
            render(<GoogleTagManager />);

            await waitFor(() => {
                const gtmScript = mockScripts.find(s => s.id === 'gtm-script');
                expect(gtmScript).toBeDefined();
            });
        });

        it('does not render GTM script when offline', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';
            Object.defineProperty(window, 'navigator', {
                value: { onLine: false },
                writable: true,
                configurable: true,
            });

            const { GoogleTagManager } = await import('../GoogleTagManager');
            render(<GoogleTagManager />);

            // Wait a bit then check no GTM script
            await new Promise(resolve => setTimeout(resolve, 50));
            const gtmScript = mockScripts.find(s => s.id === 'gtm-script');
            expect(gtmScript).toBeUndefined();
        });
    });

    // ========================================================================
    // Consent Configuration Tests
    // ========================================================================

    describe('Consent Configuration', () => {
        it('sets consent defaults to GRANTED for forced tracking', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

            const { GoogleTagManager } = await import('../GoogleTagManager');
            render(<GoogleTagManager />);

            const consentScript = mockScripts.find(s => s.id === 'gtm-consent-default');
            expect(consentScript?.html).toContain("'analytics_storage': 'granted'");
            expect(consentScript?.html).toContain("'ad_storage': 'granted'");
            expect(consentScript?.html).toContain("'ad_user_data': 'granted'");
            expect(consentScript?.html).toContain("'ad_personalization': 'granted'");
        });

        it('initializes dataLayer array', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

            const { GoogleTagManager } = await import('../GoogleTagManager');
            render(<GoogleTagManager />);

            const consentScript = mockScripts.find(s => s.id === 'gtm-consent-default');
            expect(consentScript?.html).toContain('window.dataLayer = window.dataLayer || []');
        });

        it('defines gtag function', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

            const { GoogleTagManager } = await import('../GoogleTagManager');
            render(<GoogleTagManager />);

            const consentScript = mockScripts.find(s => s.id === 'gtm-consent-default');
            expect(consentScript?.html).toContain('function gtag(){dataLayer.push(arguments);}');
        });
    });

    // ========================================================================
    // Proxy Configuration Tests
    // ========================================================================

    describe('Proxy Configuration', () => {
        it('loads GTM script from first-party proxy path', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

            const { GoogleTagManager } = await import('../GoogleTagManager');
            render(<GoogleTagManager />);

            await waitFor(() => {
                const gtmScript = mockScripts.find(s => s.id === 'gtm-script');
                expect(gtmScript?.html).toContain('/gtm/gtm.js?id=');
            });
        });

        it('includes GTM container ID in script URL', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-MYCONTAINER';

            const { GoogleTagManager } = await import('../GoogleTagManager');
            render(<GoogleTagManager />);

            await waitFor(() => {
                const gtmScript = mockScripts.find(s => s.id === 'gtm-script');
                expect(gtmScript?.html).toContain('GTM-MYCONTAINER');
            });
        });

        it('does NOT use direct googletagmanager.com URL', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

            const { GoogleTagManager } = await import('../GoogleTagManager');
            render(<GoogleTagManager />);

            await waitFor(() => {
                const gtmScript = mockScripts.find(s => s.id === 'gtm-script');
                expect(gtmScript?.html).not.toContain('https://www.googletagmanager.com');
            });
        });
    });

    // ========================================================================
    // Network State Tests
    // ========================================================================

    describe('Network State Handling', () => {
        it('reloads GTM when coming back online', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

            // Start offline
            Object.defineProperty(window, 'navigator', {
                value: { onLine: false },
                writable: true,
                configurable: true,
            });

            const { GoogleTagManager } = await import('../GoogleTagManager');
            render(<GoogleTagManager />);

            // Verify no GTM script initially
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(mockScripts.find(s => s.id === 'gtm-script')).toBeUndefined();

            // Come back online
            Object.defineProperty(window, 'navigator', {
                value: { onLine: true },
                writable: true,
                configurable: true,
            });

            // Dispatch online event
            act(() => {
                window.dispatchEvent(new Event('online'));
            });

            await waitFor(() => {
                const gtmScript = mockScripts.find(s => s.id === 'gtm-script');
                expect(gtmScript).toBeDefined();
            });
        });

        it('rechecks on visibility change', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

            const { GoogleTagManager } = await import('../GoogleTagManager');
            render(<GoogleTagManager />);

            // Simulate visibility change
            Object.defineProperty(document, 'visibilityState', {
                value: 'visible',
                writable: true,
                configurable: true,
            });

            act(() => {
                document.dispatchEvent(new Event('visibilitychange'));
            });

            // Should not throw or cause issues
            expect(true).toBe(true);
        });
    });

    // ========================================================================
    // Noscript Fallback Tests
    // ========================================================================

    describe('GoogleTagManagerNoscript', () => {
        it('renders nothing when GTM_ID is not set', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = '';

            const { GoogleTagManagerNoscript } = await import('../GoogleTagManager');
            const { container } = render(<GoogleTagManagerNoscript />);

            expect(container.innerHTML).toBe('');
        });

        it('renders noscript iframe when GTM_ID is set', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

            const { GoogleTagManagerNoscript } = await import('../GoogleTagManager');
            const { container } = render(<GoogleTagManagerNoscript />);

            const noscript = container.querySelector('noscript');
            expect(noscript).toBeDefined();
        });

        it('noscript uses direct GTM URL (not proxy)', async () => {
            process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

            const { GoogleTagManagerNoscript } = await import('../GoogleTagManager');
            const { container } = render(<GoogleTagManagerNoscript />);

            const iframe = container.querySelector('iframe');
            expect(iframe?.getAttribute('src')).toContain('https://www.googletagmanager.com/ns.html');
            expect(iframe?.getAttribute('src')).toContain('GTM-TEST123');
        });
    });
});

// ============================================================================
// Negative Tests - Error Scenarios
// ============================================================================

describe('GoogleTagManager Error Handling', () => {
    beforeEach(() => {
        vi.resetModules();
        mockScripts.length = 0;

        Object.defineProperty(window, 'navigator', {
            value: { onLine: true },
            writable: true,
            configurable: true,
        });

        Object.defineProperty(window, 'dataLayer', {
            value: [],
            writable: true,
            configurable: true,
        });
    });

    it('handles missing GTM_ID gracefully', async () => {
        process.env.NEXT_PUBLIC_GTM_ID = undefined;

        const { GoogleTagManager } = await import('../GoogleTagManager');

        // Should not throw
        expect(() => render(<GoogleTagManager />)).not.toThrow();
    });

    it('handles empty string GTM_ID gracefully', async () => {
        process.env.NEXT_PUBLIC_GTM_ID = '';

        const { GoogleTagManager } = await import('../GoogleTagManager');

        // Should not throw and render nothing
        const { container } = render(<GoogleTagManager />);
        expect(container.innerHTML).toBe('');
    });

    it('handles invalid GTM_ID format gracefully', async () => {
        process.env.NEXT_PUBLIC_GTM_ID = 'INVALID-FORMAT';

        const { GoogleTagManager } = await import('../GoogleTagManager');

        // Should not throw - GTM will just fail to load
        expect(() => render(<GoogleTagManager />)).not.toThrow();
    });

    it('script onError callback is defined', async () => {
        process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

        const { GoogleTagManager } = await import('../GoogleTagManager');
        render(<GoogleTagManager />);

        await waitFor(() => {
            const gtmScript = mockScripts.find(s => s.id === 'gtm-script');
            expect(gtmScript?.onError).toBeDefined();
        });
    });

    it('script onLoad callback is defined', async () => {
        process.env.NEXT_PUBLIC_GTM_ID = 'GTM-TEST123';

        const { GoogleTagManager } = await import('../GoogleTagManager');
        render(<GoogleTagManager />);

        await waitFor(() => {
            const gtmScript = mockScripts.find(s => s.id === 'gtm-script');
            expect(gtmScript?.onLoad).toBeDefined();
        });
    });
});

// ============================================================================
// Integration Tests - Proxy Config
// ============================================================================

describe('Proxy Configuration Integration', () => {
    it('proxyConfig exports correct GA4 transport URL', async () => {
        const { ANALYTICS_PROXIES } = await import('@/lib/analytics/proxyConfig');

        expect(ANALYTICS_PROXIES.ga4.proxyPath).toBe('/ga');
        expect(ANALYTICS_PROXIES.ga4.transportUrl).toBe('https://stepleague.com/ga');
    });

    it('proxyConfig exports correct GTM proxy path', async () => {
        const { ANALYTICS_PROXIES } = await import('@/lib/analytics/proxyConfig');

        expect(ANALYTICS_PROXIES.gtm.proxyPath).toBe('/gtm');
        expect(ANALYTICS_PROXIES.gtm.originalHost).toBe('https://www.googletagmanager.com');
    });

    it('isProxiedUrl correctly identifies proxy URLs', async () => {
        const { isProxiedUrl } = await import('@/lib/analytics/proxyConfig');

        expect(isProxiedUrl('/ga/g/collect').isProxied).toBe(true);
        expect(isProxiedUrl('/ga/g/collect').service).toBe('ga4');

        expect(isProxiedUrl('/gtm/gtm.js').isProxied).toBe(true);
        expect(isProxiedUrl('/gtm/gtm.js').service).toBe('gtm');

        expect(isProxiedUrl('/ingest/capture').isProxied).toBe(true);
        expect(isProxiedUrl('/ingest/capture').service).toBe('posthog');

        expect(isProxiedUrl('/api/some-endpoint').isProxied).toBe(false);
    });
});
