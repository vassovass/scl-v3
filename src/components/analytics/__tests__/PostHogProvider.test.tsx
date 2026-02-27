import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock posthog-js BEFORE importing the component
vi.mock('posthog-js', () => ({
    default: {
        init: vi.fn(),
        __loaded: false,
        startSessionRecording: vi.fn(),
        opt_out_capturing: vi.fn(),
        opt_in_capturing: vi.fn(),
        identify: vi.fn(),
        reset: vi.fn(),
        capture: vi.fn(),
        isFeatureEnabled: vi.fn(() => false),
        getFeatureFlagPayload: vi.fn(() => null),
        get_session_id: vi.fn(() => null),
        get_distinct_id: vi.fn(() => null),
    },
}));

vi.mock('posthog-js/react', () => ({
    PostHogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import posthog from 'posthog-js';

describe('PostHogProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset loaded state
        (posthog as any).__loaded = false;
    });

    it('renders children when PostHog key is not set', async () => {
        // NEXT_PUBLIC_POSTHOG_KEY is undefined in test env
        const { PostHogProvider } = await import('../PostHogProvider');
        render(
            <PostHogProvider>
                <div data-testid="child">Content</div>
            </PostHogProvider>,
        );

        expect(screen.getByTestId('child')).toBeTruthy();
    });

    it('renders children even when posthog.init throws', async () => {
        vi.mocked(posthog.init).mockImplementation(() => {
            throw new Error('SDK init crashed');
        });

        // Force POSTHOG_KEY to exist by re-importing with env set
        const originalEnv = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test123';

        vi.resetModules();

        // Re-mock after resetModules
        vi.doMock('posthog-js', () => ({
            default: {
                ...posthog,
                init: vi.fn(() => { throw new Error('SDK init crashed'); }),
                __loaded: false,
                startSessionRecording: vi.fn(),
            },
        }));
        vi.doMock('posthog-js/react', () => ({
            PostHogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        }));

        const { PostHogProvider } = await import('../PostHogProvider');
        render(
            <PostHogProvider featureEnabled={true}>
                <div data-testid="child-after-crash">Still here</div>
            </PostHogProvider>,
        );

        expect(screen.getByTestId('child-after-crash')).toBeTruthy();

        process.env.NEXT_PUBLIC_POSTHOG_KEY = originalEnv;
    });
});

describe('PostHog helper functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (posthog as any).__loaded = false;
    });

    it('posthogCapture is a no-op when not initialized', async () => {
        const { posthogCapture } = await import('../PostHogProvider');
        // Should not throw
        posthogCapture('test_event', { prop: 'value' });
        expect(posthog.capture).not.toHaveBeenCalled();
    });

    it('posthogIdentify is a no-op when not initialized', async () => {
        const { posthogIdentify } = await import('../PostHogProvider');
        posthogIdentify('user-123', { name: 'Test' });
        expect(posthog.identify).not.toHaveBeenCalled();
    });

    it('posthogCapture fires when loaded', async () => {
        // Need fresh module references since earlier test called vi.resetModules()
        vi.resetModules();
        vi.doMock('posthog-js', () => ({
            default: {
                __loaded: true,
                capture: vi.fn(),
                identify: vi.fn(),
                reset: vi.fn(),
                isFeatureEnabled: vi.fn(() => false),
                getFeatureFlagPayload: vi.fn(() => null),
                get_session_id: vi.fn(() => null),
                get_distinct_id: vi.fn(() => null),
            },
        }));
        vi.doMock('posthog-js/react', () => ({
            PostHogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        }));

        const freshPosthog = (await import('posthog-js')).default;
        const { posthogCapture } = await import('../PostHogProvider');
        posthogCapture('clicked_button', { page: 'dashboard' });
        expect(freshPosthog.capture).toHaveBeenCalledWith('clicked_button', { page: 'dashboard' });
    });

    it('posthogFeatureFlag returns false when not loaded', async () => {
        const { posthogFeatureFlag } = await import('../PostHogProvider');
        expect(posthogFeatureFlag('test_flag')).toBe(false);
    });
});
