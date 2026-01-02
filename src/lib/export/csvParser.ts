/**
 * CSV Parser
 * 
 * Parses CSV content with proper handling of:
 * - Quoted fields with escaped quotes
 * - Newlines within quoted fields
 * - Various delimiters
 * 
 * @see PRD 16: Import/Export System
 */

/**
 * Parse CSV content into rows of string arrays
 */
export function parseCSV(content: string, delimiter: string = ','): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    // Normalize line endings
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < normalizedContent.length; i++) {
        const char = normalizedContent[i];
        const nextChar = normalizedContent[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    currentField += '"';
                    i++; // Skip next quote
                } else {
                    // End of quoted field
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                // Start of quoted field
                inQuotes = true;
            } else if (char === delimiter) {
                // End of field
                currentRow.push(currentField.trim());
                currentField = '';
            } else if (char === '\n') {
                // End of row
                currentRow.push(currentField.trim());
                if (currentRow.length > 0 && currentRow.some(f => f !== '')) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }

    // Handle last field/row
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0 && currentRow.some(f => f !== '')) {
            rows.push(currentRow);
        }
    }

    return rows;
}

/**
 * Parse error with row/column info
 */
export interface ParseError {
    row: number;
    column?: string;
    message: string;
    value?: string;
}

/**
 * Result of parsing CSV to objects
 */
export interface ParseResult<T> {
    data: Partial<T>[];
    errors: ParseError[];
    headerMap: Map<string, string>; // CSV header -> field key
}

/**
 * Convert CSV rows to typed objects using column definitions
 */
export function csvToObjects<T>(
    rows: string[][],
    columns: Array<{
        key: string;
        header: string;
        readonly?: boolean;
        parse?: (value: string) => any;
    }>,
    fuzzyMatch?: (header: string) => string | null
): ParseResult<T> {
    const data: Partial<T>[] = [];
    const errors: ParseError[] = [];
    const headerMap = new Map<string, string>();

    if (rows.length === 0) {
        errors.push({ row: 0, message: 'CSV file is empty' });
        return { data, errors, headerMap };
    }

    // First row is headers
    const headers = rows[0];

    // Map CSV headers to column keys
    const columnIndexMap = new Map<number, typeof columns[0]>();

    headers.forEach((header, index) => {
        // Try exact match first
        let matchedColumn = columns.find(
            col => col.header.toLowerCase() === header.toLowerCase()
        );

        // Try fuzzy match if provided and no exact match
        if (!matchedColumn && fuzzyMatch) {
            const fuzzyKey = fuzzyMatch(header);
            if (fuzzyKey) {
                matchedColumn = columns.find(col => col.key === fuzzyKey);
            }
        }

        if (matchedColumn) {
            columnIndexMap.set(index, matchedColumn);
            headerMap.set(header, matchedColumn.key);
        }
    });

    // Check for required columns (ID)
    const idColumn = columns.find(col => col.key === 'id');
    const hasIdColumn = Array.from(columnIndexMap.values()).some(col => col.key === 'id');

    if (idColumn && !hasIdColumn) {
        errors.push({ row: 0, message: 'Missing required column: ID' });
    }

    // Parse data rows
    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        const item: Partial<T> = {};

        columnIndexMap.forEach((column, colIndex) => {
            const rawValue = row[colIndex] || '';

            // Skip readonly columns (they're for reference only)
            if (column.readonly && column.key !== 'id') {
                return;
            }

            try {
                // Apply parse function if defined
                const value = column.parse ? column.parse(rawValue) : rawValue;
                (item as any)[column.key] = value;
            } catch (error) {
                errors.push({
                    row: rowIndex + 1, // 1-indexed for user display
                    column: column.header,
                    message: `Invalid value for ${column.header}`,
                    value: rawValue,
                });
            }
        });

        // Only add if we got some data
        if (Object.keys(item).length > 0) {
            data.push(item);
        }
    }

    return { data, errors, headerMap };
}

/**
 * Categorize items by ID for import preview
 */
export interface ImportPreview<T> {
    /** Items with existing IDs (will be updated) */
    toUpdate: Array<{ id: string; item: Partial<T> }>;
    /** Items without IDs (will be created) */
    toCreate: Partial<T>[];
    /** Items with IDs that weren't matched to columns */
    skipped: Partial<T>[];
    /** Parse errors */
    errors: ParseError[];
}

/**
 * Prepare import preview from parsed data
 */
export function prepareImportPreview<T extends { id?: string }>(
    data: Partial<T>[],
    errors: ParseError[]
): ImportPreview<T> {
    const preview: ImportPreview<T> = {
        toUpdate: [],
        toCreate: [],
        skipped: [],
        errors,
    };

    for (const item of data) {
        const id = item.id;

        if (id && id.trim() !== '') {
            // Has ID - will update existing
            preview.toUpdate.push({ id: id.trim(), item });
        } else {
            // No ID - will create new
            preview.toCreate.push(item);
        }
    }

    return preview;
}
