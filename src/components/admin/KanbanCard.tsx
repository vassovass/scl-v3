import { memo, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { TYPE_COLORS, RELEASE_OPTIONS } from "@/lib/badges";

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
    users?: { display_name: string | null } | null;
    screenshot_url: string | null;
    attachment_count?: number;
}

interface KanbanCardProps {
    item: FeedbackItem;
    index: number;
    isSelected: boolean;
    onToggleSelection: (id: string, e: React.MouseEvent) => void;
    onTogglePublic: (id: string, current: boolean) => void;
    onCycleRelease: (id: string, current: string) => void;
    onOpenDetail?: (item: FeedbackItem) => void;
    onDelete?: (id: string, hard: boolean) => void;
}

const KanbanCard = memo(function KanbanCard({
    item,
    index,
    isSelected,
    onToggleSelection,
    onTogglePublic,
    onCycleRelease,
    onOpenDetail,
    onDelete,
}: KanbanCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Handle double-click to open detail modal
    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenDetail?.(item);
    };

    return (
        <Draggable draggableId={item.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onDoubleClick={handleDoubleClick}
                    className={`p-3 mb-2 bg-slate-800/80 rounded-lg border transition-all cursor-pointer ${snapshot.isDragging
                        ? "border-primary shadow-lg shadow-primary/20"
                        : isSelected
                            ? "border-primary ring-1 ring-primary/30 bg-primary/10"
                            : "border-slate-700 hover:border-slate-600"
                        }`}
                    title="Double-click to open details"
                >
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1">
                            {/* Selection checkbox */}
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => onToggleSelection(item.id, e as unknown as React.MouseEvent)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                                title="Select item"
                            />
                            <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-medium ${TYPE_COLORS[item.type as keyof typeof TYPE_COLORS] || TYPE_COLORS.general
                                    }`}
                            >
                                {item.type}
                            </span>
                            <button
                                onClick={() => onCycleRelease(item.id, item.target_release || "later")}
                                className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${RELEASE_OPTIONS.find((r) => r.id === item.target_release)?.color || RELEASE_OPTIONS[2].color
                                    }`}
                                title="Click to change release target"
                            >
                                {RELEASE_OPTIONS.find((r) => r.id === item.target_release)?.label || "📅 Later"}
                            </button>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onTogglePublic(item.id, item.is_public)}
                                className={`text-xs px-1.5 py-0.5 rounded transition-colors ${item.is_public
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-slate-700 text-slate-400 hover:text-slate-300"
                                    }`}
                                title={item.is_public ? "Public on roadmap" : "Private"}
                            >
                                {item.is_public ? "🌐" : "🔒"}
                            </button>
                            {/* Delete button with confirmation */}
                            {onDelete && (
                                showDeleteConfirm ? (
                                    <div className="flex items-center gap-0.5 animate-fade-in">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(item.id, false); setShowDeleteConfirm(false); }}
                                            className="text-[9px] px-1 py-0.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded transition-colors"
                                            title="Archive (can restore later)"
                                        >
                                            📦
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(item.id, true); setShowDeleteConfirm(false); }}
                                            className="text-[9px] px-1 py-0.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
                                            title="Delete forever"
                                        >
                                            🗑️
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                                            className="text-[9px] px-1 py-0.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
                                            title="Cancel"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                                        className="text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Delete or archive"
                                    >
                                        🗑️
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium text-slate-200 ${!isExpanded && "line-clamp-2"}`}>
                            {item.subject}
                        </h4>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                            title={isExpanded ? "Collapse" : "Expand"}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                    </div>

                    <p className={`text-xs text-slate-400 ${!isExpanded && "line-clamp-2"}`}>
                        {item.description}
                    </p>

                    {isExpanded && item.screenshot_url && (
                        <div className="mt-2 text-[10px] text-slate-500">
                            <img
                                src={item.screenshot_url}
                                alt="Feedback screenshot"
                                className="w-full rounded-md border border-slate-700 mt-1 max-h-48 object-contain bg-black/20"
                            />
                        </div>
                    )}

                    <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            {/* Attachment count badge */}
                            {(item.attachment_count || 0) > 0 && (
                                <span
                                    className="px-1.5 py-0.5 bg-[hsl(var(--info)/0.2)] text-[hsl(var(--info))] rounded text-[9px]"
                                    title={`${item.attachment_count} attachment${item.attachment_count === 1 ? '' : 's'}`}
                                >
                                    🖼️ {item.attachment_count}
                                </span>
                            )}
                            {item.screenshot_url && (
                                <a
                                    href={item.screenshot_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-400 hover:text-emerald-300 transition-colors"
                                    title="View Screenshot"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    📷
                                </a>
                            )}
                        </div>
                        {item.users?.display_name && (
                            <span className="text-slate-400">
                                👤 {item.users.display_name}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
});

export default KanbanCard;

