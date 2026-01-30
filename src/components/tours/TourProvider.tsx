/**
 * TourProvider Component
 * 
 * Optimized tour provider with performance features:
 * - startTransition for non-blocking state updates
 * - requestIdleCallback for deferred localStorage writes
 * - Safari fallback with setTimeout
 * - beforeunload safety handler
 * 
 * Target: INP <150ms
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

'use client';

import React, {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
} from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import type { CallBackProps, Step, Placement } from 'react-joyride';

import { useFeatureFlags } from '@/hooks/useFeatureFlag';
import type {
    TourContextType,
    TourDefinition,
    TourState,
    TourStep,
    TourPlacement,
} from '@/lib/tours/types';
import {
    TOUR_STORAGE_KEY,
    DEFAULT_TOUR_STATE,
    TOUR_STATE_SCHEMA_VERSION,
} from '@/lib/tours/types';
import {
    getTour,
    getToursForPath,
    getAutoStartTours,
    getTourByHash,
} from '@/lib/tours/registry';
import {
    migrateFromOldSchema,
    isMajorUpgrade,
} from '@/lib/tours/migrations';
import {
    getTourExperimentVariant,
    getVariantTour,
    trackExperimentConversion,
    trackExperimentEnrollment,
} from '@/lib/tours/experiments';
import { tourAnalytics } from '@/lib/tours/unified-analytics';
import {
    getCurrentLanguage,
    initTourI18n,
    isRTL,
    loadTourTranslations,
    t,
} from '@/lib/tours/i18n';
import { cancelAllValidations, validateStep } from '@/lib/tours/validation';
import { createClient } from '@/lib/supabase/client';
import { TourFeedbackDialog } from '@/components/tours/TourFeedbackDialog';
import type { AppSettingKey } from '@/lib/settings/appSettingsTypes';

// Dynamically import Joyride to reduce initial bundle
const Joyride = dynamic(() => import('react-joyride'), {
    ssr: false,
    loading: () => null,
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

export const TourContext = createContext<TourContextType | null>(null);

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: requestIdleCallback with fallback
// ═══════════════════════════════════════════════════════════════════════════

const requestIdle =
    typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? window.requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 0);

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function loadTourState(): TourState {
    if (typeof window === 'undefined') return DEFAULT_TOUR_STATE;

    try {
        const stored = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!stored) return DEFAULT_TOUR_STATE;

        const parsed = JSON.parse(stored);

        // Migrate from old schema if needed
        if (!parsed.schemaVersion || parsed.schemaVersion < TOUR_STATE_SCHEMA_VERSION) {
            return migrateFromOldSchema(parsed);
        }

        return parsed as TourState;
    } catch {
        return DEFAULT_TOUR_STATE;
    }
}

function saveTourState(state: TourState): void {
    if (typeof window === 'undefined') return;

    // Use requestIdleCallback to defer non-critical writes
    requestIdle(() => {
        try {
            localStorage.setItem(
                TOUR_STORAGE_KEY,
                JSON.stringify({
                    ...state,
                    lastUpdated: Date.now(),
                })
            );
        } catch (err) {
            console.error('[TourProvider] Failed to save state:', err);
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// PLACEMENT MAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Map our TourPlacement to a valid Joyride Placement
 * 'center' and 'auto' are mapped to 'bottom' as a safe default
 */
function mapToJoyridePlacement(placement: TourPlacement | undefined): Placement {
    if (!placement) return 'bottom';
    // These are not valid in Joyride, use bottom as fallback
    if (placement === 'center' || placement === 'auto') return 'bottom';
    return placement;
}

// ═══════════════════════════════════════════════════════════════════════════
// JOYRIDE STEP TRANSFORMER
// ═══════════════════════════════════════════════════════════════════════════

function clampText(text: string, maxChars: number, maxLines: number): string {
    if (!text) return text;
    const trimmed = text.trim();
    const truncated =
        trimmed.length > maxChars ? `${trimmed.slice(0, Math.max(maxChars - 1, 0))}…` : trimmed;
    const lines = truncated.split('\n').slice(0, maxLines).join('\n');
    return lines;
}

function filterTourSteps(
    steps: TourStep[],
    isMobile: boolean,
    userRole: 'admin' | 'member' | undefined,
    featureFlags: Record<string, boolean>,
    activeVariant: string | null,
    mobileConfig?: TourDefinition['mobile']
): TourStep[] {
    let filtered = steps.filter((step) => !(isMobile && step.hideOnMobile));

    if (userRole) {
        filtered = filtered.filter((step) => !step.requiresRole || step.requiresRole === userRole);
    }

    filtered = filtered.filter((step) => {
        if (!step.featureFlag) return true;
        return !!featureFlags[step.featureFlag];
    });

    if (activeVariant) {
        filtered = filtered.filter((step) => !step.experimentVariant || step.experimentVariant === activeVariant);
    }

    if (isMobile && mobileConfig?.maxSteps) {
        filtered = filtered.slice(0, mobileConfig.maxSteps);
    }

    return filtered;
}

function transformSteps(
    steps: TourStep[],
    isMobile: boolean,
    mobileConfig?: TourDefinition['mobile']
): Step[] {
    return steps.map((step) => {
        // Get content - use mobile override if available and on mobile
        const contentKey =
            isMobile && step.mobile?.contentKey
                ? step.mobile.contentKey
                : step.contentKey;

        const titleKey =
            isMobile && step.mobile?.titleKey
                ? step.mobile.titleKey
                : step.titleKey;

        const rawPlacement =
            isMobile && step.mobile?.placement
                ? step.mobile.placement
                : step.placement;

        const placement = mapToJoyridePlacement(rawPlacement);

        let content = t(contentKey);
        let title = titleKey ? t(titleKey) : undefined;

        if (isMobile && mobileConfig) {
            content = clampText(content, mobileConfig.maxContentChars, mobileConfig.maxLines);
            if (title && mobileConfig.maxTitleChars) {
                title = clampText(title, mobileConfig.maxTitleChars, mobileConfig.maxLines);
            }
        }

        return {
            target: step.target,
            content,
            title,
            placement,
            disableBeacon: step.disableBeacon ?? false,
            spotlightClicks: step.spotlightClicks ?? false,
            disableOverlay: step.disableOverlay ?? false,
        };
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// TOURPROVIDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface TourProviderProps {
    children: React.ReactNode;
    userId?: string;
    userRole?: 'admin' | 'member';
}

export function TourProvider({
    children,
    userId,
    userRole,
}: TourProviderProps) {
    const pathname = usePathname();
    const [tourState, setTourState] = useState<TourState>(DEFAULT_TOUR_STATE);
    const [activeTour, setActiveTour] = useState<TourDefinition | null>(null);
    const [stepIndex, setStepIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [i18nReady, setI18nReady] = useState(false);
    const [stateLoaded, setStateLoaded] = useState(false);
    const [hasLeagues, setHasLeagues] = useState<boolean | null>(null);
    const [hasSubmissions, setHasSubmissions] = useState<boolean | null>(null);
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [lastCompletedTourId, setLastCompletedTourId] = useState<string | null>(null);
    const [activeVariant, setActiveVariant] = useState<string | null>(null);
    const [originalViewMode, setOriginalViewMode] = useState<string | null>(null);
    const [pendingTourSwitch, setPendingTourSwitch] = useState<{
        fromTourId: string;
        fromTourName: string;
        toTourId: string;
        toTourName: string;
    } | null>(null);

    const tourStartTime = useRef<number>(0);
    const stepStartTime = useRef<number>(0);
    const tourStateRef = useRef<TourState>(DEFAULT_TOUR_STATE);
    const trackedTourStartRef = useRef<string | null>(null);
    const startTourRef = useRef<((tourId: string) => void) | null>(null);

    // ─────────────────────────────────────────────────────────────────────────
    // Initialization
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        // Load saved state
        const state = loadTourState();
        setTourState(state);
        setStateLoaded(true);

        // Initialize i18n
        initTourI18n().then(async () => {
            const language = getCurrentLanguage();
            await loadTourTranslations(language);
            if (typeof document !== 'undefined') {
                document.documentElement.dir = isRTL(language) ? 'rtl' : 'ltr';
            }
            setI18nReady(true);
        });

        // Check mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Safety: save state on page unload
        const handleUnload = () => {
            if (activeTour && isRunning) {
                // Synchronous save on unload
                localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(tourStateRef.current));
            }
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, []);

    useEffect(() => {
        tourAnalytics.setUserId(userId ?? null);
    }, [userId]);

    useEffect(() => {
        tourStateRef.current = tourState;
    }, [tourState]);

    useEffect(() => {
        if (!userId) {
            setHasLeagues(null);
            setHasSubmissions(null);
            return;
        }

        let isMounted = true;
        const supabase = createClient();

        const loadUserState = async () => {
            try {
                const { count: leagueCount, error: leagueError } = await supabase
                    .from('memberships')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId);

                if (!leagueError && isMounted) {
                    setHasLeagues((leagueCount ?? 0) > 0);
                }

                const { count: submissionCount, error: submissionError } = await supabase
                    .from('submissions')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId);

                if (!submissionError && isMounted) {
                    setHasSubmissions((submissionCount ?? 0) > 0);
                }
            } catch (err) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[TourProvider] Failed to load user state:', err);
                }
            }
        };

        loadUserState();

        return () => {
            isMounted = false;
        };
    }, [userId]);

    // ─────────────────────────────────────────────────────────────────────────
    // Auto-Start Logic
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!i18nReady || !stateLoaded || isRunning) return;

        // Get path-based tours
        const pathTours = getToursForPath(pathname);
        const autoStartTours = getAutoStartTours();

        // Find first eligible auto-start tour
        for (const tour of [...pathTours, ...autoStartTours]) {
            // Check if already completed
            if (tourState.completedTours[tour.id]) {
                // Check if needs migration (major version)
                const completedVersion = tourState.completedTours[tour.id];
                if (!isMajorUpgrade(completedVersion, tour.version)) {
                    continue; // Skip - already completed and no major update
                }
            }

            // Check auto-start conditions
            if (tourState.skippedTours[tour.id]) {
                continue;
            }

            if (tour.autoStart?.noLeagues === true && hasLeagues !== false) continue;
            if (tour.autoStart?.noSubmissions === true && hasSubmissions !== false) continue;
            if (tour.autoStart?.custom && !tour.autoStart.custom()) continue;

            // Check role requirement
            if (tour.requiredRole && tour.requiredRole !== userRole) continue;

            // Check path requirement
            if (tour.requiredPath) {
                if (tour.requiredPath instanceof RegExp) {
                    if (!tour.requiredPath.test(pathname)) continue;
                } else if (pathname !== tour.requiredPath) {
                    continue;
                }
            }

            // Start this tour!
            startTransition(() => {
                startTour(tour.id);
            });
            break;
        }
    }, [
        pathname,
        i18nReady,
        stateLoaded,
        isRunning,
        tourState.completedTours,
        tourState.skippedTours,
        userRole,
        hasLeagues,
        hasSubmissions,
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // Filtered Tour Steps (must come before Tour Actions)
    // ─────────────────────────────────────────────────────────────────────────

    const featureFlagKeys = useMemo(() => {
        if (!activeTour) return [];
        const keys = activeTour.steps
            .map((step) => step.featureFlag)
            .filter((flag): flag is string => !!flag);
        return Array.from(new Set(keys));
    }, [activeTour]);

    const featureFlags = useFeatureFlags(featureFlagKeys as AppSettingKey[]);

    const filteredTourSteps = useMemo(() => {
        if (!activeTour) return [];
        return filterTourSteps(
            activeTour.steps,
            isMobile,
            userRole,
            featureFlags,
            activeVariant,
            activeTour.mobile
        );
    }, [activeTour, isMobile, userRole, featureFlags, activeVariant]);

    // ─────────────────────────────────────────────────────────────────────────
    // Tour Actions
    // ─────────────────────────────────────────────────────────────────────────

    const startTour = useCallback(
        (tourId: string) => {
            const baseTour = getTour(tourId);
            if (!baseTour) {
                console.warn(`[TourProvider] Tour not found: ${tourId}`);
                return;
            }

            let selectedVariant: string | null = null;
            if (baseTour.experiment) {
                const experiment = getTourExperimentVariant(baseTour.experiment);
                selectedVariant = experiment.variant;
                if (experiment.isEligible) {
                    trackExperimentEnrollment(experiment.experimentId, experiment.variant);
                }
            }

            // Apply experiment variant if applicable
            const tour = getVariantTour(baseTour, selectedVariant || undefined);

            // Check role requirement
            if (tour.requiredRole && tour.requiredRole !== userRole) {
                console.warn(`[TourProvider] User lacks role for tour: ${tourId}`);
                return;
            }

            // Check path requirement
            if (tour.requiredPath) {
                const isValidPath = tour.requiredPath instanceof RegExp
                    ? tour.requiredPath.test(pathname)
                    : pathname === tour.requiredPath;

                if (!isValidPath) {
                    console.warn(
                        `[TourProvider] Cannot start tour "${tourId}" - not on required path. ` +
                        `Current: ${pathname}, Required: ${tour.requiredPath}`
                    );
                    return;
                }
            }

            // Special handling for analytics tour - auto-switch to "both" view mode
            if (tourId === 'analytics-v1' && typeof document !== 'undefined') {
                const currentViewMode = document.querySelector('[data-view-mode]')?.getAttribute('data-view-mode');

                if (currentViewMode && currentViewMode !== 'both') {
                    console.log('[TourProvider] Analytics tour requires "both" view mode, switching from:', currentViewMode);
                    setOriginalViewMode(currentViewMode);

                    // Dispatch custom event to switch view mode
                    window.dispatchEvent(new CustomEvent('tour:switch-view-mode', {
                        detail: { mode: 'both', restoreMode: currentViewMode }
                    }));

                    // Wait for view mode switch before starting tour
                    setTimeout(() => {
                        // Edge case: Check if user navigated away during timeout
                        if (window.location.pathname !== pathname) {
                            console.log('[TourProvider] User navigated away during view mode switch, canceling tour start');
                            setOriginalViewMode(null);
                            return;
                        }

                        // Add body class for CSS targeting
                        if (typeof document !== 'undefined') {
                            document.body.classList.add('joyride-active');
                        }

                        // Set state using startTransition for performance
                        startTransition(() => {
                            setActiveTour(tour);
                            setStepIndex(0);
                            setIsRunning(true);
                            setActiveVariant(selectedVariant);
                        });

                        // Track analytics timestamps (actual tracking in effect)
                        tourStartTime.current = Date.now();
                        stepStartTime.current = Date.now();
                    }, 200); // Wait for view mode switch
                    return;
                }
            }

            // Add body class for CSS targeting
            if (typeof document !== 'undefined') {
                document.body.classList.add('joyride-active');
            }

            // Set state using startTransition for performance
            startTransition(() => {
                setActiveTour(tour);
                setStepIndex(0);
                setIsRunning(true);
                setActiveVariant(selectedVariant);
            });

            // Track analytics timestamps (actual tracking in effect)
            tourStartTime.current = Date.now();
            stepStartTime.current = Date.now();
        },
        [userRole, userId, pathname]
    );

    // Keep ref in sync with latest startTour function
    useEffect(() => {
        startTourRef.current = startTour;
    }, [startTour]);

    // ─────────────────────────────────────────────────────────────────────────
    // Hash-based tour launch (separate from initialization for proper timing)
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        // Only check hash when all dependencies are ready
        if (!i18nReady || !stateLoaded || !startTourRef.current) {
            console.log('[TourProvider] Hash check NOT ready yet:', {
                i18nReady,
                stateLoaded,
                hasStartTourRef: !!startTourRef.current,
                currentHash: window.location.hash
            });
            return;
        }

        console.log('[TourProvider] Hash check ready:', {
            i18nReady,
            stateLoaded,
            hasStartTourRef: !!startTourRef.current,
            currentHash: window.location.hash
        });

        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#tour-')) {
                const tour = getTourByHash(hash);
                if (tour && startTourRef.current) {
                    console.log('[TourProvider] Starting tour from hash:', {
                        tourId: tour.id,
                        hash
                    });

                    // Universal tour switching logic - works for ALL tour combinations
                    // If ANY tour is running and user wants to start ANY other tour, ask them
                    if (isRunning && activeTour) {
                        // Get translated tour names using i18n - works for all tours automatically
                        const fromTourName = activeTour.nameKey ? t(activeTour.nameKey) : activeTour.id;
                        const toTourName = tour.nameKey ? t(tour.nameKey) : tour.id;

                        console.log('[TourProvider] Tour already running, asking user if they want to switch:', {
                            from: activeTour.id,
                            to: tour.id
                        });

                        // Set pending switch state - will trigger universal confirmation dialog
                        setPendingTourSwitch({
                            fromTourId: activeTour.id,
                            fromTourName,
                            toTourId: tour.id,
                            toTourName
                        });

                        // Clear hash so back button works correctly
                        window.history.replaceState(null, '',
                            `${window.location.pathname}${window.location.search}`
                        );
                        return;
                    }

                    // Use setTimeout to ensure page elements are rendered
                    setTimeout(() => {
                        // Edge case: Check if user navigated away during timeout
                        if (!window.location.hash.startsWith('#tour-')) {
                            console.log('[TourProvider] User navigated away, canceling tour start');
                            return;
                        }

                        startTourRef.current?.(tour.id);

                        // Remove hash after starting
                        window.history.replaceState(
                            null,
                            '',
                            `${window.location.pathname}${window.location.search}`
                        );
                    }, 100); // Small delay for DOM elements to render
                }
            }
        };

        // Check hash on mount (when all deps are ready)
        handleHashChange();

        // Listen for future hash changes
        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [i18nReady, stateLoaded, isRunning]); // Dependencies: wait for readiness

    // ─────────────────────────────────────────────────────────────────────────
    // Feedback dialog - show after ANY tour completes and state settles
    // Universal effect - applies to all tours automatically
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        // This effect runs for ALL tours - no tour-specific logic
        // Only show dialog when:
        // 1. There's a completed tour ID (any tour)
        // 2. Tour is NOT running (state has settled for any tour)
        // 3. No active tour (universal state)
        // 4. Dialog is not already showing
        if (lastCompletedTourId && !isRunning && !activeTour && !showFeedbackDialog) {
            console.log('[TourProvider] Opening feedback dialog for completed tour:', lastCompletedTourId);
            setShowFeedbackDialog(true);
        }
    }, [lastCompletedTourId, isRunning, activeTour, showFeedbackDialog]);

    const startContextualTour = useCallback(() => {
        const pathTours = getToursForPath(pathname);
        if (pathTours.length > 0) {
            startTour(pathTours[0].id);
        }
    }, [pathname, startTour]);

    const skipTour = useCallback(() => {
        if (!activeTour) return;

        // Cancel any pending validations
        cancelAllValidations();

        // Restore view mode if it was changed for analytics tour
        if (originalViewMode && activeTour.id === 'analytics-v1') {
            console.log('[TourProvider] Restoring view mode to:', originalViewMode);
            window.dispatchEvent(new CustomEvent('tour:switch-view-mode', {
                detail: { mode: originalViewMode }
            }));
            setOriginalViewMode(null);
        }

        // Track skip
        tourAnalytics.trackTourComplete({
            tourId: activeTour.id,
            tourVersion: activeTour.version,
            completionType: 'skipped',
            stepsCompleted: stepIndex,
            totalSteps: filteredTourSteps.length || activeTour.steps.length,
            durationMs: Date.now() - tourStartTime.current,
            userId,
        });

        // Update state
        startTransition(() => {
            setTourState((prev) => {
                const newState = {
                    ...prev,
                    skippedTours: {
                        ...prev.skippedTours,
                        [activeTour.id]: Date.now(),
                    },
                };
                saveTourState(newState);
                return newState;
            });
            setActiveTour(null);
            setIsRunning(false);
            setStepIndex(0);
        });

        setActiveVariant(null);
        trackedTourStartRef.current = null;
        if (typeof document !== 'undefined') {
            document.body.classList.remove('joyride-active');
        }
    }, [activeTour, stepIndex, userId, filteredTourSteps.length, originalViewMode]);

    const completeTour = useCallback(() => {
        if (!activeTour) return;

        // Cancel any pending validations
        cancelAllValidations();

        // Restore view mode if it was changed for analytics tour
        if (originalViewMode && activeTour.id === 'analytics-v1') {
            console.log('[TourProvider] Restoring view mode to:', originalViewMode);
            window.dispatchEvent(new CustomEvent('tour:switch-view-mode', {
                detail: { mode: originalViewMode }
            }));
            setOriginalViewMode(null);
        }

        // Track completion
        tourAnalytics.trackTourComplete({
            tourId: activeTour.id,
            tourVersion: activeTour.version,
            completionType: 'completed',
            stepsCompleted: filteredTourSteps.length || activeTour.steps.length,
            totalSteps: filteredTourSteps.length || activeTour.steps.length,
            durationMs: Date.now() - tourStartTime.current,
            userId,
        });

        if (activeTour.experiment && activeVariant) {
            trackExperimentConversion(activeTour.experiment.experimentId, activeVariant);
        }

        // Update state
        startTransition(() => {
            setTourState((prev) => {
                const newState = {
                    ...prev,
                    completedTours: {
                        ...prev.completedTours,
                        [activeTour.id]: activeTour.version,
                    },
                };
                saveTourState(newState);
                return newState;
            });
            setActiveTour(null);
            setIsRunning(false);
            setStepIndex(0);
        });

        setActiveVariant(null);
        trackedTourStartRef.current = null;
        setLastCompletedTourId(activeTour.id);
        // Note: Feedback dialog is shown via effect (after state settles) - not synchronously
        if (typeof document !== 'undefined') {
            document.body.classList.remove('joyride-active');
        }
    }, [activeTour, userId, filteredTourSteps.length, activeVariant, originalViewMode]);

    const resetAllTours = useCallback(() => {
        startTransition(() => {
            setTourState(DEFAULT_TOUR_STATE);
            saveTourState(DEFAULT_TOUR_STATE);
            setActiveTour(null);
            setIsRunning(false);
            setStepIndex(0);
        });
        setActiveVariant(null);
        trackedTourStartRef.current = null;
        if (typeof document !== 'undefined') {
            document.body.classList.remove('joyride-active');
        }
    }, []);

    const hasCompletedTour = useCallback(
        (tourId: string): boolean => {
            return !!tourState.completedTours[tourId];
        },
        [tourState.completedTours]
    );

    const getCompletionStatus = useCallback((): Record<string, boolean> => {
        const status: Record<string, boolean> = {};
        Object.keys(tourState.completedTours).forEach((id) => {
            status[id] = true;
        });
        return status;
    }, [tourState.completedTours]);

    // ─────────────────────────────────────────────────────────────────────────
    // Joyride Callback
    // ─────────────────────────────────────────────────────────────────────────

    const handleJoyrideCallback = useCallback(
        (data: CallBackProps) => {
            const { status, type, action, index } = data;

            // Handle error status (including missing target elements)
            if (status === STATUS.ERROR) {
                console.warn('[TourProvider] Tour error at step:', index, data);

                if (activeTour) {
                    const step = filteredTourSteps[index];
                    if (step) {
                        tourAnalytics.trackTourDropOff({
                            tourId: activeTour.id,
                            stepId: step.id,
                            stepIndex: index,
                            totalSteps: filteredTourSteps.length || activeTour.steps.length,
                            durationMs: Date.now() - tourStartTime.current,
                            reason: 'error',
                        });
                    }
                }

                // Auto-advance to next step instead of closing tour
                if (index < filteredTourSteps.length - 1) {
                    console.log('[TourProvider] Auto-advancing to next step after error');
                    startTransition(() => {
                        setStepIndex(index + 1);
                    });
                    stepStartTime.current = Date.now();
                } else {
                    // Last step - complete tour
                    console.log('[TourProvider] Last step encountered error, completing tour');
                    completeTour();
                }
                return;
            }

            // Tour finished
            if (status === STATUS.FINISHED) {
                completeTour();
                return;
            }

            // Tour skipped
            if (status === STATUS.SKIPPED || action === ACTIONS.SKIP) {
                skipTour();
                return;
            }

            if (action === ACTIONS.CLOSE && activeTour) {
                const step = filteredTourSteps[stepIndex];
                if (step) {
                    tourAnalytics.trackTourDropOff({
                        tourId: activeTour.id,
                        stepId: step.id,
                        stepIndex,
                        totalSteps: filteredTourSteps.length || activeTour.steps.length,
                        durationMs: Date.now() - tourStartTime.current,
                        reason: 'close',
                    });
                }
                skipTour();
                return;
            }

            // Step navigation
            if (type === EVENTS.STEP_AFTER && activeTour) {
                // Track step completion
                const step = filteredTourSteps[index];
                if (step && action === ACTIONS.NEXT) {
                    tourAnalytics.trackStepCompleted({
                        tourId: activeTour.id,
                        stepId: step.id,
                        stepIndex: index,
                        durationMs: Date.now() - stepStartTime.current,
                        userId,
                    });
                }

                // Update step index
                if (action === ACTIONS.NEXT) {
                    startTransition(() => {
                        setStepIndex((prev) => prev + 1);
                    });
                } else if (action === ACTIONS.PREV) {
                    startTransition(() => {
                        setStepIndex((prev) => prev - 1);
                    });
                }

                // Reset step timer
                stepStartTime.current = Date.now();
            }
        },
        [activeTour, completeTour, skipTour, userId, filteredTourSteps, stepIndex]
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Context Value
    // ─────────────────────────────────────────────────────────────────────────

    const contextValue = useMemo<TourContextType>(
        () => ({
            startTour,
            startContextualTour,
            skipTour,
            resetAllTours,
            isRunning,
            activeTour,
            currentStepIndex: stepIndex,
            hasCompletedTour,
            getCompletionStatus,
            pendingTourSwitch: !!pendingTourSwitch, // Flag to indicate tour switch confirmation is showing
        }),
        [
            startTour,
            startContextualTour,
            skipTour,
            resetAllTours,
            isRunning,
            activeTour,
            stepIndex,
            hasCompletedTour,
            getCompletionStatus,
            pendingTourSwitch,
        ]
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Joyride Steps
    // ─────────────────────────────────────────────────────────────────────────

    const joyrideSteps = useMemo(() => {
        if (!activeTour || !i18nReady) return [];
        return transformSteps(filteredTourSteps, isMobile, activeTour.mobile);
    }, [activeTour, filteredTourSteps, i18nReady, isMobile]);

    useEffect(() => {
        if (!activeTour || !isRunning || !i18nReady) return;
        if (trackedTourStartRef.current === activeTour.id) return;
        trackedTourStartRef.current = activeTour.id;
        tourAnalytics.trackTourStart({
            tourId: activeTour.id,
            tourVersion: activeTour.version,
            tourCategory: activeTour.category,
            totalSteps: filteredTourSteps.length || activeTour.steps.length,
            variant: activeVariant || activeTour.experiment?.defaultVariant,
            userId,
        });
    }, [activeTour, isRunning, i18nReady, filteredTourSteps.length, activeVariant, userId]);

    useEffect(() => {
        if (!activeTour || !isRunning) return;
        const step = filteredTourSteps[stepIndex];
        if (!step) return;
        tourAnalytics.trackStepViewed({
            tourId: activeTour.id,
            stepId: step.id,
            stepIndex,
            totalSteps: filteredTourSteps.length || activeTour.steps.length,
        });
    }, [activeTour, isRunning, stepIndex, filteredTourSteps, filteredTourSteps.length]);

    useEffect(() => {
        if (!activeTour || !isRunning) return;
        const step = filteredTourSteps[stepIndex];
        if (!step?.interactive?.enabled) return;

        let isCancelled = false;

        const runValidation = async () => {
            const result = await validateStep(step.interactive!.validation);
            if (isCancelled) return;

            tourAnalytics.trackValidationResult({
                tourId: activeTour.id,
                stepId: step.id,
                result: result.success ? 'success' : result.reason === 'timeout' ? 'timeout' : 'cancelled',
                userId,
            });

            if (result.success) {
                startTransition(() => {
                    setStepIndex((prev) => Math.min(prev + 1, filteredTourSteps.length - 1));
                });
            } else {
                step.interactive?.onValidationFail?.();
            }
        };

        runValidation();

        return () => {
            isCancelled = true;
        };
    }, [activeTour, isRunning, stepIndex, filteredTourSteps, userId]);

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <TourContext.Provider value={contextValue}>
            {children}

            {isRunning && activeTour && i18nReady && (
                <Joyride
                    steps={joyrideSteps}
                    stepIndex={stepIndex}
                    run={isRunning}
                    continuous
                    showProgress
                    showSkipButton
                    scrollToFirstStep
                    disableScrollParentFix
                    callback={handleJoyrideCallback}
                    locale={{
                        back: t('common.buttons.previous'),
                        close: t('common.buttons.close'),
                        last: t('common.buttons.finish'),
                        next: t('common.buttons.next'),
                        skip: t('common.buttons.skip'),
                    }}
                    styles={{
                        options: {
                            zIndex: 10000,
                            primaryColor: 'hsl(var(--primary))',
                            textColor: 'hsl(var(--foreground))',
                            backgroundColor: 'hsl(var(--card))',
                            arrowColor: 'hsl(var(--card))',
                            overlayColor: 'rgba(0, 0, 0, 0.5)',
                        },
                        tooltip: {
                            borderRadius: 'var(--radius)',
                            fontSize: '0.875rem',
                            padding: '1rem',
                            maxWidth: 'min(90vw, 340px)',
                            margin: '0 8px',
                        },
                        tooltipTitle: {
                            fontSize: '1rem',
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                        },
                        tooltipContent: {
                            padding: '0.5rem 0',
                        },
                        buttonNext: {
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                            borderRadius: 'var(--radius)',
                            fontSize: '0.875rem',
                            padding: '0.5rem 1rem',
                        },
                        buttonBack: {
                            color: 'hsl(var(--muted-foreground))',
                            fontSize: '0.875rem',
                        },
                        buttonSkip: {
                            color: 'hsl(var(--muted-foreground))',
                            fontSize: '0.75rem',
                        },
                        spotlight: {
                            borderRadius: 'var(--radius)',
                        },
                    }}
                />
            )}

            {/* Tour switch confirmation dialog - universal for all tours */}
            {pendingTourSwitch && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10001]"
                    onClick={() => setPendingTourSwitch(null)}
                >
                    <div
                        className="bg-card border border-border rounded-lg p-6 max-w-md mx-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-2">
                            Switch Tours?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            You're currently in the <strong>{pendingTourSwitch.fromTourName}</strong> tour.
                            Would you like to switch to the <strong>{pendingTourSwitch.toTourName}</strong> tour,
                            or complete your current tour first?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    // Switch to new tour
                                    console.log('[TourProvider] User chose to switch tours');
                                    skipTour(); // End current tour without feedback
                                    setTimeout(() => {
                                        startTour(pendingTourSwitch.toTourId);
                                        setPendingTourSwitch(null);
                                    }, 100); // Brief delay for state to settle
                                }}
                                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
                            >
                                Switch to {pendingTourSwitch.toTourName}
                            </button>
                            <button
                                onClick={() => {
                                    // Stay in current tour
                                    console.log('[TourProvider] User chose to stay in current tour');
                                    setPendingTourSwitch(null);
                                }}
                                className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-accent transition"
                            >
                                Continue Current Tour
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {lastCompletedTourId && (
                <TourFeedbackDialog
                    open={showFeedbackDialog}
                    onOpenChange={(open) => {
                        setShowFeedbackDialog(open);
                        if (!open) {
                            setLastCompletedTourId(null); // Clear trigger when dialog closes
                        }
                    }}
                    tourId={lastCompletedTourId}
                />
            )}
        </TourContext.Provider>
    );
}
