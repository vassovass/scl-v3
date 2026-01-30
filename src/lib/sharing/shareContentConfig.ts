/**
 * Share Content Configuration System
 *
 * Defines customizable content blocks for share messages.
 * Users can choose which elements to include when sharing their progress.
 *
 * PRD-57: Customizable Share Content
 *
 * @module lib/sharing/shareContentConfig
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Shareable content blocks - each represents a piece of information
 * that can be included in a share message
 */
export type ShareContentBlock =
    | "total_steps" // Total steps for period
    | "day_count" // Number of days
    | "date_range" // "10 Jan - 30 Jan 2026"
    | "average" // Average steps/day
    | "individual_days" // List each day's steps
    | "best_day" // Best day in period
    | "streak" // Current streak
    | "rank" // League rank
    | "league_name" // Name of the league
    | "improvement" // % improvement vs previous period
    | "comparison_self" // Before/after self comparison
    | "comparison_league"; // Comparison to league average

/**
 * Categories for grouping content blocks in the UI
 */
export type ShareContentCategory = "basic" | "detailed" | "comparison";

/**
 * Configuration for each shareable content block
 */
export interface ShareContentBlockConfig {
    /** Unique identifier */
    id: ShareContentBlock;
    /** Display label in UI */
    label: string;
    /** Description shown as tooltip/help text */
    description: string;
    /** Emoji for visual identification */
    emoji: string;
    /** Whether enabled by default */
    defaultEnabled: boolean;
    /** Category for UI grouping */
    category: ShareContentCategory;
    /** Other blocks this depends on (for validation) */
    requires?: ShareContentBlock[];
    /** Data fields needed from ShareMessageData */
    requiredData?: string[];
}

/**
 * Data structure for building share messages
 */
export interface ShareMessageData {
    // Basic stats
    totalSteps?: number;
    dayCount?: number;
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    averageSteps?: number;

    // Individual days (for detailed breakdown)
    dailyBreakdown?: Array<{
        date: string;
        steps: number;
        isBestDay?: boolean;
    }>;

    // Best day
    bestDaySteps?: number;
    bestDayDate?: string;

    // Streak
    currentStreak?: number;

    // League/Rank
    rank?: number;
    totalMembers?: number;
    leagueName?: string;
    leagueAverage?: number;

    // Comparison
    previousPeriodSteps?: number;
    improvementPercent?: number;
}

/**
 * Share context determines smart defaults
 */
export type ShareContext =
    | "batch_submission" // After uploading steps
    | "daily_stats" // Single day share
    | "weekly_stats" // Week view share
    | "personal_best" // PB celebration
    | "league_rank" // Rank share
    | "comparison" // Before/after
    | "custom"; // Custom period

// ============================================================================
// Content Block Registry
// ============================================================================

export const SHARE_CONTENT_BLOCKS: Record<ShareContentBlock, ShareContentBlockConfig> = {
    total_steps: {
        id: "total_steps",
        label: "Total Steps",
        description: "Show total steps for the period",
        emoji: "👟",
        defaultEnabled: true,
        category: "basic",
        requiredData: ["totalSteps"],
    },
    day_count: {
        id: "day_count",
        label: "Days Logged",
        description: "Number of days in the period",
        emoji: "📅",
        defaultEnabled: true,
        category: "basic",
        requiredData: ["dayCount"],
    },
    date_range: {
        id: "date_range",
        label: "Date Range",
        description: 'Show period (e.g., "10 Jan - 30 Jan 2026")',
        emoji: "📆",
        defaultEnabled: true,
        category: "basic",
        requiredData: ["startDate", "endDate"],
    },
    average: {
        id: "average",
        label: "Daily Average",
        description: "Average steps per day",
        emoji: "📊",
        defaultEnabled: true,
        category: "basic",
        requiredData: ["averageSteps"],
    },
    individual_days: {
        id: "individual_days",
        label: "Daily Breakdown",
        description: "List steps for each day",
        emoji: "📋",
        defaultEnabled: false,
        category: "detailed",
        requiredData: ["dailyBreakdown"],
    },
    best_day: {
        id: "best_day",
        label: "Best Day",
        description: "Highlight your best day in the period",
        emoji: "⭐",
        defaultEnabled: false,
        category: "detailed",
        requiredData: ["bestDaySteps", "bestDayDate"],
    },
    streak: {
        id: "streak",
        label: "Current Streak",
        description: "Show consecutive days active",
        emoji: "🔥",
        defaultEnabled: false,
        category: "detailed",
        requiredData: ["currentStreak"],
    },
    rank: {
        id: "rank",
        label: "League Rank",
        description: "Your position in the league",
        emoji: "🏆",
        defaultEnabled: false,
        category: "comparison",
        requiredData: ["rank"],
    },
    league_name: {
        id: "league_name",
        label: "League Name",
        description: "Name of your league",
        emoji: "👥",
        defaultEnabled: false,
        category: "comparison",
        requires: ["rank"],
        requiredData: ["leagueName"],
    },
    improvement: {
        id: "improvement",
        label: "Improvement %",
        description: "Percentage change vs previous period",
        emoji: "📈",
        defaultEnabled: false,
        category: "comparison",
        requiredData: ["improvementPercent"],
    },
    comparison_self: {
        id: "comparison_self",
        label: "Before/After",
        description: "Compare to your previous period",
        emoji: "↔️",
        defaultEnabled: false,
        category: "comparison",
        requiredData: ["previousPeriodSteps", "totalSteps"],
    },
    comparison_league: {
        id: "comparison_league",
        label: "vs League Average",
        description: "Compare to league average",
        emoji: "👥",
        defaultEnabled: false,
        category: "comparison",
        requiredData: ["leagueAverage", "totalSteps"],
    },
};

// ============================================================================
// Category Configuration
// ============================================================================

export interface ShareContentCategoryConfig {
    id: ShareContentCategory;
    label: string;
    description: string;
}

export const SHARE_CONTENT_CATEGORIES: Record<ShareContentCategory, ShareContentCategoryConfig> = {
    basic: {
        id: "basic",
        label: "Basic Stats",
        description: "Essential metrics everyone sees",
    },
    detailed: {
        id: "detailed",
        label: "Detailed Stats",
        description: "In-depth breakdown of your activity",
    },
    comparison: {
        id: "comparison",
        label: "Comparisons",
        description: "Compare against yourself or others",
    },
};

// ============================================================================
// Smart Defaults by Context
// ============================================================================

export const CONTEXT_DEFAULTS: Record<ShareContext, ShareContentBlock[]> = {
    batch_submission: ["total_steps", "day_count", "date_range", "average"],
    daily_stats: ["total_steps", "date_range", "streak"],
    weekly_stats: ["total_steps", "day_count", "average", "best_day"],
    personal_best: ["total_steps", "best_day", "streak"],
    league_rank: ["total_steps", "rank", "league_name", "improvement"],
    comparison: ["total_steps", "comparison_self", "improvement"],
    custom: ["total_steps", "day_count", "date_range", "average"],
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get configuration for a content block
 */
export function getContentBlockConfig(block: ShareContentBlock): ShareContentBlockConfig {
    return SHARE_CONTENT_BLOCKS[block];
}

/**
 * Get all blocks for a category
 */
export function getBlocksByCategory(category: ShareContentCategory): ShareContentBlockConfig[] {
    return Object.values(SHARE_CONTENT_BLOCKS).filter((block) => block.category === category);
}

/**
 * Get default blocks for a context
 */
export function getDefaultBlocks(context: ShareContext): ShareContentBlock[] {
    return CONTEXT_DEFAULTS[context] ?? CONTEXT_DEFAULTS.custom;
}

/**
 * Check if a block can be enabled based on available data
 */
export function isBlockAvailable(block: ShareContentBlock, data: ShareMessageData): boolean {
    const config = getContentBlockConfig(block);
    if (!config.requiredData) return true;

    return config.requiredData.every((field) => {
        const value = data[field as keyof ShareMessageData];
        return value !== undefined && value !== null;
    });
}

/**
 * Get all available blocks based on provided data
 */
export function getAvailableBlocks(data: ShareMessageData): ShareContentBlock[] {
    return Object.keys(SHARE_CONTENT_BLOCKS).filter((block) =>
        isBlockAvailable(block as ShareContentBlock, data)
    ) as ShareContentBlock[];
}

/**
 * Validate block selection (check dependencies)
 */
export function validateBlockSelection(
    selectedBlocks: ShareContentBlock[],
    data: ShareMessageData
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const block of selectedBlocks) {
        const config = getContentBlockConfig(block);

        // Check if data is available
        if (!isBlockAvailable(block, data)) {
            errors.push(`"${config.label}" requires data that is not available`);
        }

        // Check dependencies
        if (config.requires) {
            for (const required of config.requires) {
                if (!selectedBlocks.includes(required)) {
                    const requiredConfig = getContentBlockConfig(required);
                    errors.push(`"${config.label}" requires "${requiredConfig.label}" to be selected`);
                }
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Get blocks grouped by category
 */
export function getBlocksGroupedByCategory(): Record<ShareContentCategory, ShareContentBlockConfig[]> {
    return {
        basic: getBlocksByCategory("basic"),
        detailed: getBlocksByCategory("detailed"),
        comparison: getBlocksByCategory("comparison"),
    };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    SHARE_CONTENT_BLOCKS,
    SHARE_CONTENT_CATEGORIES,
    CONTEXT_DEFAULTS,
    getContentBlockConfig,
    getBlocksByCategory,
    getDefaultBlocks,
    isBlockAvailable,
    getAvailableBlocks,
    validateBlockSelection,
    getBlocksGroupedByCategory,
};
