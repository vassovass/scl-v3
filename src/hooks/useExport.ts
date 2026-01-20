/**
 * useExport Hook
 * 
 * Provides CSV export functionality with proper escaping and formula injection prevention.
 * 
 * @example
 * const { exportCSV, isExporting } = useExport({
 *   filename: 'kanban-export',
 *   columns: EXPORT_PRESETS.kanban
 * });
 * 
 * <button onClick={() => exportCSV(items)}>Export CSV</button>
 * 
 * @see PRD 16: Import/Export System
 */

import { useState, useCallback } from 'react';
import { ExportColumn, getNestedValue, sanitizeForCSV } from '@/lib/export/presets';
import { trackEvent } from '@/lib/analytics';

export interface UseExportOptions<T> {
    /** Base filename (date will be appended) */
    filename: string;
    /** Column definitions with headers and formatters */
    columns: ExportColumn<T>[];
}

export interface UseExportResult<T> {
    /** Export items to CSV and trigger download */
    exportCSV: (items: T[]) => void;
    /** Export items to JSON and trigger download */
    exportJSON: (items: T[]) => void;
    /** Download a template CSV with example data */
    downloadTemplate: (exampleItems?: T[]) => void;
    /** Whether an export is in progress */
    isExporting: boolean;
}

/**
 * Generate current date string for filename
 */
function getDateString(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Trigger file download in browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Hook for exporting data to CSV/JSON
 */
export function useExport<T>({
    filename,
    columns
}: UseExportOptions<T>): UseExportResult<T> {
    const [isExporting, setIsExporting] = useState(false);

    /**
     * Export items to CSV format
     */
    const exportCSV = useCallback((items: T[]) => {
        setIsExporting(true);

        try {
            // Build header row
            const headers = columns.map(col => col.header);

            // Build data rows
            const rows = items.map(item => {
                return columns.map(col => {
                    // Get raw value (supports dot notation like 'users.display_name')
                    const rawValue = getNestedValue(item, col.key as string);

                    // Apply format function if defined
                    const formatted = col.format
                        ? col.format(rawValue, item)
                        : rawValue;

                    // Sanitize for CSV (escape quotes, prevent formula injection)
                    return sanitizeForCSV(formatted);
                });
            });

            // Combine into CSV content
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // Trigger download with UTF-8 BOM for Excel compatibility
            const bom = '\uFEFF';
            downloadFile(
                bom + csvContent,
                `StepLeague-${filename}-${getDateString()}.csv`,
                'text/csv;charset=utf-8;'
            );

            // Track analytics
            trackEvent('export_completed', {
                category: 'admin',
                export_format: 'csv',
                item_count: items.length,
                export_type: filename,
            });

        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    }, [filename, columns]);

    /**
     * Export items to JSON format
     */
    const exportJSON = useCallback((items: T[]) => {
        setIsExporting(true);

        try {
            // Create structured export with metadata
            const exportData = {
                exportedAt: new Date().toISOString(),
                itemCount: items.length,
                items: items.map(item => {
                    const exportItem: Record<string, any> = {};
                    columns.forEach(col => {
                        const rawValue = getNestedValue(item, col.key as string);
                        const formatted = col.format ? col.format(rawValue, item) : rawValue;
                        exportItem[col.key as string] = formatted;
                    });
                    return exportItem;
                }),
            };

            const jsonContent = JSON.stringify(exportData, null, 2);

            downloadFile(
                jsonContent,
                `StepLeague-${filename}-${getDateString()}.json`,
                'application/json'
            );

            // Track analytics
            trackEvent('export_completed', {
                category: 'admin',
                export_format: 'json',
                item_count: items.length,
                export_type: filename,
            });

        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    }, [filename, columns]);

    /**
     * Download a template CSV with column headers and optional example data
     */
    const downloadTemplate = useCallback((exampleItems?: T[]) => {
        setIsExporting(true);

        try {
            // Build header row
            const headers = columns.map(col => col.header);

            // Build example rows if provided, otherwise just headers
            let rows: string[][] = [];

            if (exampleItems && exampleItems.length > 0) {
                rows = exampleItems.map(item => {
                    return columns.map(col => {
                        const rawValue = getNestedValue(item, col.key as string);
                        const formatted = col.format ? col.format(rawValue, item) : rawValue;
                        return sanitizeForCSV(formatted);
                    });
                });
            }

            // Combine into CSV content
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // Trigger download
            const bom = '\uFEFF';
            downloadFile(
                bom + csvContent,
                `StepLeague-${filename}-template.csv`,
                'text/csv;charset=utf-8;'
            );
        } catch (error) {
            console.error('Template download failed:', error);
        } finally {
            setIsExporting(false);
        }
    }, [filename, columns]);

    return {
        exportCSV,
        exportJSON,
        downloadTemplate,
        isExporting,
    };
}

