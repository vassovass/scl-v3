/**
 * Challenge Templates (PRD-54 P-1)
 *
 * Pre-built challenge configurations for one-click challenge creation.
 *
 * Systems Thinking:
 * - Templates reduce friction for common challenge types
 * - Each template calculates dates dynamically based on creation time
 * - Extensible registry pattern for adding new templates
 */

import type { ChallengeTemplate } from "./types";
import { formatDateYMD, getWeekStart, getWeekEnd } from "@/lib/utils/periods";

// ============================================================================
// Date Helpers
// ============================================================================

/**
 * Get the start of tomorrow.
 */
function getTomorrow(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get the start of next Saturday (upcoming weekend).
 */
function getNextSaturday(): Date {
    const d = new Date();
    const day = d.getDay();
    // Days until Saturday (0 = Sunday, 6 = Saturday)
    const daysUntilSaturday = day === 6 ? 7 : (6 - day);
    d.setDate(d.getDate() + daysUntilSaturday);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get the start of next Monday.
 */
function getNextMonday(): Date {
    const d = new Date();
    const day = d.getDay();
    // Days until Monday (1 = Monday)
    const daysUntilMonday = day === 1 ? 7 : ((8 - day) % 7);
    d.setDate(d.getDate() + daysUntilMonday);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get the first day of next month.
 */
function getFirstOfNextMonth(): Date {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Add days to a date string.
 */
function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + days);
    return formatDateYMD(d);
}

/**
 * Get last day of month for a date string.
 */
function getLastDayOfMonth(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    d.setMonth(d.getMonth() + 1);
    d.setDate(0); // Sets to last day of previous month
    return formatDateYMD(d);
}

// ============================================================================
// Challenge Templates
// ============================================================================

/**
 * Challenge template registry.
 * Each template defines:
 * - Display info (name, emoji, description)
 * - Duration in days
 * - Period calculation functions
 */
export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
    {
        id: "today_only",
        name: "Today Only",
        description: "Head-to-head for today's steps",
        emoji: "⚡",
        duration_days: 1,
        getPeriodStart: () => formatDateYMD(new Date()),
        getPeriodEnd: (start) => start, // Same day
    },
    {
        id: "weekend_warrior",
        name: "Weekend Warrior",
        description: "Saturday & Sunday showdown",
        emoji: "🌴",
        duration_days: 2,
        getPeriodStart: () => formatDateYMD(getNextSaturday()),
        getPeriodEnd: (start) => addDays(start, 1), // Saturday + Sunday
    },
    {
        id: "week_sprint",
        name: "Week Sprint",
        description: "7-day competition (Mon-Sun)",
        emoji: "🏃",
        duration_days: 7,
        getPeriodStart: () => formatDateYMD(getNextMonday()),
        getPeriodEnd: (start) => addDays(start, 6), // Full week
    },
    {
        id: "workweek",
        name: "Workweek Challenge",
        description: "Monday through Friday",
        emoji: "💼",
        duration_days: 5,
        getPeriodStart: () => formatDateYMD(getNextMonday()),
        getPeriodEnd: (start) => addDays(start, 4), // Mon-Fri
    },
    {
        id: "two_week",
        name: "Two Week Battle",
        description: "14-day endurance challenge",
        emoji: "🔥",
        duration_days: 14,
        getPeriodStart: () => formatDateYMD(getNextMonday()),
        getPeriodEnd: (start) => addDays(start, 13),
    },
    {
        id: "monthly_marathon",
        name: "Monthly Marathon",
        description: "Full month competition",
        emoji: "🏆",
        duration_days: 30, // Approximate
        getPeriodStart: () => formatDateYMD(getFirstOfNextMonth()),
        getPeriodEnd: (start) => getLastDayOfMonth(start),
    },
];

// ============================================================================
// Template Utilities
// ============================================================================

/**
 * Get a template by ID.
 */
export function getTemplateById(templateId: string): ChallengeTemplate | undefined {
    return CHALLENGE_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Apply a template to get period dates.
 */
export function applyTemplate(templateId: string): { period_start: string; period_end: string } | null {
    const template = getTemplateById(templateId);
    if (!template) return null;

    const period_start = template.getPeriodStart();
    const period_end = template.getPeriodEnd(period_start);

    return { period_start, period_end };
}

/**
 * Get template options for UI selector.
 */
export function getTemplateOptions(): Array<{
    value: string;
    label: string;
    emoji: string;
    description: string;
    duration: number;
}> {
    return CHALLENGE_TEMPLATES.map((t) => ({
        value: t.id,
        label: t.name,
        emoji: t.emoji,
        description: t.description,
        duration: t.duration_days,
    }));
}

/**
 * Format template duration for display.
 */
export function formatTemplateDuration(days: number): string {
    if (days === 1) return "1 day";
    if (days === 7) return "1 week";
    if (days === 14) return "2 weeks";
    if (days >= 28 && days <= 31) return "1 month";
    return `${days} days`;
}
