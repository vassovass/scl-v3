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

    requiredPath: '/submit-steps',

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
            id: 'date-picker',
            target: '[data-tour="date-picker"]',
            titleKey: 'submit.steps.datePicker.title',
            contentKey: 'submit.steps.datePicker.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'submit.steps.datePicker.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'steps-input',
            target: '[data-tour="steps-input"]',
            titleKey: 'submit.steps.stepsInput.title',
            contentKey: 'submit.steps.stepsInput.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'submit.steps.stepsInput.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'screenshot-upload',
            target: '[data-tour="screenshot-upload"]',
            titleKey: 'submit.steps.screenshotUpload.title',
            contentKey: 'submit.steps.screenshotUpload.content',
            placement: 'top',
            mobile: {
                contentKey: 'submit.steps.screenshotUpload.mobile.content',
            },
        },
        {
            id: 'submit-button',
            target: '[data-tour="submit-button"]',
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
            target: '[data-tour="recent-submissions"]',
            titleKey: 'submit.steps.confirmation.title',
            contentKey: 'submit.steps.confirmation.content',
            placement: 'top',
            mobile: {
                contentKey: 'submit.steps.confirmation.mobile.content',
            },
        },
    ],
};
