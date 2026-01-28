/**
 * Sharing Tour Definition
 *
 * Guides users through the Stats Hub sharing features.
 * Auto-starts on first visit to /dashboard/my-stats.
 * A/B test: "quick" (4 steps) vs "detailed" (7 steps)
 *
 * @see PRD 52: Sharing Tour for Stats Hub
 */

import type { TourDefinition } from '../types';

export const sharingTour: TourDefinition = {
    id: 'sharing-guide',
    version: '1.0.0',
    nameKey: 'sharing.meta.name',
    descriptionKey: 'sharing.meta.description',
    category: 'feature',
    icon: '📤',
    estimatedDuration: 90, // 1.5 minutes for detailed, ~45s for quick

    requiredPath: '/dashboard/my-stats',

    autoStart: {
        onFirstVisit: true,
    },

    mobile: {
        maxContentChars: 130,
        maxTitleChars: 60,
        maxLines: 3,
    },

    // A/B Testing Configuration
    experiment: {
        experimentId: 'sharing-tour-length',
        variants: ['quick', 'detailed'],
        defaultVariant: 'detailed',
    },

    // Base steps (detailed variant - 7 steps)
    steps: [
        {
            id: 'welcome',
            target: '[data-tour="sharing"]',
            titleKey: 'sharing.steps.welcome.title',
            contentKey: 'sharing.steps.welcome.content',
            placement: 'bottom',
            disableBeacon: true,
            mobile: {
                contentKey: 'sharing.steps.welcome.mobile.content',
            },
        },
        {
            id: 'stat-card',
            target: '[data-tour="stats-quick"]',
            titleKey: 'sharing.steps.statCard.title',
            contentKey: 'sharing.steps.statCard.content',
            placement: 'top',
            mobile: {
                contentKey: 'sharing.steps.statCard.mobile.content',
            },
        },
        {
            id: 'period-dropdown',
            target: '[data-tour="period-selector"]',
            titleKey: 'sharing.steps.periodDropdown.title',
            contentKey: 'sharing.steps.periodDropdown.content',
            placement: 'bottom',
            spotlightClicks: true,
            disableOverlay: true,
            mobile: {
                contentKey: 'sharing.steps.periodDropdown.mobile.content',
            },
        },
        {
            id: 'share-button',
            target: '[data-tour="challenge-share-button"]',
            titleKey: 'sharing.steps.shareButton.title',
            contentKey: 'sharing.steps.shareButton.content',
            placement: 'top',
            spotlightClicks: true,
            disableOverlay: true,
            interactive: {
                enabled: true,
                validation: {
                    type: 'element',
                    element: '[data-tour="share-modal"]',
                    timeout: 30000, // 30 seconds to click
                },
            },
            mobile: {
                contentKey: 'sharing.steps.shareButton.mobile.content',
            },
        },
        {
            id: 'card-preview',
            target: '[data-tour="share-card-preview"]',
            titleKey: 'sharing.steps.cardPreview.title',
            contentKey: 'sharing.steps.cardPreview.content',
            placement: 'top',
            mobile: {
                contentKey: 'sharing.steps.cardPreview.mobile.content',
            },
        },
        {
            id: 'whatsapp-button',
            target: '[data-tour="share-whatsapp-button"]',
            titleKey: 'sharing.steps.whatsappButton.title',
            contentKey: 'sharing.steps.whatsappButton.content',
            placement: 'top',
            spotlightClicks: true,
            mobile: {
                contentKey: 'sharing.steps.whatsappButton.mobile.content',
            },
        },
        {
            id: 'complete',
            target: '[data-tour="sharing"]',
            titleKey: 'sharing.steps.complete.title',
            contentKey: 'sharing.steps.complete.content',
            placement: 'center',
            mobile: {
                contentKey: 'sharing.steps.complete.mobile.content',
            },
        },
    ],

    // A/B Variant: Quick (4 steps)
    variants: {
        quick: {
            estimatedDuration: 45,
            steps: [
                {
                    id: 'welcome',
                    target: '[data-tour="sharing"]',
                    titleKey: 'sharing.steps.welcome.title',
                    contentKey: 'sharing.variants.quick.welcome.content',
                    placement: 'bottom',
                    disableBeacon: true,
                    mobile: {
                        contentKey: 'sharing.variants.quick.welcome.mobile.content',
                    },
                },
                {
                    id: 'stat-card',
                    target: '[data-tour="stats-quick"]',
                    titleKey: 'sharing.steps.statCard.title',
                    contentKey: 'sharing.variants.quick.statCard.content',
                    placement: 'top',
                    mobile: {
                        contentKey: 'sharing.variants.quick.statCard.mobile.content',
                    },
                },
                {
                    id: 'share-button',
                    target: '[data-tour="challenge-share-button"]',
                    titleKey: 'sharing.steps.shareButton.title',
                    contentKey: 'sharing.variants.quick.shareButton.content',
                    placement: 'top',
                    spotlightClicks: true,
                    disableOverlay: true,
                    mobile: {
                        contentKey: 'sharing.variants.quick.shareButton.mobile.content',
                    },
                },
                {
                    id: 'complete',
                    target: '[data-tour="sharing"]',
                    titleKey: 'sharing.steps.complete.title',
                    contentKey: 'sharing.variants.quick.complete.content',
                    placement: 'center',
                    mobile: {
                        contentKey: 'sharing.variants.quick.complete.mobile.content',
                    },
                },
            ],
        },
    },
};
