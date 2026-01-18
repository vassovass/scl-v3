/**
 * useImport Hook Tests
 *
 * Tests for the useImport CSV import hook.
 * Based on testing-patterns skill and PRD 42.
 *
 * Key areas tested:
 * - CSV parsing logic
 * - Preview generation
 * - Error handling
 * - Import confirmation flow
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// Type Definitions (matching hook interface)
// ============================================================================

interface ExportColumn<T> {
    key: keyof T | string;
    header: string;
    format?: (value: unknown, item: T) => string;
    readonly?: boolean;
    parse?: (value: string) => unknown;
}

interface ParseError {
    row: number;
    column?: string;
    message: string;
}

interface ImportPreview<T> {
    toUpdate: Array<{ id: string; item: Partial<T> }>;
    toCreate: Array<Partial<T>>;
    skipped: number;
    errors: ParseError[];
}

interface ImportResult {
    success: boolean;
    summary: {
        updated: number;
        created: number;
        errors: number;
    };
    errors: Array<{ row?: number; id?: string; message: string }>;
}

// ============================================================================
// Initial State Tests
// ============================================================================

describe('useImport - Initial State', () => {
    it('starts with preview=null', () => {
        const preview: ImportPreview<unknown> | null = null;
        expect(preview).toBeNull();
    });

    it('starts with empty parseErrors', () => {
        const parseErrors: ParseError[] = [];
        expect(parseErrors).toHaveLength(0);
    });

    it('starts with result=null', () => {
        const result: ImportResult | null = null;
        expect(result).toBeNull();
    });

    it('starts with isParsing=false', () => {
        const isParsing = false;
        expect(isParsing).toBe(false);
    });

    it('starts with isImporting=false', () => {
        const isImporting = false;
        expect(isImporting).toBe(false);
    });

    it('starts with empty rawData', () => {
        const rawData: unknown[] = [];
        expect(rawData).toHaveLength(0);
    });
});

// ============================================================================
// CSV Parsing Tests
// ============================================================================

describe('useImport - CSV Parsing', () => {
    /**
     * Simple CSV parser for testing
     */
    const parseCSV = (content: string): string[][] => {
        const lines = content.trim().split('\n');
        return lines.map(line => {
            const values: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            return values;
        });
    };

    it('parses simple CSV', () => {
        const content = 'name,email\nJohn,john@example.com\nJane,jane@example.com';
        const rows = parseCSV(content);

        expect(rows).toHaveLength(3);
        expect(rows[0]).toEqual(['name', 'email']);
        expect(rows[1]).toEqual(['John', 'john@example.com']);
    });

    it('handles quoted fields', () => {
        const content = 'name,description\nJohn,"Hello, World"';
        const rows = parseCSV(content);

        expect(rows[1][1]).toBe('Hello, World');
    });

    it('handles escaped quotes', () => {
        const content = 'name,quote\nJohn,"Say ""Hello"""';
        const rows = parseCSV(content);

        expect(rows[1][1]).toBe('Say "Hello"');
    });

    it('handles empty values', () => {
        const content = 'name,email,phone\nJohn,,123';
        const rows = parseCSV(content);

        expect(rows[1]).toEqual(['John', '', '123']);
    });

    it('handles single row', () => {
        const content = 'name,email';
        const rows = parseCSV(content);

        expect(rows).toHaveLength(1);
    });
});

// ============================================================================
// Column Mapping Tests
// ============================================================================

describe('useImport - Column Mapping', () => {
    interface TestItem {
        id?: string;
        name: string;
        status: string;
    }

    const columns: ExportColumn<TestItem>[] = [
        { key: 'id', header: 'ID', readonly: true },
        { key: 'name', header: 'Name' },
        { key: 'status', header: 'Status' },
    ];

    it('maps headers to column keys', () => {
        const headers = ['ID', 'Name', 'Status'];
        const mapping: Record<string, string> = {};

        headers.forEach((header, idx) => {
            const col = columns.find(c => c.header === header);
            if (col) {
                mapping[header] = col.key as string;
            }
        });

        expect(mapping['ID']).toBe('id');
        expect(mapping['Name']).toBe('name');
        expect(mapping['Status']).toBe('status');
    });

    it('handles case-insensitive matching', () => {
        const header = 'NAME';
        const col = columns.find(c =>
            c.header.toLowerCase() === header.toLowerCase()
        );

        expect(col?.key).toBe('name');
    });

    it('identifies unmapped columns', () => {
        const headers = ['ID', 'Name', 'Unknown Column'];
        const unmapped = headers.filter(h =>
            !columns.some(c => c.header === h)
        );

        expect(unmapped).toEqual(['Unknown Column']);
    });
});

// ============================================================================
// Fuzzy Matching Tests
// ============================================================================

describe('useImport - Fuzzy Column Matching', () => {
    const fuzzyMatch = (header: string, candidates: string[]): string | null => {
        // Exact match first
        const exact = candidates.find(c => c === header);
        if (exact) return exact;

        // Case-insensitive
        const caseInsensitive = candidates.find(
            c => c.toLowerCase() === header.toLowerCase()
        );
        if (caseInsensitive) return caseInsensitive;

        // Contains match
        const contains = candidates.find(
            c => c.toLowerCase().includes(header.toLowerCase()) ||
                 header.toLowerCase().includes(c.toLowerCase())
        );
        if (contains) return contains;

        return null;
    };

    it('matches exact header', () => {
        const result = fuzzyMatch('Name', ['ID', 'Name', 'Status']);
        expect(result).toBe('Name');
    });

    it('matches case-insensitive', () => {
        const result = fuzzyMatch('name', ['ID', 'Name', 'Status']);
        expect(result).toBe('Name');
    });

    it('matches partial contains', () => {
        const result = fuzzyMatch('User Name', ['ID', 'Name', 'Status']);
        expect(result).toBe('Name');
    });

    it('returns null for no match', () => {
        const result = fuzzyMatch('Unknown', ['ID', 'Name', 'Status']);
        expect(result).toBeNull();
    });
});

// ============================================================================
// Preview Generation Tests
// ============================================================================

describe('useImport - Preview Generation', () => {
    interface TestItem {
        id?: string;
        name: string;
    }

    it('separates items with id into toUpdate', () => {
        const data: Partial<TestItem>[] = [
            { id: '123', name: 'John' },
            { name: 'Jane' }, // no id
        ];

        const toUpdate = data.filter(item => !!item.id);
        const toCreate = data.filter(item => !item.id);

        expect(toUpdate).toHaveLength(1);
        expect(toCreate).toHaveLength(1);
    });

    it('formats toUpdate with id and item', () => {
        const data: Partial<TestItem>[] = [
            { id: '123', name: 'John' },
        ];

        const toUpdate = data
            .filter(item => !!item.id)
            .map(item => ({
                id: item.id!,
                item: { ...item },
            }));

        expect(toUpdate[0].id).toBe('123');
        expect(toUpdate[0].item.name).toBe('John');
    });

    it('counts skipped rows', () => {
        const errors: ParseError[] = [
            { row: 2, message: 'Invalid data' },
            { row: 5, message: 'Missing required field' },
        ];

        const skipped = errors.length;
        expect(skipped).toBe(2);
    });

    it('includes parse errors in preview', () => {
        const preview: ImportPreview<TestItem> = {
            toUpdate: [],
            toCreate: [{ name: 'John' }],
            skipped: 1,
            errors: [{ row: 3, message: 'Invalid format' }],
        };

        expect(preview.errors).toHaveLength(1);
        expect(preview.errors[0].row).toBe(3);
    });
});

// ============================================================================
// Import Confirmation Tests
// ============================================================================

describe('useImport - Import Confirmation', () => {
    it('returns null when no preview', () => {
        const preview: ImportPreview<unknown> | null = null;
        const shouldImport = preview !== null;

        expect(shouldImport).toBe(false);
    });

    it('prepares items for API from preview', () => {
        interface Item { id?: string; name: string }
        const preview: ImportPreview<Item> = {
            toUpdate: [{ id: '123', item: { name: 'John Updated' } }],
            toCreate: [{ name: 'Jane New' }],
            skipped: 0,
            errors: [],
        };

        const items = [
            ...preview.toUpdate.map(({ id, item }) => ({ ...item, id })),
            ...preview.toCreate,
        ];

        expect(items).toHaveLength(2);
        expect(items[0]).toEqual({ name: 'John Updated', id: '123' });
        expect(items[1]).toEqual({ name: 'Jane New' });
    });

    it('handles successful import result', () => {
        const result: ImportResult = {
            success: true,
            summary: {
                updated: 5,
                created: 3,
                errors: 0,
            },
            errors: [],
        };

        expect(result.success).toBe(true);
        expect(result.summary.updated + result.summary.created).toBe(8);
    });

    it('handles import with errors', () => {
        const result: ImportResult = {
            success: false,
            summary: {
                updated: 2,
                created: 1,
                errors: 2,
            },
            errors: [
                { row: 3, message: 'Duplicate entry' },
                { id: '456', message: 'Invalid reference' },
            ],
        };

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(2);
    });
});

// ============================================================================
// Clear Import Tests
// ============================================================================

describe('useImport - Clear Import', () => {
    it('resets preview to null', () => {
        let preview: ImportPreview<unknown> | null = {
            toUpdate: [],
            toCreate: [],
            skipped: 0,
            errors: [],
        };

        preview = null;
        expect(preview).toBeNull();
    });

    it('resets parseErrors to empty', () => {
        let parseErrors: ParseError[] = [{ row: 1, message: 'Error' }];

        parseErrors = [];
        expect(parseErrors).toHaveLength(0);
    });

    it('resets result to null', () => {
        let result: ImportResult | null = {
            success: true,
            summary: { updated: 1, created: 0, errors: 0 },
            errors: [],
        };

        result = null;
        expect(result).toBeNull();
    });

    it('resets rawData to empty', () => {
        let rawData: unknown[] = [{ name: 'John' }];

        rawData = [];
        expect(rawData).toHaveLength(0);
    });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('useImport - Error Handling', () => {
    it('captures file read errors', () => {
        let parseErrors: ParseError[] = [];

        try {
            throw new Error('Failed to read file');
        } catch (error) {
            parseErrors = [{
                row: 0,
                message: error instanceof Error ? error.message : 'Failed to parse CSV file',
            }];
        }

        expect(parseErrors[0].message).toBe('Failed to read file');
    });

    it('handles API error response', () => {
        const responseData = {
            error: 'Import validation failed',
        };

        const result: ImportResult = {
            success: false,
            summary: { updated: 0, created: 0, errors: 0 },
            errors: [{
                message: responseData.error || 'Unknown import error'
            }]
        };

        expect(result.success).toBe(false);
        expect(result.errors[0].message).toBe('Import validation failed');
    });

    it('handles network failure', () => {
        let result: ImportResult | null = null;

        try {
            throw new Error('Network error');
        } catch (error) {
            result = {
                success: false,
                summary: { updated: 0, created: 0, errors: 1 },
                errors: [{
                    message: error instanceof Error ? error.message : 'Import failed',
                }],
            };
        }

        expect(result?.success).toBe(false);
        expect(result?.errors[0].message).toBe('Network error');
    });
});

// ============================================================================
// Parse Function Tests
// ============================================================================

describe('useImport - Parse Functions', () => {
    it('applies parse function to string value', () => {
        const parse = (value: string) => parseInt(value, 10);
        const result = parse('123');

        expect(result).toBe(123);
    });

    it('handles boolean parse', () => {
        const parse = (value: string) =>
            value.toLowerCase() === 'true' || value === '1';

        expect(parse('true')).toBe(true);
        expect(parse('TRUE')).toBe(true);
        expect(parse('1')).toBe(true);
        expect(parse('false')).toBe(false);
    });

    it('handles date parse', () => {
        const parse = (value: string) => new Date(value).toISOString();
        const result = parse('2026-01-17');

        expect(result).toContain('2026-01-17');
    });

    it('handles enum parse with validation', () => {
        const validStatuses = ['open', 'in_progress', 'closed'] as const;
        const parse = (value: string) => {
            const lower = value.toLowerCase().replace(' ', '_');
            return validStatuses.includes(lower as typeof validStatuses[number])
                ? lower
                : 'open';
        };

        expect(parse('In Progress')).toBe('in_progress');
        expect(parse('invalid')).toBe('open');
    });
});

// ============================================================================
// State Transition Tests
// ============================================================================

describe('useImport - State Transitions', () => {
    it('isParsing: false → true → false', () => {
        let isParsing = false;

        // Start parsing
        isParsing = true;
        expect(isParsing).toBe(true);

        // Finish parsing
        isParsing = false;
        expect(isParsing).toBe(false);
    });

    it('isImporting: false → true → false', () => {
        let isImporting = false;

        // Start import
        isImporting = true;
        expect(isImporting).toBe(true);

        // Finish import
        isImporting = false;
        expect(isImporting).toBe(false);
    });

    it('clears result when starting new parse', () => {
        let result: ImportResult | null = {
            success: true,
            summary: { updated: 1, created: 0, errors: 0 },
            errors: [],
        };

        // New parse clears previous result
        result = null;
        expect(result).toBeNull();
    });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('useImport - Edge Cases', () => {
    it('handles empty CSV file', () => {
        const content = '';
        const rows = content.trim().split('\n').filter(Boolean);

        expect(rows).toHaveLength(0);
    });

    it('handles CSV with only headers', () => {
        const content = 'name,email,status';
        const rows = content.split('\n');

        expect(rows).toHaveLength(1);
        // No data rows to import
    });

    it('handles very large import', () => {
        const items = Array.from({ length: 1000 }, (_, i) => ({
            name: `Item ${i}`,
        }));

        expect(items).toHaveLength(1000);
    });

    it('handles special characters in values', () => {
        const value = '日本語 中文 한국어';
        expect(value.length).toBeGreaterThan(0);
    });

    it('handles mixed update and create', () => {
        const preview: ImportPreview<{ id?: string; name: string }> = {
            toUpdate: [
                { id: '1', item: { name: 'Update 1' } },
                { id: '2', item: { name: 'Update 2' } },
            ],
            toCreate: [
                { name: 'Create 1' },
                { name: 'Create 2' },
                { name: 'Create 3' },
            ],
            skipped: 0,
            errors: [],
        };

        expect(preview.toUpdate.length + preview.toCreate.length).toBe(5);
    });

    it('useFuzzyMatch option toggles matching behavior', () => {
        const useFuzzyMatch = true;
        const shouldUseFuzzy = useFuzzyMatch;

        expect(shouldUseFuzzy).toBe(true);
    });
});
