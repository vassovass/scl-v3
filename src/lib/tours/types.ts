/**
 * Tour System Type Definitions
 * 
 * Core types for the modular tour system supporting:
 * - i18n-first design with translation keys
 * - Mobile-responsive content with character limits
 * - Interactive step validation
 * - A/B testing variants
 * - Role-based visibility
 * - Feature flag integration
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import type { Placement as JoyridePlacement } from 'react-joyride';

/**
 * Extended placement type that includes 'center' and 'auto'
 * These are mapped to valid Joyride placements at runtime
 */
export type TourPlacement = JoyridePlacement | 'center' | 'auto';

// ═══════════════════════════════════════════════════════════════════════════
// TOUR CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

export type TourCategory =
    | 'onboarding'      // First-time user tours
    | 'feature'         // Feature-specific tours
    | 'admin'           // Admin-only tours
    | 'advanced';       // Power user tours

// ═══════════════════════════════════════════════════════════════════════════
// TOUR STEP TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Interactive step validation configuration
 * Enables "learn by doing" tours where users complete tasks
 */
export interface InteractiveValidation {
    /** Validation type */
    type: 'event' | 'element' | 'timeout';
    /** Analytics event name to wait for (type: 'event') */
    event?: string;
    /** CSS selector to wait for (type: 'element') */
    element?: string;
    /** Timeout in milliseconds */
    timeout: number;
}

export interface InteractiveConfig {
    /** Whether this step requires user action */
    enabled: boolean;
    /** Validation configuration */
    validation: InteractiveValidation;
    /** Callback when validation fails */
    onValidationFail?: () => void;
}

/**
 * Mobile-specific content overrides
 * Ensures readability on small screens
 */
export interface MobileOverrides {
    /** Mobile-optimized content (max 130 chars, 3 lines) */
    contentKey: string;
    /** Mobile-optimized header (max 60 chars) */
    titleKey?: string;
    /** Override placement for mobile */
    placement?: TourPlacement;
}

/**
 * Analytics tracking for individual steps
 */
export interface StepAnalytics {
    /** Custom event name for this step */
    eventName?: string;
    /** Additional properties to track */
    properties?: Record<string, string | number | boolean>;
}

/**
 * Individual tour step definition
 * i18n-first: Uses translation keys instead of hardcoded content
 */
export interface TourStep {
    /** Unique step ID within the tour */
    id: string;

    /** CSS selector for target element (use data-tour attributes) */
    target: string;

    // ─────────────────────────────────────────────────────────────────────────
    // i18n Content (Translation Keys)
    // ─────────────────────────────────────────────────────────────────────────

    /** Translation key for step content (required) */
    contentKey: string;

    /** Translation key for step title (optional) */
    titleKey?: string;

    // ─────────────────────────────────────────────────────────────────────────
    // Positioning & Display
    // ─────────────────────────────────────────────────────────────────────────

    /** Tooltip placement relative to target */
    placement?: TourPlacement;

    /** Disable the beacon animation */
    disableBeacon?: boolean;

    /** Allow clicking the spotlight area */
    spotlightClicks?: boolean;

    /** Disable the overlay (allows full page interaction) */
    disableOverlay?: boolean;

    // ─────────────────────────────────────────────────────────────────────────
    // Visibility & Access Control
    // ─────────────────────────────────────────────────────────────────────────

    /** Required user role to see this step */
    requiresRole?: 'admin' | 'member';

    /** Feature flag that must be enabled */
    featureFlag?: string;

    /** A/B test variant this step belongs to */
    experimentVariant?: string;

    // ─────────────────────────────────────────────────────────────────────────
    // Mobile & Responsive
    // ─────────────────────────────────────────────────────────────────────────

    /** Mobile-specific overrides */
    mobile?: MobileOverrides;

    /** Hide this step on mobile devices */
    hideOnMobile?: boolean;

    // ─────────────────────────────────────────────────────────────────────────
    // Interactive & Analytics
    // ─────────────────────────────────────────────────────────────────────────

    /** Interactive step configuration */
    interactive?: InteractiveConfig;

    /** Step-specific analytics */
    analytics?: StepAnalytics;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOUR DEFINITION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Auto-start conditions for tours
 */
export interface AutoStartConditions {
    /** Auto-start on first visit to the page */
    onFirstVisit?: boolean;
    /** Only if user has no leagues */
    noLeagues?: boolean;
    /** Only if user has never submitted steps */
    noSubmissions?: boolean;
    /** Custom condition function */
    custom?: () => boolean;
}

/**
 * A/B test experiment configuration
 */
export interface TourExperiment {
    /** PostHog experiment ID */
    experimentId: string;
    /** Available variants */
    variants: string[];
    /** Default variant if experiment not available */
    defaultVariant: string;
}

/**
 * Mobile configuration for the entire tour
 */
export interface TourMobileConfig {
    /** Maximum steps to show on mobile (truncate) */
    maxSteps?: number;
    /** Maximum characters for mobile content */
    maxContentChars: number;
    /** Maximum characters for mobile headers */
    maxTitleChars: number;
    /** Maximum lines for mobile content */
    maxLines: number;
}

/**
 * Complete tour definition
 */
export interface TourDefinition {
    /** Unique tour ID (e.g., 'dashboard-v1') */
    id: string;

    /** Semantic version (e.g., '1.0.0') */
    version: string;

    // ─────────────────────────────────────────────────────────────────────────
    // i18n Metadata (Translation Keys)
    // ─────────────────────────────────────────────────────────────────────────

    /** Translation key for tour name */
    nameKey: string;

    /** Translation key for tour description */
    descriptionKey: string;

    // ─────────────────────────────────────────────────────────────────────────
    // Classification
    // ─────────────────────────────────────────────────────────────────────────

    /** Tour category */
    category: TourCategory;

    /** Icon for UI display */
    icon?: string;

    /** Estimated duration in seconds */
    estimatedDuration?: number;

    // ─────────────────────────────────────────────────────────────────────────
    // Steps
    // ─────────────────────────────────────────────────────────────────────────

    /** Tour steps */
    steps: TourStep[];

    // ─────────────────────────────────────────────────────────────────────────
    // Trigger & Visibility
    // ─────────────────────────────────────────────────────────────────────────

    /** Auto-start conditions */
    autoStart?: AutoStartConditions;

    /** Required URL path pattern (regex or exact match) */
    requiredPath?: string | RegExp;

    /** Required user role */
    requiredRole?: 'admin' | 'member';

    /** Feature flag that must be enabled */
    featureFlag?: string;

    // ─────────────────────────────────────────────────────────────────────────
    // Mobile Configuration
    // ─────────────────────────────────────────────────────────────────────────

    /** Mobile-specific configuration */
    mobile?: TourMobileConfig;

    // ─────────────────────────────────────────────────────────────────────────
    // A/B Testing
    // ─────────────────────────────────────────────────────────────────────────

    /** Experiment configuration */
    experiment?: TourExperiment;

    /** Variant-specific step overrides (keyed by variant name) */
    variants?: Record<string, Partial<TourDefinition>>;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOUR STATE TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Progress tracking for an in-progress tour
 */
export interface TourProgress {
    /** Current step index */
    currentStep: number;
    /** Timestamp when started */
    startedAt: number;
    /** Steps viewed (for analytics) */
    stepsViewed: number[];
}

/**
 * Complete tour state (persisted to localStorage)
 */
export interface TourState {
    /** Completed tours (tourId -> version completed) */
    completedTours: Record<string, string>;

    /** Skipped tours (tourId -> timestamp) */
    skippedTours: Record<string, number>;

    /** In-progress tour state */
    tourProgress: Record<string, TourProgress>;

    /** Interaction history for analytics */
    interactionHistory: TourInteraction[];

    /** Last update timestamp */
    lastUpdated: number;

    /** Schema version for migrations */
    schemaVersion: number;
}

/**
 * Tour interaction record for analytics
 */
export interface TourInteraction {
    /** Tour ID */
    tourId: string;
    /** Interaction type */
    type: 'started' | 'completed' | 'skipped' | 'step_viewed' | 'step_completed';
    /** Step ID (if applicable) */
    stepId?: string;
    /** Timestamp */
    timestamp: number;
    /** A/B test variant (if applicable) */
    variant?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION RESULT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
    /** Whether validation passed */
    success: boolean;
    /** Failure reason if not successful */
    reason?: 'timeout' | 'not_found' | 'cancelled';
}

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TourMigration {
    /** Source version */
    from: string;
    /** Target version */
    to: string;
    /** Migration function */
    migrate: (oldState: TourState) => TourState;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TourContextType {
    /** Start a specific tour */
    startTour: (tourId: string) => void;
    /** Start contextual tour based on current page */
    startContextualTour: () => void;
    /** Skip the current tour */
    skipTour: () => void;
    /** Reset all tour progress (dev/admin) */
    resetAllTours: () => void;
    /** Whether a tour is currently running */
    isRunning: boolean;
    /** Currently active tour */
    activeTour: TourDefinition | null;
    /** Current step index */
    currentStepIndex: number;
    /** Check if a tour has been completed */
    hasCompletedTour: (tourId: string) => boolean;
    /** Get completion status for all tours */
    getCompletionStatus: () => Record<string, boolean>;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/** Current localStorage schema version */
export const TOUR_STATE_SCHEMA_VERSION = 2;

/** localStorage key */
export const TOUR_STORAGE_KEY = 'stepleague-tours';

/** Default mobile configuration */
export const DEFAULT_MOBILE_CONFIG: TourMobileConfig = {
    maxContentChars: 130,
    maxTitleChars: 60,
    maxLines: 3,
};

/** Default initial tour state */
export const DEFAULT_TOUR_STATE: TourState = {
    completedTours: {},
    skippedTours: {},
    tourProgress: {},
    interactionHistory: [],
    lastUpdated: Date.now(),
    schemaVersion: TOUR_STATE_SCHEMA_VERSION,
};
