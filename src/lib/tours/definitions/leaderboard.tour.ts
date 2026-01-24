/**
 * Leaderboard Tour Definition
 * 
 * Explains rankings and filters.
 * Auto-starts on first visit to leaderboard.
 * 5 steps covering time filters, league filters, and high fives.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import type { TourDefinition } from '../types';

export const leaderboardTour: TourDefinition = {
    id: 'leaderboard-v1',
    version: '1.0.0',
    nameKey: 'leaderboard.meta.name',
    descriptionKey: 'leaderboard.meta.description',
    category: 'feature',
    icon: '📊',
    estimatedDuration: 60, // 1 minute

    requiredPath: '/leaderboard',

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
            target: '[data-tour="leaderboard-header"]',
            titleKey: 'leaderboard.steps.intro.title',
            contentKey: 'leaderboard.steps.intro.content',
            placement: 'bottom',
            disableBeacon: true,
            mobile: {
                contentKey: 'leaderboard.steps.intro.mobile.content',
            },
        },
        {
            id: 'time-filters',
            target: '[data-tour="leaderboard-time-filter"]',
            titleKey: 'leaderboard.steps.timeFilters.title',
            contentKey: 'leaderboard.steps.timeFilters.content',
            placement: 'bottom',
            spotlightClicks: true,
            disableOverlay: true,
            mobile: {
                contentKey: 'leaderboard.steps.timeFilters.mobile.content',
            },
        },
        {
            id: 'league-filter',
            target: '[data-tour="leaderboard-league-filter"]',
            titleKey: 'leaderboard.steps.leagueFilter.title',
            contentKey: 'leaderboard.steps.leagueFilter.content',
            placement: 'bottom',
            spotlightClicks: true,
            disableOverlay: true,
            mobile: {
                contentKey: 'leaderboard.steps.leagueFilter.mobile.content',
            },
        },
        {
            id: 'your-position',
            target: '[data-tour="leaderboard-current-user"]',
            titleKey: 'leaderboard.steps.yourPosition.title',
            contentKey: 'leaderboard.steps.yourPosition.content',
            placement: 'right',
            mobile: {
                contentKey: 'leaderboard.steps.yourPosition.mobile.content',
                placement: 'top',
            },
        },
        {
            id: 'high-five',
            target: '[data-tour="high-five-button"]',
            titleKey: 'leaderboard.steps.highFive.title',
            contentKey: 'leaderboard.steps.highFive.content',
            placement: 'left',
            spotlightClicks: true,
            mobile: {
                contentKey: 'leaderboard.steps.highFive.mobile.content',
                placement: 'top',
            },
        },
    ],
};
