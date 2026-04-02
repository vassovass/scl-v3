"use client";

/**
 * ImportModal Component
 * 
 * Modal for CSV import with drag-and-drop, preview, and confirmation.
 * 
 * @see PRD 16: Import/Export System
 */

import { useState, useCallback, useRef } from 'react';
import { useImport, ImportResult } from '@/hooks/useImport';
import { ExportColumn } from '@/lib/export/presets';

interface ImportModalProps<T> {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** API endpoint for import */
    endpoint: string;
    /** Column definitions for parsing */
    columns: ExportColumn<T>[];
    /** Title for the modal */
    title?: string;
}

export default function ImportModal<T extends { id?: string }>({
    isOpen,
    onClose,
    onSuccess,
    endpoint,
    columns,
    title = 'Import CSV',
}: ImportModalProps<T>) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const {
        parseFile,
        confirmImport,
        clearImport,
        preview,
        parseErrors,
        result,
        isParsing,
        isImporting,
    } = useImport<T>({
        endpoint,
        columns,
        onSuccess: () => {
            onSuccess();
        },
    });

    const handleClose = useCallback(() => {
        clearImport();
        onClose();
    }, [clearImport, onClose]);

    const handleFileSelect = useCallback((file: File) => {
        if (file && file.type === 'text/csv' || file.name.endsWith('.csv')) {
            parseFile(file);
        }
    }, [parseFile]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                    <button
                        onClick={handleClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {!preview && !result && (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`
                                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                                ${isDragging
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/30 bg-card/30'
                                }
                            `}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleInputChange}
                                className="hidden"
                            />

                            {isParsing ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                                    <span className="text-muted-foreground">Parsing CSV...</span>
                                </div>
                            ) : (
                                <>
                                    <svg className="mx-auto h-12 w-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="text-foreground mb-2">
                                        Drag and drop a CSV file here
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        or click to browse files
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Parse Errors */}
                    {parseErrors.length > 0 && !result && (
                        <div className="mt-4 p-4 bg-destructive/20 border border-destructive/50 rounded-lg">
                            <h3 className="text-sm font-medium text-destructive mb-2">Parse Errors</h3>
                            <ul className="text-sm text-destructive/80 space-y-1">
                                {parseErrors.slice(0, 5).map((error, i) => (
                                    <li key={i}>
                                        {error.row > 0 && <span className="text-destructive">Row {error.row}:</span>} {error.message}
                                        {error.value && <span className="text-destructive ml-1">("{error.value}")</span>}
                                    </li>
                                ))}
                                {parseErrors.length > 5 && (
                                    <li className="text-destructive">...and {parseErrors.length - 5} more errors</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Preview */}
                    {preview && !result && (
                        <div className="mt-4 space-y-4">
                            <h3 className="text-sm font-medium text-foreground">Import Preview</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-[hsl(var(--info)/0.2)] border border-[hsl(var(--info)/0.5)] rounded-lg">
                                    <div className="text-2xl font-bold text-[hsl(var(--info))]">{preview.toUpdate.length}</div>
                                    <div className="text-sm text-[hsl(var(--info))]">Items to Update</div>
                                    <div className="text-xs text-muted-foreground mt-1">Existing items with matching IDs</div>
                                </div>

                                <div className="p-4 bg-success/20 border border-success/50 rounded-lg">
                                    <div className="text-2xl font-bold text-success">{preview.toCreate.length}</div>
                                    <div className="text-sm text-success/80">Items to Create</div>
                                    <div className="text-xs text-muted-foreground mt-1">New items without IDs</div>
                                </div>
                            </div>

                            {preview.errors.length > 0 && (
                                <div className="p-3 bg-warning/20 border border-warning/50 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-[hsl(var(--warning))]">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        {preview.errors.length} rows have errors and will be skipped
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div className="space-y-4">
                            {result.success ? (
                                <div className="p-6 bg-success/20 border border-success/50 rounded-lg text-center">
                                    <svg className="mx-auto h-12 w-12 text-success mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-success mb-2">Import Complete!</h3>
                                    <div className="text-sm text-foreground space-y-1">
                                        <p>{result.summary.updated} items updated</p>
                                        <p>{result.summary.created} items created</p>
                                        {result.summary.errors > 0 && (
                                            <p className="text-[hsl(var(--warning))]">{result.summary.errors} errors</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-destructive/20 border border-destructive/50 rounded-lg text-center">
                                    <svg className="mx-auto h-12 w-12 text-destructive mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-destructive mb-2">Import Failed</h3>
                                    {result.errors.length > 0 && (
                                        <div className="text-sm text-destructive/80">
                                            {result.errors[0].message}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                    {result ? (
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                        >
                            Done
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>

                            {preview && (
                                <button
                                    onClick={confirmImport}
                                    disabled={isImporting || (preview.toUpdate.length === 0 && preview.toCreate.length === 0)}
                                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isImporting ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            Import {preview.toUpdate.length + preview.toCreate.length} Items
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

