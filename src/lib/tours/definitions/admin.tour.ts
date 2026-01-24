/**
 * Admin Tour Definition
 * 
 * Admin-only league management features.
 * Manual trigger only, requires admin role.
 * 5 steps covering member management and moderation.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import type { TourDefinition } from '../types';

export const adminTour: TourDefinition = {
    id: 'admin-v1',
    version: '1.0.0',
    nameKey: 'admin.meta.name',
    descriptionKey: 'admin.meta.description',
    category: 'admin',
    icon: '🛡️',
    estimatedDuration: 60, // 1 minute

    requiredPath: /^\/admin/,

    // Admin role required
    requiredRole: 'admin',

    // No autoStart - manual trigger only
    autoStart: undefined,

    mobile: {
        maxContentChars: 130,
        maxTitleChars: 60,
        maxLines: 3,
    },

    steps: [
        {
            id: 'intro',
            target: '[data-tour="admin-dashboard-header"]',
            titleKey: 'admin.steps.intro.title',
            contentKey: 'admin.steps.intro.content',
            placement: 'bottom',
            disableBeacon: true,
            requiresRole: 'admin',
            mobile: {
                contentKey: 'admin.steps.intro.mobile.content',
            },
        },
        {
            id: 'members',
            target: '[data-tour="admin-members-section"]',
            titleKey: 'admin.steps.members.title',
            contentKey: 'admin.steps.members.content',
            placement: 'right',
            spotlightClicks: true,
            requiresRole: 'admin',
            mobile: {
                contentKey: 'admin.steps.members.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'moderation',
            target: '[data-tour="admin-moderation-queue"]',
            titleKey: 'admin.steps.moderation.title',
            contentKey: 'admin.steps.moderation.content',
            placement: 'right',
            spotlightClicks: true,
            requiresRole: 'admin',
            mobile: {
                contentKey: 'admin.steps.moderation.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'league-settings',
            target: '[data-tour="admin-league-settings"]',
            titleKey: 'admin.steps.leagueSettings.title',
            contentKey: 'admin.steps.leagueSettings.content',
            placement: 'right',
            spotlightClicks: true,
            requiresRole: 'admin',
            mobile: {
                contentKey: 'admin.steps.leagueSettings.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'analytics',
            target: '[data-tour="admin-league-analytics"]',
            titleKey: 'admin.steps.analytics.title',
            contentKey: 'admin.steps.analytics.content',
            placement: 'left',
            requiresRole: 'admin',
            mobile: {
                contentKey: 'admin.steps.analytics.mobile.content',
                placement: 'top',
            },
        },
    ],
};
