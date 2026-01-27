"use client";

import { useState, useCallback } from "react";
import { type CardType, type MetricType } from "@/lib/sharing";

/**
 * Share modal configuration
 */
export interface ShareModalConfig {
    cardType: CardType;
    value: number;
    metricType?: MetricType;
    rank?: number;
    leagueName?: string;
    streakDays?: number;
    periodLabel?: string;
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
