/**
 * CSV Parser Tests
 *
 * Tests for the csvParser utility functions.
 * Based on testing-patterns skill and PRD 42.
 *
 * Key areas tested:
 * - CSV parsing with quotes, escapes, newlines
 * - Column mapping with fuzzy matching
 * - Import preview generation
 * - Edge cases and error handling
 */

import { describe, it, expect } from 'vitest';
import { parseCSV, csvToObjects, prepareImportPreview, ParseError } from '../csvParser';

// ============================================================================
// parseCSV Tests
// ============================================================================

describe('csvParser - parseCSV', () => {
    describe('Basic Parsing', () => {
        it('parses simple CSV', () => {
            const content = 'name,email\nJohn,john@example.com\nJane,jane@example.com';
            const rows = parseCSV(content);

            expect(rows).toHaveLength(3);
            expect(rows[0]).toEqual(['name', 'email']);
            expect(rows[1]).toEqual(['John', 'john@example.com']);
            expect(rows[2]).toEqual(['Jane', 'jane@example.com']);
        });

        it('handles single row (headers only)', () => {
            const content = 'name,email,phone';
            const rows = parseCSV(content);

            expect(rows).toHaveLength(1);
            expect(rows[0]).toEqual(['name', 'email', 'phone']);
        });

        it('handles empty content', () => {
            const content = '';
            const rows = parseCSV(content);

            expect(rows).toHaveLength(0);
        });

        it('trims whitespace from fields', () => {
            const content = ' name , email \nJohn , john@example.com ';
            const rows = parseCSV(content);

            expect(rows[0]).toEqual(['name', 'email']);
            expect(rows[1]).toEqual(['John', 'john@example.com']);
        });
    });

    describe('Quoted Fields', () => {
        it('handles quoted fields with commas', () => {
            const content = 'name,description\nJohn,"Hello, World"';
            const rows = parseCSV(content);

            expect(rows[1][1]).toBe('Hello, World');
        });

        it('handles escaped quotes within quoted fields', () => {
            const content = 'name,quote\nJohn,"Say ""Hello"""';
            const rows = parseCSV(content);

            expect(rows[1][1]).toBe('Say "Hello"');
        });

        it('handles multiple escaped quotes', () => {
            const content = 'data\n"He said ""Hi"" then ""Bye"""';
            const rows = parseCSV(content);

            expect(rows[1][0]).toBe('He said "Hi" then "Bye"');
        });

        it('handles newlines within quoted fields', () => {
            const content = 'name,address\nJohn,"123 Main St\nApt 4"';
            const rows = parseCSV(content);

            expect(rows[1][1]).toBe('123 Main St\nApt 4');
        });

        it('handles empty quoted fields', () => {
            const content = 'a,b\n"",value';
            const rows = parseCSV(content);

            expect(rows[1][0]).toBe('');
            expect(rows[1][1]).toBe('value');
        });
    });

    describe('Line Ending Normalization', () => {
        it('handles Windows line endings (CRLF)', () => {
            const content = 'name,email\r\nJohn,john@example.com\r\nJane,jane@example.com';
            const rows = parseCSV(content);

            expect(rows).toHaveLength(3);
        });

        it('handles Mac classic line endings (CR)', () => {
            const content = 'name,email\rJohn,john@example.com\rJane,jane@example.com';
            const rows = parseCSV(content);

            expect(rows).toHaveLength(3);
        });

        it('handles mixed line endings', () => {
            const content = 'a\nb\r\nc\rd';
            const rows = parseCSV(content);

            expect(rows).toHaveLength(4);
        });
    });

    describe('Custom Delimiters', () => {
        it('parses with semicolon delimiter', () => {
            const content = 'name;email\nJohn;john@example.com';
            const rows = parseCSV(content, ';');

            expect(rows[0]).toEqual(['name', 'email']);
            expect(rows[1]).toEqual(['John', 'john@example.com']);
        });

        it('parses with tab delimiter', () => {
            const content = 'name\temail\nJohn\tjohn@example.com';
            const rows = parseCSV(content, '\t');

            expect(rows[0]).toEqual(['name', 'email']);
        });
    });

    describe('Empty Values', () => {
        it('handles empty values between delimiters', () => {
            const content = 'a,b,c\n1,,3';
            const rows = parseCSV(content);

            expect(rows[1]).toEqual(['1', '', '3']);
        });

        it('handles trailing empty value', () => {
            const content = 'a,b,c\n1,2,';
            const rows = parseCSV(content);

            expect(rows[1]).toEqual(['1', '2', '']);
        });

        it('handles leading empty value', () => {
            const content = 'a,b,c\n,2,3';
            const rows = parseCSV(content);

            expect(rows[1]).toEqual(['', '2', '3']);
        });

        it('skips completely empty rows', () => {
            const content = 'a,b\n1,2\n\n3,4';
            const rows = parseCSV(content);

            expect(rows).toHaveLength(3);
            expect(rows[2]).toEqual(['3', '4']);
        });
    });

    describe('Edge Cases', () => {
        it('handles field at end of file without newline', () => {
            const content = 'a,b\n1,2';
            const rows = parseCSV(content);

            expect(rows[1]).toEqual(['1', '2']);
        });

        it('handles very long fields', () => {
            const longValue = 'A'.repeat(10000);
            const content = `name\n${longValue}`;
            const rows = parseCSV(content);

            expect(rows[1][0]).toBe(longValue);
        });

        it('handles unicode characters', () => {
            const content = 'name\n日本語\n中文\n한국어';
            const rows = parseCSV(content);

            expect(rows[1][0]).toBe('日本語');
            expect(rows[2][0]).toBe('中文');
            expect(rows[3][0]).toBe('한국어');
        });

        it('handles emoji in fields', () => {
            const content = 'status\n✅ Done\n🔥 Hot';
            const rows = parseCSV(content);

            expect(rows[1][0]).toBe('✅ Done');
            expect(rows[2][0]).toBe('🔥 Hot');
        });
    });
});

// ============================================================================
// csvToObjects Tests
// ============================================================================

describe('csvParser - csvToObjects', () => {
    interface TestItem {
        id?: string;
        name: string;
        status: string;
    }

    const columns = [
        { key: 'id', header: 'ID', readonly: true },
        { key: 'name', header: 'Name' },
        { key: 'status', header: 'Status' },
    ];

    describe('Basic Conversion', () => {
        it('converts rows to objects', () => {
            const rows = [
                ['ID', 'Name', 'Status'],
                ['123', 'John', 'active'],
                ['456', 'Jane', 'inactive'],
            ];

            const { data, errors } = csvToObjects<TestItem>(rows, columns);

            expect(data).toHaveLength(2);
            expect(data[0]).toEqual({ id: '123', name: 'John', status: 'active' });
            expect(data[1]).toEqual({ id: '456', name: 'Jane', status: 'inactive' });
            expect(errors).toHaveLength(0);
        });

        it('handles case-insensitive header matching', () => {
            const rows = [
                ['id', 'NAME', 'Status'],
                ['123', 'John', 'active'],
            ];

            const { data } = csvToObjects<TestItem>(rows, columns);

            expect(data[0]).toEqual({ id: '123', name: 'John', status: 'active' });
        });

        it('returns error for empty CSV', () => {
            const rows: string[][] = [];

            const { data, errors } = csvToObjects<TestItem>(rows, columns);

            expect(data).toHaveLength(0);
            expect(errors).toHaveLength(1);
            expect(errors[0].message).toBe('CSV file is empty');
        });
    });

    describe('Header Mapping', () => {
        it('populates headerMap correctly', () => {
            const rows = [
                ['ID', 'Name', 'Status'],
                ['123', 'John', 'active'],
            ];

            const { headerMap } = csvToObjects<TestItem>(rows, columns);

            expect(headerMap.get('ID')).toBe('id');
            expect(headerMap.get('Name')).toBe('name');
            expect(headerMap.get('Status')).toBe('status');
        });

        it('skips unmapped columns', () => {
            const rows = [
                ['ID', 'Name', 'Unknown', 'Status'],
                ['123', 'John', 'ignored', 'active'],
            ];

            const { data, headerMap } = csvToObjects<TestItem>(rows, columns);

            expect(headerMap.has('Unknown')).toBe(false);
            expect(data[0]).toEqual({ id: '123', name: 'John', status: 'active' });
        });
    });

    describe('Fuzzy Matching', () => {
        it('uses fuzzy match when no exact match', () => {
            const rows = [
                ['Item ID', 'Full Name', 'Current Status'],
                ['123', 'John', 'active'],
            ];

            const fuzzyMatch = (header: string) => {
                const map: Record<string, string> = {
                    'Item ID': 'id',
                    'Full Name': 'name',
                    'Current Status': 'status',
                };
                return map[header] || null;
            };

            const { data } = csvToObjects<TestItem>(rows, columns, fuzzyMatch);

            expect(data[0]).toEqual({ id: '123', name: 'John', status: 'active' });
        });

        it('prefers exact match over fuzzy match', () => {
            const rows = [
                ['Name', 'Status'], // exact matches
                ['John', 'active'],
            ];

            const fuzzyMatch = (_header: string) => null; // Would match nothing

            const { data } = csvToObjects<TestItem>(rows, columns, fuzzyMatch);

            expect(data[0].name).toBe('John');
        });
    });

    describe('Parse Functions', () => {
        it('applies parse function to values', () => {
            interface NumItem { count: number }
            const numColumns = [
                { key: 'count', header: 'Count', parse: (v: string) => parseInt(v, 10) },
            ];

            const rows = [['Count'], ['42']];
            const { data } = csvToObjects<NumItem>(rows, numColumns);

            expect(data[0].count).toBe(42);
        });

        it('captures parse errors', () => {
            interface NumItem { count: number }
            const numColumns = [
                {
                    key: 'count',
                    header: 'Count',
                    parse: (v: string) => {
                        const num = parseInt(v, 10);
                        if (isNaN(num)) throw new Error('Invalid number');
                        return num;
                    }
                },
            ];

            const rows = [['Count'], ['not-a-number']];
            const { errors } = csvToObjects<NumItem>(rows, numColumns);

            expect(errors).toHaveLength(1);
            expect(errors[0].row).toBe(2); // 1-indexed
            expect(errors[0].column).toBe('Count');
        });
    });

    describe('Readonly Columns', () => {
        it('includes readonly ID column', () => {
            const rows = [['ID', 'Name'], ['123', 'John']];
            const { data } = csvToObjects<TestItem>(rows, columns);

            expect(data[0].id).toBe('123');
        });

        it('excludes other readonly columns', () => {
            interface Item { id: string; computed: string }
            const cols = [
                { key: 'id', header: 'ID', readonly: true },
                { key: 'computed', header: 'Computed', readonly: true },
            ];

            const rows = [['ID', 'Computed'], ['123', 'ignored']];
            const { data } = csvToObjects<Item>(rows, cols);

            expect(data[0].id).toBe('123');
            expect(data[0].computed).toBeUndefined();
        });
    });
});

// ============================================================================
// prepareImportPreview Tests
// ============================================================================

describe('csvParser - prepareImportPreview', () => {
    interface TestItem {
        id?: string;
        name: string;
    }

    it('separates items with IDs into toUpdate', () => {
        const data: Partial<TestItem>[] = [
            { id: '123', name: 'Update Me' },
            { name: 'Create Me' },
        ];

        const preview = prepareImportPreview(data, []);

        expect(preview.toUpdate).toHaveLength(1);
        expect(preview.toUpdate[0]).toEqual({ id: '123', item: { id: '123', name: 'Update Me' } });
    });

    it('separates items without IDs into toCreate', () => {
        const data: Partial<TestItem>[] = [
            { id: '123', name: 'Update Me' },
            { name: 'Create Me' },
        ];

        const preview = prepareImportPreview(data, []);

        expect(preview.toCreate).toHaveLength(1);
        expect(preview.toCreate[0]).toEqual({ name: 'Create Me' });
    });

    it('trims whitespace from IDs', () => {
        const data: Partial<TestItem>[] = [
            { id: '  123  ', name: 'Test' },
        ];

        const preview = prepareImportPreview(data, []);

        expect(preview.toUpdate[0].id).toBe('123');
    });

    it('treats empty string ID as no ID', () => {
        const data: Partial<TestItem>[] = [
            { id: '', name: 'Should Create' },
            { id: '   ', name: 'Also Should Create' },
        ];

        const preview = prepareImportPreview(data, []);

        expect(preview.toUpdate).toHaveLength(0);
        expect(preview.toCreate).toHaveLength(2);
    });

    it('includes parse errors', () => {
        const errors: ParseError[] = [
            { row: 2, message: 'Invalid value' },
            { row: 5, column: 'Status', message: 'Unknown status' },
        ];

        const preview = prepareImportPreview([], errors);

        expect(preview.errors).toEqual(errors);
    });

    it('handles all updates', () => {
        const data: Partial<TestItem>[] = [
            { id: '1', name: 'A' },
            { id: '2', name: 'B' },
            { id: '3', name: 'C' },
        ];

        const preview = prepareImportPreview(data, []);

        expect(preview.toUpdate).toHaveLength(3);
        expect(preview.toCreate).toHaveLength(0);
    });

    it('handles all creates', () => {
        const data: Partial<TestItem>[] = [
            { name: 'A' },
            { name: 'B' },
            { name: 'C' },
        ];

        const preview = prepareImportPreview(data, []);

        expect(preview.toUpdate).toHaveLength(0);
        expect(preview.toCreate).toHaveLength(3);
    });

    it('handles empty data', () => {
        const preview = prepareImportPreview([], []);

        expect(preview.toUpdate).toHaveLength(0);
        expect(preview.toCreate).toHaveLength(0);
        expect(preview.skipped).toHaveLength(0);
    });
});
