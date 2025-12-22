"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import Joyride, { CallBackProps, STATUS, ACTIONS, EVENTS, Step } from "react-joyride";
import { usePathname } from "next/navigation";

// Tour names
export type TourName = "new-user" | "member" | "admin" | "leaderboard";

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
// TOUR DEFINITIONS
// ============================================

const newUserTour: OnboardingStep[] = [
    {
        target: "body",
        content: "Welcome to StepLeague! 👟 Let me show you around so you can start competing with friends.",
        placement: "center",
        disableBeacon: true,
    },
    {
        target: '[data-tour="dashboard-header"]',
        content: "This is your dashboard where you can see all your leagues and stats at a glance.",
        placement: "bottom",
    },
    {
        target: '[data-tour="create-league"]',
        content: "Create a new league to compete with friends. You'll get an invite code to share!",
        placement: "bottom",
    },
    {
        target: '[data-tour="join-league"]',
        content: "Or join an existing league using an invite code or link from a friend.",
        placement: "bottom",
    },
    {
        target: "body",
        content: "That's it for now! Create or join a league to get started. 🏆",
        placement: "center",
    },
];

const memberTour: OnboardingStep[] = [
    {
        target: "body",
        content: "Welcome to your league! Here's how to submit your daily steps and compete. 👟",
        placement: "center",
        disableBeacon: true,
    },
    {
        target: '[data-tour="submission-form"]',
        content: "This is the submission form. Upload a screenshot of your step count here.",
        placement: "right",
    },
    {
        target: '[data-tour="date-picker"]',
        content: "Select the date for your step submission. You can submit for past days too!",
        placement: "bottom",
    },
    {
        target: '[data-tour="steps-input"]',
        content: "Enter your step count. The AI will verify this matches your screenshot.",
        placement: "bottom",
    },
    {
        target: '[data-tour="screenshot-upload"]',
        content: "Upload a screenshot from your fitness app (Apple Health, Google Fit, Samsung Health, etc.).",
        placement: "top",
    },
    {
        target: '[data-tour="partial-checkbox"]',
        content: "Check this if you didn't have your phone all day - it helps explain lower counts.",
        placement: "bottom",
    },
    {
        target: '[data-tour="submit-button"]',
        content: "Hit submit and our AI will verify your steps automatically!",
        placement: "top",
    },
    {
        target: '[data-tour="batch-toggle"]',
        content: "Switch to Batch Mode to upload multiple screenshots at once - great for catching up!",
        placement: "bottom",
    },
    {
        target: '[data-tour="nav-leaderboard"]',
        content: "Check the Leaderboard to see how you rank against others.",
        placement: "bottom",
    },
    {
        target: '[data-tour="nav-analytics"]',
        content: "View your Analytics for detailed stats and heatmaps of your activity.",
        placement: "bottom",
    },
];

const leaderboardTour: OnboardingStep[] = [
    {
        target: '[data-tour="leaderboard-filters"]',
        content: "Filter by time period: this week, last week, month, or custom dates.",
        placement: "bottom",
        disableBeacon: true,
    },
    {
        target: '[data-tour="verified-filter"]',
        content: "Toggle to show only verified submissions for fair competition.",
        placement: "bottom",
    },
    {
        target: '[data-tour="common-days-filter"]',
        content: "Compare only days where everyone submitted - great for fairness!",
        placement: "bottom",
    },
    {
        target: '[data-tour="leaderboard-table"]',
        content: "See everyone's total steps and ranking for the selected period.",
        placement: "top",
    },
    {
        target: '[data-tour="share-button"]',
        content: "Share your achievements or invite friends to join your league!",
        placement: "bottom",
    },
];

const adminTour: OnboardingStep[] = [
    {
        target: "body",
        content: "As the league owner, you have extra powers! 👑 Let me show you.",
        placement: "center",
        disableBeacon: true,
        requiresAdmin: true,
    },
    {
        target: '[data-tour="invite-button"]',
        content: "Share this invite link or code with friends to add them to your league.",
        placement: "bottom",
        requiresAdmin: true,
    },
    {
        target: '[data-tour="proxy-members"]',
        content: "Create Proxy Members for people who haven't signed up yet. Submit steps on their behalf, then link to their real account when they join!",
        placement: "top",
        requiresAdmin: true,
    },
    {
        target: '[data-tour="league-settings"]',
        content: "Manage your league settings here (coming soon!).",
        placement: "bottom",
        requiresAdmin: true,
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

    // Auto-start tour for new users
    useEffect(() => {
        if (!isHydrated) return;

        // Delay to ensure DOM is ready
        const timer = setTimeout(() => {
            startContextualTour();
        }, 1000);

        return () => clearTimeout(timer);
    }, [isHydrated, pathname, startContextualTour]);

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
        if (pathname === "/dashboard") {
            markTourComplete("new-user");
        } else if (pathname.match(/\/league\/[^/]+/)) {
            markTourComplete("member");
        }
    }, [pathname, markTourComplete]);

    const handleJoyrideCallback = useCallback((data: CallBackProps) => {
        const { status, action, index, type } = data;

        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
        }

        if (status === STATUS.FINISHED) {
            setRun(false);
            // Mark appropriate tour as complete
            if (pathname === "/dashboard") {
                markTourComplete("new-user");
            } else if (pathname.match(/\/league\/[^/]+/)) {
                markTourComplete("member");
                if (isAdmin) {
                    markTourComplete("admin");
                }
            }
            // Show feedback prompt
            setShowFeedback(true);
        }

        if (status === STATUS.SKIPPED) {
            setRun(false);
        }
    }, [pathname, isAdmin, markTourComplete]);

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
                        arrowColor: "#1e293b",
                        backgroundColor: "#1e293b",
                        overlayColor: "rgba(0, 0, 0, 0.75)",
                        primaryColor: "#0ea5e9",
                        textColor: "#f1f5f9",
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
                        backgroundColor: "#0ea5e9",
                        borderRadius: 8,
                        color: "#0f172a",
                        fontSize: 14,
                        fontWeight: 600,
                        padding: "8px 16px",
                    },
                    buttonBack: {
                        color: "#94a3b8",
                        fontSize: 14,
                    },
                    buttonSkip: {
                        color: "#64748b",
                        fontSize: 13,
                    },
                    spotlight: {
                        borderRadius: 8,
                    },
                    beaconInner: {
                        backgroundColor: "#0ea5e9",
                    },
                    beaconOuter: {
                        backgroundColor: "rgba(14, 165, 233, 0.3)",
                        border: "2px solid #0ea5e9",
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

            {/* Feedback Modal */}
            {showFeedback && (
                <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-5 space-y-4">
                        {feedbackSubmitted ? (
                            <div className="text-center py-6">
                                <span className="text-3xl">✓</span>
                                <p className="mt-2 text-sm text-emerald-400">Thanks for your feedback!</p>
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
