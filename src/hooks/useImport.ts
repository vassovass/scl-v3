/**
 * useImport Hook
 * 
 * Provides CSV import functionality with preview, validation, and error handling.
 * 
 * @example
 * const { parseFile, confirmImport, preview, errors, isImporting } = useImport({
 *   endpoint: '/api/admin/feedback/import',
 *   columns: EXPORT_PRESETS.kanban,
 *   onSuccess: () => router.refresh()
 * });
 * 
 * <input type="file" onChange={(e) => parseFile(e.target.files[0])} />
 * 
 * @see PRD 16: Import/Export System
 */

import { useState, useCallback } from 'react';
import { ExportColumn, fuzzyMatchColumn } from '@/lib/export/presets';
import { parseCSV, csvToObjects, prepareImportPreview, ImportPreview, ParseError } from '@/lib/export/csvParser';
import { trackEvent } from '@/lib/analytics';

export interface UseImportOptions<T> {
    /** API endpoint for import */
    endpoint: string;
    /** Column definitions for parsing */
    columns: ExportColumn<T>[];
    /** Callback on successful import */
    onSuccess?: () => void;
    /** Use fuzzy column matching */
    useFuzzyMatch?: boolean;
}

export interface ImportResult {
    success: boolean;
    summary: {
        updated: number;
        created: number;
        errors: number;
    };
    errors: Array<{ row?: number; id?: string; message: string }>;
}

export interface UseImportResult<T> {
    /** Parse a CSV file and generate preview */
    parseFile: (file: File) => Promise<void>;
    /** Confirm and execute the import */
    confirmImport: () => Promise<ImportResult | null>;
    /** Clear the current import state */
    clearImport: () => void;
    /** Import preview (what will be updated/created) */
    preview: ImportPreview<T> | null;
    /** Parse errors */
    parseErrors: ParseError[];
    /** Import result after confirmation */
    result: ImportResult | null;
    /** Whether parsing is in progress */
    isParsing: boolean;
    /** Whether import is in progress */
    isImporting: boolean;
    /** The raw parsed data */
    rawData: Partial<T>[];
}

export function useImport<T extends { id?: string }>({
    endpoint,
    columns,
    onSuccess,
    useFuzzyMatch = true,
}: UseImportOptions<T>): UseImportResult<T> {
    const [preview, setPreview] = useState<ImportPreview<T> | null>(null);
    const [parseErrors, setParseErrors] = useState<ParseError[]>([]);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [rawData, setRawData] = useState<Partial<T>[]>([]);

    /**
     * Parse a CSV file and generate import preview
     */
    const parseFile = useCallback(async (file: File) => {
        setIsParsing(true);
        setResult(null);
        setParseErrors([]);

        try {
            const content = await file.text();
            const rows = parseCSV(content);

            // Convert to column configs for parser
            const parserColumns = columns.map(col => ({
                key: col.key as string,
                header: col.header,
                readonly: col.readonly,
                parse: col.parse,
            }));

            const { data, errors } = csvToObjects<T>(
                rows,
                parserColumns,
                useFuzzyMatch ? fuzzyMatchColumn : undefined
            );

            setRawData(data);
            setParseErrors(errors);

            // Generate preview
            const importPreview = prepareImportPreview<T>(data, errors);
            setPreview(importPreview);

        } catch (error) {
            setParseErrors([{
                row: 0,
                message: error instanceof Error ? error.message : 'Failed to parse CSV file',
            }]);
            setPreview(null);
        } finally {
            setIsParsing(false);
        }
    }, [columns, useFuzzyMatch]);

    /**
     * Confirm and execute the import
     */
    const confirmImport = useCallback(async (): Promise<ImportResult | null> => {
        if (!preview) return null;

        setIsImporting(true);

        try {
            // Prepare items for import
            const items = [
                ...preview.toUpdate.map(({ id, item }) => ({ ...item, id })),
                ...preview.toCreate,
            ];

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });

            const responseData = await response.json();

            // Handle API errors that don't match ImportResult shape
            let importResult: ImportResult;

            if (!response.ok || !responseData.summary) {
                importResult = {
                    success: false,
                    summary: { updated: 0, created: 0, errors: 0 },
                    errors: [{
                        message: responseData.error || responseData.message || 'Unknown import error'
                    }]
                };
            } else {
                importResult = responseData as ImportResult;
            }

            setResult(importResult);

            // Track analytics only if we have a valid summary
            if (importResult.summary) {
                trackEvent('import_completed', {
                    category: 'admin',
                    items_updated: importResult.summary.updated,
                    items_created: importResult.summary.created,
                    items_errored: importResult.summary.errors,
                });
            }

            if (importResult.success && onSuccess) {
                onSuccess();
            }

            return importResult;

        } catch (error) {
            const errorResult: ImportResult = {
                success: false,
                summary: { updated: 0, created: 0, errors: 1 },
                errors: [{
                    message: error instanceof Error ? error.message : 'Import failed',
                }],
            };
            setResult(errorResult);
            return errorResult;
        } finally {
            setIsImporting(false);
        }
    }, [preview, endpoint, onSuccess]);

    /**
     * Clear the current import state
     */
    const clearImport = useCallback(() => {
        setPreview(null);
        setParseErrors([]);
        setResult(null);
        setRawData([]);
    }, []);

    return {
        parseFile,
        confirmImport,
        clearImport,
        preview,
        parseErrors,
        result,
        isParsing,
        isImporting,
        rawData,
    };
}

