/**
 * Share Tooltip Content Definitions
 *
 * Centralized tooltip content for the sharing system.
 * Makes it easy to update text and supports future i18n.
 *
 * PRD-57: Customizable Share Content
 *
 * @module lib/sharing/shareTooltips
 */

import { type CardType } from "./index";
import { type ShareContentCategory, type ShareContentBlock } from "./shareContentConfig";

// ============================================================================
// Card Type Tooltips
// ============================================================================

export const CARD_TYPE_TOOLTIPS: Record<CardType, string> = {
    daily: "Share a single day's step count with a simple, clean design.",
    weekly: "Share your weekly total with day-by-day progress.",
    personal_best: "Celebrate your highest step count ever!",
    streak: "Show off how many consecutive days you've been active.",
    rank: "Display your position in your league.",
    challenge: "Challenge friends to beat your score.",
    rank_change: "Share when you've moved up in the rankings.",
    custom_period: "Select any date range and customize exactly what to share.",
};

// ============================================================================
// Category Tooltips
// ============================================================================

export const CATEGORY_TOOLTIPS: Record<ShareContentCategory, string> = {
    basic: "Essential information about your activity - steps, days, and dates.",
    detailed: "In-depth breakdown showing daily progress and highlights.",
    comparison: "Compare against yourself, others, or league averages.",
};

// ============================================================================
// Content Block Tooltips (extended descriptions)
// ============================================================================

export const BLOCK_TOOLTIPS: Record<ShareContentBlock, { available: string; unavailable: string }> = {
    total_steps: {
        available: "Shows your total step count for the selected period.",
        unavailable: "No step data available for this selection.",
    },
    day_count: {
        available: "Shows how many days are included in your share.",
        unavailable: "Select a date range to show day count.",
    },
    date_range: {
        available: "Displays the start and end dates of your period.",
        unavailable: "Select a date range to show dates.",
    },
    average: {
        available: "Shows your average steps per day over the period.",
        unavailable: "Need multiple days with data to calculate average.",
    },
    individual_days: {
        available: "Lists each day's step count individually.",
        unavailable: "No daily data available. Select a date range with submissions.",
    },
    best_day: {
        available: "Highlights your highest step count day in the period.",
        unavailable: "No submission data to determine best day.",
    },
    streak: {
        available: "Shows your current consecutive days active.",
        unavailable: "Streak data not available for this share.",
    },
    rank: {
        available: "Shows your position in the league leaderboard.",
        unavailable: "Join a league to share your rank.",
    },
    league_name: {
        available: "Includes the name of your league.",
        unavailable: "No league associated with this share.",
    },
    improvement: {
        available: "Shows percentage change vs previous period.",
        unavailable: "Need previous period data to show improvement.",
    },
    comparison_self: {
        available: "Compare current period to your previous performance.",
        unavailable: "Need previous period data for comparison.",
    },
    comparison_league: {
        available: "Compare your steps to the league average.",
        unavailable: "League average data not available.",
    },
};

// ============================================================================
// Section Label Tooltips
// ============================================================================

export const SECTION_TOOLTIPS = {
    cardType: "Choose how your achievement will be displayed. Each card type has a different visual style and purpose.",
    selectDateRange: "Pick the dates for your share. Days with step data are highlighted.",
    customizeMessage: "Choose what information to include in your share message. Toggle options on/off to customize.",
    preview: "Preview how your share card will look. The image updates as you make changes.",
    addMessage: "Add a personal message that appears with your share (optional).",
    darkTheme: "Toggle between dark and light theme for your share card.",
    showRank: "Include your league rank in the share.",
};

// ============================================================================
// Helper Function
// ============================================================================

/**
 * Get tooltip text for a content block based on availability
 */
export function getBlockTooltip(block: ShareContentBlock, isAvailable: boolean): string {
    const tooltips = BLOCK_TOOLTIPS[block];
    return isAvailable ? tooltips.available : tooltips.unavailable;
}

export default {
    CARD_TYPE_TOOLTIPS,
    CATEGORY_TOOLTIPS,
    BLOCK_TOOLTIPS,
    SECTION_TOOLTIPS,
    getBlockTooltip,
};
