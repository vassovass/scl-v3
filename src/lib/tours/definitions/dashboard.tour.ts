/**
 * Dashboard Tour Definition
 * 
 * Comprehensive navigation orientation tour.
 * Auto-starts on first visit to dashboard.
 * 11 steps covering all major features.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import type { TourDefinition } from '../types';

export const dashboardTour: TourDefinition = {
    id: 'dashboard-v1',
    version: '1.0.0',
    nameKey: 'dashboard.meta.name',
    descriptionKey: 'dashboard.meta.description',
    category: 'onboarding',
    icon: '🏠',
    estimatedDuration: 180, // 3 minutes

    requiredPath: '/',

    autoStart: {
        onFirstVisit: true,
    },

    mobile: {
        maxSteps: 6,
        maxContentChars: 130,
        maxTitleChars: 60,
        maxLines: 3,
    },

    steps: [
        {
            id: 'welcome',
            target: '[data-tour="hero-section"]',
            titleKey: 'dashboard.steps.welcome.title',
            contentKey: 'dashboard.steps.welcome.content',
            placement: 'auto',
            disableBeacon: true,
            mobile: {
                contentKey: 'dashboard.steps.welcome.mobile.content',
            },
        },
        {
            id: 'step-counter',
            target: '[data-tour="step-counter"]',
            titleKey: 'dashboard.steps.stepCounter.title',
            contentKey: 'dashboard.steps.stepCounter.content',
            placement: 'bottom',
            mobile: {
                contentKey: 'dashboard.steps.stepCounter.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'streak',
            target: '[data-tour="streak-counter"]',
            titleKey: 'dashboard.steps.streak.title',
            contentKey: 'dashboard.steps.streak.content',
            placement: 'bottom',
            mobile: {
                contentKey: 'dashboard.steps.streak.mobile.content',
            },
        },
        {
            id: 'leagues',
            target: '[data-tour="leagues-section"]',
            titleKey: 'dashboard.steps.leagues.title',
            contentKey: 'dashboard.steps.leagues.content',
            placement: 'top',
            mobile: {
                contentKey: 'dashboard.steps.leagues.mobile.content',
            },
        },
        {
            id: 'submit-button',
            target: '[data-tour="submit-steps-button"]',
            titleKey: 'dashboard.steps.submitButton.title',
            contentKey: 'dashboard.steps.submitButton.content',
            placement: 'left',
            spotlightClicks: true,
            mobile: {
                contentKey: 'dashboard.steps.submitButton.mobile.content',
                placement: 'top',
            },
        },
        {
            id: 'leaderboard',
            target: '[data-tour="nav-leaderboard"]',
            titleKey: 'dashboard.steps.leaderboard.title',
            contentKey: 'dashboard.steps.leaderboard.content',
            placement: 'bottom',
            disableOverlay: true,
            spotlightClicks: true,
            mobile: {
                contentKey: 'dashboard.steps.leaderboard.mobile.content',
            },
        },
        {
            id: 'analytics',
            target: '[data-tour="nav-analytics"]',
            titleKey: 'dashboard.steps.analytics.title',
            contentKey: 'dashboard.steps.analytics.content',
            placement: 'bottom',
            disableOverlay: true,
            spotlightClicks: true,
            mobile: {
                contentKey: 'dashboard.steps.analytics.mobile.content',
            },
            hideOnMobile: true, // Skip on mobile to keep tour short
        },
        {
            id: 'create-league',
            target: '[data-tour="create-league-button"]',
            titleKey: 'dashboard.steps.createLeague.title',
            contentKey: 'dashboard.steps.createLeague.content',
            placement: 'left',
            spotlightClicks: true,
            mobile: {
                contentKey: 'dashboard.steps.createLeague.mobile.content',
                placement: 'top',
            },
            hideOnMobile: true,
        },
        {
            id: 'help-menu',
            target: '[data-tour="help-menu"]',
            titleKey: 'dashboard.steps.helpMenu.title',
            contentKey: 'dashboard.steps.helpMenu.content',
            placement: 'bottom-end',
            disableOverlay: true,
            spotlightClicks: true,
            mobile: {
                contentKey: 'dashboard.steps.helpMenu.mobile.content',
            },
        },
        {
            id: 'settings',
            target: '[data-tour="user-menu"]',
            titleKey: 'dashboard.steps.settings.title',
            contentKey: 'dashboard.steps.settings.content',
            placement: 'bottom-end',
            disableOverlay: true,
            spotlightClicks: true,
            mobile: {
                contentKey: 'dashboard.steps.settings.mobile.content',
            },
            hideOnMobile: true,
        },
        {
            id: 'complete',
            target: '[data-tour="hero-section"]',
            titleKey: 'dashboard.steps.complete.title',
            contentKey: 'dashboard.steps.complete.content',
            placement: 'auto',
            mobile: {
                contentKey: 'dashboard.steps.complete.mobile.content',
            },
        },
    ],
};
