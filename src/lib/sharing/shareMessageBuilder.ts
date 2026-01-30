/**
 * Share Message Builder
 *
 * Dynamically constructs share messages based on selected content blocks.
 * Handles formatting, character limits, and platform-specific optimizations.
 *
 * PRD-57: Customizable Share Content
 *
 * @module lib/sharing/shareMessageBuilder
 */

import { APP_CONFIG } from "@/lib/config";
import {
    type ShareContentBlock,
    type ShareMessageData,
    getContentBlockConfig,
} from "./shareContentConfig";

// ============================================================================
// Types
// ============================================================================

export interface BuildMessageOptions {
    /** Maximum character length (WhatsApp optimal: 150, X/Twitter: 280) */
    maxLength?: number;
    /** Target platform for formatting */
    platform?: "whatsapp" | "x" | "generic";
    /** Include app hashtag */
    includeHashtag?: boolean;
    /** Include app URL */
    includeUrl?: boolean;
    /** Custom intro text */
    customIntro?: string;
}

export interface BuildMessageResult {
    /** The formatted message */
    message: string;
    /** Character count */
    length: number;
    /** Whether message was truncated */
    truncated: boolean;
    /** Blocks that were included */
    includedBlocks: ShareContentBlock[];
    /** Blocks that were skipped (no data) */
    skippedBlocks: ShareContentBlock[];
}

// ============================================================================
// Formatting Helpers
// ============================================================================

/**
 * Format a date string to readable format
 */
function formatDate(dateStr: string, includeYear = false): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "short",
        ...(includeYear && { year: "numeric" }),
    };
    return date.toLocaleDateString("en-GB", options);
}

/**
 * Format a date range
 */
function formatDateRange(startDate: string, endDate: string): string {
    if (startDate === endDate) {
        return formatDate(endDate, true);
    }
    return `${formatDate(startDate)} - ${formatDate(endDate, true)}`;
}

/**
 * Format a number with locale separators
 */
function formatNumber(num: number): string {
    return num.toLocaleString();
}

/**
 * Format improvement percentage
 */
function formatImprovement(percent: number): string {
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(0)}%`;
}

/**
 * Get day name from date string
 */
function getDayName(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { weekday: "short" });
}

// ============================================================================
// Block Renderers
// ============================================================================

type BlockRenderer = (data: ShareMessageData) => string | null;

const BLOCK_RENDERERS: Record<ShareContentBlock, BlockRenderer> = {
    total_steps: (data) => {
        if (data.totalSteps === undefined) return null;
        return `${formatNumber(data.totalSteps)} steps`;
    },

    day_count: (data) => {
        if (data.dayCount === undefined) return null;
        const plural = data.dayCount !== 1 ? "s" : "";
        return `${data.dayCount} day${plural}`;
    },

    date_range: (data) => {
        if (!data.startDate || !data.endDate) return null;
        return `(${formatDateRange(data.startDate, data.endDate)})`;
    },

    average: (data) => {
        if (data.averageSteps === undefined) return null;
        return `Avg: ${formatNumber(data.averageSteps)} steps/day`;
    },

    individual_days: (data) => {
        if (!data.dailyBreakdown?.length) return null;
        const lines = data.dailyBreakdown.map((day) => {
            const dayName = getDayName(day.date);
            const dateFormatted = formatDate(day.date);
            const star = day.isBestDay ? " ⭐" : "";
            return `${dayName} ${dateFormatted}: ${formatNumber(day.steps)}${star}`;
        });
        return lines.join("\n");
    },

    best_day: (data) => {
        if (data.bestDaySteps === undefined || !data.bestDayDate) return null;
        return `⭐ Best: ${formatNumber(data.bestDaySteps)} (${formatDate(data.bestDayDate)})`;
    },

    streak: (data) => {
        if (data.currentStreak === undefined) return null;
        const plural = data.currentStreak !== 1 ? "s" : "";
        return `${data.currentStreak} day${plural} streak`;
    },

    rank: (data) => {
        if (data.rank === undefined) return null;
        const ofTotal = data.totalMembers ? ` of ${data.totalMembers}` : "";
        return `Rank #${data.rank}${ofTotal}`;
    },

    league_name: (data) => {
        if (!data.leagueName) return null;
        return `in ${data.leagueName}`;
    },

    improvement: (data) => {
        if (data.improvementPercent === undefined) return null;
        const arrow = data.improvementPercent >= 0 ? "↑" : "↓";
        return `${arrow} ${formatImprovement(data.improvementPercent)} vs last period`;
    },

    comparison_self: (data) => {
        if (data.previousPeriodSteps === undefined || data.totalSteps === undefined) return null;
        return `Before: ${formatNumber(data.previousPeriodSteps)} → Now: ${formatNumber(data.totalSteps)}`;
    },

    comparison_league: (data) => {
        if (data.leagueAverage === undefined || data.totalSteps === undefined) return null;
        const diff = data.totalSteps - data.leagueAverage;
        const sign = diff >= 0 ? "+" : "";
        return `League avg: ${formatNumber(data.leagueAverage)} (${sign}${formatNumber(diff)})`;
    },
};

// ============================================================================
// Message Builder
// ============================================================================

/**
 * Build a share message from selected content blocks
 */
export function buildShareMessage(
    blocks: ShareContentBlock[],
    data: ShareMessageData,
    options: BuildMessageOptions = {}
): BuildMessageResult {
    const {
        maxLength = 500,
        platform = "whatsapp",
        includeHashtag = true,
        includeUrl = false, // URL is added by useShare hook, not in message text
        customIntro,
    } = options;

    const includedBlocks: ShareContentBlock[] = [];
    const skippedBlocks: ShareContentBlock[] = [];
    const lines: string[] = [];

    // Add custom intro or default
    if (customIntro) {
        lines.push(customIntro);
    } else if (data.totalSteps !== undefined && blocks.includes("total_steps")) {
        lines.push(`I just logged ${formatNumber(data.totalSteps)} steps on StepLeague!`);
        includedBlocks.push("total_steps");
    }

    // Add a blank line after intro
    if (lines.length > 0) {
        lines.push("");
    }

    // Process each block in order
    for (const block of blocks) {
        // Skip total_steps if already in intro
        if (block === "total_steps" && includedBlocks.includes("total_steps")) {
            continue;
        }

        const renderer = BLOCK_RENDERERS[block];
        if (!renderer) {
            skippedBlocks.push(block);
            continue;
        }

        const rendered = renderer(data);
        if (rendered === null) {
            skippedBlocks.push(block);
            continue;
        }

        // Handle multi-line blocks (individual_days)
        if (block === "individual_days") {
            lines.push(""); // Add spacing before breakdown
            lines.push(rendered);
            lines.push(""); // Add spacing after breakdown
        } else {
            lines.push(rendered);
        }

        includedBlocks.push(block);
    }

    // Add footer (URL instead of hashtag to prevent tracking URL from being appended)
    if (includeHashtag || includeUrl) {
        lines.push(""); // Blank line before footer
        // Use clean URL instead of hashtag - this prevents useShare from appending the tracking URL
        // because it checks for "stepleague.app" in the message
        if (includeHashtag || includeUrl) {
            lines.push(APP_CONFIG.url);
        }
    }

    // Join lines and handle truncation
    let message = lines.join("\n").trim();
    let truncated = false;

    if (message.length > maxLength) {
        // Try to truncate intelligently
        message = truncateMessage(message, maxLength, includeHashtag, includeUrl);
        truncated = true;
    }

    return {
        message,
        length: message.length,
        truncated,
        includedBlocks,
        skippedBlocks,
    };
}

/**
 * Truncate message while preserving footer
 */
function truncateMessage(
    message: string,
    maxLength: number,
    preserveHashtag: boolean,
    preserveUrl: boolean
): string {
    const lines = message.split("\n");
    const footer: string[] = [];

    // Extract footer lines to preserve
    if (preserveUrl && APP_CONFIG.url && lines[lines.length - 1] === APP_CONFIG.url) {
        footer.unshift(lines.pop()!);
    }
    if (preserveHashtag && APP_CONFIG.hashtag && lines[lines.length - 1] === APP_CONFIG.hashtag) {
        footer.unshift(lines.pop()!);
    }
    // Remove blank line before footer if present
    if (lines[lines.length - 1] === "") {
        lines.pop();
    }

    const footerText = footer.length > 0 ? "\n\n" + footer.join("\n") : "";
    const availableLength = maxLength - footerText.length - 3; // -3 for "..."

    // Rebuild message within limit
    let truncatedContent = "";
    for (const line of lines) {
        const potentialContent = truncatedContent ? truncatedContent + "\n" + line : line;
        if (potentialContent.length <= availableLength) {
            truncatedContent = potentialContent;
        } else {
            break;
        }
    }

    return truncatedContent + "..." + footerText;
}

// ============================================================================
// Preset Builders
// ============================================================================

/**
 * Build a batch submission share message
 */
export function buildBatchSubmissionMessage(
    data: ShareMessageData,
    selectedBlocks?: ShareContentBlock[]
): BuildMessageResult {
    const blocks = selectedBlocks ?? ["total_steps", "day_count", "date_range", "average"];
    return buildShareMessage(blocks, data);
}

/**
 * Build a league comparison share message
 */
export function buildLeagueShareMessage(
    data: ShareMessageData,
    selectedBlocks?: ShareContentBlock[]
): BuildMessageResult {
    const blocks = selectedBlocks ?? ["total_steps", "rank", "league_name", "improvement"];

    // Custom intro for league shares
    let customIntro: string | undefined;
    if (data.rank === 1) {
        customIntro = `Leading the pack! 🏆`;
    } else if (data.improvementPercent && data.improvementPercent > 0) {
        customIntro = `Climbing the ranks! 📈`;
    }

    return buildShareMessage(blocks, data, { customIntro });
}

/**
 * Build a before/after comparison message
 */
export function buildComparisonMessage(
    data: ShareMessageData,
    selectedBlocks?: ShareContentBlock[]
): BuildMessageResult {
    const blocks = selectedBlocks ?? ["comparison_self", "improvement"];
    return buildShareMessage(blocks, data, {
        customIntro: "Progress check! 💪",
    });
}

/**
 * Build a daily breakdown message
 */
export function buildDailyBreakdownMessage(data: ShareMessageData): BuildMessageResult {
    const blocks: ShareContentBlock[] = ["individual_days", "total_steps", "average"];
    return buildShareMessage(blocks, data, {
        customIntro: `My week in steps! 👟`,
    });
}

// ============================================================================
// Character Count Helpers
// ============================================================================

/**
 * Get recommended max length for platform
 */
export function getRecommendedMaxLength(platform: "whatsapp" | "x" | "generic"): number {
    switch (platform) {
        case "whatsapp":
            return 500; // WhatsApp has no hard limit but shorter is better
        case "x":
            return 280; // Twitter/X character limit
        default:
            return 500;
    }
}

/**
 * Check if message length is optimal for platform
 */
export function isOptimalLength(
    length: number,
    platform: "whatsapp" | "x" | "generic"
): { optimal: boolean; status: "short" | "optimal" | "long" } {
    const thresholds = {
        whatsapp: { min: 50, optimal: 150, max: 300 },
        x: { min: 50, optimal: 200, max: 280 },
        generic: { min: 50, optimal: 200, max: 400 },
    };

    const t = thresholds[platform];

    if (length < t.min) return { optimal: false, status: "short" };
    if (length <= t.optimal) return { optimal: true, status: "optimal" };
    if (length <= t.max) return { optimal: true, status: "optimal" };
    return { optimal: false, status: "long" };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    buildShareMessage,
    buildBatchSubmissionMessage,
    buildLeagueShareMessage,
    buildComparisonMessage,
    buildDailyBreakdownMessage,
    getRecommendedMaxLength,
    isOptimalLength,
};
