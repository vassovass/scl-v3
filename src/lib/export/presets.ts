/**
 * Export Column Presets
 * 
 * Defines column configurations for CSV import/export with format/parse functions
 * for round-trip support.
 * 
 * @see PRD 16: Import/Export System
 */

import { IDENTITY_FIELD, IDENTITY_LABEL } from "@/lib/identity";

export interface ExportColumn<T = any> {
    /** Key path to access the value (supports dot notation like 'users.display_name') */
    key: keyof T | string;
    /** Header label in CSV */
    header: string;
    /** If true, column must be present for import (ID) */
    required?: boolean;
    /** If true, exported but ignored on import (computed/auto-managed fields) */
    readonly?: boolean;
    /** Transform value for export (e.g., boolean → "Yes"/"No") */
    format?: (value: any, item: T) => string;
    /** Transform value for import (e.g., "Yes"/"No" → boolean) */
    parse?: (value: string) => any;
}

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue(item, 'users.display_name') → item.users?.display_name
 */
export function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Sanitize value for CSV export to prevent formula injection
 * @see https://owasp.org/www-community/attacks/CSV_Injection
 */
export function sanitizeForCSV(value: string | null | undefined): string {
    if (value == null) return '';
    let str = String(value);

    // If starts with formula character, prepend single quote to prevent execution
    if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
    }

    // Standard CSV escaping: wrap in quotes if contains special chars
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

/**
 * Format boolean values for CSV
 */
export const formatBoolean = (v: any): string => v ? 'Yes' : 'No';

/**
 * Parse boolean values from CSV
 */
export const parseBoolean = (v: string): boolean =>
    v.toLowerCase() === 'yes' || v.toLowerCase() === 'true' || v === '1';

/**
 * Format date values for CSV (ISO format)
 */
export const formatDate = (v: any): string => {
    if (!v) return '';
    const date = new Date(v);
    return isNaN(date.getTime()) ? '' : date.toISOString();
};

/**
 * Parse date values from CSV
 */
export const parseDate = (v: string): string | null => {
    if (!v || v.trim() === '') return null;
    const date = new Date(v);
    return isNaN(date.getTime()) ? null : date.toISOString();
};

/**
 * Kanban/Feedback item export columns
 * Includes all fields needed for round-trip editing
 */
export const KANBAN_COLUMNS: ExportColumn[] = [
    { key: 'id', header: 'ID', required: true, readonly: true },
    { key: 'type', header: 'Type' },
    { key: 'subject', header: 'Subject' },
    { key: 'description', header: 'Description' },
    { key: 'board_status', header: 'Status' },
    {
        key: 'is_public',
        header: 'Is Public',
        format: formatBoolean,
        parse: parseBoolean
    },
    {
        key: 'priority_order',
        header: 'Priority Order',
        parse: (v) => v ? parseInt(v, 10) : 0
    },
    { key: 'target_release', header: 'Target Release' },
    {
        key: 'completed_at',
        header: 'Completed At',
        format: formatDate,
        parse: parseDate
    },
    // Readonly columns (exported for reference, ignored on import)
    { key: 'created_at', header: 'Created At', readonly: true, format: formatDate },
    { key: 'updated_at', header: 'Updated At', readonly: true, format: formatDate },
    { key: 'status_changed_at', header: 'Status Changed At', readonly: true, format: formatDate },
    { key: 'user_id', header: 'User ID', readonly: true },
    { key: `users.${IDENTITY_FIELD}`, header: IDENTITY_LABEL, readonly: true },
    { key: 'screenshot_url', header: 'Screenshot URL', readonly: true },
];

/**
 * Roadmap item export columns
 * Similar to kanban but includes vote-related computed fields
 */
export const ROADMAP_COLUMNS: ExportColumn[] = [
    { key: 'id', header: 'ID', required: true, readonly: true },
    { key: 'type', header: 'Type' },
    { key: 'subject', header: 'Subject' },
    { key: 'description', header: 'Description' },
    { key: 'target_release', header: 'Release' },
    { key: 'board_status', header: 'Status' },
    {
        key: 'is_public',
        header: 'Is Public',
        format: formatBoolean,
        parse: parseBoolean
    },
    {
        key: 'completed_at',
        header: 'Completed At',
        format: formatDate,
        parse: parseDate
    },
    // Readonly computed fields
    { key: 'avg_priority', header: 'Avg Priority', readonly: true },
    { key: 'vote_count', header: 'Votes', readonly: true },
    { key: 'comment_count', header: 'Comments', readonly: true },
    { key: 'created_at', header: 'Created At', readonly: true, format: formatDate },
];

/**
 * Export presets namespace for easy access
 */
export const EXPORT_PRESETS = {
    kanban: KANBAN_COLUMNS,
    roadmap: ROADMAP_COLUMNS,
} as const;

/**
 * Valid board status values for validation
 */
export const VALID_BOARD_STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done'];

/**
 * Valid feedback types for validation
 */
export const VALID_FEEDBACK_TYPES = ['bug', 'feature', 'general', 'positive', 'negative'];

/**
 * Valid target release values for validation
 */
export const VALID_RELEASES = ['now', 'next', 'later', 'future'];

/**
 * Column aliases for fuzzy matching during import
 * Maps common variations to canonical field names
 */
export const COLUMN_ALIASES: Record<string, string[]> = {
    id: ['id', 'identifier', 'uuid'],
    subject: ['subject', 'title', 'name', 'summary'],
    description: ['description', 'details', 'body', 'content', 'text'],
    type: ['type', 'category', 'kind'],
    board_status: ['board_status', 'status', 'state', 'stage', 'column'],
    is_public: ['is_public', 'public', 'visibility', 'visible'],
    priority_order: ['priority_order', 'priority', 'order', 'rank'],
    target_release: ['target_release', 'release', 'milestone', 'version'],
    completed_at: ['completed_at', 'completed', 'done_at', 'finished_at'],
};

/**
 * Attempt to match a header to a known column using aliases
 */
export function fuzzyMatchColumn(header: string): string | null {
    const normalized = header.toLowerCase().trim().replace(/[\s_-]+/g, '_');

    for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
        if (aliases.some(alias => alias === normalized || normalized.includes(alias))) {
            return canonical;
        }
    }
    return null;
}

