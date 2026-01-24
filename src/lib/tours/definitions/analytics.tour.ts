/**
 * Analytics Tour Definition
 * 
 * Explains personal stats and heatmaps.
 * Auto-starts on first visit to analytics.
 * 4 steps covering heatmap, trends, and personal bests.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import type { TourDefinition } from '../types';

export const analyticsTour: TourDefinition = {
    id: 'analytics-v1',
    version: '1.0.0',
    nameKey: 'analytics.meta.name',
    descriptionKey: 'analytics.meta.description',
    category: 'feature',
    icon: '📈',
    estimatedDuration: 45, // 45 seconds

    requiredPath: '/analytics',

    autoStart: {
        onFirstVisit: true,
    },

    mobile: {
        maxContentChars: 130,
        maxTitleChars: 60,
        maxLines: 3,
    },

    steps: [
        {
            id: 'intro',
            target: '[data-tour="analytics-header"]',
            titleKey: 'analytics.steps.intro.title',
            contentKey: 'analytics.steps.intro.content',
            placement: 'bottom',
            disableBeacon: true,
            mobile: {
                contentKey: 'analytics.steps.intro.mobile.content',
            },
        },
        {
            id: 'heatmap',
            target: '[data-tour="analytics-heatmap"]',
            titleKey: 'analytics.steps.heatmap.title',
            contentKey: 'analytics.steps.heatmap.content',
            placement: 'top',
            mobile: {
                contentKey: 'analytics.steps.heatmap.mobile.content',
            },
        },
        {
            id: 'trends',
            target: '[data-tour="analytics-trends-chart"]',
            titleKey: 'analytics.steps.trends.title',
            contentKey: 'analytics.steps.trends.content',
            placement: 'top',
            mobile: {
                contentKey: 'analytics.steps.trends.mobile.content',
            },
        },
        {
            id: 'personal-best',
            target: '[data-tour="analytics-personal-bests"]',
            titleKey: 'analytics.steps.personalBest.title',
            contentKey: 'analytics.steps.personalBest.content',
            placement: 'left',
            mobile: {
                contentKey: 'analytics.steps.personalBest.mobile.content',
                placement: 'top',
            },
        },
    ],
};
