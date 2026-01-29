"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useShare, type SharePlatform } from "@/hooks/useShare";
import { APP_CONFIG } from "@/lib/config";
import { analytics } from "@/lib/analytics";
import {
    type CardType,
    type MetricType,
    CARD_TYPE_CONFIGS,
    getCardTypeConfig,
    getMetricConfig,
    generateShareMessage,
} from "@/lib/sharing";
import { Spinner } from "@/components/ui/Spinner";
import { ShareDateRangePicker } from "./ShareDateRangePicker";
import { type PeriodPreset, formatCustomPeriodLabel } from "@/lib/utils/periods";

// ============================================================================
// Types
// ============================================================================

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultCardType?: CardType;
    defaultValue?: number;
    metricType?: MetricType;
    rank?: number;
    leagueName?: string;
    streakDays?: number;
    periodLabel?: string;
    /** Custom period start date (YYYY-MM-DD) */
    periodStart?: string;
    /** Custom period end date (YYYY-MM-DD) */
    periodEnd?: string;
}

interface CardData {
    cardType: CardType;
    metricType: MetricType;
    value: number;
    rank?: number;
    leagueName?: string;
    streakDays?: number;
    customMessage?: string;
    showRank: boolean;
    showImprovement: boolean;
    theme: "light" | "dark";
    /** Custom period date range */
    customPeriod?: { start: string; end: string } | null;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Share Modal with Card Generator
 *
 * Features:
 * - Card type selector (daily, weekly, personal_best, streak, rank, challenge)
 * - Live OG image preview
 * - Customizable elements (show/hide rank, improvement)
 * - WhatsApp-first share buttons
 * - Theme variants (light/dark)
 *
 * PRD-51: Social Sharing & Stats Hub
 */
export function ShareModal({
    isOpen,
    onClose,
    defaultCardType = "daily",
    defaultValue = 0,
    metricType = "steps",
    rank,
    leagueName,
    streakDays,
    periodLabel,
    periodStart,
    periodEnd,
}: ShareModalProps) {
    const [cardData, setCardData] = useState<CardData>({
        cardType: defaultCardType,
        metricType,
        value: defaultValue,
        rank,
        leagueName,
        streakDays,
        customMessage: "",
        showRank: !!rank,
        showImprovement: false,
        theme: "dark",
        customPeriod: periodStart && periodEnd ? { start: periodStart, end: periodEnd } : null,
    });

    const [imageLoading, setImageLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const hasTrackedOpen = useRef(false);

    const { share, copied, supportsNativeShare } = useShare({
        contentType: `share_card_${cardData.cardType}`,
        onShare: (platform) => {
            // Track share completion
            analytics.shareFunnel.completed(platform, cardData.cardType, cardData.value);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        },
    });

    // Reset state and track when modal opens
    useEffect(() => {
        if (isOpen) {
            setCardData({
                cardType: defaultCardType,
                metricType,
                value: defaultValue,
                rank,
                leagueName,
                streakDays,
                customMessage: "",
                showRank: !!rank,
                showImprovement: false,
                theme: "dark",
                customPeriod: periodStart && periodEnd ? { start: periodStart, end: periodEnd } : null,
            });
            setImageLoading(true);
            setShowSuccess(false);

            // Track modal opened (only once per open)
            if (!hasTrackedOpen.current) {
                analytics.shareFunnel.modalOpened("share_modal", defaultCardType);
                hasTrackedOpen.current = true;
            }
        } else {
            hasTrackedOpen.current = false;
        }
    }, [isOpen, defaultCardType, defaultValue, metricType, rank, leagueName, streakDays, periodStart, periodEnd]);

    // Generate OG image URL
    const getOgImageUrl = useCallback(() => {
        const params = new URLSearchParams({
            card_type: cardData.cardType,
            metric_type: cardData.metricType,
            value: cardData.value.toString(),
            theme: cardData.theme,
        });

        if (cardData.rank && cardData.showRank) {
            params.set("rank", cardData.rank.toString());
        }
        if (cardData.leagueName && cardData.showRank) {
            params.set("league", cardData.leagueName);
        }
        if (cardData.streakDays) {
            params.set("streak", cardData.streakDays.toString());
        }
        if (cardData.customMessage) {
            params.set("customTitle", cardData.customMessage);
        }

        // Handle period labels - custom period takes precedence
        if (cardData.customPeriod && cardData.cardType === "custom_period") {
            params.set("period_start", cardData.customPeriod.start);
            params.set("period_end", cardData.customPeriod.end);
            // Also set a formatted period label for the OG image
            params.set("period", formatCustomPeriodLabel(cardData.customPeriod.start, cardData.customPeriod.end));
        } else if (periodLabel) {
            params.set("period", periodLabel);
        }

        return `/api/og?${params.toString()}`;
    }, [cardData, periodLabel]);

    // Generate share URL with UTM parameters
    const getShareUrl = useCallback((platform?: SharePlatform) => {
        const params = new URLSearchParams({
            card_type: cardData.cardType,
            metric_type: cardData.metricType,
            value: cardData.value.toString(),
            // UTM parameters for tracking
            utm_source: "share",
            utm_medium: platform || "direct",
            utm_campaign: cardData.cardType,
        });

        if (cardData.rank && cardData.showRank) {
            params.set("rank", cardData.rank.toString());
        }
        if (cardData.streakDays) {
            params.set("streak", cardData.streakDays.toString());
        }
        // Add custom period dates to share URL
        if (cardData.customPeriod && cardData.cardType === "custom_period") {
            params.set("period_start", cardData.customPeriod.start);
            params.set("period_end", cardData.customPeriod.end);
        }

        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        return `${baseUrl}/share/stats?${params.toString()}`;
    }, [cardData]);

    // Generate share message
    const getShareMessage = useCallback(() => {
        // Generate period label for custom periods
        const customPeriodLabel = cardData.customPeriod
            ? formatCustomPeriodLabel(cardData.customPeriod.start, cardData.customPeriod.end)
            : undefined;

        return generateShareMessage(cardData.cardType, {
            value: cardData.value,
            metricType: cardData.metricType,
            rank: cardData.showRank ? cardData.rank : undefined,
            leagueName: cardData.showRank ? cardData.leagueName : undefined,
            streakDays: cardData.streakDays,
            customMessage: cardData.customMessage,
            periodLabel: cardData.cardType === "custom_period" ? customPeriodLabel : periodLabel,
        }).fullMessage;
    }, [cardData, periodLabel]);

    // Handle share action
    const handleShare = (platform: SharePlatform) => {
        share({
            text: getShareMessage(),
            url: getShareUrl(platform),
            title: APP_CONFIG.name,
        }, platform);
    };

    // Update card data helper with analytics
    const updateCardData = (updates: Partial<CardData>) => {
        setCardData((prev) => {
            // Track card type changes
            if (updates.cardType && updates.cardType !== prev.cardType) {
                analytics.shareFunnel.cardTypeSelected(updates.cardType, prev.cardType);
            }
            return { ...prev, ...updates };
        });
        setImageLoading(true);
    };

    if (!isOpen) return null;

    const cardTypeConfig = getCardTypeConfig(cardData.cardType);
    const metricConfig = getMetricConfig(cardData.metricType);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl" data-tour="share-modal">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                    <h2 className="text-lg font-semibold text-foreground">
                        Share Your Achievement
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Success State */}
                {showSuccess && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 rounded-xl">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🎉</div>
                            <p className="text-xl font-bold text-foreground">Shared!</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Card Type Selector */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Card Type
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(CARD_TYPE_CONFIGS) as CardType[]).map((type) => {
                                const config = CARD_TYPE_CONFIGS[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => updateCardData({ cardType: type })}
                                        className={`rounded-lg border p-2 text-center transition ${
                                            cardData.cardType === type
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border text-muted-foreground hover:border-border/80"
                                        }`}
                                    >
                                        <span className="text-lg">{config.emoji}</span>
                                        <p className="text-xs mt-1">{config.label}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Period Date Picker */}
                    {cardData.cardType === "custom_period" && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                Select Date Range
                            </label>
                            <ShareDateRangePicker
                                value={cardData.customPeriod ?? null}
                                onChange={(range, preset) => {
                                    updateCardData({ customPeriod: range });
                                }}
                                showShortcuts={true}
                                compact={true}
                            />
                        </div>
                    )}

                    {/* Live Preview */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Preview
                        </label>
                        <div className="relative rounded-lg border border-border overflow-hidden bg-secondary/30" data-tour="share-card-preview">
                            {imageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
                                    <Spinner size="md" />
                                </div>
                            )}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={getOgImageUrl()}
                                alt="Share card preview"
                                className="w-full aspect-[1200/630] object-cover"
                                onLoad={() => setImageLoading(false)}
                                onError={() => setImageLoading(false)}
                            />
                        </div>
                    </div>

                    {/* Customization Options */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Show Rank Toggle (if rank available) */}
                        {rank && (
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={cardData.showRank}
                                    onChange={(e) => updateCardData({ showRank: e.target.checked })}
                                    className="w-4 h-4 rounded border-border"
                                />
                                <span className="text-sm text-foreground">Show rank</span>
                            </label>
                        )}

                        {/* Theme Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={cardData.theme === "dark"}
                                onChange={(e) =>
                                    updateCardData({ theme: e.target.checked ? "dark" : "light" })
                                }
                                className="w-4 h-4 rounded border-border"
                            />
                            <span className="text-sm text-foreground">Dark theme</span>
                        </label>
                    </div>

                    {/* Custom Message */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                            Add a message (optional)
                        </label>
                        <input
                            type="text"
                            value={cardData.customMessage}
                            onChange={(e) =>
                                updateCardData({ customMessage: e.target.value.slice(0, 100) })
                            }
                            placeholder="e.g., Feeling great today!"
                            maxLength={100}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {cardData.customMessage?.length || 0}/100 characters
                        </p>
                    </div>

                    {/* Share Message Preview */}
                    <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Share message:</p>
                        <p className="text-sm text-foreground">{getShareMessage()}</p>
                    </div>
                </div>

                {/* Share Buttons */}
                <div className="border-t border-border p-4 space-y-3">
                    {/* WhatsApp - Primary */}
                    <button
                        onClick={() => handleShare("whatsapp")}
                        className="w-full flex items-center justify-center gap-3 rounded-lg bg-[#25D366] px-4 py-3 text-white font-medium hover:bg-[#22c55e] transition"
                        data-tour="share-whatsapp-button"
                    >
                        <span className="text-xl">💬</span>
                        Share on WhatsApp
                    </button>

                    {/* Secondary Options */}
                    <div className="grid grid-cols-2 gap-2">
                        {supportsNativeShare && (
                            <button
                                onClick={() => handleShare("native")}
                                className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition"
                            >
                                <span>📤</span>
                                Share
                            </button>
                        )}
                        <button
                            onClick={() => handleShare("x")}
                            className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary transition"
                        >
                            <span className="font-bold">𝕏</span>
                            Post on X
                        </button>
                        <button
                            onClick={() => handleShare("copy")}
                            className={`flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition ${
                                copied
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "text-foreground hover:bg-secondary"
                            }`}
                        >
                            <span>{copied ? "✓" : "📋"}</span>
                            {copied ? "Copied!" : "Copy Link"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
