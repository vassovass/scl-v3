'use client';

/**
 * Analytics Hub for StepLeague
 * 
 * Architecture:
 * - Events are pushed to BOTH dataLayer (GA4 via GTM) AND PostHog SDK
 * - dataLayer → GTM → GA4 for Google Analytics
 * - PostHog SDK → PostHog for session replay, feature flags, funnels
 * - Component-level tracking for granular insights
 * 
 * Adding new tracking:
 * 1. Add event method to `analytics` object below
 * 2. Events automatically go to both GA4 and PostHog
 * 3. No GTM changes needed for new events
 * 
 * @see PRD 14: Analytics GTM & GA4
 * @see PostHogProvider.tsx for PostHog initialization
 */

import { posthogCapture, posthogIdentify, posthogReset } from '@/components/analytics/PostHogProvider';
import { dispatchValidationEvent } from '@/lib/tours/validation';

declare global {
    interface Window {
        dataLayer: Record<string, unknown>[];
        gtag: (...args: unknown[]) => void;
    }
}

// Ensure dataLayer exists
if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
}

// ═══════════════════════════════════════════════════════════════════════════
// MASTER TRACKING TOGGLE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Master tracking toggle controlled by SuperAdmin feature flag.
 * When false, ALL analytics are disabled regardless of user consent.
 * This is set by the AnalyticsGate component based on feature_user_tracking setting.
 */
let _trackingEnabled = true;

/**
 * Set the master tracking toggle. Called by AnalyticsGate on mount/update.
 */
export function setTrackingEnabled(enabled: boolean) {
    _trackingEnabled = enabled;
    if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Master tracking toggle:', enabled ? 'ENABLED' : 'DISABLED');
    }
}

/**
 * Check if tracking is currently enabled (for external use).
 */
export function isTrackingEnabled(): boolean {
    return _trackingEnabled;
}

// ═══════════════════════════════════════════════════════════════════════════
// CORE TRACKING FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export interface TrackEventParams {
    /** Event category for grouping (e.g., 'league', 'feedback', 'navigation') */
    category?: string;
    /** Action taken (e.g., 'click', 'submit', 'view') */
    action?: string;
    /** Component or module name (e.g., 'LeaderboardCard', 'FeedbackForm') */
    component?: string;
    /** Additional properties */
    [key: string]: string | number | boolean | null | undefined;
}

/**
 * Push event to BOTH dataLayer (GA4) AND PostHog
 * - dataLayer → GTM → GA4
 * - PostHog SDK → PostHog (session replay, funnels, feature flags)
 *
 * Note: Events are only sent if master tracking toggle is enabled (feature_user_tracking).
 * Tour validation events are still dispatched regardless of tracking state.
 *
 * PRD-56: Analytics tracking is deferred using requestIdleCallback to prevent
 * blocking the main thread and causing INP (Interaction to Next Paint) delays.
 * This reduced the "Try Demo" button INP from ~1050ms to <200ms.
 */
export function trackEvent(
    eventName: string,
    params?: TrackEventParams
) {
    if (typeof window === 'undefined') return;

    // Always dispatch tour validation events synchronously (for interactive tours to work)
    dispatchValidationEvent(eventName);

    // Master toggle check - if tracking disabled, skip analytics
    if (!_trackingEnabled) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[Analytics] Event BLOCKED (tracking disabled):', eventName);
        }
        return;
    }

    // PRD-56: Defer analytics to prevent blocking main thread
    // This significantly improves INP (Interaction to Next Paint)
    const doTrack = () => {
        // Filter out undefined/null values
        const cleanParams = params
            ? Object.fromEntries(
                Object.entries(params).filter(([, v]) => v != null)
            )
            : {};

        // Add timestamp for debugging/ordering
        const event = {
            event: eventName,
            event_timestamp: new Date().toISOString(),
            ...cleanParams,
        };

        // Push to dataLayer (GA4 via GTM)
        window.dataLayer.push(event);

        // Push to PostHog SDK (session replay, funnels, feature flags)
        posthogCapture(eventName, cleanParams as Record<string, string | number | boolean | null | undefined>);

        // Debug in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Analytics] Event sent to GA4 + PostHog:', eventName, cleanParams);
        }
    };

    // Use requestIdleCallback for non-blocking analytics
    // Falls back to setTimeout(0) for browsers without requestIdleCallback
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(doTrack, { timeout: 2000 });
    } else {
        setTimeout(doTrack, 0);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// USER IDENTITY (for cross-tool user matching)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Set user identity for all analytics tools (GA4 + PostHog)
 * Call this after login/signup
 */
export function identifyUser(userId: string, traits?: Record<string, string | number | boolean>) {
    if (typeof window === 'undefined') return;

    // Push to dataLayer for GA4
    window.dataLayer.push({
        event: 'user_identified',
        user_id: userId,
        ...traits,
    });

    // Identify in PostHog
    posthogIdentify(userId, traits);
}

/**
 * Clear user identity on logout (GA4 + PostHog)
 */
export function clearUser() {
    if (typeof window === 'undefined') return;

    // Push to dataLayer for GA4
    window.dataLayer.push({
        event: 'user_logged_out',
        user_id: null,
    });

    // Reset PostHog user
    posthogReset();
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT INTERACTION TRACKING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track component visibility (for heatmaps/scroll tracking)
 */
export function trackComponentView(componentName: string, context?: string) {
    trackEvent('component_viewed', {
        component: componentName,
        context,
        category: 'engagement',
        action: 'view',
    });
}

/**
 * Track component interaction (clicks, hovers, etc.)
 */
export function trackInteraction(
    componentName: string,
    action: 'click' | 'hover' | 'focus' | 'blur' | 'scroll' | 'swipe',
    elementId?: string,
    value?: string | number
) {
    trackEvent('component_interaction', {
        component: componentName,
        action,
        element_id: elementId,
        value: value?.toString(),
        category: 'interaction',
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// TIER 1: MACRO CONVERSIONS (Key Events in GA4)
// ═══════════════════════════════════════════════════════════════════════════

export const analytics = {
    // ─────────────────────────────────────────────────────────────────────────
    // CONVERSIONS
    // ─────────────────────────────────────────────────────────────────────────

    signUp: (method: 'google' | 'email') => {
        trackEvent('sign_up', {
            method,
            category: 'conversion',
            action: 'complete',
        });
    },

    leagueCreated: (leagueId: string, leagueName: string) => {
        trackEvent('league_created', {
            league_id: leagueId,
            league_name: leagueName,
            category: 'conversion',
            action: 'create',
        });
    },

    leagueJoined: (leagueId: string, method: 'invite' | 'browse' | 'link') => {
        trackEvent('league_joined', {
            league_id: leagueId,
            method,
            category: 'conversion',
            action: 'join',
        });
    },

    stepsSubmitted: (stepCount: number, leagueId?: string) => {
        trackEvent('steps_submitted', {
            step_count: stepCount,
            league_id: leagueId,
            category: 'conversion',
            action: 'submit',
        });
    },

    worldLeagueEnrolled: (method: 'auto' | 'manual' | 'proxy') => {
        trackEvent('world_league_enrolled', {
            method,
            category: 'conversion',
            action: 'enroll',
        });
    },


    // ─────────────────────────────────────────────────────────────────────────
    // PROXY EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    proxyClaimed: (proxyId: string, submissionCount: number, leagueCount: number) => {
        trackEvent('proxy_claimed', {
            proxy_id: proxyId,
            submission_count: submissionCount,
            league_count: leagueCount,
            category: 'conversion',
            action: 'claim',
        });
    },

    highFiveSent: (recipientId: string, isToggleOn: boolean) => {
        trackEvent('high_five_sent', {
            recipient_id: recipientId,
            action: isToggleOn ? 'send' : 'remove',
            category: 'engagement',
        });
    },

    // ─────────────────────────────────────────────────────────────────────────
    // MICRO CONVERSIONS
    // ─────────────────────────────────────────────────────────────────────────

    onboardingCompleted: (stepsCompleted: number) => {
        trackEvent('onboarding_completed', {
            steps_completed: stepsCompleted,
            category: 'conversion',
            action: 'complete',
        });
    },

    onboardingStep: (stepNumber: number, stepName: string) => {
        trackEvent('onboarding_step', {
            step_number: stepNumber,
            step_name: stepName,
            category: 'onboarding',
            action: 'view',
        });
    },

    firstStepsSubmitted: (stepCount: number) => {
        trackEvent('first_steps_submitted', {
            step_count: stepCount,
            category: 'conversion',
            action: 'milestone',
        });
    },

    inviteSent: (leagueId: string, method: 'email' | 'link' | 'share') => {
        trackEvent('invite_sent', {
            league_id: leagueId,
            invite_method: method,
            category: 'conversion',
            action: 'share',
        });
    },

    share: (content_type: string, item_id: string | undefined, method: string) => {
        trackEvent('share', {
            content_type,
            item_id,
            method,
            category: 'social',
            action: 'share',
        });
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SHARE FUNNEL (PRD-51: Social Sharing & Stats Hub)
    // ─────────────────────────────────────────────────────────────────────────

    /** Share funnel tracking for conversion analysis */
    shareFunnel: {
        /** Track when share modal is opened (intent) */
        modalOpened: (source: string, cardType?: string) => {
            trackEvent('share_modal_opened', {
                source,
                card_type: cardType,
                category: 'share_funnel',
                action: 'intent',
            });
        },

        /** Track card type selection in modal */
        cardTypeSelected: (cardType: string, previousType?: string) => {
            trackEvent('share_card_type_selected', {
                card_type: cardType,
                previous_type: previousType,
                category: 'share_funnel',
                action: 'select',
            });
        },

        /** Track when share is completed */
        completed: (platform: string, cardType: string, value?: number) => {
            trackEvent('share_completed', {
                platform,
                card_type: cardType,
                metric_value: value,
                category: 'share_funnel',
                action: 'complete',
            });
        },

        /** Track share link clicks (from shared content) */
        linkClicked: (shortCode: string, cardType?: string, source?: string) => {
            trackEvent('share_link_clicked', {
                short_code: shortCode,
                card_type: cardType,
                utm_source: source,
                category: 'share_funnel',
                action: 'click',
            });
        },

        /** Track sign-up from shared link */
        signUpFromShare: (shortCode: string, cardType?: string) => {
            trackEvent('sign_up_from_share', {
                short_code: shortCode,
                card_type: cardType,
                category: 'share_funnel',
                action: 'convert',
            });
        },

        /** Track share prompt shown (post-submission, milestone) */
        promptShown: (trigger: 'post_submission' | 'personal_best' | 'streak_milestone' | 'rank_change', value?: number) => {
            trackEvent('share_prompt_shown', {
                trigger,
                metric_value: value,
                category: 'share_funnel',
                action: 'prompt',
            });
        },

        /** Track share prompt dismissed */
        promptDismissed: (trigger: string) => {
            trackEvent('share_prompt_dismissed', {
                trigger,
                category: 'share_funnel',
                action: 'dismiss',
            });
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // ENGAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    login: (method: 'google' | 'email') => {
        trackEvent('login', {
            method,
            category: 'auth',
            action: 'complete',
        });
    },

    logout: () => {
        trackEvent('logout', {
            category: 'auth',
            action: 'complete',
        });
        clearUser();
    },

    pageView: (pageName: string, pageType?: string) => {
        trackEvent('page_view', {
            page_name: pageName,
            page_type: pageType,
            category: 'navigation',
            action: 'view',
        });
    },

    ctaClicked: (buttonName: string, location: string, destination?: string) => {
        trackEvent('cta_clicked', {
            button_name: buttonName,
            location,
            destination,
            category: 'engagement',
            action: 'click',
        });
    },

    feedbackSubmitted: (type: 'bug' | 'feature' | 'improvement' | 'general' | 'positive' | 'negative') => {
        trackEvent('feedback_submitted', {
            feedback_type: type,
            category: 'feedback',
            action: 'submit',
        });
    },

    roadmapVoted: (itemId: string, voteType: 'up' | 'down') => {
        trackEvent('roadmap_voted', {
            item_id: itemId,
            vote_type: voteType,
            category: 'engagement',
            action: 'vote',
        });
    },

    achievementShared: (platform: string, achievementType: string) => {
        trackEvent('achievement_shared', {
            platform,
            achievement_type: achievementType,
            category: 'social',
            action: 'share',
        });
    },

    // ─────────────────────────────────────────────────────────────────────────
    // MODULE-SPECIFIC TRACKING
    // ─────────────────────────────────────────────────────────────────────────

    /** Leaderboard interactions */
    leaderboard: {
        viewed: (leagueId: string, period: 'daily' | 'weekly' | 'all') => {
            trackEvent('leaderboard_viewed', {
                league_id: leagueId,
                period,
                component: 'Leaderboard',
                category: 'league',
                action: 'view',
            });
        },
        periodChanged: (leagueId: string, newPeriod: 'daily' | 'weekly' | 'all') => {
            trackEvent('leaderboard_period_changed', {
                league_id: leagueId,
                period: newPeriod,
                component: 'Leaderboard',
                category: 'league',
                action: 'filter',
            });
        },
    },

    /** League navigation interactions */
    leagueNav: {
        tabClicked: (leagueId: string, tabName: string) => {
            trackEvent('league_nav_tab_clicked', {
                league_id: leagueId,
                tab_name: tabName,
                component: 'LeagueNav',
                category: 'navigation',
                action: 'click',
            });
        },
        hubViewed: (leagueId: string) => {
            trackEvent('league_hub_viewed', {
                league_id: leagueId,
                component: 'LeagueHub',
                category: 'league',
                action: 'view',
            });
        },
    },

    /** Kanban/Task board interactions */
    kanban: {
        cardMoved: (itemId: string, fromColumn: string, toColumn: string) => {
            trackEvent('kanban_card_moved', {
                item_id: itemId,
                from_column: fromColumn,
                to_column: toColumn,
                component: 'KanbanBoard',
                category: 'admin',
                action: 'drag',
            });
        },
        cardClicked: (itemId: string, itemType: string) => {
            trackEvent('kanban_card_clicked', {
                item_id: itemId,
                item_type: itemType,
                component: 'KanbanBoard',
                category: 'admin',
                action: 'click',
            });
        },
    },

    /** Filter interactions */
    filters: {
        applied: (filterType: string, filterValue: string, location: string) => {
            trackEvent('filter_applied', {
                filter_type: filterType,
                filter_value: filterValue,
                location,
                component: 'UniversalFilters',
                category: 'filter',
                action: 'apply',
            });
        },
        cleared: (location: string) => {
            trackEvent('filters_cleared', {
                location,
                component: 'UniversalFilters',
                category: 'filter',
                action: 'clear',
            });
        },
        savedViewLoaded: (viewName: string) => {
            trackEvent('saved_view_loaded', {
                view_name: viewName,
                component: 'SavedViewsDropdown',
                category: 'filter',
                action: 'load',
            });
        },
    },

    /** Settings interactions */
    settings: {
        opened: (section?: string) => {
            trackEvent('settings_opened', {
                section,
                component: 'Settings',
                category: 'settings',
                action: 'open',
            });
        },
        changed: (settingName: string, oldValue?: string, newValue?: string) => {
            trackEvent('setting_changed', {
                setting_name: settingName,
                old_value: oldValue,
                new_value: newValue,
                component: 'Settings',
                category: 'settings',
                action: 'change',
            });
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // PERFORMANCE & ERRORS (for debugging)
    // ─────────────────────────────────────────────────────────────────────────

    performance: {
        pageLoaded: (pageName: string, loadTimeMs: number) => {
            trackEvent('page_performance', {
                page_name: pageName,
                load_time_ms: loadTimeMs,
                category: 'performance',
                action: 'load',
            });
        },
        apiCall: (endpoint: string, durationMs: number, success: boolean) => {
            trackEvent('api_performance', {
                endpoint,
                duration_ms: durationMs,
                success,
                category: 'performance',
                action: 'api',
            });
        },
    },

    error: {
        occurred: (errorType: string, errorMessage: string, component?: string) => {
            trackEvent('error_occurred', {
                error_type: errorType,
                error_message: errorMessage.slice(0, 200),
                component,
                category: 'error',
                action: 'error',
            });
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // EXPERIMENTS (for A/B testing via GrowthBook/PostHog)
    // ─────────────────────────────────────────────────────────────────────────

    experiment: {
        viewed: (experimentId: string, variantId: string) => {
            trackEvent('experiment_viewed', {
                experiment_id: experimentId,
                variant_id: variantId,
                category: 'experiment',
                action: 'view',
            });
        },
        converted: (experimentId: string, variantId: string, goalId: string) => {
            trackEvent('experiment_converted', {
                experiment_id: experimentId,
                variant_id: variantId,
                goal_id: goalId,
                category: 'experiment',
                action: 'convert',
            });
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUPPORT & CHAT (Intercom, AI Chatbot, etc.)
    // ─────────────────────────────────────────────────────────────────────────

    support: {
        chatOpened: (source: 'widget' | 'nav' | 'help_page') => {
            trackEvent('support_chat_opened', {
                source,
                component: 'SupportChat',
                category: 'support',
                action: 'open',
            });
        },
        messageSent: (messageType: 'question' | 'feedback' | 'issue') => {
            trackEvent('support_message_sent', {
                message_type: messageType,
                component: 'SupportChat',
                category: 'support',
                action: 'send',
            });
        },
        articleViewed: (articleId: string, articleTitle: string) => {
            trackEvent('support_article_viewed', {
                article_id: articleId,
                article_title: articleTitle,
                component: 'HelpCenter',
                category: 'support',
                action: 'view',
            });
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // AI FEATURES (Verification, Chatbot, Suggestions)
    // ─────────────────────────────────────────────────────────────────────────

    ai: {
        /** AI verification of step screenshots */
        verificationStarted: (imageSize: number, leagueId?: string) => {
            trackEvent('ai_verification_started', {
                image_size_bytes: imageSize,
                league_id: leagueId,
                component: 'StepVerification',
                category: 'ai',
                action: 'start',
            });
        },
        verificationCompleted: (
            result: 'approved' | 'rejected' | 'manual_review',
            confidenceScore: number,
            durationMs: number,
            leagueId?: string
        ) => {
            trackEvent('ai_verification_completed', {
                result,
                confidence_score: confidenceScore,
                duration_ms: durationMs,
                league_id: leagueId,
                component: 'StepVerification',
                category: 'ai',
                action: 'complete',
            });
        },
        verificationFailed: (errorType: string, leagueId?: string) => {
            trackEvent('ai_verification_failed', {
                error_type: errorType,
                league_id: leagueId,
                component: 'StepVerification',
                category: 'ai',
                action: 'error',
            });
        },

        /** AI chatbot interactions */
        chatbotOpened: (context: string) => {
            trackEvent('ai_chatbot_opened', {
                context,
                component: 'AIChatbot',
                category: 'ai',
                action: 'open',
            });
        },
        chatbotQuery: (queryType: 'question' | 'command' | 'feedback', queryLength: number) => {
            trackEvent('ai_chatbot_query', {
                query_type: queryType,
                query_length: queryLength,
                component: 'AIChatbot',
                category: 'ai',
                action: 'query',
            });
        },
        chatbotResponse: (responseType: 'answer' | 'action' | 'clarification', helpful?: boolean) => {
            trackEvent('ai_chatbot_response', {
                response_type: responseType,
                helpful,
                component: 'AIChatbot',
                category: 'ai',
                action: 'response',
            });
        },

        /** AI suggestions/recommendations */
        suggestionShown: (suggestionType: string, context: string) => {
            trackEvent('ai_suggestion_shown', {
                suggestion_type: suggestionType,
                context,
                component: 'AISuggestions',
                category: 'ai',
                action: 'show',
            });
        },
        suggestionAccepted: (suggestionType: string, suggestionId: string) => {
            trackEvent('ai_suggestion_accepted', {
                suggestion_type: suggestionType,
                suggestion_id: suggestionId,
                component: 'AISuggestions',
                category: 'ai',
                action: 'accept',
            });
        },
        suggestionDismissed: (suggestionType: string, suggestionId: string) => {
            trackEvent('ai_suggestion_dismissed', {
                suggestion_type: suggestionType,
                suggestion_id: suggestionId,
                component: 'AISuggestions',
                category: 'ai',
                action: 'dismiss',
            });
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // CHALLENGES (PRD-54: Friend-Specific Challenges)
    // ─────────────────────────────────────────────────────────────────────────

    challenges: {
        /** Track when a challenge is created */
        created: (targetId: string, metricType: string, durationDays: number, templateId?: string) => {
            trackEvent('challenge_created', {
                target_id: targetId,
                metric_type: metricType,
                duration_days: durationDays,
                template_id: templateId,
                component: 'ChallengeModal',
                category: 'challenge',
                action: 'create',
            });
        },

        /** Track when a challenge is accepted */
        accepted: (challengeId: string, challengerId: string) => {
            trackEvent('challenge_accepted', {
                challenge_id: challengeId,
                challenger_id: challengerId,
                component: 'ChallengeCard',
                category: 'challenge',
                action: 'accept',
            });
        },

        /** Track when a challenge is declined */
        declined: (challengeId: string, challengerId: string) => {
            trackEvent('challenge_declined', {
                challenge_id: challengeId,
                challenger_id: challengerId,
                component: 'ChallengeCard',
                category: 'challenge',
                action: 'decline',
            });
        },

        /** Track when a challenge is cancelled */
        cancelled: (challengeId: string, cancelledBy: 'challenger' | 'target') => {
            trackEvent('challenge_cancelled', {
                challenge_id: challengeId,
                cancelled_by: cancelledBy,
                component: 'ChallengeCard',
                category: 'challenge',
                action: 'cancel',
            });
        },

        /** Track when a challenge is completed */
        completed: (challengeId: string, won: boolean, marginPct: number) => {
            trackEvent('challenge_completed', {
                challenge_id: challengeId,
                result: won ? 'won' : 'lost',
                margin_pct: marginPct,
                component: 'ChallengeCard',
                category: 'challenge',
                action: 'complete',
            });
        },

        /** Track challenge template selection */
        templateSelected: (templateId: string, templateName: string) => {
            trackEvent('challenge_template_selected', {
                template_id: templateId,
                template_name: templateName,
                component: 'ChallengeModal',
                category: 'challenge',
                action: 'select_template',
            });
        },

        /** Track challenge shared */
        shared: (challengeId: string, platform: string, status: string) => {
            trackEvent('challenge_shared', {
                challenge_id: challengeId,
                platform,
                status,
                component: 'ChallengeCard',
                category: 'challenge',
                action: 'share',
            });
        },

        /** Track challenge dashboard viewed */
        dashboardViewed: (activeCount: number, pendingCount: number) => {
            trackEvent('challenges_dashboard_viewed', {
                active_count: activeCount,
                pending_count: pendingCount,
                component: 'ChallengesDashboard',
                category: 'challenge',
                action: 'view',
            });
        },
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SHARE STREAKS (PRD-56: Sharing Encouragement System)
    // ─────────────────────────────────────────────────────────────────────────

    shareStreak: {
        /** Track when a share streak is updated */
        updated: (newStreak: number, isMilestone: boolean, milestoneValue?: number) => {
            trackEvent('share_streak_updated', {
                new_streak: newStreak,
                is_milestone: isMilestone,
                milestone_value: milestoneValue,
                component: 'ShareStreakBadge',
                category: 'share_streak',
                action: 'update',
            });
        },

        /** Track when a milestone is reached */
        milestoneReached: (milestoneValue: number, tier: string) => {
            trackEvent('share_streak_milestone', {
                milestone_value: milestoneValue,
                tier,
                component: 'ShareMilestoneToast',
                category: 'share_streak',
                action: 'milestone',
            });
        },

        /** Track when a nudge is shown */
        nudgeShown: (nudgeType: string, currentStreak: number) => {
            trackEvent('share_nudge_shown', {
                nudge_type: nudgeType,
                current_streak: currentStreak,
                component: 'ShareReminder',
                category: 'share_streak',
                action: 'nudge',
            });
        },

        /** Track when a nudge is dismissed */
        nudgeDismissed: (nudgeType: string) => {
            trackEvent('share_nudge_dismissed', {
                nudge_type: nudgeType,
                component: 'ShareReminder',
                category: 'share_streak',
                action: 'dismiss',
            });
        },

        /** Track when a nudge leads to a share (conversion) */
        nudgeConverted: (nudgeType: string) => {
            trackEvent('share_nudge_converted', {
                nudge_type: nudgeType,
                component: 'ShareReminder',
                category: 'share_streak',
                action: 'convert',
            });
        },

        /** Track share insights dashboard viewed */
        insightsViewed: () => {
            trackEvent('share_insights_viewed', {
                component: 'ShareAnalyticsDashboard',
                category: 'share_streak',
                action: 'view',
            });
        },
    },
};
