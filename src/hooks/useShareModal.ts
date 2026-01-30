"use client";

import { useState, useCallback } from "react";
import { type CardType, type MetricType } from "@/lib/sharing";

/**
 * Daily breakdown entry for share message builder
 */
export interface DailyBreakdownEntry {
    date: string;  // YYYY-MM-DD
    steps: number;
}

/**
 * Share modal configuration
 *
 * PRD-57: Extended with full data fields for multi-select message builder
 */
export interface ShareModalConfig {
    cardType: CardType;
    value: number;
    metricType?: MetricType;
    rank?: number;
    leagueName?: string;
    streakDays?: number;
    periodLabel?: string;
    /** Custom period start date (YYYY-MM-DD) - PRD-54 */
    periodStart?: string;
    /** Custom period end date (YYYY-MM-DD) - PRD-54 */
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

/**
 * Hook for managing share modal state
 *
 * Usage:
 * ```tsx
 * const { isOpen, config, openShareModal, closeShareModal } = useShareModal();
 *
 * // Open modal with specific config
 * openShareModal({
 *   cardType: 'daily',
 *   value: 12345,
 *   metricType: 'steps',
 * });
 *
 * // In render
 * <ShareModal
 *   isOpen={isOpen}
 *   onClose={closeShareModal}
 *   defaultCardType={config?.cardType}
 *   defaultValue={config?.value}
 *   {...config}
 * />
 * ```
 *
 * PRD-51: Social Sharing & Stats Hub
 */
export function useShareModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<ShareModalConfig | null>(null);

    const openShareModal = useCallback((modalConfig: ShareModalConfig) => {
        setConfig(modalConfig);
        setIsOpen(true);
    }, []);

    const closeShareModal = useCallback(() => {
        setIsOpen(false);
        // Keep config for a moment (for exit animations)
        setTimeout(() => setConfig(null), 300);
    }, []);

    return {
        isOpen,
        config,
        openShareModal,
        closeShareModal,
    };
}
