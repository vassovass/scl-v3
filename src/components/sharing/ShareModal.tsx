"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import {
    type ShareContentBlock,
    type ShareMessageData,
    getDefaultBlocks,
} from "@/lib/sharing/shareContentConfig";
import { buildShareMessage } from "@/lib/sharing/shareMessageBuilder";
import { Spinner } from "@/components/ui/Spinner";
import { ShareDateRangePicker } from "./ShareDateRangePicker";
import { ShareContentPicker } from "./ShareContentPicker";
import { type PeriodPreset, formatCustomPeriodLabel } from "@/lib/utils/periods";
import { ChevronDown, HelpCircle } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    CARD_TYPE_TOOLTIPS,
    SECTION_TOOLTIPS,
} from "@/lib/sharing/shareTooltips";

// ============================================================================
// Types
// ============================================================================

/**
 * Daily breakdown entry for message builder
 */
interface DailyBreakdownEntry {
    date: string;
    steps: number;
}

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

    // PRD-57: Full data for multi-select message builder
    /** Number of days in the period */
    dayCount?: number;
    /** Average steps per day */
    averageSteps?: number;
    /** Daily breakdown for individual day display */
    dailyBreakdown?: DailyBreakdownEntry[];
    /** Best day step count in period */
    bestDaySteps?: number;
    /** Best day date (YYYY-MM-DD) */
    bestDayDate?: string;
    /** Improvement percentage vs previous period */
    improvementPct?: number;
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
// Helpers
// ============================================================================

/**
 * Calculate the longest consecutive streak within a set of dates.
 * This finds the maximum number of consecutive days with submissions
 * in the given date array.
 *
 * @param sortedDates Array of YYYY-MM-DD strings (will be sorted internally)
 * @returns The longest streak of consecutive days
 */
function calculateStreakInRange(dates: string[]): number {
    if (dates.length === 0) return 0;
    if (dates.length === 1) return 1;

    // Sort dates ascending
    const sortedDates = [...dates].sort();

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1] + "T00:00:00");
        const currDate = new Date(sortedDates[i] + "T00:00:00");
        const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Consecutive day
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else if (diffDays > 1) {
            // Gap in dates - reset streak
            currentStreak = 1;
        }
        // diffDays === 0 means duplicate date, ignore
    }

    return maxStreak;
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
    // PRD-57: Full data for message builder
    dayCount,
    averageSteps,
    dailyBreakdown,
    bestDaySteps,
    bestDayDate,
    improvementPct,
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

    // PRD-57: Multi-select content picker state
    const [showContentPicker, setShowContentPicker] = useState(false);
    const [selectedBlocks, setSelectedBlocks] = useState<ShareContentBlock[]>(() =>
        getDefaultBlocks("custom")
    );

    // Data fetching state for custom period
    const [fetchedDailyBreakdown, setFetchedDailyBreakdown] = useState<DailyBreakdownEntry[] | undefined>(dailyBreakdown);
    const [fetchedBestDay, setFetchedBestDay] = useState<{ steps: number; date: string } | undefined>(
        bestDaySteps && bestDayDate ? { steps: bestDaySteps, date: bestDayDate } : undefined
    );
    const [fetchedStreak, setFetchedStreak] = useState<number | undefined>(streakDays);
    const [availableDates, setAvailableDates] = useState<Array<{ date: string; steps: number }>>([]);
    const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);

    // Fetch available dates on mount (for heatmap - last 90 days)
    useEffect(() => {
        if (!isOpen) return;

        const fetchAvailableDates = async () => {
            try {
                const endDate = new Date().toISOString().slice(0, 10);
                const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                const res = await apiRequest<{ dates: Array<{ date: string; steps: number }> }>(
                    `submissions/available-dates?start=${startDate}&end=${endDate}`
                );
                setAvailableDates(res.dates || []);
            } catch (error) {
                console.error("Failed to fetch available dates:", error);
            }
        };

        fetchAvailableDates();
    }, [isOpen]);

    // Fetch daily breakdown when custom period changes
    useEffect(() => {
        if (!cardData.customPeriod || cardData.cardType !== "custom_period") return;

        const fetchBreakdown = async () => {
            setIsLoadingBreakdown(true);
            try {
                const { start, end } = cardData.customPeriod!;
                const res = await apiRequest<{ dates: Array<{ date: string; steps: number }> }>(
                    `submissions/available-dates?start=${start}&end=${end}`
                );

                const breakdown = res.dates?.map(d => ({ date: d.date, steps: d.steps })) || [];
                setFetchedDailyBreakdown(breakdown);

                // Calculate best day from breakdown
                if (breakdown.length > 0) {
                    const best = breakdown.reduce((max, day) => day.steps > max.steps ? day : max, breakdown[0]);
                    setFetchedBestDay({ steps: best.steps, date: best.date });

                    // Update total steps and value
                    const total = breakdown.reduce((sum, d) => sum + d.steps, 0);
                    setCardData(prev => ({ ...prev, value: total }));

                    // Calculate streak within the selected period
                    const datesWithData = breakdown.map(d => d.date);
                    const streakInRange = calculateStreakInRange(datesWithData);
                    setFetchedStreak(streakInRange > 0 ? streakInRange : undefined);
                } else {
                    setFetchedBestDay(undefined);
                    setFetchedStreak(undefined);
                }
            } catch (error) {
                console.error("Failed to fetch daily breakdown:", error);
            } finally {
                setIsLoadingBreakdown(false);
            }
        };

        fetchBreakdown();
    }, [cardData.customPeriod?.start, cardData.customPeriod?.end, cardData.cardType]);

    // Build ShareMessageData from all available props (use fetched data when available)
    const shareMessageData: ShareMessageData = useMemo(() => {
        // Use fetched data if available, otherwise fall back to props
        const breakdownToUse = fetchedDailyBreakdown ?? dailyBreakdown;
        const bestToUse = fetchedBestDay ?? (bestDaySteps && bestDayDate ? { steps: bestDaySteps, date: bestDayDate } : undefined);

        // Mark the best day in daily breakdown if we have the data
        const enrichedBreakdown = breakdownToUse?.map(day => ({
            date: day.date,
            steps: day.steps,
            isBestDay: bestToUse ? day.date === bestToUse.date : false,
        }));

        // Calculate average from fetched data if available
        const calculatedAverage = fetchedDailyBreakdown?.length
            ? Math.round(fetchedDailyBreakdown.reduce((sum, d) => sum + d.steps, 0) / fetchedDailyBreakdown.length)
            : averageSteps;

        return {
            totalSteps: cardData.value,
            dayCount: fetchedDailyBreakdown?.length ?? dayCount,
            startDate: cardData.customPeriod?.start || periodStart,
            endDate: cardData.customPeriod?.end || periodEnd,
            averageSteps: calculatedAverage,
            dailyBreakdown: enrichedBreakdown,
            bestDaySteps: bestToUse?.steps,
            bestDayDate: bestToUse?.date,
            // Use fetched streak (calculated within period) or fall back to prop
            currentStreak: fetchedStreak ?? streakDays,
            rank: cardData.showRank ? rank : undefined,
            leagueName: cardData.showRank ? leagueName : undefined,
            improvementPercent: improvementPct,
        };
    }, [
        cardData.value, cardData.customPeriod, cardData.showRank,
        dayCount, periodStart, periodEnd, averageSteps, dailyBreakdown,
        bestDaySteps, bestDayDate, streakDays, rank, leagueName, improvementPct,
        fetchedDailyBreakdown, fetchedBestDay, fetchedStreak
    ]);

    // Check if we have enough data for the message builder (include fetched data)
    const hasMessageBuilderData = useMemo(() => {
        return (dayCount !== undefined && dayCount > 0) ||
               (fetchedDailyBreakdown && fetchedDailyBreakdown.length > 0) ||
               (periodStart && periodEnd) ||
               (cardData.customPeriod?.start && cardData.customPeriod?.end) ||
               dailyBreakdown?.length;
    }, [dayCount, periodStart, periodEnd, dailyBreakdown, fetchedDailyBreakdown, cardData.customPeriod]);

    // DEBUG: Log customPeriod changes
    useEffect(() => {
        console.log('[ShareModal] cardData.customPeriod changed:', cardData.customPeriod);
    }, [cardData.customPeriod]);

    // DEBUG: Log shareMessageData changes
    useEffect(() => {
        console.log('[ShareModal] shareMessageData updated:', shareMessageData);
    }, [shareMessageData]);

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

    // Generate share message - PRD-57: Use message builder when data available
    const getShareMessage = useCallback(() => {
        // Use the new message builder if we have multi-select data
        if (hasMessageBuilderData && selectedBlocks.length > 0) {
            const result = buildShareMessage(selectedBlocks, shareMessageData, {
                includeHashtag: true,
                includeUrl: false, // URL added by useShare hook
                customIntro: cardData.customMessage || undefined,
            });
            return result.message;
        }

        // Fallback to legacy message generator for backwards compatibility
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
    }, [cardData, periodLabel, hasMessageBuilderData, selectedBlocks, shareMessageData]);

    // Handle share action
    const handleShare = (platform: SharePlatform) => {
        const message = getShareMessage();
        const url = getShareUrl(platform);
        console.log('[ShareModal] handleShare:', {
            platform,
            cardType: cardData.cardType,
            customPeriod: cardData.customPeriod,
            value: cardData.value,
            selectedBlocks,
            shareMessageData,
            finalMessage: message,
            shareUrl: url,
        });
        share({
            text: message,
            url: url,
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
        <TooltipProvider delayDuration={300}>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
                role="dialog"
                aria-modal="true"
                aria-labelledby="share-modal-title"
            >
                <div
                    className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
                    data-tour="share-modal"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                    <h2 id="share-modal-title" className="text-lg font-semibold text-foreground">
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
                        <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            Card Type
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                    {SECTION_TOOLTIPS.cardType}
                                </TooltipContent>
                            </Tooltip>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(CARD_TYPE_CONFIGS) as CardType[]).map((type) => {
                                const config = CARD_TYPE_CONFIGS[type];
                                return (
                                    <Tooltip key={type}>
                                        <TooltipTrigger asChild>
                                            <button
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
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="max-w-xs">
                                            {CARD_TYPE_TOOLTIPS[type]}
                                        </TooltipContent>
                                    </Tooltip>
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
                                    console.log('[ShareModal] ShareDateRangePicker onChange called:', { range, preset });
                                    updateCardData({ customPeriod: range });
                                }}
                                showShortcuts={true}
                                compact={true}
                                submissionData={availableDates}
                            />
                            {isLoadingBreakdown && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <Spinner size="sm" />
                                    <span>Loading data...</span>
                                </div>
                            )}
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

                    {/* PRD-57: Multi-select Content Picker */}
                    {hasMessageBuilderData && (
                        <div className="border-t border-border pt-4">
                            <button
                                type="button"
                                onClick={() => setShowContentPicker(!showContentPicker)}
                                className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition"
                            >
                                <span>✏️ Customize Message Content</span>
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                        showContentPicker ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            <p className="text-xs text-muted-foreground mt-1">
                                Choose what to include in your share message
                            </p>

                            {showContentPicker && (
                                <div className="mt-4">
                                    <ShareContentPicker
                                        selectedBlocks={selectedBlocks}
                                        onChange={setSelectedBlocks}
                                        availableData={shareMessageData}
                                        compact={true}
                                        hideEmptyCategories={true}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Share Message Preview */}
                    <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Share message:</p>
                        <p className="text-sm text-foreground whitespace-pre-line">{getShareMessage()}</p>
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
        </TooltipProvider>
    );
}
