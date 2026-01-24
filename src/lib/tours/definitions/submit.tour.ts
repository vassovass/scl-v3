/**
 * Submit Steps Tour Definition
 * 
 * Explains the three submission methods.
 * Auto-starts on first visit to submit page.
 * 7 steps covering Apple Health, Google Fit, and manual entry.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import type { TourDefinition } from '../types';

export const submitTour: TourDefinition = {
    id: 'submit-steps-v1',
    version: '1.0.0',
    nameKey: 'submit.meta.name',
    descriptionKey: 'submit.meta.description',
    category: 'onboarding',
    icon: '📝',
    estimatedDuration: 120, // 2 minutes

    requiredPath: '/submit',

    autoStart: {
        onFirstVisit: true,
    },

    mobile: {
        maxSteps: 5,
        maxContentChars: 130,
        maxTitleChars: 60,
        maxLines: 3,
    },

    steps: [
        {
            id: 'intro',
            target: '[data-tour="submit-page-header"]',
            titleKey: 'submit.steps.intro.title',
            contentKey: 'submit.steps.intro.content',
            placement: 'bottom',
            disableBeacon: true,
            mobile: {
                contentKey: 'submit.steps.intro.mobile.content',
            },
        },
        {
            id: 'apple-health',
            target: '[data-tour="apple-health-connect"]',
            titleKey: 'submit.steps.appleHealth.title',
            contentKey: 'submit.steps.appleHealth.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'submit.steps.appleHealth.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'google-fit',
            target: '[data-tour="google-fit-connect"]',
            titleKey: 'submit.steps.googleFit.title',
            contentKey: 'submit.steps.googleFit.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'submit.steps.googleFit.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'manual-entry',
            target: '[data-tour="manual-step-input"]',
            titleKey: 'submit.steps.manualEntry.title',
            contentKey: 'submit.steps.manualEntry.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'submit.steps.manualEntry.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'photo-proof',
            target: '[data-tour="photo-upload"]',
            titleKey: 'submit.steps.photoProof.title',
            contentKey: 'submit.steps.photoProof.content',
            placement: 'top',
            mobile: {
                contentKey: 'submit.steps.photoProof.mobile.content',
            },
            hideOnMobile: true, // Skip on mobile
        },
        {
            id: 'submit-button',
            target: '[data-tour="submit-confirm-button"]',
            titleKey: 'submit.steps.submitButton.title',
            contentKey: 'submit.steps.submitButton.content',
            placement: 'top',
            spotlightClicks: true,
            mobile: {
                contentKey: 'submit.steps.submitButton.mobile.content',
            },
            // Interactive: Wait for steps_submitted event
            interactive: {
                enabled: true,
                validation: {
                    type: 'event',
                    event: 'steps_submitted',
                    timeout: 120000, // 2 minutes
                },
            },
        },
        {
            id: 'confirmation',
            target: '[data-tour="submission-success"]',
            titleKey: 'submit.steps.confirmation.title',
            contentKey: 'submit.steps.confirmation.content',
            placement: 'auto',
            mobile: {
                contentKey: 'submit.steps.confirmation.mobile.content',
            },
        },
    ],
};
