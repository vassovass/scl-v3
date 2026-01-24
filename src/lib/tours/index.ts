/**
 * Tour System Index
 * 
 * Re-exports all tour system modules for convenient imports.
 * 
 * Usage:
 * import { getTour, tourAnalytics, TourDefinition } from '@/lib/tours';
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────
export type {
    TourCategory,
    TourStep,
    TourDefinition,
    TourState,
    TourProgress,
    TourInteraction,
    TourContextType,
    InteractiveValidation,
    InteractiveConfig,
    MobileOverrides,
    StepAnalytics,
    AutoStartConditions,
    TourExperiment,
    TourMobileConfig,
    ValidationResult,
    TourMigration,
} from './types';

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────
export {
    TOUR_STATE_SCHEMA_VERSION,
    TOUR_STORAGE_KEY,
    DEFAULT_MOBILE_CONFIG,
    DEFAULT_TOUR_STATE,
} from './types';

// ─────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────
export {
    TOUR_REGISTRY,
    getTour,
    getToursByCategory,
    getToursForPath,
    getAutoStartTours,
    getAllTours,
    hasTour,
    getHelpMenuTours,
    getTourByHash,
} from './registry';

// ─────────────────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────────────────
export {
    tourI18n,
    initTourI18n,
    loadTourTranslations,
    t as tourT,
    getCurrentLanguage,
    changeLanguage,
    isRTL,
    RTL_LANGUAGES,
} from './i18n';

// ─────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────
export {
    validateStep,
    dispatchValidationEvent,
    cancelAllValidations,
} from './validation';

// ─────────────────────────────────────────────────────────────────────────
// Migrations
// ─────────────────────────────────────────────────────────────────────────
export {
    migrateFromOldSchema,
    migrateTourVersion,
    compareVersions,
    needsMigration,
    getMajorVersion,
    isMajorUpgrade,
} from './migrations';

// ─────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────
export { tourAnalytics } from './unified-analytics';
export { tourGTM } from './gtm-integration';
export {
    saveTourCompletion,
    saveStepInteraction,
    saveTourFeedback,
    getTourCompletionStats,
    getDropOffPoints,
    getAverageFeedbackRating,
} from './supabase-sync';

// ─────────────────────────────────────────────────────────────────────────
// Experiments
// ─────────────────────────────────────────────────────────────────────────
export {
    getTourExperimentVariant,
    shouldShowExperiment,
    getVariantTour,
    trackExperimentEnrollment,
    trackExperimentConversion,
    useTourExperiment,
} from './experiments';
