/**
 * Onboarding First Submission Tour
 *
 * Lightweight tour that guides brand-new users through their first submission.
 * Auto-starts on /submit-steps only when user has zero submissions.
 * Complements the static onboarding cards on the dashboard (PRD 60).
 *
 * Cards answer WHAT to do (visual guidance).
 * This tour answers HOW to do it (step-by-step spotlight).
 *
 * @see PRD 60: UX Onboarding
 */

import type { TourDefinition } from '../types';

export const onboardingSubmitTour: TourDefinition = {
    id: 'onboarding-submit-v1',
    version: '1.0.0',
    nameKey: 'onboardingSubmit.meta.name',
    descriptionKey: 'onboardingSubmit.meta.description',
    category: 'onboarding',
    icon: '🎯',
    estimatedDuration: 60, // 1 minute — shorter than full submit tour

    requiredPath: '/submit-steps',

    autoStart: {
        noSubmissions: true,
    },

    mobile: {
        maxSteps: 4,
        maxContentChars: 130,
        maxTitleChars: 60,
        maxLines: 3,
    },

    steps: [
        {
            id: 'welcome-submit',
            target: '[data-tour="submit-page-header"]',
            titleKey: 'onboardingSubmit.steps.welcome.title',
            contentKey: 'onboardingSubmit.steps.welcome.content',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            id: 'upload-area',
            target: '[data-tour="batch-file-upload"]',
            titleKey: 'onboardingSubmit.steps.upload.title',
            contentKey: 'onboardingSubmit.steps.upload.content',
            placement: 'bottom',
            spotlightClicks: true,
        },
        {
            id: 'extract-button',
            target: '[data-tour="extract-button"]',
            titleKey: 'onboardingSubmit.steps.extract.title',
            contentKey: 'onboardingSubmit.steps.extract.content',
            placement: 'top',
            spotlightClicks: true,
        },
        {
            id: 'submit-button',
            target: '[data-tour="submit-button"]',
            titleKey: 'onboardingSubmit.steps.submit.title',
            contentKey: 'onboardingSubmit.steps.submit.content',
            placement: 'top',
            spotlightClicks: true,
            interactive: {
                enabled: true,
                validation: {
                    type: 'event',
                    event: 'steps_submitted',
                    timeout: 120000,
                },
            },
        },
    ],
};
