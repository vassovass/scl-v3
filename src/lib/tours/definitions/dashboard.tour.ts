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

    requiredPath: '/dashboard',

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
            target: '[data-tour="dashboard-header"]',
            titleKey: 'dashboard.steps.welcome.title',
            contentKey: 'dashboard.steps.welcome.content',
            placement: 'auto',
            disableBeacon: true,
            mobile: {
                contentKey: 'dashboard.steps.welcome.mobile.content',
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
            id: 'join-league',
            target: '[data-tour="join-league"]',
            titleKey: 'dashboard.steps.joinLeague.title',
            contentKey: 'dashboard.steps.joinLeague.content',
            placement: 'bottom',
            mobile: {
                contentKey: 'dashboard.steps.joinLeague.mobile.content',
            },
        },
        {
            id: 'create-league',
            target: '[data-tour="create-league"]',
            titleKey: 'dashboard.steps.createLeague.title',
            contentKey: 'dashboard.steps.createLeague.content',
            placement: 'bottom',
            spotlightClicks: true,
            mobile: {
                contentKey: 'dashboard.steps.createLeague.mobile.content',
            },
        },
        {
            id: 'actions-menu',
            target: '[data-tour="nav-actions-menu"]',
            titleKey: 'dashboard.steps.actionsMenu.title',
            contentKey: 'dashboard.steps.actionsMenu.content',
            placement: 'bottom',
            disableOverlay: true,
            spotlightClicks: true,
            mobile: {
                contentKey: 'dashboard.steps.actionsMenu.mobile.content',
            },
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
            target: '[data-tour="nav-user-menu"]',
            titleKey: 'dashboard.steps.settings.title',
            contentKey: 'dashboard.steps.settings.content',
            placement: 'bottom-end',
            disableOverlay: true,
            spotlightClicks: true,
            mobile: {
                contentKey: 'dashboard.steps.settings.mobile.content',
            },
        },
        {
            id: 'complete',
            target: '[data-tour="dashboard-header"]',
            titleKey: 'dashboard.steps.complete.title',
            contentKey: 'dashboard.steps.complete.content',
            placement: 'auto',
            mobile: {
                contentKey: 'dashboard.steps.complete.mobile.content',
            },
        },
    ],
};
