"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import Joyride, { CallBackProps, STATUS, ACTIONS, EVENTS, Step } from "react-joyride";
import { usePathname, useSearchParams } from "next/navigation";

// Tour names
export type TourName = "new-user" | "member" | "admin" | "leaderboard" | "navigation";

// Step with optional role requirement
interface OnboardingStep extends Step {
    requiresAdmin?: boolean;
}

// ============================================
// HELPER: Check if element exists in DOM
// ============================================
function isElementVisible(selector: string): boolean {
    if (selector === "body") return true;
    if (typeof document === "undefined") return false;
    return document.querySelector(selector) !== null;
}

// ============================================
// TOUR DEFINITIONS - Redesigned for UX
// ============================================

/**
 * WELCOME TOUR - Dashboard orientation for new users
 * Brief intro, points to key actions
 */
const newUserTour: OnboardingStep[] = [
    {
        target: "body",
        content: "👟 Welcome to StepLeague! Let's get you started in under a minute.",
        placement: "center",
        disableBeacon: true,
    },
    {
        target: '[data-tour="dashboard-header"]',
        content: "This is your home base. All your leagues and stats appear here.",
        placement: "bottom",
    },
    {
        target: '[data-tour="create-league"]',
        content: "🏆 Start your own competition! You'll get an invite code to share with friends.",
        placement: "bottom",
    },
    {
        target: '[data-tour="join-league"]',
        content: "🔗 Have an invite code? Join an existing league here.",
        placement: "bottom",
    },
    {
        target: "body",
        content: "That's the basics! Once you're in a league, check out 'How to Submit Steps' in the Help menu. 💪",
        placement: "center",
    },
];

/**
 * SUBMISSION TOUR - Deep-dive into the 3 submission modes
 * Explains each mode clearly and the difference between verified/unverified
 */
const memberTour: OnboardingStep[] = [
    {
        target: "body",
        content: "📝 Welcome! Let's learn how to submit your daily steps. There are 3 different ways to upload, each with different verification levels.",
        placement: "center",
        disableBeacon: true,
    },
    {
        target: '[data-tour="batch-toggle"]',
        content: "🎛️ MODE SELECTOR: Switch between the 3 submission modes here. Let me explain what each one does...",
        placement: "bottom",
    },
    {
        target: '[data-tour="submission-form"]',
        content: "📸 BATCH UPLOAD (Recommended)\n\n• Upload multiple screenshots at once\n• AI automatically extracts dates & step counts\n• Review and edit before submitting\n• Result: ✅ VERIFIED submissions",
        placement: "top",
    },
    {
        target: '[data-tour="submission-form"]',
        content: "📷 SINGLE ENTRY\n\n• Pick a specific date manually\n• Enter your step count\n• Upload one screenshot for AI verification\n• Result: ✅ VERIFIED if AI confirms match",
        placement: "top",
    },
    {
        target: '[data-tour="submission-form"]',
        content: "✏️ BULK MANUAL\n\n• Enter multiple days of steps at once\n• No screenshot required\n• Great for catching up on missed days\n• Result: ⚠️ UNVERIFIED submissions",
        placement: "top",
    },
    {
        target: "body",
        content: "✅ VERIFIED vs ⚠️ UNVERIFIED\n\n• Verified = AI confirmed your screenshot matches your steps\n• Unverified = Manual entry without proof\n\nLeague admins can filter leaderboards to 'verified only' for fair competition. Your verified submissions get a ✓ badge!",
        placement: "center",
    },
];

/**
 * LEADERBOARD TOUR - Explains filters and competition features
 */
const leaderboardTour: OnboardingStep[] = [
    {
        target: "body",
        content: "🏆 See how you rank against your league! Let me show you the powerful filters.",
        placement: "center",
        disableBeacon: true,
    },
    {
        target: "body",
        content: "🌍 GLOBAL vs LEAGUE: This is your league's leaderboard. Your steps also count on the Global Leaderboard (found in main navigation) where ALL StepLeague users compete worldwide. Your nickname is visible to everyone!",
        placement: "center",
        disableBeacon: false,
    },
    {
        target: '[data-tour="leaderboard-filters"]',
        content: "📅 TIME PERIOD: Filter by today, this week, last 30 days, or pick custom dates for any range.",
        placement: "bottom",
    },
    {
        target: '[data-tour="verified-filter"]',
        content: "✓ VERIFIED FILTER: Show only AI-verified submissions for fair competition. Unverified entries won't count!",
        placement: "bottom",
    },
    {
        target: '[data-tour="leaderboard-table"]',
        content: "📊 RANKINGS: See total steps, daily average, streaks, and badges. Click your row to see more details.",
        placement: "top",
    },
    {
        target: '[data-tour="share-button"]',
        content: "🎉 SHARE: Brag about your rank! Creates a shareable image for social media.",
        placement: "left",
    },
];

/**
 * ADMIN TOUR - League owner specific features
 */
const adminTour: OnboardingStep[] = [
    {
        target: "body",
        content: "👑 As league owner, you have extra powers! Let me show you.",
        placement: "center",
        disableBeacon: true,
        requiresAdmin: true,
    },
    {
        target: '[data-tour="invite-button"]',
        content: "🔗 INVITE FRIENDS: Share this code or copy the link. Anyone with it can join your league!",
        placement: "bottom",
        requiresAdmin: true,
    },
    {
        target: '[data-tour="proxy-members"]',
        content: "👤 PROXY MEMBERS: Add placeholders for people not signed up yet. Submit steps on their behalf, then link their real account when they join!",
        placement: "top",
        requiresAdmin: true,
    },
    {
        target: "body",
        content: "🔍 ADMIN DUTIES: You'll see flagged submissions when AI detects mismatches. Review them to keep competition fair!",
        placement: "center",
        requiresAdmin: true,
    },
];

/**
 * NAVIGATION TOUR - Menu system and how to get around
 * Covers header nav, dropdowns, and admin-specific menu items
 */
const navigationTour: OnboardingStep[] = [
    {
        target: "body",
        content: "🧭 Let me show you how to navigate around StepLeague!",
        placement: "center",
        disableBeacon: true,
    },
    {
        target: '[data-tour="nav-dashboard"]',
        content: "🏠 DASHBOARD: Your home base. Click here anytime to see all your leagues.",
        placement: "bottom",
    },
    {
        target: '[data-tour="nav-league-menu"]',
        content: "🏆 LEAGUE MENU: Quick access to your current league's pages - submission form, leaderboard, and analytics.",
        placement: "bottom",
    },
    {
        target: '[data-tour="nav-actions-menu"]',
        content: "⚡ ACTIONS: Create a new league, join with a code, or submit steps quickly.",
        placement: "bottom",
    },
    {
        target: '[data-tour="nav-user-menu"]',
        content: "👤 YOUR PROFILE: Settings, help guides, and sign out. All your tours are in 'Guides & Help'!",
        placement: "bottom",
    },
    {
        target: "body",
        content: "💡 TIP: League owners see extra options like invite codes and member management. Admins get even more!",
        placement: "center",
    },
];

// ============================================
// CONTEXT
// ============================================

interface OnboardingContextType {
    startTour: (tour: TourName) => void;
    startContextualTour: () => void;
    resetAllTours: () => void;
    skipTour: () => void;
    isRunning: boolean;
    hasCompletedTour: (tour: TourName) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error("useOnboarding must be used within an OnboardingProvider");
    }
    return context;
}

// ============================================
// PROVIDER
// ============================================

interface OnboardingProviderProps {
    children: ReactNode;
    isAdmin?: boolean;
    hasLeagues?: boolean;
}

const STORAGE_KEY = "stepleague-onboarding";

interface OnboardingState {
    completedTours: TourName[];
    lastSeenVersion: string;
}

const CURRENT_VERSION = "1.0.0";

export function OnboardingProvider({ children, isAdmin = false, hasLeagues = false }: OnboardingProviderProps) {
    const pathname = usePathname();
    const [run, setRun] = useState(false);
    const [steps, setSteps] = useState<Step[]>([]);
    const [stepIndex, setStepIndex] = useState(0);
    const [activeTour, setActiveTour] = useState<TourName | null>(null);
    const [state, setState] = useState<OnboardingState>({
        completedTours: [],
        lastSeenVersion: CURRENT_VERSION,
    });
    const [isHydrated, setIsHydrated] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackType, setFeedbackType] = useState<"positive" | "negative" | null>(null);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    // Load state from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as OnboardingState;
                setState(parsed);
            }
        } catch {
            // Ignore errors
        }
        setIsHydrated(true);
    }, []);

    // Save state to localStorage
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
    }, [state, isHydrated]);

    // Toggle body class when tour is running to allow CSS to lower header z-index
    useEffect(() => {
        if (run) {
            document.body.classList.add('joyride-active');
        } else {
            document.body.classList.remove('joyride-active');
        }
        return () => document.body.classList.remove('joyride-active');
    }, [run]);

    const hasCompletedTour = useCallback((tour: TourName) => {
        return state.completedTours.includes(tour);
    }, [state.completedTours]);

    const markTourComplete = useCallback((tour: TourName) => {
        setState(prev => ({
            ...prev,
            completedTours: prev.completedTours.includes(tour)
                ? prev.completedTours
                : [...prev.completedTours, tour],
        }));
    }, []);

    const startTour = useCallback((tour: TourName) => {
        let tourSteps: OnboardingStep[] = [];

        switch (tour) {
            case "new-user":
                tourSteps = newUserTour;
                break;
            case "member":
                tourSteps = [...memberTour];
                break;
            case "leaderboard":
                tourSteps = leaderboardTour;
                break;
            case "admin":
                tourSteps = adminTour;
                break;
            case "navigation":
                tourSteps = navigationTour;
                break;
        }

        // Filter out admin-only steps if not admin
        if (!isAdmin) {
            tourSteps = tourSteps.filter(step => !step.requiresAdmin);
        }

        // Filter to only steps with visible targets (fixes step count issue)
        const visibleSteps = tourSteps.filter(step => {
            const target = typeof step.target === "string" ? step.target : "body";
            return isElementVisible(target);
        });

        if (visibleSteps.length === 0) {
            console.log("No visible tour elements found");
            return;
        }

        setActiveTour(tour);
        setSteps(visibleSteps);
        setStepIndex(0);
        setRun(true);
    }, [pathname, isAdmin]);

    const startContextualTour = useCallback(() => {
        // Determine which tour based on context
        if (pathname === "/dashboard") {
            if (!hasLeagues && !hasCompletedTour("new-user")) {
                startTour("new-user");
            }
        } else if (pathname.match(/\/league\/[^/]+$/)) {
            // On league submit page
            if (!hasCompletedTour("member")) {
                startTour("member");
            }
        } else if (pathname.includes("/leaderboard")) {
            // Show leaderboard-specific tour (use member tour which handles leaderboard)
            if (!hasCompletedTour("member")) {
                startTour("member");
            }
        }
    }, [pathname, hasLeagues, hasCompletedTour, startTour]);

    const searchParams = useSearchParams();

    // Auto-start tour based on context or query param
    useEffect(() => {
        if (!isHydrated) return;

        // Check for explicit start_tour param first
        const tourParam = searchParams?.get("start_tour");
        if (tourParam) {
            // Clear the param from URL to prevent loop, then start tour
            const url = new URL(window.location.href);
            url.searchParams.delete("start_tour");
            window.history.replaceState({}, "", url.toString());

            // Short delay to ensure page content is ready
            setTimeout(() => {
                startTour(tourParam as TourName);
            }, 500);
            return;
        }

        // Otherwise run standard contextual check
        const timer = setTimeout(() => {
            startContextualTour();
        }, 1000);

        return () => clearTimeout(timer);
    }, [isHydrated, pathname, searchParams, startContextualTour, startTour]);

    // Listen for custom event from NavHeader - supports explicit tour selection
    useEffect(() => {
        const handleStartTour = (event: Event) => {
            const customEvent = event as CustomEvent<{ tour?: TourName }>;
            const requestedTour = customEvent.detail?.tour;

            // If explicit tour requested, use it
            if (requestedTour) {
                startTour(requestedTour);
                return;
            }

            // Otherwise, start contextual tour based on current page
            if (pathname === "/dashboard") {
                startTour("new-user");
            } else if (pathname.match(/\/league\/[^/]+/)) {
                startTour("member");
            } else {
                startTour("new-user");
            }
        };

        window.addEventListener('start-onboarding-tour', handleStartTour);
        return () => window.removeEventListener('start-onboarding-tour', handleStartTour);
    }, [pathname, startTour]);

    const resetAllTours = useCallback(() => {
        setState({ completedTours: [], lastSeenVersion: CURRENT_VERSION });
        setRun(false);
        setStepIndex(0);
    }, []);

    const skipTour = useCallback(() => {
        setRun(false);
        // Mark current tour as complete so it doesn't auto-start again
        if (activeTour) {
            markTourComplete(activeTour);
            setActiveTour(null);
        }
    }, [activeTour, markTourComplete]);

    const handleJoyrideCallback = useCallback((data: CallBackProps) => {
        const { status, action, index, type } = data;

        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
        }

        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setRun(false);
            // Mark the active tour as complete so it doesn't auto-start again
            if (activeTour) {
                markTourComplete(activeTour);
                setActiveTour(null);
            }
            // Show feedback prompt only if finished (not skipped)
            if (status === STATUS.FINISHED) {
                setShowFeedback(true);
            }
        }
    }, [activeTour, markTourComplete]);

    const handleFeedbackSubmit = async () => {
        if (!feedbackType) return;
        setFeedbackSubmitting(true);

        try {
            await fetch("/api/feedback/module", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    module_id: "onboarding-tour",
                    module_name: "Guided Tour",
                    feedback_type: feedbackType,
                    comment: feedbackComment || null,
                    page_url: typeof window !== "undefined" ? window.location.href : null,
                }),
            });
            setFeedbackSubmitted(true);
            setTimeout(() => {
                setShowFeedback(false);
                setFeedbackSubmitted(false);
                setFeedbackType(null);
                setFeedbackComment("");
            }, 2000);
        } catch (err) {
            console.error("Feedback submission failed:", err);
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const handleFeedbackClose = () => {
        setShowFeedback(false);
        setFeedbackType(null);
        setFeedbackComment("");
    };

    const contextValue: OnboardingContextType = {
        startTour,
        startContextualTour,
        resetAllTours,
        skipTour,
        isRunning: run,
        hasCompletedTour,
    };

    return (
        <OnboardingContext.Provider value={contextValue}>
            {children}
            {/* Only render Joyride after hydration to prevent server/client mismatch */}
            {isHydrated && (
                <Joyride
                    steps={steps}
                    stepIndex={stepIndex}
                    run={run}
                    continuous
                    showProgress
                    showSkipButton
                    scrollToFirstStep
                    spotlightClicks
                    callback={handleJoyrideCallback}
                    styles={{
                        options: {
                            arrowColor: "hsl(var(--card))",
                            backgroundColor: "hsl(var(--card))",
                            overlayColor: "rgba(0, 0, 0, 0.75)",
                            primaryColor: "hsl(var(--primary))",
                            textColor: "hsl(var(--foreground))",
                            zIndex: 10000,
                        },
                        tooltip: {
                            borderRadius: 12,
                            padding: 20,
                        },
                        tooltipTitle: {
                            fontSize: 18,
                            fontWeight: 600,
                        },
                        tooltipContent: {
                            fontSize: 14,
                            lineHeight: 1.6,
                        },
                        buttonNext: {
                            backgroundColor: "hsl(var(--primary))",
                            borderRadius: 8,
                            color: "hsl(var(--primary-foreground))",
                            fontSize: 14,
                            fontWeight: 600,
                            padding: "8px 16px",
                        },
                        buttonBack: {
                            color: "hsl(var(--muted-foreground))",
                            fontSize: 14,
                        },
                        buttonSkip: {
                            color: "hsl(var(--muted-foreground))",
                            fontSize: 13,
                        },
                        spotlight: {
                            borderRadius: 8,
                        },
                        beaconInner: {
                            backgroundColor: "hsl(var(--primary))",
                        },
                        beaconOuter: {
                            backgroundColor: "hsl(var(--primary) / 0.3)",
                            border: "2px solid hsl(var(--primary))",
                        },
                    }}
                    locale={{
                        back: "Back",
                        close: "Close",
                        last: "Done!",
                        next: "Next",
                        skip: "Skip tour",
                    }}
                />
            )}

            {/* Feedback Modal */}
            {showFeedback && isHydrated && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-80 rounded-xl bg-card border border-border shadow-2xl p-5 space-y-4">
                        {feedbackSubmitted ? (
                            <div className="text-center py-6">
                                <span className="text-3xl">✓</span>
                                <p className="mt-2 text-sm text-[hsl(var(--success))]">Thanks for your feedback!</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-200">How was the tour?</span>
                                    <button
                                        onClick={handleFeedbackClose}
                                        className="w-6 h-6 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-300"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setFeedbackType("positive")}
                                        className={`flex-1 py-2 rounded-lg text-sm transition ${feedbackType === "positive"
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500"
                                            : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                                            }`}
                                    >
                                        👍 Helpful
                                    </button>
                                    <button
                                        onClick={() => setFeedbackType("negative")}
                                        className={`flex-1 py-2 rounded-lg text-sm transition ${feedbackType === "negative"
                                            ? "bg-rose-500/20 text-rose-400 border border-rose-500"
                                            : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                                            }`}
                                    >
                                        👎 Needs work
                                    </button>
                                </div>

                                <textarea
                                    value={feedbackComment}
                                    onChange={(e) => setFeedbackComment(e.target.value)}
                                    placeholder="Any suggestions? (optional)"
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none resize-none"
                                />

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleFeedbackClose}
                                        className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-2 text-sm text-slate-400 hover:bg-slate-700 transition"
                                    >
                                        Skip
                                    </button>
                                    <button
                                        onClick={handleFeedbackSubmit}
                                        disabled={!feedbackType || feedbackSubmitting}
                                        className="flex-1 rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50 transition"
                                    >
                                        {feedbackSubmitting ? "Sending..." : "Submit"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </OnboardingContext.Provider>
    );
}

