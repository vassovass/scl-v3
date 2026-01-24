/**
 * Settings Tour Definition
 * 
 * Explains profile customization.
 * Manual trigger only (from Help menu).
 * 5 steps covering profile, connections, and preferences.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import type { TourDefinition } from '../types';

export const settingsTour: TourDefinition = {
    id: 'settings-v1',
    version: '1.0.0',
    nameKey: 'settings.meta.name',
    descriptionKey: 'settings.meta.description',
    category: 'feature',
    icon: '⚙️',
    estimatedDuration: 60, // 1 minute

    requiredPath: '/settings',

    // No autoStart - manual trigger only
    autoStart: undefined,

    mobile: {
        maxContentChars: 130,
        maxTitleChars: 60,
        maxLines: 3,
    },

    steps: [
        {
            id: 'profile',
            target: '[data-tour="settings-profile-section"]',
            titleKey: 'settings.steps.profile.title',
            contentKey: 'settings.steps.profile.content',
            placement: 'right',
            disableBeacon: true,
            spotlightClicks: true,
            mobile: {
                contentKey: 'settings.steps.profile.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'fitness-connect',
            target: '[data-tour="settings-fitness-connections"]',
            titleKey: 'settings.steps.fitnessConnect.title',
            contentKey: 'settings.steps.fitnessConnect.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'settings.steps.fitnessConnect.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'notifications',
            target: '[data-tour="settings-notifications"]',
            titleKey: 'settings.steps.notifications.title',
            contentKey: 'settings.steps.notifications.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'settings.steps.notifications.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'privacy',
            target: '[data-tour="settings-privacy"]',
            titleKey: 'settings.steps.privacy.title',
            contentKey: 'settings.steps.privacy.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'settings.steps.privacy.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'preferences',
            target: '[data-tour="settings-preferences"]',
            titleKey: 'settings.steps.preferences.title',
            contentKey: 'settings.steps.preferences.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'settings.steps.preferences.mobile.content',
                placement: 'bottom',
            },
        },
    ],
};
