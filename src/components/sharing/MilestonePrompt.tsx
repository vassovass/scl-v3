"use client";

import { useState, useEffect } from "react";
import { ShareModal } from "./ShareModal";
import { analytics } from "@/lib/analytics";
import {
    type MilestoneResult,
    hasMilestones,
    getPrimaryMilestone,
} from "@/lib/milestones";
import {
    getStreakMilestoneMessage,
    getPersonalBestMessage,
    getRankChangeMessage,
    type MilestoneMessage,
} from "@/lib/sharing/shareMessages";
import type { CardType } from "@/lib/sharing";

// ============================================================================
// Types
// ============================================================================

interface MilestonePromptProps {
    milestones: MilestoneResult | null;
    onDismiss?: () => void;
    autoShow?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Milestone Prompt Component
 *
 * Shows a celebration modal when milestones are detected.
 * Includes a "Share" button that opens the ShareModal.
 *
 * PRD-51: Social Sharing & Stats Hub - Stickiness Features
 */
export function MilestonePrompt({
    milestones,
    onDismiss,
    autoShow = true,
}: MilestonePromptProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [milestoneMessage, setMilestoneMessage] = useState<MilestoneMessage | null>(null);
    const [shareConfig, setShareConfig] = useState<{
        cardType: CardType;
        value: number;
        streakDays?: number;
        rank?: number;
        leagueName?: string;
    } | null>(null);

    // Process milestones when they change
    useEffect(() => {
        if (!milestones || !hasMilestones(milestones)) {
            setIsVisible(false);
            return;
        }

        const primaryType = getPrimaryMilestone(milestones);
        if (!primaryType) return;

        let message: MilestoneMessage | null = null;
        let config: typeof shareConfig = null;

        switch (primaryType) {
            case "personal_best":
                if (milestones.personalBest) {
                    message = getPersonalBestMessage(
                        milestones.personalBest.newValue,
                        milestones.personalBest.oldValue
                    );
                    config = {
                        cardType: "personal_best",
                        value: milestones.personalBest.newValue,
                    };
                }
                break;

            case "streak_milestone":
                if (milestones.streakMilestone) {
                    message = getStreakMilestoneMessage(milestones.streakMilestone.days);
                    config = {
                        cardType: "streak",
                        value: milestones.streakMilestone.days,
                        streakDays: milestones.streakMilestone.days,
                    };
                }
                break;

            case "rank_change":
                if (milestones.rankChange) {
                    message = getRankChangeMessage(
                        milestones.rankChange.oldRank,
                        milestones.rankChange.newRank,
                        milestones.rankChange.leagueName
                    );
                    if (message) {
                        config = {
                            cardType: "rank_change",
                            value: 0,
                            rank: milestones.rankChange.newRank,
                            leagueName: milestones.rankChange.leagueName,
                        };
                    }
                }
                break;
        }

        if (message && config) {
            setMilestoneMessage(message);
            setShareConfig(config);

            if (autoShow) {
                setIsVisible(true);
                // Track prompt shown
                analytics.shareFunnel.promptShown(primaryType, config.value);
            }
        }
    }, [milestones, autoShow]);

    const handleDismiss = () => {
        setIsVisible(false);
        const primaryType = getPrimaryMilestone(milestones!);
        if (primaryType) {
            analytics.shareFunnel.promptDismissed(primaryType);
        }
        onDismiss?.();
    };

    const handleShare = () => {
        setIsVisible(false);
        setShowShareModal(true);
    };

    if (!isVisible || !milestoneMessage) return null;

    return (
        <>
            {/* Celebration Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
                    {/* Celebration Header */}
                    <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-6 text-center">
                        <div className="text-5xl mb-3">{milestoneMessage.emoji}</div>
                        <h2 className="text-xl font-bold text-foreground">
                            {milestoneMessage.title}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {milestoneMessage.message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="p-4 space-y-3">
                        <button
                            onClick={handleShare}
                            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-white font-medium hover:bg-[#22c55e] transition"
                        >
                            <span className="text-xl">📤</span>
                            Share on WhatsApp
                        </button>

                        <button
                            onClick={handleDismiss}
                            className="w-full rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-secondary transition"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {shareConfig && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    defaultCardType={shareConfig.cardType}
                    defaultValue={shareConfig.value}
                    metricType="steps"
                    streakDays={shareConfig.streakDays}
                    rank={shareConfig.rank}
                    leagueName={shareConfig.leagueName}
                />
            )}
        </>
    );
}
