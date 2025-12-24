"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

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

    useEffect(() => {
        // Organize items into columns
        const organized = COLUMNS.map((col) => ({
            ...col,
            items: initialItems
                .filter((item) => item.board_status === col.id)
                .sort((a, b) => a.priority_order - b.priority_order),
        }));
        setColumns(organized);
    }, [initialItems]);

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Optimistic update
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
                    completed_at: destination.droppableId === "done" ? new Date().toISOString() : null,
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
        <div className="relative">
            {isUpdating && (
                <div className="absolute top-2 right-2 text-xs text-sky-400 animate-pulse">
                    Saving...
                </div>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {columns.map((column) => (
                        <div
                            key={column.id}
                            className="flex-shrink-0 w-72 bg-slate-900/50 rounded-xl border border-slate-800"
                        >
                            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                                <h3 className="font-semibold text-slate-200">{column.title}</h3>
                                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                    {column.items.length}
                                </span>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`p-2 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? "bg-slate-800/30" : ""
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
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
