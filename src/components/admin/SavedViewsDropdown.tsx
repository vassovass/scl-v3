"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FeedbackFilterState } from "@/lib/filters/feedbackFilters";
import {
    getSavedViews,
    saveView,
    deleteView,
    viewNameExists,
    SavedView,
} from "@/lib/filters/savedViews";

interface SavedViewsDropdownProps {
    currentFilters: FeedbackFilterState;
    onViewApply: (filters: FeedbackFilterState) => void;
    className?: string;
}

export default function SavedViewsDropdown({
    currentFilters,
    onViewApply,
    className = "",
}: SavedViewsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [views, setViews] = useState<SavedView[]>([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [newViewName, setNewViewName] = useState("");
    const [saveError, setSaveError] = useState("");
    const [activeViewId, setActiveViewId] = useState<string | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const saveInputRef = useRef<HTMLInputElement>(null);

    // Load views on mount
    useEffect(() => {
        setViews(getSavedViews());
    }, []);

    // Focus management for save dialog
    useEffect(() => {
        if (showSaveDialog && saveInputRef.current) {
            saveInputRef.current.focus();
        }
    }, [showSaveDialog]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setIsOpen(false);
            setShowSaveDialog(false);
            triggerRef.current?.focus();
        }
    }, []);

    const handleSaveView = useCallback(() => {
        setShowSaveDialog(true);
        setNewViewName("");
        setSaveError("");
    }, []);

    const handleSaveSubmit = useCallback(() => {
        if (!newViewName.trim()) {
            setSaveError("View name is required");
            return;
        }

        if (newViewName.trim().length > 50) {
            setSaveError("Name is too long (max 50 characters)");
            return;
        }

        if (viewNameExists(newViewName)) {
            setSaveError("A view with this name already exists");
            return;
        }

        const savedView = saveView(newViewName, currentFilters);
        if (savedView) {
            setViews(getSavedViews());
            setShowSaveDialog(false);
            setNewViewName("");
            setActiveViewId(savedView.id);
        } else {
            setSaveError("Failed to save view. Storage might be full.");
        }
    }, [newViewName, currentFilters]);

    const handleApplyView = useCallback((view: SavedView) => {
        onViewApply(view.filters);
        setActiveViewId(view.id);
        setIsOpen(false);
    }, [onViewApply]);

    const handleDeleteView = useCallback((e: React.MouseEvent, viewId: string) => {
        e.stopPropagation();
        if (deleteView(viewId)) {
            setViews(getSavedViews());
            if (activeViewId === viewId) {
                setActiveViewId(null);
            }
        }
    }, [activeViewId]);

    const presetViews = views.filter(v => v.isPreset);
    const userViews = views.filter(v => !v.isPreset);

    return (
        <div ref={dropdownRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="menu"
                aria-expanded={isOpen ? "true" : "false"}
                aria-controls="saved-views-menu"
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 hover:border-slate-600 hover:bg-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4h14M5 8h14M5 12h14M5 16h8M5 20h8" />
                </svg>
                <span className="hidden sm:inline">Saved Views</span>
                <svg className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    id="saved-views-menu"
                    role="menu"
                    className="absolute left-0 top-full mt-2 w-72 rounded-lg border border-slate-700 bg-slate-900 shadow-xl z-50 animate-fade-in"
                >
                    {/* Preset Views */}
                    {presetViews.length > 0 && (
                        <div className="border-b border-slate-800">
                            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Presets
                            </div>
                            {presetViews.map((view) => (
                                <button
                                    key={view.id}
                                    role="menuitem"
                                    onClick={() => handleApplyView(view)}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-800 focus:bg-slate-800 focus:outline-none transition ${activeViewId === view.id ? 'bg-sky-500/10 text-sky-400' : 'text-slate-300'
                                        }`}
                                    tabIndex={0}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-amber-500">⭐</span>
                                        <span>{view.name}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* User Views */}
                    {userViews.length > 0 && (
                        <div className="border-b border-slate-800">
                            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Your Views
                            </div>
                            {userViews.map((view) => (
                                <button
                                    key={view.id}
                                    role="menuitem"
                                    onClick={() => handleApplyView(view)}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-800 focus:bg-slate-800 focus:outline-none transition group ${activeViewId === view.id ? 'bg-sky-500/10 text-sky-400' : 'text-slate-300'
                                        }`}
                                    tabIndex={0}
                                >
                                    <span className="flex items-center gap-2 truncate">
                                        <span>🔖</span>
                                        <span className="truncate">{view.name}</span>
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteView(e, view.id)}
                                        className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition"
                                        aria-label={`Delete ${view.name}`}
                                        tabIndex={-1}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Save Current View */}
                    {!showSaveDialog ? (
                        <button
                            onClick={handleSaveView}
                            role="menuitem"
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-sky-400 hover:bg-slate-800 focus:bg-slate-800 focus:outline-none transition"
                            tabIndex={0}
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Save Current View...</span>
                        </button>
                    ) : (
                        <div className="p-3 border-t border-slate-800">
                            <input
                                ref={saveInputRef}
                                type="text"
                                value={newViewName}
                                onChange={(e) => {
                                    setNewViewName(e.target.value);
                                    setSaveError("");
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSaveSubmit();
                                    }
                                }}
                                placeholder="View name..."
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 mb-2"
                                maxLength={50}
                            />
                            {saveError && (
                                <p className="text-xs text-red-400 mb-2">{saveError}</p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveSubmit}
                                    className="flex-1 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSaveDialog(false);
                                        setNewViewName("");
                                        setSaveError("");
                                    }}
                                    className="flex-1 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
