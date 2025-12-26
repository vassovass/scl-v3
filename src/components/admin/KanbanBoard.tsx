"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { filterBySource, FeedbackFilterState, DEFAULT_FILTER_STATE } from "@/lib/filters/feedbackFilters";
import UniversalFilters, { FILTER_PRESETS } from "@/components/shared/UniversalFilters";

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
}

const RELEASE_OPTIONS: { id: string; label: string; color: string }[] = [
    { id: "now", label: "🔥 Now", color: "bg-rose-500/20 text-rose-400" },
    { id: "next", label: "⏭️ Next", color: "bg-amber-500/20 text-amber-400" },
    { id: "later", label: "📅 Later", color: "bg-sky-500/20 text-sky-400" },
    { id: "future", label: "🔮 Future", color: "bg-slate-500/20 text-slate-400" },
];

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

const TYPE_COLORS: Record<string, string> = {
    bug: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    feature: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    improvement: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    general: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    positive: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    negative: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface KanbanBoardProps {
    initialItems: FeedbackItem[];
}

export default function KanbanBoard({ initialItems }: KanbanBoardProps) {
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [filters, setFilters] = useState<FeedbackFilterState>(DEFAULT_FILTER_STATE);

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

    // Export all items to CSV
    const exportToCSV = () => {
        // Gather all items from all columns
        const allItems = columns.flatMap((col) => col.items);

        // Define CSV headers
        const headers = [
            "ID",
            "Type",
            "Subject",
            "Description",
            "Status",
            "Is Public",
            "Priority Order",
            "Created At",
            "Completed At",
            "Target Release",
            "Submitter",
        ];

        // Helper to escape CSV fields
        const escapeCSV = (field: string | null | undefined): string => {
            if (field === null || field === undefined) return "";
            const str = String(field);
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        // Build CSV rows
        const rows = allItems.map((item) => [
            escapeCSV(item.id),
            escapeCSV(item.type),
            escapeCSV(item.subject),
            escapeCSV(item.description),
            escapeCSV(item.board_status),
            item.is_public ? "Yes" : "No",
            String(item.priority_order),
            escapeCSV(item.created_at),
            escapeCSV(item.completed_at),
            escapeCSV(item.target_release),
            escapeCSV(item.users?.nickname),
        ]);

        // Combine headers and rows
        const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

        // Create and download the file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `StepLeague-Roadmap-Export-${new Date().toISOString().split("T")[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

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
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                        title="Export all items to CSV"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
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
                            {columns.map((column, index) => (
                                <Draggable key={column.id} draggableId={column.id} index={index}>
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
                                                            <Draggable key={item.id} draggableId={item.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className={`p-3 mb-2 bg-slate-800/80 rounded-lg border transition-all ${snapshot.isDragging
                                                                            ? "border-sky-500 shadow-lg shadow-sky-500/20"
                                                                            : "border-slate-700 hover:border-slate-600"
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                                            <div className="flex items-center gap-1">
                                                                                <span
                                                                                    className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-medium ${TYPE_COLORS[item.type] || TYPE_COLORS.general
                                                                                        }`}
                                                                                >
                                                                                    {item.type}
                                                                                </span>
                                                                                <button
                                                                                    onClick={() => cycleRelease(item.id, item.target_release || "later")}
                                                                                    className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${RELEASE_OPTIONS.find((r) => r.id === item.target_release)?.color || RELEASE_OPTIONS[2].color
                                                                                        }`}
                                                                                    title="Click to change release target"
                                                                                >
                                                                                    {RELEASE_OPTIONS.find((r) => r.id === item.target_release)?.label || "📅 Later"}
                                                                                </button>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => togglePublic(item.id, item.is_public)}
                                                                                className={`text-xs px-1.5 py-0.5 rounded transition-colors ${item.is_public
                                                                                    ? "bg-emerald-500/20 text-emerald-400"
                                                                                    : "bg-slate-700 text-slate-400 hover:text-slate-300"
                                                                                    }`}
                                                                                title={item.is_public ? "Public on roadmap" : "Private"}
                                                                            >
                                                                                {item.is_public ? "🌐" : "🔒"}
                                                                            </button>
                                                                        </div>

                                                                        <h4 className="text-sm font-medium text-slate-200 line-clamp-2 mb-1">
                                                                            {item.subject}
                                                                        </h4>

                                                                        <p className="text-xs text-slate-400 line-clamp-2">
                                                                            {item.description}
                                                                        </p>

                                                                        <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                                                                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                                            {item.users?.nickname && (
                                                                                <span className="text-slate-400">
                                                                                    👤 {item.users.nickname}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
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
        </div>
    );
}
