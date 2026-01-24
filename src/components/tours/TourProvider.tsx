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
    needsMigration,
    isMajorUpgrade,
} from '@/lib/tours/migrations';
import { getVariantTour } from '@/lib/tours/experiments';
import { tourAnalytics } from '@/lib/tours/unified-analytics';
import { initTourI18n, loadTourTranslations, t } from '@/lib/tours/i18n';
import { cancelAllValidations } from '@/lib/tours/validation';

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

function transformSteps(
    steps: TourStep[],
    isMobile: boolean
): Step[] {
    return steps
        .filter((step) => !(isMobile && step.hideOnMobile))
        .map((step) => {
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

            return {
                target: step.target,
                content: t(contentKey),
                title: titleKey ? t(titleKey) : undefined,
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

    const tourStartTime = useRef<number>(0);
    const stepStartTime = useRef<number>(0);

    // ─────────────────────────────────────────────────────────────────────────
    // Initialization
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        // Load saved state
        const state = loadTourState();
        setTourState(state);

        // Initialize i18n
        initTourI18n().then(() => {
            loadTourTranslations('en').then(() => {
                setI18nReady(true);
            });
        });

        // Set user ID for analytics
        if (userId) {
            tourAnalytics.setUserId(userId);
        }

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
                localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(tourState));
            }
        };
        window.addEventListener('beforeunload', handleUnload);

        // Handle hash-based tour launch
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith('#tour-')) {
                const tour = getTourByHash(hash);
                if (tour) {
                    startTour(tour.id);
                    // Remove hash after starting
                    window.history.replaceState(null, '', pathname);
                }
            }
        };
        handleHashChange(); // Check on mount
        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('beforeunload', handleUnload);
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Auto-Start Logic
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!i18nReady || isRunning) return;

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
            if (!tour.autoStart?.onFirstVisit) continue;

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
    }, [pathname, i18nReady, isRunning, tourState.completedTours, userRole]);

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

            // Apply experiment variant if applicable
            const tour = getVariantTour(baseTour);

            // Check role requirement
            if (tour.requiredRole && tour.requiredRole !== userRole) {
                console.warn(`[TourProvider] User lacks role for tour: ${tourId}`);
                return;
            }

            // Add body class for CSS targeting
            document.body.classList.add('joyride-active');

            // Set state using startTransition for performance
            startTransition(() => {
                setActiveTour(tour);
                setStepIndex(0);
                setIsRunning(true);
            });

            // Track analytics
            tourStartTime.current = Date.now();
            stepStartTime.current = Date.now();

            tourAnalytics.trackTourStart({
                tourId: tour.id,
                tourVersion: tour.version,
                tourCategory: tour.category,
                totalSteps: tour.steps.length,
                variant: tour.experiment?.defaultVariant,
                userId,
            });
        },
        [userRole, userId]
    );

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

        // Track skip
        tourAnalytics.trackTourComplete({
            tourId: activeTour.id,
            tourVersion: activeTour.version,
            completionType: 'skipped',
            stepsCompleted: stepIndex,
            totalSteps: activeTour.steps.length,
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

        document.body.classList.remove('joyride-active');
    }, [activeTour, stepIndex, userId]);

    const completeTour = useCallback(() => {
        if (!activeTour) return;

        // Cancel any pending validations
        cancelAllValidations();

        // Track completion
        tourAnalytics.trackTourComplete({
            tourId: activeTour.id,
            tourVersion: activeTour.version,
            completionType: 'completed',
            stepsCompleted: activeTour.steps.length,
            totalSteps: activeTour.steps.length,
            durationMs: Date.now() - tourStartTime.current,
            userId,
        });

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

        document.body.classList.remove('joyride-active');
    }, [activeTour, userId]);

    const resetAllTours = useCallback(() => {
        startTransition(() => {
            setTourState(DEFAULT_TOUR_STATE);
            saveTourState(DEFAULT_TOUR_STATE);
            setActiveTour(null);
            setIsRunning(false);
            setStepIndex(0);
        });
        document.body.classList.remove('joyride-active');
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

            // Step navigation
            if (type === EVENTS.STEP_AFTER && activeTour) {
                // Track step completion
                const step = activeTour.steps[index];
                if (step) {
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
        [activeTour, completeTour, skipTour, userId]
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
        ]
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Joyride Steps
    // ─────────────────────────────────────────────────────────────────────────

    const joyrideSteps = useMemo(() => {
        if (!activeTour || !i18nReady) return [];
        return transformSteps(activeTour.steps, isMobile);
    }, [activeTour, isMobile, i18nReady]);

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
        </TourContext.Provider>
    );
}
