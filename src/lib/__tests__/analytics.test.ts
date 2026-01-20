/**
 * Analytics Tracking Tests
 * 
 * Tests for the dual-tracking system (GA4 via dataLayer + PostHog SDK).
 * Verifies that events are properly pushed to both tracking systems.
 * 
 * @see analytics.ts
 * @see PostHogProvider.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Mock PostHog SDK
// ============================================================================
const mockPosthogCapture = vi.fn();
const mockPosthogIdentify = vi.fn();
const mockPosthogReset = vi.fn();

vi.mock('@/components/analytics/PostHogProvider', () => ({
    posthogCapture: (...args: unknown[]) => mockPosthogCapture(...args),
    posthogIdentify: (...args: unknown[]) => mockPosthogIdentify(...args),
    posthogReset: (...args: unknown[]) => mockPosthogReset(...args),
}));

// Import AFTER mocks are set up
import {
    trackEvent,
    identifyUser,
    clearUser,
    analytics,
    trackInteraction,
    trackComponentView,
} from '../analytics';

// ============================================================================
// Test Setup
// ============================================================================

describe('Analytics Tracking System', () => {
    let dataLayerPushes: Record<string, unknown>[];

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Mock dataLayer
        dataLayerPushes = [];
        Object.defineProperty(window, 'dataLayer', {
            value: {
                push: (event: Record<string, unknown>) => {
                    dataLayerPushes.push(event);
                },
            },
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ========================================================================
    // Core trackEvent Function
    // ========================================================================

    describe('trackEvent()', () => {
        it('pushes event to dataLayer', () => {
            trackEvent('test_event', { category: 'test' });

            expect(dataLayerPushes).toHaveLength(1);
            expect(dataLayerPushes[0]).toMatchObject({
                event: 'test_event',
                category: 'test',
            });
        });

        it('pushes event to PostHog', () => {
            trackEvent('test_event', { category: 'test' });

            expect(mockPosthogCapture).toHaveBeenCalledTimes(1);
            expect(mockPosthogCapture).toHaveBeenCalledWith(
                'test_event',
                expect.objectContaining({ category: 'test' })
            );
        });

        it('includes event_timestamp in dataLayer push', () => {
            trackEvent('test_event');

            expect(dataLayerPushes[0]).toHaveProperty('event_timestamp');
            expect(typeof dataLayerPushes[0].event_timestamp).toBe('string');
        });

        it('filters out null and undefined params', () => {
            trackEvent('test_event', {
                valid: 'value',
                nullParam: null,
                undefinedParam: undefined,
                category: 'test',
            });

            expect(mockPosthogCapture).toHaveBeenCalledWith(
                'test_event',
                expect.objectContaining({ valid: 'value', category: 'test' })
            );
            // Should not contain null/undefined values
            const calledParams = mockPosthogCapture.mock.calls[0][1];
            expect(calledParams).not.toHaveProperty('nullParam');
            expect(calledParams).not.toHaveProperty('undefinedParam');
        });

        it('handles events with no params', () => {
            trackEvent('simple_event');

            expect(dataLayerPushes).toHaveLength(1);
            expect(dataLayerPushes[0].event).toBe('simple_event');
            expect(mockPosthogCapture).toHaveBeenCalledWith('simple_event', {});
        });
    });

    // ========================================================================
    // User Identification
    // ========================================================================

    describe('identifyUser()', () => {
        it('pushes user_identified event to dataLayer', () => {
            identifyUser('user-123', { display_name: 'Test User' });

            expect(dataLayerPushes).toHaveLength(1);
            expect(dataLayerPushes[0]).toMatchObject({
                event: 'user_identified',
                user_id: 'user-123',
                display_name: 'Test User',
            });
        });

        it('calls posthogIdentify with userId and traits', () => {
            identifyUser('user-123', { display_name: 'Test User', is_premium: true });

            expect(mockPosthogIdentify).toHaveBeenCalledTimes(1);
            expect(mockPosthogIdentify).toHaveBeenCalledWith(
                'user-123',
                { display_name: 'Test User', is_premium: true }
            );
        });

        it('works without traits', () => {
            identifyUser('user-456');

            expect(dataLayerPushes[0].user_id).toBe('user-456');
            expect(mockPosthogIdentify).toHaveBeenCalledWith('user-456', undefined);
        });
    });

    describe('clearUser()', () => {
        it('pushes user_logged_out event to dataLayer', () => {
            clearUser();

            expect(dataLayerPushes).toHaveLength(1);
            expect(dataLayerPushes[0]).toMatchObject({
                event: 'user_logged_out',
                user_id: null,
            });
        });

        it('calls posthogReset', () => {
            clearUser();

            expect(mockPosthogReset).toHaveBeenCalledTimes(1);
        });
    });

    // ========================================================================
    // Analytics Object - Conversion Events (Tier 1)
    // ========================================================================

    describe('analytics.signUp()', () => {
        it('tracks sign_up event with method', () => {
            analytics.signUp('google');

            expect(dataLayerPushes[0].event).toBe('sign_up');
            expect(dataLayerPushes[0].method).toBe('google');
            expect(mockPosthogCapture).toHaveBeenCalledWith(
                'sign_up',
                expect.objectContaining({ method: 'google', category: 'conversion' })
            );
        });

        it('tracks email signup', () => {
            analytics.signUp('email');
            expect(dataLayerPushes[0].method).toBe('email');
        });
    });

    describe('analytics.login()', () => {
        it('tracks login event with method', () => {
            analytics.login('google');

            expect(dataLayerPushes[0].event).toBe('login');
            expect(dataLayerPushes[0].method).toBe('google');
        });
    });

    describe('analytics.logout()', () => {
        it('tracks logout event and clears user', () => {
            analytics.logout();

            // Should have logout event
            const logoutEvent = dataLayerPushes.find(e => e.event === 'logout');
            expect(logoutEvent).toBeDefined();

            // Should also clear user (user_logged_out event)
            const loggedOutEvent = dataLayerPushes.find(e => e.event === 'user_logged_out');
            expect(loggedOutEvent).toBeDefined();

            // PostHog should be reset
            expect(mockPosthogReset).toHaveBeenCalled();
        });
    });

    describe('analytics.leagueCreated()', () => {
        it('tracks league_created with league details', () => {
            analytics.leagueCreated('league-123', 'My League');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'league_created',
                league_id: 'league-123',
                league_name: 'My League',
                category: 'conversion',
            });
        });
    });

    describe('analytics.leagueJoined()', () => {
        it('tracks league_joined with method', () => {
            analytics.leagueJoined('league-456', 'invite');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'league_joined',
                league_id: 'league-456',
                method: 'invite',
            });
        });
    });

    describe('analytics.stepsSubmitted()', () => {
        it('tracks steps_submitted with step count and league', () => {
            analytics.stepsSubmitted(10000, 'league-789');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'steps_submitted',
                step_count: 10000,
                league_id: 'league-789',
            });
        });

        it('works without league_id', () => {
            analytics.stepsSubmitted(5000);

            expect(dataLayerPushes[0].step_count).toBe(5000);
            // league_id should be filtered out if undefined
        });
    });

    // ========================================================================
    // Proxy Events
    // ========================================================================

    describe('analytics.proxyClaimed()', () => {
        it('tracks proxy_claimed with all details', () => {
            analytics.proxyClaimed('proxy-123', 5, 2);

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'proxy_claimed',
                proxy_id: 'proxy-123',
                submission_count: 5,
                league_count: 2,
                category: 'conversion',
                action: 'claim',
            });
        });

        it('sends to PostHog', () => {
            analytics.proxyClaimed('proxy-456', 10, 3);

            expect(mockPosthogCapture).toHaveBeenCalledWith(
                'proxy_claimed',
                expect.objectContaining({
                    proxy_id: 'proxy-456',
                    submission_count: 10,
                    league_count: 3,
                })
            );
        });
    });

    describe('analytics.highFiveSent()', () => {
        it('tracks high_five_sent when sending', () => {
            analytics.highFiveSent('user-456', true);

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'high_five_sent',
                recipient_id: 'user-456',
                action: 'send',
                category: 'engagement',
            });
        });

        it('tracks high_five_sent when removing', () => {
            analytics.highFiveSent('user-789', false);

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'high_five_sent',
                recipient_id: 'user-789',
                action: 'remove',
            });
        });

        it('sends to PostHog', () => {
            analytics.highFiveSent('user-123', true);

            expect(mockPosthogCapture).toHaveBeenCalledWith(
                'high_five_sent',
                expect.objectContaining({
                    recipient_id: 'user-123',
                    action: 'send',
                })
            );
        });
    });


    describe('analytics.share()', () => {
        it('tracks share event with content type and method', () => {
            analytics.share('league', 'league-123', 'whatsapp');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'share',
                content_type: 'league',
                item_id: 'league-123',
                method: 'whatsapp',
            });
        });
    });

    // ========================================================================
    // Component Tracking
    // ========================================================================

    describe('trackComponentView()', () => {
        it('tracks component visibility', () => {
            trackComponentView('Leaderboard', 'league-page');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'component_viewed',
                component: 'Leaderboard',
                context: 'league-page',
            });
        });
    });

    describe('trackInteraction()', () => {
        it('tracks component interactions', () => {
            trackInteraction('LeaderboardCard', 'click', 'card-1', 'view-details');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'component_interaction',
                component: 'LeaderboardCard',
                action: 'click',
                element_id: 'card-1',
            });
        });
    });

    // ========================================================================
    // Leaderboard Tracking
    // ========================================================================

    describe('analytics.leaderboard', () => {
        it('tracks leaderboard viewed', () => {
            analytics.leaderboard.viewed('league-123', 'weekly');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'leaderboard_viewed',
                league_id: 'league-123',
                period: 'weekly',
            });
        });

        it('tracks period change', () => {
            analytics.leaderboard.periodChanged('league-123', 'daily');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'leaderboard_period_changed',
                period: 'daily',
            });
        });
    });

    // ========================================================================
    // Feedback Tracking
    // ========================================================================

    describe('analytics.feedbackSubmitted()', () => {
        it('tracks feedback submission with type', () => {
            analytics.feedbackSubmitted('bug');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'feedback_submitted',
                feedback_type: 'bug',
                category: 'feedback',
            });
        });
    });

    // ========================================================================
    // AI Feature Tracking
    // ========================================================================

    describe('analytics.ai', () => {
        it('tracks AI verification started', () => {
            analytics.ai.verificationStarted(1024, 'league-123');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'ai_verification_started',
                image_size_bytes: 1024,
                league_id: 'league-123',
            });
        });

        it('tracks AI verification completed', () => {
            analytics.ai.verificationCompleted('approved', 0.95, 1500, 'league-123');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'ai_verification_completed',
                result: 'approved',
                confidence_score: 0.95,
                duration_ms: 1500,
            });
        });

        it('tracks AI verification failed', () => {
            analytics.ai.verificationFailed('timeout', 'league-123');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'ai_verification_failed',
                error_type: 'timeout',
            });
        });
    });

    // ========================================================================
    // Filter & Settings Tracking
    // ========================================================================

    describe('analytics.filters', () => {
        it('tracks filter applied', () => {
            analytics.filters.applied('period', 'weekly', 'leaderboard');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'filter_applied',
                filter_type: 'period',
                filter_value: 'weekly',
                location: 'leaderboard',
            });
        });

        it('tracks filters cleared', () => {
            analytics.filters.cleared('leaderboard');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'filters_cleared',
                location: 'leaderboard',
            });
        });
    });

    describe('analytics.settings', () => {
        it('tracks settings opened', () => {
            analytics.settings.opened('profile');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'settings_opened',
                section: 'profile',
            });
        });

        it('tracks setting changed', () => {
            analytics.settings.changed('theme', 'light', 'dark');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'setting_changed',
                setting_name: 'theme',
                old_value: 'light',
                new_value: 'dark',
            });
        });
    });

    // ========================================================================
    // Performance & Error Tracking
    // ========================================================================

    describe('analytics.performance', () => {
        it('tracks page load performance', () => {
            analytics.performance.pageLoaded('dashboard', 1234);

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'page_performance',
                page_name: 'dashboard',
                load_time_ms: 1234,
            });
        });

        it('tracks API call performance', () => {
            analytics.performance.apiCall('/api/leaderboard', 250, true);

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'api_performance',
                endpoint: '/api/leaderboard',
                duration_ms: 250,
                success: true,
            });
        });
    });

    describe('analytics.error', () => {
        it('tracks errors with truncated message', () => {
            const longMessage = 'x'.repeat(300);
            analytics.error.occurred('api_error', longMessage, 'LeaderboardPage');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'error_occurred',
                error_type: 'api_error',
                component: 'LeaderboardPage',
            });
            // Message should be truncated to 200 chars
            expect((dataLayerPushes[0].error_message as string).length).toBe(200);
        });
    });

    // ========================================================================
    // Experiment Tracking
    // ========================================================================

    describe('analytics.experiment', () => {
        it('tracks experiment viewed', () => {
            analytics.experiment.viewed('new-onboarding', 'variant-a');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'experiment_viewed',
                experiment_id: 'new-onboarding',
                variant_id: 'variant-a',
            });
        });

        it('tracks experiment converted', () => {
            analytics.experiment.converted('new-onboarding', 'variant-a', 'signup_complete');

            expect(dataLayerPushes[0]).toMatchObject({
                event: 'experiment_converted',
                experiment_id: 'new-onboarding',
                variant_id: 'variant-a',
                goal_id: 'signup_complete',
            });
        });
    });
});

// ============================================================================
// Dual-Push Verification (Integration-style)
// ============================================================================

describe('Dual-Push Verification', () => {
    let dataLayerPushes: Record<string, unknown>[];

    beforeEach(() => {
        vi.clearAllMocks();
        dataLayerPushes = [];
        Object.defineProperty(window, 'dataLayer', {
            value: { push: (e: Record<string, unknown>) => dataLayerPushes.push(e) },
            writable: true,
            configurable: true,
        });
    });

    it('every trackEvent call goes to both GA4 and PostHog', () => {
        // Track multiple events
        analytics.signUp('google');
        analytics.login('email');
        analytics.leagueCreated('l-1', 'Test');
        analytics.stepsSubmitted(5000);

        // Verify both systems received events
        expect(dataLayerPushes.length).toBeGreaterThanOrEqual(4);
        expect(mockPosthogCapture).toHaveBeenCalledTimes(4);

        // Verify event names match
        expect(dataLayerPushes.map(e => e.event)).toContain('sign_up');
        expect(dataLayerPushes.map(e => e.event)).toContain('login');
        expect(dataLayerPushes.map(e => e.event)).toContain('league_created');
        expect(dataLayerPushes.map(e => e.event)).toContain('steps_submitted');
    });

    it('user identification syncs across both systems', () => {
        identifyUser('user-abc', { role: 'premium' });

        // GA4 (dataLayer)
        expect(dataLayerPushes[0]).toMatchObject({
            event: 'user_identified',
            user_id: 'user-abc',
        });

        // PostHog
        expect(mockPosthogIdentify).toHaveBeenCalledWith('user-abc', { role: 'premium' });
    });

    it('logout clears user in both systems', () => {
        analytics.logout();

        // GA4 (dataLayer) - should have both logout and user_logged_out
        expect(dataLayerPushes.some(e => e.event === 'logout')).toBe(true);
        expect(dataLayerPushes.some(e => e.event === 'user_logged_out')).toBe(true);

        // PostHog
        expect(mockPosthogCapture).toHaveBeenCalledWith('logout', expect.any(Object));
        expect(mockPosthogReset).toHaveBeenCalled();
    });
});

