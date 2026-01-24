/**
 * League Creation Tour Definition
 * 
 * Guides users through creating their first league.
 * Auto-starts when user has no leagues.
 * 5 steps covering league setup.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import type { TourDefinition } from '../types';

export const leagueTour: TourDefinition = {
    id: 'league-v1',
    version: '1.0.0',
    nameKey: 'league.meta.name',
    descriptionKey: 'league.meta.description',
    category: 'onboarding',
    icon: '🏆',
    estimatedDuration: 90, // 1.5 minutes

    requiredPath: '/league/create',

    autoStart: {
        noLeagues: true,
    },

    mobile: {
        maxContentChars: 130,
        maxTitleChars: 60,
        maxLines: 3,
    },

    steps: [
        {
            id: 'intro',
            target: '[data-tour="league-create-header"]',
            titleKey: 'league.steps.intro.title',
            contentKey: 'league.steps.intro.content',
            placement: 'bottom',
            disableBeacon: true,
            spotlightClicks: true,
            mobile: {
                contentKey: 'league.steps.intro.mobile.content',
            },
        },
        {
            id: 'name-field',
            target: '[data-tour="league-name-input"]',
            titleKey: 'league.steps.nameField.title',
            contentKey: 'league.steps.nameField.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'league.steps.nameField.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'privacy-setting',
            target: '[data-tour="league-week-start"]',
            titleKey: 'league.steps.weekStart.title',
            contentKey: 'league.steps.weekStart.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'league.steps.weekStart.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'invite-members',
            target: '[data-tour="league-invite-info"]',
            titleKey: 'league.steps.inviteMembers.title',
            contentKey: 'league.steps.inviteMembers.content',
            placement: 'left',
            mobile: {
                contentKey: 'league.steps.inviteMembers.mobile.content',
                placement: 'top',
            },
        },
        {
            id: 'create-button',
            target: '[data-tour="league-create-submit"]',
            titleKey: 'league.steps.createButton.title',
            contentKey: 'league.steps.createButton.content',
            placement: 'top',
            spotlightClicks: true,
            mobile: {
                contentKey: 'league.steps.createButton.mobile.content',
            },
            // Interactive: Wait for league_created event
            interactive: {
                enabled: true,
                validation: {
                    type: 'event',
                    event: 'league_created',
                    timeout: 60000, // 1 minute
                },
            },
        },
    ],
};
