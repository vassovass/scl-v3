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

    requiredPath: /^\/admin\/analytics/,

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
            target: '[data-tour="admin-analytics-header"]',
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
            id: 'kpis',
            target: '[data-tour="admin-analytics-kpis"]',
            titleKey: 'admin.steps.kpis.title',
            contentKey: 'admin.steps.kpis.content',
            placement: 'right',
            spotlightClicks: true,
            requiresRole: 'admin',
            mobile: {
                contentKey: 'admin.steps.kpis.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'completion',
            target: '[data-tour="admin-analytics-completion"]',
            titleKey: 'admin.steps.completion.title',
            contentKey: 'admin.steps.completion.content',
            placement: 'right',
            spotlightClicks: true,
            requiresRole: 'admin',
            mobile: {
                contentKey: 'admin.steps.completion.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'feedback',
            target: '[data-tour="admin-analytics-feedback"]',
            titleKey: 'admin.steps.feedback.title',
            contentKey: 'admin.steps.feedback.content',
            placement: 'right',
            spotlightClicks: true,
            requiresRole: 'admin',
            mobile: {
                contentKey: 'admin.steps.feedback.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'dropoff',
            target: '[data-tour="admin-analytics-dropoff"]',
            titleKey: 'admin.steps.dropoff.title',
            contentKey: 'admin.steps.dropoff.content',
            placement: 'left',
            requiresRole: 'admin',
            mobile: {
                contentKey: 'admin.steps.dropoff.mobile.content',
                placement: 'top',
            },
        },
    ],
};
