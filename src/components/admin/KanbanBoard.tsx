"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { filterBySource, FeedbackFilterState, DEFAULT_FILTER_STATE } from "@/lib/filters/feedbackFilters";
import { TYPE_COLORS, RELEASE_OPTIONS } from "@/lib/badges";
import UniversalFilters, { FILTER_PRESETS } from "@/components/shared/UniversalFilters";
import BulkActionsBar from "./BulkActionsBar";
import MergeModal from "./MergeModal";
import KanbanCard from "./KanbanCard";
import ImportModal from "./ImportModal";
import { useExport } from "@/hooks/useExport";
import { KANBAN_COLUMNS as EXPORT_COLUMNS } from "@/lib/export/presets";
import { useRouter } from "next/navigation";

interface FeedbackItem {
    id: string;
    type: string;
    subject: string;
    description: string;
    board_status: string;
    is_public: boolean;
    priority_order: number;
    created_at: string;
    completed_at: string | null;
    target_release: string;
    user_id: string | null;
    users?: { nickname: string } | null;
    screenshot_url: string | null;
}

interface KanbanColumn {
    id: string;
    title: string;
    items: FeedbackItem[];
}

const COLUMNS: { id: string; title: string }[] = [
    { id: "backlog", title: "📋 Backlog" },
    { id: "todo", title: "📝 To Do" },
    { id: "in_progress", title: "🔨 In Progress" },
    { id: "review", title: "👀 Review" },
    { id: "done", title: "✅ Done" },
];

interface KanbanBoardProps {
    initialItems: FeedbackItem[];
}

export default function KanbanBoard({ initialItems }: KanbanBoardProps) {
    const router = useRouter();
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [filters, setFilters] = useState<FeedbackFilterState>(DEFAULT_FILTER_STATE);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Toggle selection for a single item
    const toggleSelection = useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                clearSelection();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [clearSelection]);

    // Bulk actions using PRD 10 API
    const handleBulkStatusChange = async (status: string) => {
        const ids = Array.from(selectedIds);
        await fetch("/api/admin/feedback/bulk", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, updates: { board_status: status } }),
        });
        clearSelection();
        window.location.reload();
    };

    const handleBulkArchive = async () => {
        const ids = Array.from(selectedIds);
        await fetch("/api/admin/feedback/bulk/archive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
        });
        clearSelection();
        window.location.reload();
    };

    const handleBulkTogglePublic = async (isPublic: boolean) => {
        const ids = Array.from(selectedIds);
        await fetch("/api/admin/feedback/bulk", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, updates: { is_public: isPublic } }),
        });
        clearSelection();
        window.location.reload();
    };

    // Handle filter changes from UniversalFilters
    const handleFiltersChange = useCallback((newFilters: FeedbackFilterState) => {
        setFilters(newFilters);
    }, []);

    // Filter items based on current filters
    const filteredItems = useMemo(() => {
        let items = initialItems;
        items = filterBySource(items, filters.source);
        if (filters.type) {
            items = items.filter(item => item.type === filters.type);
        }
        if (filters.isPublic) {
            const isPublicBool = filters.isPublic === "true";
            items = items.filter(item => item.is_public === isPublicBool);
        }
        return items;
    }, [initialItems, filters]);

    // Export using PRD 16 hook (replaces 60 lines of inline code)
    const { exportCSV, isExporting: isExportingCSV } = useExport<FeedbackItem>({
        filename: 'kanban-export',
        columns: EXPORT_COLUMNS,
    });

    // Get all items for export
    const getAllItems = useCallback(() => {
        return columns.flatMap((col) => col.items);
    }, [columns]);

    useEffect(() => {
        // Load column order from local storage
        const savedOrder = localStorage.getItem("admin-kanban-order");
        let orderedColumns = [...COLUMNS];

        if (savedOrder) {
            try {
                const orderIds = JSON.parse(savedOrder);
                // Sort columns based on saved order, appending any new columns at the end
                orderedColumns.sort((a, b) => {
                    const indexA = orderIds.indexOf(a.id);
                    const indexB = orderIds.indexOf(b.id);
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });
            } catch (e) {
                console.error("Failed to parse column order", e);
            }
        }

        // Organize items into columns using filtered items
        const organized = orderedColumns.map((col) => ({
            ...col,
            items: filteredItems
                .filter((item) => item.board_status === col.id)
                .sort((a, b) => a.priority_order - b.priority_order),
        }));
        setColumns(organized);
    }, [filteredItems]);

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId, type } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Handle Column Reordering
        if (type === "COLUMN") {
            const newColumns = [...columns];
            const [movedColumn] = newColumns.splice(source.index, 1);
            newColumns.splice(destination.index, 0, movedColumn);
            setColumns(newColumns);

            // Save new order to local storage
            const orderIds = newColumns.map(c => c.id);
            localStorage.setItem("admin-kanban-order", JSON.stringify(orderIds));
            return;
        }

        // Handle Item Reordering (existing logic)
        const newColumns = [...columns];
        const sourceCol = newColumns.find((c) => c.id === source.droppableId);
        const destCol = newColumns.find((c) => c.id === destination.droppableId);

        if (!sourceCol || !destCol) return;

        const [movedItem] = sourceCol.items.splice(source.index, 1);
        movedItem.board_status = destination.droppableId;
        destCol.items.splice(destination.index, 0, movedItem);

        // Update priority order for all items in destination column
        destCol.items.forEach((item, index) => {
            item.priority_order = index;
        });

        // If moved to "done", set completed_at
        const completedAt = destination.droppableId === "done" ? new Date().toISOString() : null;
        if (completedAt) {
            movedItem.completed_at = completedAt;
        }

        setColumns(newColumns);

        // Persist to database
        setIsUpdating(true);
        try {
            await fetch("/api/admin/kanban", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: draggableId,
                    board_status: destination.droppableId,
                    priority_order: destination.index,
                    completed_at: completedAt,
                }),
            });
        } catch (error) {
            console.error("Failed to update:", error);
            // Revert on error
            window.location.reload();
        }
        setIsUpdating(false);
    };

    const togglePublic = async (itemId: string, currentState: boolean) => {
        setIsUpdating(true);
        try {
            await fetch("/api/admin/kanban", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: itemId, is_public: !currentState }),
            });
            // Update local state
            setColumns((prev) =>
                prev.map((col) => ({
                    ...col,
                    items: col.items.map((item) =>
                        item.id === itemId ? { ...item, is_public: !currentState } : item
                    ),
                }))
            );
        } catch (error) {
            console.error("Failed to toggle public:", error);
        }
        setIsUpdating(false);
    };

    const cycleRelease = async (itemId: string, currentRelease: string) => {
        const currentIndex = RELEASE_OPTIONS.findIndex((r) => r.id === currentRelease);
        const nextIndex = (currentIndex + 1) % RELEASE_OPTIONS.length;
        const nextRelease = RELEASE_OPTIONS[nextIndex].id;

        setIsUpdating(true);
        try {
            await fetch("/api/admin/kanban", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: itemId, target_release: nextRelease }),
            });
            // Update local state
            setColumns((prev) =>
                prev.map((col) => ({
                    ...col,
                    items: col.items.map((item) =>
                        item.id === itemId ? { ...item, target_release: nextRelease } : item
                    ),
                }))
            );
        } catch (error) {
            console.error("Failed to update release:", error);
        }
        setIsUpdating(false);
    };

    return (
        <div className="relative h-full flex flex-col">
            {/* Header with Filters and Export Button */}
            <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
                <UniversalFilters
                    config={FILTER_PRESETS.adminKanban}
                    onFiltersChange={handleFiltersChange}
                    compact
                />
                <div className="flex items-center gap-2">
                    {isUpdating && (
                        <span className="text-xs text-sky-400 animate-pulse">
                            Saving...
                        </span>
                    )}
                    {/* Help tooltip explaining Kanban → Roadmap mapping */}
                    <div className="relative group">
                        <button
                            className="flex items-center justify-center w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-sm rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                            title="How this maps to public roadmap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <h4 className="text-sm font-semibold text-slate-200 mb-2">📋 Kanban → 🗺️ Roadmap</h4>
                            <div className="text-xs text-slate-400 space-y-1.5">
                                <p><span className="text-sky-400">🌐 Public items</span> appear on /roadmap</p>
                                <div className="border-t border-slate-700 pt-1.5 mt-1.5">
                                    <p className="font-medium text-slate-300 mb-1">Column Mapping:</p>
                                    <p>• <span className="text-amber-400">In Progress</span> → <span className="text-orange-400">🔥 Now</span></p>
                                    <p>• <span className="text-slate-300">Release tag</span> → Roadmap column</p>
                                    <p>• <span className="text-emerald-400">Done</span> → <span className="text-emerald-400">✅ Done</span></p>
                                </div>
                                <p className="text-slate-500 pt-1">Click 🔒/🌐 to toggle visibility</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-slate-200 text-sm font-medium rounded-lg border border-emerald-600 hover:border-emerald-500 transition-colors"
                        title="Import items from CSV"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import CSV
                    </button>
                    <button
                        onClick={() => exportCSV(getAllItems())}
                        disabled={isExportingCSV}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 hover:border-slate-600 transition-colors disabled:opacity-50"
                        title="Export all items to CSV"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {isExportingCSV ? 'Exporting...' : 'Export CSV'}
                    </button>
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="board" direction="horizontal" type="COLUMN">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-140px)] items-start"
                        >
                            {columns.map((column, colIndex) => (
                                <Draggable key={column.id} draggableId={column.id} index={colIndex}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="flex-shrink-0 w-72 bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col max-h-full"
                                        >
                                            <div
                                                {...provided.dragHandleProps}
                                                className="p-3 border-b border-slate-800 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-slate-800/50 rounded-t-xl transition-colors"
                                            >
                                                <h3 className="font-semibold text-slate-200">{column.title}</h3>
                                                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                                    {column.items.length}
                                                </span>
                                            </div>

                                            <Droppable droppableId={column.id} type="ITEM">
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.droppableProps}
                                                        className={`p-2 flex-1 overflow-y-auto min-h-[100px] transition-colors ${snapshot.isDraggingOver ? "bg-slate-800/30" : ""
                                                            }`}
                                                    >
                                                        {column.items.map((item, index) => (
                                                            <KanbanCard
                                                                key={item.id}
                                                                item={item}
                                                                index={index}
                                                                isSelected={selectedIds.has(item.id)}
                                                                onToggleSelection={toggleSelection}
                                                                onTogglePublic={togglePublic}
                                                                onCycleRelease={cycleRelease}
                                                            />
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Bulk Actions Bar */}
            <BulkActionsBar
                selectedCount={selectedIds.size}
                onClear={clearSelection}
                onBulkStatusChange={handleBulkStatusChange}
                onBulkArchive={handleBulkArchive}
                onBulkTogglePublic={handleBulkTogglePublic}
                onMerge={() => setShowMergeModal(true)}
            />

            {/* Merge Modal */}
            <MergeModal
                isOpen={showMergeModal}
                onClose={() => setShowMergeModal(false)}
                onSuccess={() => {
                    clearSelection();
                    window.location.reload();
                }}
                items={initialItems.filter(i => selectedIds.has(i.id))}
            />

            {/* Import Modal */}
            <ImportModal<FeedbackItem>
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onSuccess={() => {
                    setShowImportModal(false);
                    router.refresh();
                }}
                endpoint="/api/admin/feedback/import"
                columns={EXPORT_COLUMNS}
                title="Import Kanban Items"
            />
        </div>
    );
}
