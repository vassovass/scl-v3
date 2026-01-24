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

    requiredPath: /^\/settings/,

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
            id: 'display-name',
            target: '[data-tour="settings-display-name"]',
            titleKey: 'settings.steps.displayName.title',
            contentKey: 'settings.steps.displayName.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'settings.steps.displayName.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'navigation',
            target: '[data-tour="settings-nav"]',
            titleKey: 'settings.steps.navigation.title',
            contentKey: 'settings.steps.navigation.content',
            placement: 'bottom',
            spotlightClicks: true,
            mobile: {
                contentKey: 'settings.steps.navigation.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'save',
            target: '[data-tour="settings-save-button"]',
            titleKey: 'settings.steps.save.title',
            contentKey: 'settings.steps.save.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'settings.steps.save.mobile.content',
                placement: 'bottom',
            },
        },
    ],
};
