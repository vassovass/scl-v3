/**
 * Smart date normalization utilities for StepLeague.
 * Handles dates without years by inferring the most logical year.
 */

/**
 * Normalize a date string that may be missing the year.
 * If only month/day is provided, infers the year based on:
 * 1. Try current year first
 * 2. If that would be in the future, use previous year
 *
 * @param dateStr - Date string in various formats (YYYY-MM-DD, MM-DD, DD/MM, etc.)
 * @param referenceDate - The date to use as reference (defaults to now)
 * @returns Normalized date string in YYYY-MM-DD format
 */
export function normalizeExtractedDate(
    dateStr: string | null | undefined,
    referenceDate: Date = new Date()
): string {
    if (!dateStr) return referenceDate.toISOString().slice(0, 10);

    // Clean up the string
    const cleaned = dateStr.trim();

    // Try parsing as-is first (handles YYYY-MM-DD)
    const direct = new Date(cleaned);
    if (!isNaN(direct.getTime()) && cleaned.match(/^\d{4}/)) {
        // Has a 4-digit year at start
        return direct.toISOString().slice(0, 10);
    }

    // Extract month and day using common patterns
    let month: number | null = null;
    let day: number | null = null;

    // Pattern: "December 12" or "Dec 12" or "12 December" etc.
    const monthNames: Record<string, number> = {
        january: 1, jan: 1,
        february: 2, feb: 2,
        march: 3, mar: 3,
        april: 4, apr: 4,
        may: 5,
        june: 6, jun: 6,
        july: 7, jul: 7,
        august: 8, aug: 8,
        september: 9, sep: 9, sept: 9,
        october: 10, oct: 10,
        november: 11, nov: 11,
        december: 12, dec: 12,
    };

    // Try "Month Day" or "Day Month" patterns
    const monthDayMatch = cleaned.match(/(\w+)\s+(\d{1,2})/i);
    const dayMonthMatch = cleaned.match(/(\d{1,2})\s+(\w+)/i);

    if (monthDayMatch) {
        const monthName = monthDayMatch[1].toLowerCase();
        if (monthNames[monthName]) {
            month = monthNames[monthName];
            day = parseInt(monthDayMatch[2], 10);
        }
    } else if (dayMonthMatch) {
        const monthName = dayMonthMatch[2].toLowerCase();
        if (monthNames[monthName]) {
            month = monthNames[monthName];
            day = parseInt(dayMonthMatch[1], 10);
        }
    }

    // Try numeric patterns: MM/DD, DD/MM, MM-DD, DD-MM
    if (month === null || day === null) {
        const numericMatch = cleaned.match(/(\d{1,2})[\/\-\.](\d{1,2})/);
        if (numericMatch) {
            const first = parseInt(numericMatch[1], 10);
            const second = parseInt(numericMatch[2], 10);

            // Heuristic: if first > 12, it's likely DD/MM
            if (first > 12 && second <= 12) {
                day = first;
                month = second;
            } else if (second > 12 && first <= 12) {
                // MM/DD format
                month = first;
                day = second;
            } else {
                // Ambiguous - assume MM/DD (US format) as default
                month = first;
                day = second;
            }
        }
    }

    if (month === null || day === null || month < 1 || month > 12 || day < 1 || day > 31) {
        // Could not parse - return today
        return referenceDate.toISOString().slice(0, 10);
    }

    // Now infer the year
    const refYear = referenceDate.getFullYear();
    const refMonth = referenceDate.getMonth() + 1; // 0-indexed
    const refDay = referenceDate.getDate();

    let year = refYear;

    // Create the candidate date with current year
    const candidateDate = new Date(year, month - 1, day);

    // Check if this would be in the future
    if (candidateDate > referenceDate) {
        // Use previous year instead
        year = refYear - 1;
    }

    // Format as YYYY-MM-DD
    const paddedMonth = month.toString().padStart(2, "0");
    const paddedDay = day.toString().padStart(2, "0");

    return `${year}-${paddedMonth}-${paddedDay}`;
}

/**
 * Validate that a date is not in the future.
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns true if valid (not in future)
 */
export function isValidSubmissionDate(dateStr: string): boolean {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date <= today;
}

/**
 * Get a human-readable relative date label.
 */
export function getRelativeDateLabel(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "Last week";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
