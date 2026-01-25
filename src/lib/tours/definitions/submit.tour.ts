/**
 * Submit Steps Tour Definition
 *
 * Explains the batch submission workflow with AI extraction.
 * Auto-starts on first visit to submit page.
 * 9 steps covering batch upload, extraction, review, and submission.
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
        maxSteps: 6,
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
            id: 'batch-toggle',
            target: '[data-tour="batch-toggle"]',
            titleKey: 'submit.steps.batchToggle.title',
            contentKey: 'submit.steps.batchToggle.content',
            placement: 'bottom',
            spotlightClicks: true,
            mobile: {
                contentKey: 'submit.steps.batchToggle.mobile.content',
            },
        },
        {
            id: 'file-upload',
            target: '[data-tour="batch-file-upload"]',
            titleKey: 'submit.steps.fileUpload.title',
            contentKey: 'submit.steps.fileUpload.content',
            placement: 'right',
            mobile: {
                contentKey: 'submit.steps.fileUpload.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'extract-button',
            target: '[data-tour="batch-extract-button"]',
            titleKey: 'submit.steps.extractButton.title',
            contentKey: 'submit.steps.extractButton.content',
            placement: 'top',
            mobile: {
                contentKey: 'submit.steps.extractButton.mobile.content',
            },
        },
        {
            id: 'review-grid',
            target: '[data-tour="batch-review-grid"]',
            titleKey: 'submit.steps.reviewGrid.title',
            contentKey: 'submit.steps.reviewGrid.content',
            placement: 'top',
            mobile: {
                contentKey: 'submit.steps.reviewGrid.mobile.content',
            },
        },
        {
            id: 'date-edit',
            target: '[data-tour="batch-date-input"]',
            titleKey: 'submit.steps.dateEdit.title',
            contentKey: 'submit.steps.dateEdit.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'submit.steps.dateEdit.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'steps-edit',
            target: '[data-tour="batch-steps-input"]',
            titleKey: 'submit.steps.stepsEdit.title',
            contentKey: 'submit.steps.stepsEdit.content',
            placement: 'right',
            spotlightClicks: true,
            mobile: {
                contentKey: 'submit.steps.stepsEdit.mobile.content',
                placement: 'bottom',
            },
        },
        {
            id: 'submit-button',
            target: '[data-tour="batch-submit-button"]',
            titleKey: 'submit.steps.submitButton.title',
            contentKey: 'submit.steps.submitButton.content',
            placement: 'top',
            spotlightClicks: true,
            mobile: {
                contentKey: 'submit.steps.submitButton.mobile.content',
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
